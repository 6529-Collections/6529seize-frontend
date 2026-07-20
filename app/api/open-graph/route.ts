import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  BodyTooLargeError,
  UnsupportedContentTypeError,
  assertContentType,
  isHtmlContentType,
  isJsonContentType,
  readLimitedJson,
  readLimitedText,
} from "@/lib/fetch/limitedBody";
import { API_AUTH_COOKIE } from "@/constants/constants";
import {
  UrlGuardError,
  assertPublicUrl,
  fetchPublicUrl,
  parsePublicUrl,
  type UrlGuardOptions,
} from "@/lib/security/urlGuard";
import LruTtlCache from "@/lib/cache/lruTtl";
import {
  detectExternalFileKind,
  getFileExtension,
  getNormalizedMimeType,
  isClearlyFileLikeUrl,
} from "@/lib/link-preview/fileKinds";
import type {
  ExternalFileLinkPreviewResponse,
  LinkPreviewResponse,
} from "@/services/api/link-preview-api";
import { buildGoogleWorkspaceResponse, buildResponse } from "./utils";
import { createCompoundPlan, type PreviewPlan } from "./compound/service";
import { createFoundationPlan } from "./foundation/service";
import { createManifoldPlan } from "./manifold/service";
import { createOpenSeaPlan } from "./opensea/service";
import { createFirstParty6529Plan } from "./6529/service";
import { createTransientPlan } from "./transient/service";
import { createYoutubePlan } from "./youtube/service";
import { buildFarcasterEmbedResponse } from "./farcaster/service";
import { detectEnsTarget, fetchEnsPreview, EnsPreviewError } from "./ens";
import { HTML_FETCH_HEADERS, createFetchConfig } from "./fetchConfig";

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ITEMS = 500;
const FETCH_TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 5;
const BATCH_CONCURRENCY = 5;
const MAX_BATCH_URLS = BATCH_CONCURRENCY;
const HTML_RESPONSE_MAX_BYTES = 8 * 1024 * 1024;
const BATCH_REQUEST_MAX_BYTES = 64 * 1024;

const PUBLIC_URL_POLICY: UrlGuardOptions["policy"] = {
  blockedHosts: ["localhost", "127.0.0.1", "::1"],
  blockedHostSuffixes: [
    ".local",
    ".internal",
    ".lan",
    ".intra",
    ".corp",
    ".home",
    ".test",
  ],
};

const PUBLIC_URL_OPTIONS: UrlGuardOptions = {
  policy: PUBLIC_URL_POLICY,
};

type PreviewContext = {
  readonly apiAuth?: string | null | undefined;
};

const cache = new LruTtlCache<string, LinkPreviewResponse>({
  max: CACHE_MAX_ITEMS,
  ttlMs: CACHE_TTL_MS,
});

const isUrlGuardError = (error: unknown): error is UrlGuardError =>
  error instanceof UrlGuardError ||
  (typeof error === "object" &&
    error !== null &&
    (error as { name?: string | undefined }).name === "UrlGuardError");

const isEnsPreviewError = (error: unknown): error is EnsPreviewError =>
  typeof EnsPreviewError === "function" && error instanceof EnsPreviewError;

/**
 * Detects bounded-body reader failures that should produce client responses.
 */
const isLimitedBodyError = (
  error: unknown
): error is BodyTooLargeError | UnsupportedContentTypeError =>
  error instanceof BodyTooLargeError ||
  error instanceof UnsupportedContentTypeError;

/**
 * Converts preview fetch body-limit failures into user-facing JSON errors.
 */
function previewLimitErrorResponse(
  error: BodyTooLargeError | UnsupportedContentTypeError
) {
  const message =
    error instanceof BodyTooLargeError
      ? "Preview response is too large to process safely."
      : "Preview URL did not return readable HTML metadata.";
  return NextResponse.json({ error: message }, { status: error.statusCode });
}

/**
 * Converts oversized or non-JSON batch request bodies into clear API errors.
 */
function batchBodyLimitErrorResponse(
  error: BodyTooLargeError | UnsupportedContentTypeError
) {
  const message =
    error instanceof BodyTooLargeError
      ? "Open graph batch request body is too large."
      : "Open graph batch request body must be JSON.";
  return NextResponse.json({ error: message }, { status: error.statusCode });
}

type FetchInput = Parameters<typeof fetch>[0];

const isRequestLike = (value: unknown): value is { url: string } => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const { url } = value as { url?: unknown | undefined };
  return typeof url === "string" && url.length > 0;
};

const stringifiesToUrl = (value: unknown): string | null => {
  if (
    typeof value !== "object" ||
    value === null ||
    typeof (value as { toString?: unknown | undefined }).toString !== "function"
  ) {
    return null;
  }

  try {
    const raw = (value as { toString: () => string }).toString();
    return typeof raw === "string" &&
      !raw.startsWith("[object ") &&
      raw.length > 0
      ? raw
      : null;
  } catch {
    return null;
  }
};

const resolveRequestUrl = (input: FetchInput): URL => {
  if (typeof input === "string") {
    return new URL(input);
  }

  if (input instanceof URL) {
    return input;
  }

  if (typeof Request !== "undefined" && input instanceof Request) {
    return new URL(input.url);
  }

  if (isRequestLike(input)) {
    return new URL(input.url);
  }

  const stringified = stringifiesToUrl(input);
  if (stringified) {
    return new URL(stringified);
  }

  throw new UrlGuardError(
    "Unsupported fetch input provided.",
    "invalid-url",
    400
  );
};

// Apply host-specific header overrides while letting fetchPublicUrl enforce SSRF guardrails.
const hostAwareFetch: typeof fetch = async (input, init = {}) => {
  const targetUrl = resolveRequestUrl(input);
  const { headers: baseHeaders, userAgent } = createFetchConfig(targetUrl);

  const headers = new Headers(init.headers);
  const keysToReset = new Set([
    ...Object.keys(HTML_FETCH_HEADERS),
    ...Object.keys(baseHeaders),
    "user-agent",
  ]);

  keysToReset.forEach((key) => {
    headers.delete(key);
  });

  for (const [key, value] of Object.entries(baseHeaders)) {
    headers.set(key, value);
  }

  headers.set("user-agent", userAgent);

  return fetch(input, {
    ...init,
    headers,
  });
};

function ensureSuccessfulResponse(response: Response): void {
  if (!response.ok) {
    throw new UrlGuardError(
      `Request failed with status ${response.status}`,
      "fetch-failed",
      response.status
    );
  }
}

/**
 * Validates and reads an HTML response using the shared byte-limited reader.
 */
async function extractHtmlResponse(
  response: Response,
  fallbackUrl: URL
): Promise<{ html: string; contentType: string | null; finalUrl: string }> {
  try {
    const contentType = assertContentType(
      response.headers,
      isHtmlContentType,
      "HTML",
      { allowMissing: true }
    );
    const html = await readLimitedText(response, HTML_RESPONSE_MAX_BYTES);
    if (contentType === null && !looksLikeHtmlDocument(html)) {
      throw new UnsupportedContentTypeError(null, "HTML");
    }
    const finalUrl = response.url || fallbackUrl.toString();

    return {
      html,
      contentType,
      finalUrl,
    };
  } catch (error) {
    if (error instanceof UrlGuardError || isLimitedBodyError(error)) {
      throw error;
    }

    throw new UrlGuardError("Failed to fetch URL.", "fetch-failed", 502, {
      cause: error,
    });
  }
}

function looksLikeHtmlDocument(value: string): boolean {
  return /^\s*(?:<!doctype\s+html\b|<html\b|<head\b|<body\b|<meta\b|<title\b|<!--)/i.test(
    value
  );
}

/**
 * Fetches remote generic preview content through the public URL guard.
 */
async function fetchGenericResponse(url: URL): Promise<Response> {
  const response = await fetchPublicUrl(
    url,
    {},
    {
      ...PUBLIC_URL_OPTIONS,
      timeoutMs: FETCH_TIMEOUT_MS,
      maxRedirects: MAX_REDIRECTS,
      fetchImpl: hostAwareFetch,
    }
  );

  ensureSuccessfulResponse(response);

  return response;
}

/**
 * Fetches remote OpenGraph HTML through the public URL guard and byte cap.
 */
async function fetchHtml(
  url: URL
): Promise<{ html: string; contentType: string | null; finalUrl: string }> {
  const response = await fetchGenericResponse(url);
  return extractHtmlResponse(response, url);
}

function isHtmlDocumentContentType(contentType: string | null): boolean {
  if (!contentType) {
    return false;
  }

  const mimeType = getNormalizedMimeType(contentType);
  return (
    mimeType === "text/html" ||
    mimeType === "application/xhtml+xml" ||
    mimeType === "application/xml" ||
    mimeType === "text/xml" ||
    Boolean(mimeType?.endsWith("+xml"))
  );
}

function parseContentLength(headers: Headers): number | null {
  const rawContentLength = headers.get("content-length")?.trim();
  if (!rawContentLength || !/^\d+$/.test(rawContentLength)) {
    return null;
  }

  const parsed = Number(rawContentLength);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

async function cancelResponseBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    // Best effort: file previews intentionally do not consume response bodies.
  }
}

function decodeHeaderValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeContentDispositionFilenameStar(value: string): string {
  const trimmed = value.trim().replace(/^"|"$/g, "");
  const parts = trimmed.split("'");
  if (parts.length >= 3 && parts[0]) {
    return parts.slice(2).join("'");
  }
  return trimmed;
}

function sanitizeFileName(value: string | null | undefined): string | null {
  const normalized = value
    ?.replace(/[\u0000-\u001f\u007f]/g, "")
    .split(/[\\/]/)
    .findLast((segment) => segment.length > 0)
    ?.trim();

  if (!normalized) {
    return null;
  }

  return normalized.slice(0, 180);
}

function getContentDispositionFileName(headers: Headers): string | null {
  const contentDisposition = headers.get("content-disposition");
  if (!contentDisposition) {
    return null;
  }

  const encodedMatch = /filename\*\s*=\s*([^;]+)/i.exec(contentDisposition);
  if (encodedMatch?.[1]) {
    return sanitizeFileName(
      decodeHeaderValue(
        normalizeContentDispositionFilenameStar(encodedMatch[1])
      )
    );
  }

  const quotedMatch = /filename\s*=\s*"([^"]+)"/i.exec(contentDisposition);
  if (quotedMatch?.[1]) {
    return sanitizeFileName(quotedMatch[1]);
  }

  const plainMatch = /filename\s*=\s*([^;]+)/i.exec(contentDisposition);
  return sanitizeFileName(plainMatch?.[1]);
}

function getUrlFileName(url: URL): string | null {
  return sanitizeFileName(
    decodeHeaderValue(url.pathname.split("/").at(-1) ?? "")
  );
}

function getSourceHost(url: URL): string {
  return url.hostname.replace(/^www\./i, "");
}

function shouldUseExternalFilePreview(
  response: Response,
  finalUrl: URL
): boolean {
  if (isClearlyFileLikeUrl(finalUrl)) {
    return true;
  }

  const contentType = response.headers.get("content-type");
  // Explicit non-HTML payloads, including JSON, are metadata-only file
  // previews; external bodies are not proxied or decoded here.
  return Boolean(contentType) && !isHtmlDocumentContentType(contentType);
}

function buildExternalFileResponse(
  response: Response,
  finalUrl: URL
): ExternalFileLinkPreviewResponse {
  const contentType = response.headers.get("content-type")?.trim() ?? null;
  const fileName =
    getContentDispositionFileName(response.headers) ??
    getUrlFileName(finalUrl) ??
    getSourceHost(finalUrl);
  const extension =
    getFileExtension(fileName) ?? getFileExtension(finalUrl.pathname);
  const fileKind = detectExternalFileKind({ extension, contentType });

  return {
    type: "external.file",
    title: fileName,
    fileName,
    extension,
    fileKind,
    contentType,
    sizeBytes: parseContentLength(response.headers),
    sourceHost: getSourceHost(finalUrl),
    trust: "external_unscanned",
    links: {
      open: finalUrl.toString(),
    },
  };
}

function getFetchedFinalUrl(response: Response, fallbackUrl: URL): URL {
  const finalUrl = response.url || fallbackUrl.toString();
  try {
    return new URL(finalUrl);
  } catch {
    throw new UrlGuardError("Invalid redirect URL", "invalid-url", 502);
  }
}

function handleGuardError(error: unknown, fallbackStatus = 400) {
  if (isUrlGuardError(error)) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  const message =
    error instanceof Error ? error.message : "Invalid or forbidden URL";
  return NextResponse.json({ error: message }, { status: fallbackStatus });
}

function getErrorMessage(
  error: unknown,
  fallbackMessage = "Invalid or forbidden URL"
): string {
  return error instanceof Error ? error.message : fallbackMessage;
}

function handlePreviewError(error: unknown) {
  if (isEnsPreviewError(error)) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    );
  }

  if (isLimitedBodyError(error)) {
    return previewLimitErrorResponse(error);
  }

  if (isUrlGuardError(error)) {
    return handleGuardError(error, 502);
  }

  const message =
    error instanceof Error ? error.message : "Unable to fetch URL";
  return NextResponse.json({ error: message }, { status: 502 });
}

function createGenericPlan(url: URL): PreviewPlan {
  return {
    cacheKey: `generic:${url.toString()}`,
    execute: async () => {
      const response = await fetchGenericResponse(url);
      const finalUrlInstance = getFetchedFinalUrl(response, url);
      await assertPublicUrl(finalUrlInstance, PUBLIC_URL_OPTIONS);

      if (shouldUseExternalFilePreview(response, finalUrlInstance)) {
        const data = buildExternalFileResponse(response, finalUrlInstance);
        await cancelResponseBody(response);
        return { data, ttl: CACHE_TTL_MS };
      }

      const {
        html,
        contentType,
        finalUrl: htmlFinalUrl,
      } = await extractHtmlResponse(response, finalUrlInstance);
      const googleWorkspace = await buildGoogleWorkspaceResponse(
        finalUrlInstance,
        html,
        url
      );
      if (googleWorkspace) {
        return { data: googleWorkspace, ttl: CACHE_TTL_MS };
      }

      const genericData = buildResponse(
        finalUrlInstance,
        html,
        contentType,
        htmlFinalUrl
      );
      const farcasterEmbed = await buildFarcasterEmbedResponse(
        finalUrlInstance,
        html,
        genericData,
        {
          assertPublicUrl: (candidate) =>
            assertPublicUrl(candidate, PUBLIC_URL_OPTIONS),
        }
      );
      const data = farcasterEmbed ?? genericData;
      return { data, ttl: CACHE_TTL_MS };
    },
  };
}

function getRequestApiAuth(request: NextRequest): string | null {
  const cookieStore = (
    request as {
      readonly cookies?: {
        get: (name: string) => { readonly value?: string } | undefined;
      };
    }
  ).cookies;
  return cookieStore?.get(API_AUTH_COOKIE)?.value ?? null;
}

async function resolveLinkPreview(
  rawUrl: string | null,
  context?: PreviewContext
): Promise<LinkPreviewResponse> {
  const ensTarget = detectEnsTarget(rawUrl);
  if (ensTarget) {
    return fetchEnsPreview(ensTarget) as Promise<LinkPreviewResponse>;
  }

  const targetUrl = parsePublicUrl(rawUrl);
  const firstParty6529Plan = createFirstParty6529Plan(targetUrl, context);

  if (!firstParty6529Plan) {
    await assertPublicUrl(targetUrl, PUBLIC_URL_OPTIONS);
  }

  const plan =
    firstParty6529Plan ??
    createYoutubePlan(targetUrl) ??
    createManifoldPlan(targetUrl, {
      fetchHtml,
      assertPublicUrl: (url) => assertPublicUrl(url, PUBLIC_URL_OPTIONS),
    }) ??
    createFoundationPlan(targetUrl, {
      fetchHtml,
      assertPublicUrl: (url) => assertPublicUrl(url, PUBLIC_URL_OPTIONS),
    }) ??
    createOpenSeaPlan(targetUrl, {
      fetchHtml,
      assertPublicUrl: (url) => assertPublicUrl(url, PUBLIC_URL_OPTIONS),
    }) ??
    createTransientPlan(targetUrl, {
      fetchHtml,
      assertPublicUrl: (url) => assertPublicUrl(url, PUBLIC_URL_OPTIONS),
    }) ??
    createCompoundPlan(targetUrl) ??
    createGenericPlan(targetUrl);

  if (firstParty6529Plan) {
    return executeFirstParty6529Plan(firstParty6529Plan, targetUrl);
  }

  return executePlan(plan);
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");

  try {
    const preview = await resolveLinkPreview(rawUrl, {
      apiAuth: getRequestApiAuth(request),
    });
    return NextResponse.json(preview);
  } catch (error) {
    return handlePreviewError(error);
  }
}

type BatchResult = {
  readonly url: string;
  readonly data?: LinkPreviewResponse | undefined;
  readonly error?: string | undefined;
};

function isOpenGraphBatchBody(value: unknown): value is {
  readonly urls: readonly string[];
} {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const { urls } = value as { urls?: unknown };
  return Array.isArray(urls) && urls.every((url) => typeof url === "string");
}

function normalizeBatchUrls(urls: readonly string[]): readonly string[] {
  return Array.from(new Set(urls.map((url) => url.trim())));
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const worker = async (): Promise<void> => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex]!);
    }
  };

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      await worker();
    })
  );

  return results;
}

async function resolveBatchUrl(
  url: string,
  context?: PreviewContext
): Promise<BatchResult> {
  try {
    const data = await resolveLinkPreview(url, context);
    return { url, data };
  } catch (error) {
    return { url, error: getErrorMessage(error) };
  }
}

async function executePlan(plan: PreviewPlan): Promise<LinkPreviewResponse> {
  const cached = cache.get(plan.cacheKey);

  if (cached) {
    return cached;
  }

  const { data, ttl } = await plan.execute();
  cache.set(plan.cacheKey, data, ttl);

  return data;
}

async function executeFirstParty6529Plan(
  plan: PreviewPlan,
  targetUrl: URL
): Promise<LinkPreviewResponse> {
  try {
    return await executePlan(plan);
  } catch {
    await assertPublicUrl(targetUrl, PUBLIC_URL_OPTIONS);
    const fallbackPlan = createGenericPlan(targetUrl);
    return executePlan(fallbackPlan);
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    assertContentType(request.headers, isJsonContentType, "JSON", {
      allowMissing: true,
    });
    body = await readLimitedJson(request, BATCH_REQUEST_MAX_BYTES);
  } catch (error) {
    if (isLimitedBodyError(error)) {
      return batchBodyLimitErrorResponse(error);
    }

    return NextResponse.json(
      { error: "Invalid open graph batch request body." },
      { status: 400 }
    );
  }

  if (!isOpenGraphBatchBody(body)) {
    return NextResponse.json(
      { error: "A urls array is required." },
      { status: 400 }
    );
  }

  const urls = normalizeBatchUrls(body.urls);
  if (urls.length > MAX_BATCH_URLS) {
    return NextResponse.json(
      { error: `A maximum of ${MAX_BATCH_URLS} urls can be requested.` },
      { status: 400 }
    );
  }

  const context: PreviewContext = {
    apiAuth: getRequestApiAuth(request),
  };
  const batchResults = await mapWithConcurrency(
    urls,
    BATCH_CONCURRENCY,
    (url) => resolveBatchUrl(url, context)
  );
  const results: Record<string, LinkPreviewResponse> = {};
  const errors: Record<string, string> = {};

  for (const result of batchResults) {
    if (result.data) {
      results[result.url] = result.data;
    } else {
      errors[result.url] = result.error ?? "Invalid or forbidden URL";
    }
  }

  return NextResponse.json({ results, errors });
}

export const dynamic = "force-dynamic";
