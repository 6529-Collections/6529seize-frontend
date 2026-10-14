import { publicEnv } from "@/config/env";
import { getUsableText } from "@/app/api/og-metadata/_lib/imageUtils";
import {
  assertContentType,
  isJsonContentType,
  readLimitedJson,
} from "@/lib/fetch/limitedBody";

const MAX_METADATA_BYTES = 256 * 1024;
const METADATA_TIMEOUT_MS = 5_000;
const STAGING_API_ORIGIN = "https://api.staging.6529.io";
const PUBLIC_API_ORIGIN = "https://api.6529.io";

export type JsonRecord = Record<string, unknown>;
export type FetchOgApiJson = (path: string) => Promise<unknown>;

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
 * Runs `run` with a JSON reader for the configured collection API. Card text
 * and artwork are resolved only through this reader, never from request input.
 * Callers pass fixed API paths and must never follow response redirects.
 */
export async function withOgApiJson<T>(
  signal: AbortSignal | undefined,
  run: (fetchJson: FetchOgApiJson) => Promise<T>
): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) abort();
  const timeout = setTimeout(abort, METADATA_TIMEOUT_MS);
  const apiAuth = getUsableText(publicEnv.STAGING_API_KEY);
  const mayUsePublicApi =
    new URL(publicEnv.API_ENDPOINT).origin === STAGING_API_ORIGIN;
  let usePublicApi = false;
  const requestMetadata = (path: string): Promise<Response> =>
    fetch(
      `${usePublicApi ? PUBLIC_API_ORIGIN : publicEnv.API_ENDPOINT}/api/${path}`,
      {
        signal: controller.signal,
        redirect: "error",
        headers: {
          Accept: "application/json",
          ...(apiAuth === null || usePublicApi
            ? {}
            : { "x-6529-auth": apiAuth }),
        },
        next: { revalidate: 3600 },
      }
    );
  const fetchJson: FetchOgApiJson = async (path) => {
    let response = await requestMetadata(path);
    if (
      mayUsePublicApi &&
      !usePublicApi &&
      (response.status === 401 || response.status === 403)
    ) {
      await response.body?.cancel();
      // These collections are public. Keep the token and its collection on the
      // public API after one staging-access fallback, without forwarding auth.
      usePublicApi = true;
      response = await requestMetadata(path);
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
