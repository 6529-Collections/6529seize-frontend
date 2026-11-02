import { publicEnv } from "@/config/env";
import { getStagingApiKey } from "@/config/serverEnv";
import { getUsableText } from "@/app/api/og-metadata/_lib/imageUtils";
import {
  assertContentType,
  isJsonContentType,
  readLimitedJson,
} from "@/lib/fetch/limitedBody";

const MAX_METADATA_BYTES = 256 * 1024;
const DEFAULT_METADATA_TIMEOUT_MS = 5_000;
const STAGING_API_ORIGIN = "https://api.staging.6529.io";
const PUBLIC_API_ORIGIN = "https://api.6529.io";
const TRANSIENT_STATUSES = new Set([429, 502, 503, 504]);

// Path segments and query values must match these allowlists before they are
// placed in a request URL. Neither pattern admits "/", ".", ":", "@", "?",
// "#", "%", "&", "=" or whitespace.
const API_SEGMENT_PATTERN = /^\w{1,80}$/;
const API_QUERY_KEY_PATTERN = /^[a-z_]{1,24}$/;
const API_QUERY_VALUE_PATTERN = /^[A-Za-z0-9]{1,80}$/;

export type JsonRecord = Record<string, unknown>;
export type OgApiQuery = Readonly<Record<string, string>>;
export type FetchOgApiJson = (
  segments: readonly string[],
  query?: OgApiQuery
) => Promise<unknown>;

export const asRecord = (value: unknown): JsonRecord | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;

export const text = (value: unknown, maxLength = 180): string | null =>
  typeof value === "string"
    ? (getUsableText(value)?.slice(0, maxLength) ?? null)
    : null;

export const isTokenNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

/**
 * Builds a collection-API URL from the fixed API base and validated parts.
 * Every segment and query value is tested against a strict allowlist and
 * encoded, and the result must keep the base's origin, so request-derived
 * values can never select another host, a different path, or extra parameters.
 */
const buildApiUrl = (
  apiBase: string,
  segments: readonly string[],
  query: OgApiQuery
): URL => {
  const baseUrl = new URL(apiBase.endsWith("/") ? apiBase : `${apiBase}/`);
  const apiRoot = new URL("api/", baseUrl);
  if (segments.length === 0) {
    throw new Error("Card metadata path is empty.");
  }
  const encodedPath = segments.map((segment) => {
    if (!API_SEGMENT_PATTERN.test(segment)) {
      throw new Error("Card metadata path is invalid.");
    }
    return encodeURIComponent(segment);
  });
  const url = new URL(encodedPath.join("/"), apiRoot);
  for (const [key, value] of Object.entries(query)) {
    if (
      !API_QUERY_KEY_PATTERN.test(key) ||
      !API_QUERY_VALUE_PATTERN.test(value)
    ) {
      throw new Error("Card metadata query is invalid.");
    }
    url.searchParams.set(key, value);
  }
  if (
    url.origin !== baseUrl.origin ||
    !url.pathname.startsWith(apiRoot.pathname)
  ) {
    throw new Error("Card metadata URL left the configured API.");
  }
  return url;
};

/**
 * Runs `run` with a JSON reader for the configured collection API. Card text
 * and artwork are resolved only through this reader, never from request input,
 * and the reader accepts only path segments and query values that pass the
 * allowlists above. Responses never follow redirects. A transient failure
 * (network error, 429, 502, 503 or 504) is retried once inside the deadline.
 */
export async function withOgApiJson<T>(
  signal: AbortSignal | undefined,
  run: (fetchJson: FetchOgApiJson) => Promise<T>,
  options: { readonly timeoutMs?: number } = {}
): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) abort();
  const timeout = setTimeout(
    abort,
    options.timeoutMs ?? DEFAULT_METADATA_TIMEOUT_MS
  );
  const apiAuth = getStagingApiKey() ?? null;
  const mayUsePublicApi =
    new URL(publicEnv.API_ENDPOINT).origin === STAGING_API_ORIGIN;
  let usePublicApi = false;
  const requestOnce = (url: string): Promise<Response> =>
    fetch(url, {
      signal: controller.signal,
      redirect: "error",
      headers: {
        Accept: "application/json",
        ...(apiAuth === null || usePublicApi ? {} : { "x-6529-auth": apiAuth }),
      },
      next: { revalidate: 3600 },
    });
  const requestMetadata = async (
    segments: readonly string[],
    query: OgApiQuery
  ): Promise<Response> => {
    const url = buildApiUrl(
      usePublicApi ? PUBLIC_API_ORIGIN : publicEnv.API_ENDPOINT,
      segments,
      query
    ).toString();
    try {
      const response = await requestOnce(url);
      if (!TRANSIENT_STATUSES.has(response.status)) return response;
      await response.body?.cancel();
    } catch (error) {
      if (controller.signal.aborted) throw error;
    }
    return requestOnce(url);
  };
  const fetchJson: FetchOgApiJson = async (segments, query = {}) => {
    let response = await requestMetadata(segments, query);
    if (
      mayUsePublicApi &&
      !usePublicApi &&
      (response.status === 401 || response.status === 403)
    ) {
      await response.body?.cancel();
      // These collections are public. Keep the token and its collection on the
      // public API after one staging-access fallback, without forwarding auth.
      usePublicApi = true;
      response = await requestMetadata(segments, query);
    }
    if (!response.ok) throw new Error("Card metadata is unavailable.");
    assertContentType(response.headers, isJsonContentType, "application/json");
    return readLimitedJson<unknown>(response, MAX_METADATA_BYTES);
  };
  try {
    return await run(fetchJson);
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
    controller.abort();
  }
}
