import { NextRequest, NextResponse } from "next/server";

import {
  UrlGuardError,
  assertPublicUrl,
  fetchPublicUrl,
  parsePublicUrl,
} from "@/lib/security/urlGuard";
import {
  decodeHtmlEntities,
  replaceHtmlBreaksWithNewlines,
  stripHtmlTags,
} from "@/lib/text/html";
import type { FetchPublicUrlOptions, UrlGuardOptions } from "@/lib/security/urlGuard";
import type {
  TikTokPreviewKind,
  TikTokPreviewResult,
  TikTokPreviewSuccess,
} from "@/services/api/tiktok-preview";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const USER_AGENT =
  "6529seize-tiktok-preview/1.0 (+https://6529.io; Fetching public TikTok oEmbed data)";

const TIKTOK_ALLOWED_HOSTS = [
  "www.tiktok.com",
  "m.tiktok.com",
  "tiktok.com",
  "vm.tiktok.com",
  "vt.tiktok.com",
] as const;

const TIKTOK_URL_GUARD_OPTIONS: UrlGuardOptions = {
  policy: {
    allowedHosts: TIKTOK_ALLOWED_HOSTS,
  },
};

const TIKTOK_UNSUPPORTED_MESSAGE = "The provided URL is not a supported TikTok link.";
const INVALID_URL_MESSAGE = "The provided url parameter is not a valid URL.";

const TIKTOK_FETCH_OPTIONS: FetchPublicUrlOptions = {
  policy: {
    allowedHosts: TIKTOK_ALLOWED_HOSTS,
  },
  timeoutMs: FETCH_TIMEOUT_MS,
  userAgent: USER_AGENT,
};

type CacheEntry = {
  data: TikTokPreviewResult;
  status: number;
  expiresAt: number;
  revalidating: boolean;
};

const cache = new Map<string, CacheEntry>();
const revalidating = new Set<string>();

const TRACKING_PARAM_PREFIXES = ["utm_", "is_from_", "share_"];
const TRACKING_PARAM_NAMES = new Set(["web_id"]);

interface TikTokOEmbedResponse {
  readonly author_name?: string;
  readonly author_url?: string;
  readonly title?: string;
  readonly thumbnail_url?: string;
  readonly thumbnail_width?: number;
  readonly thumbnail_height?: number;
  readonly provider_name?: string;
  readonly provider_url?: string;
}

interface NormalizedTikTokUrl {
  readonly canonicalUrl: string;
  readonly kind: TikTokPreviewKind;
}

type HandlerResult<T> = { ok: true; value: T } | { ok: false; response: NextResponse };

function mapGuardErrorToResponse(error: UrlGuardError): NextResponse {
  const message =
    error.kind === "host-not-allowed" || error.kind === "ip-not-allowed"
      ? TIKTOK_UNSUPPORTED_MESSAGE
      : error.message;
  return NextResponse.json({ error: message }, { status: error.statusCode });
}

function parseRequestUrl(rawUrl: string): HandlerResult<URL> {
  try {
    return { ok: true, value: parsePublicUrl(rawUrl) };
  } catch (error) {
    if (error instanceof UrlGuardError) {
      return {
        ok: false,
        response: NextResponse.json({ error: error.message }, { status: error.statusCode }),
      };
    }

    return {
      ok: false,
      response: NextResponse.json({ error: INVALID_URL_MESSAGE }, { status: 400 }),
    };
  }
}

async function ensureTikTokUrlAllowed(url: URL): Promise<HandlerResult<URL>> {
  try {
    await assertPublicUrl(url, TIKTOK_URL_GUARD_OPTIONS);
    return { ok: true, value: url };
  } catch (error) {
    if (error instanceof UrlGuardError) {
      return { ok: false, response: mapGuardErrorToResponse(error) };
    }

    return {
      ok: false,
      response: NextResponse.json({ error: TIKTOK_UNSUPPORTED_MESSAGE }, { status: 400 }),
    };
  }
}

async function normalizeTikTokLink(url: URL): Promise<HandlerResult<NormalizedTikTokUrl>> {
  try {
    const normalized = await normalizeTikTokUrl(url);
    return { ok: true, value: normalized };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : TIKTOK_UNSUPPORTED_MESSAGE;

    return {
      ok: false,
      response: NextResponse.json({ error: message }, { status: 400 }),
    };
  }
}

function getCachedPreviewResponse(canonicalUrl: string): NextResponse | null {
  const cached = cache.get(canonicalUrl);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    scheduleRevalidation(canonicalUrl);
  }

  return NextResponse.json(cached.data, { status: cached.status });
}

async function resolveTikTokPreview(normalized: NormalizedTikTokUrl): Promise<NextResponse> {
  const cachedResponse = getCachedPreviewResponse(normalized.canonicalUrl);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const { data, status } = await fetchTikTokPreview(normalized.canonicalUrl);
    cache.set(normalized.canonicalUrl, {
      data,
      status,
      expiresAt: Date.now() + CACHE_TTL_MS,
      revalidating: false,
    });
    return NextResponse.json(data, { status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch TikTok preview at this time.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

function isNumeric(value: string | undefined): boolean {
  return !!value && /^\d+$/.test(value);
}

function sanitizeTrackingParams(url: URL): void {
  if (!url.search) {
    return;
  }

  const params = new URLSearchParams(url.search);
  for (const key of Array.from(params.keys())) {
    const lowerKey = key.toLowerCase();
    if (
      TRACKING_PARAM_NAMES.has(lowerKey) ||
      TRACKING_PARAM_PREFIXES.some((prefix) => lowerKey.startsWith(prefix))
    ) {
      params.delete(key);
    }
  }

  const nextSearch = params.toString();
  url.search = nextSearch ? `?${nextSearch}` : "";
}

function stripHtml(value: string): string {
  const withBreaks = replaceHtmlBreaksWithNewlines(value);
  return stripHtmlTags(withBreaks, { preserveTagSpacing: true });
}

function sanitizeCaption(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const decoded = decodeHtmlEntities(value);
  const withoutTags = stripHtml(decoded);
  const normalized = withoutTags.replaceAll(/\s+/g, " ").trim();
  if (!normalized) {
    return null;
  }
  return normalized.slice(0, 1000);
}

function sanitizeText(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed || null;
}

function ensureCanonicalHost(hostname: string): string {
  const normalized = hostname.toLowerCase();
  if (
    normalized === "tiktok.com" ||
    normalized === "www.tiktok.com" ||
    normalized === "m.tiktok.com"
  ) {
    return "www.tiktok.com";
  }
  throw new Error("Only standard TikTok domains are supported.");
}

function parseTikTokPath(segments: readonly string[]): NormalizedTikTokUrl {
  if (segments.length === 0) {
    throw new Error("Unsupported TikTok URL.");
  }

  const first = segments[0];
  if (first.startsWith("@")) {
    if (!/^@[A-Za-z0-9._-]+$/.test(first)) {
      throw new Error("Invalid TikTok username.");
    }

    if (segments.length === 1) {
      return {
        canonicalUrl: `https://www.tiktok.com/${first}`,
        kind: "profile",
      };
    }

    if (segments[1] === "video" && isNumeric(segments[2])) {
      return {
        canonicalUrl: `https://www.tiktok.com/${first}/video/${segments[2]}`,
        kind: "video",
      };
    }

    throw new Error("Unsupported TikTok path.");
  }

  if (first === "video" && isNumeric(segments[1])) {
    return {
      canonicalUrl: `https://www.tiktok.com/video/${segments[1]}`,
      kind: "video",
    };
  }

  throw new Error("Unsupported TikTok path.");
}

async function resolveShortLink(url: URL): Promise<URL> {
  const baseHeaders = { "user-agent": USER_AGENT };

  let response = await fetchPublicUrl(
    url,
    {
      method: "HEAD",
      headers: baseHeaders,
    },
    TIKTOK_FETCH_OPTIONS
  );

  if (response.status === 405 || response.status === 400) {
    response = await fetchPublicUrl(
      url,
      {
        method: "GET",
        headers: baseHeaders,
      },
      TIKTOK_FETCH_OPTIONS
    );
  }

  if (!response.ok) {
    throw new Error(`Short link resolution failed with status ${response.status}`);
  }

  return new URL(response.url || url.toString());
}

async function normalizeTikTokUrl(url: URL): Promise<NormalizedTikTokUrl> {
  const hostname = url.hostname.toLowerCase();

  if (hostname === "vm.tiktok.com" || hostname === "vt.tiktok.com") {
    const resolved = await resolveShortLink(url);
    return normalizeTikTokUrl(resolved);
  }

  ensureCanonicalHost(hostname);
  url.hash = "";
  sanitizeTrackingParams(url);

  const segments = url.pathname.split("/").filter((segment) => segment.length > 0);
  const normalized = parseTikTokPath(segments);

  const search = url.search ? url.search : "";
  return {
    canonicalUrl: `${normalized.canonicalUrl}${search}`,
    kind: normalized.kind,
  };
}

async function fetchTikTokPreview(
  canonicalUrl: string
): Promise<{ data: TikTokPreviewResult; status: number }> {
  const endpoint = new URL("https://www.tiktok.com/oembed");
  endpoint.searchParams.set("url", canonicalUrl);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint.toString(), {
      headers: {
        accept: "application/json",
        "user-agent": USER_AGENT,
      },
      signal: controller.signal,
    });

    if (response.status === 404 || response.status === 401) {
      const unavailable: TikTokPreviewResult = {
        error: "unavailable",
        canonicalUrl,
      };
      return { data: unavailable, status: 404 };
    }

    if (!response.ok) {
      throw new Error(`TikTok oEmbed request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as TikTokOEmbedResponse;

    const data: TikTokPreviewSuccess = {
      kind: canonicalUrl.includes("/video/") ? "video" : "profile",
      canonicalUrl,
      authorName: sanitizeText(payload.author_name),
      authorUrl: sanitizeText(payload.author_url),
      title: sanitizeCaption(payload.title ?? undefined),
      thumbnailUrl: sanitizeText(payload.thumbnail_url),
      thumbnailWidth:
        typeof payload.thumbnail_width === "number"
          ? payload.thumbnail_width
          : null,
      thumbnailHeight:
        typeof payload.thumbnail_height === "number"
          ? payload.thumbnail_height
          : null,
      providerName: sanitizeText(payload.provider_name),
      providerUrl: sanitizeText(payload.provider_url),
    };

    return { data, status: 200 };
  } finally {
    clearTimeout(timeout);
  }
}

function scheduleRevalidation(canonicalUrl: string): void {
  if (revalidating.has(canonicalUrl)) {
    return;
  }

  const entry = cache.get(canonicalUrl);
  if (!entry) {
    return;
  }

  revalidating.add(canonicalUrl);
  void fetchTikTokPreview(canonicalUrl)
    .then(({ data, status }) => {
      cache.set(canonicalUrl, {
        data,
        status,
        expiresAt: Date.now() + CACHE_TTL_MS,
        revalidating: false,
      });
    })
    .catch(() => {
      // keep existing cached value on failure
    })
    .finally(() => {
      revalidating.delete(canonicalUrl);
    });
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");
  if (!rawUrl) {
    return NextResponse.json({ error: "A url query parameter is required." }, { status: 400 });
  }

  const parsedResult = parseRequestUrl(rawUrl);
  if (!parsedResult.ok) {
    return parsedResult.response;
  }

  const guardResult = await ensureTikTokUrlAllowed(parsedResult.value);
  if (!guardResult.ok) {
    return guardResult.response;
  }

  const normalizedResult = await normalizeTikTokLink(parsedResult.value);
  if (!normalizedResult.ok) {
    return normalizedResult.response;
  }

  const canonicalUrl = new URL(normalizedResult.value.canonicalUrl);
  const canonicalGuardResult = await ensureTikTokUrlAllowed(canonicalUrl);
  if (!canonicalGuardResult.ok) {
    return canonicalGuardResult.response;
  }

  return resolveTikTokPreview(normalizedResult.value);
}

export const dynamic = "force-dynamic";
