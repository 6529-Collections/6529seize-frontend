import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { publicEnv } from "@/config/env";
import {
  BodyTooLargeError,
  UnsupportedContentTypeError,
  assertContentType,
  isHtmlContentType,
  isTolerantJsonContentType,
  readLimitedJson,
  readLimitedText,
} from "@/lib/fetch/limitedBody";
import {
  UrlGuardError,
  assertPublicUrl,
  fetchPublicUrl,
  parsePublicUrl,
  type UrlGuardOptions,
} from "@/lib/security/urlGuard";
import { escapeRegExp } from "@/lib/text/regex";
import LruTtlCache from "@/lib/cache/lruTtl";
import {
  parseFarcasterResource,
  type FarcasterResourceIdentifier,
} from "@/services/farcaster/url";
import type {
  FarcasterCastPreview,
  FarcasterChannelPreview,
  FarcasterFramePreview,
  FarcasterPreviewResponse,
  FarcasterProfilePreview,
  FarcasterUnavailablePreview,
  FarcasterUnsupportedPreview,
} from "@/types/farcaster.types";
import {
  mapWarpcastCast,
  mapWarpcastChannel,
  mapWarpcastUser,
  type WarpcastCastResponse,
  type WarpcastChannelResponse,
  type WarpcastUserResponse,
} from "./warpcastMappers";

const WARPCAST_API_BASE =
  publicEnv.FARCASTER_WARPCAST_API_BASE ?? "https://api.warpcast.com";
const WARPCAST_API_KEY = publicEnv.FARCASTER_WARPCAST_API_KEY ?? undefined;

const CAST_CACHE_TTL_MS = 20 * 60 * 1000;
const PROFILE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CHANNEL_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FRAME_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const CACHE_MAX_ITEMS = 500;

const FETCH_TIMEOUT_MS = 6000;
const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);
const MAX_REDIRECTS = 4;
const USER_AGENT =
  "6529seize-farcaster/1.0 (+https://6529.io; Fetching Farcaster metadata)";
const HTML_ACCEPT_HEADER =
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8";
const HTML_RESPONSE_MAX_BYTES = 8 * 1024 * 1024;
const JSON_RESPONSE_MAX_BYTES = 2 * 1024 * 1024;

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

const castCache = new LruTtlCache<string, FarcasterCastPreview | null>({
  max: CACHE_MAX_ITEMS,
  ttlMs: CAST_CACHE_TTL_MS,
});
const profileCache = new LruTtlCache<string, FarcasterProfilePreview | null>({
  max: CACHE_MAX_ITEMS,
  ttlMs: PROFILE_CACHE_TTL_MS,
});
const channelCache = new LruTtlCache<string, FarcasterChannelPreview | null>({
  max: CACHE_MAX_ITEMS,
  ttlMs: CHANNEL_CACHE_TTL_MS,
});
const frameCache = new LruTtlCache<
  string,
  FarcasterFramePreview | FarcasterUnsupportedPreview | null
>({
  max: CACHE_MAX_ITEMS,
  ttlMs: FRAME_CACHE_TTL_MS,
});

const createAbortController = (
  timeoutMs: number
): {
  controller: AbortController;
  cancel: () => void;
} => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return {
    controller,
    cancel: () => clearTimeout(timeoutId),
  };
};

const buildWarpcastUrl = (
  path: string,
  params: Record<string, string | undefined>
): URL => {
  const url = new URL(path, WARPCAST_API_BASE);

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.length > 0) {
      url.searchParams.set(key, value);
    }
  }

  if (WARPCAST_API_KEY) {
    url.searchParams.set("key", WARPCAST_API_KEY);
  }

  return url;
};

const fetchWarpcastJson = async <T>(
  path: string,
  params: Record<string, string | undefined>
): Promise<T | null> => {
  const url = buildWarpcastUrl(path, params);
  const { controller, cancel } = createAbortController(FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        "user-agent": USER_AGENT,
      },
      signal: controller.signal,
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Warpcast request failed with status ${response.status}`);
    }

    assertContentType(response.headers, isTolerantJsonContentType, "JSON", {
      allowMissing: true,
    });
    return await readLimitedJson<T>(response, JSON_RESPONSE_MAX_BYTES);
  } catch (error) {
    if ((error as { name?: string | undefined }).name === "AbortError") {
      throw new Error("Warpcast request aborted");
    }

    throw error instanceof Error ? error : new Error("Warpcast request failed");
  } finally {
    cancel();
  }
};

const fetchCastPreview = async (
  identifier: Extract<FarcasterResourceIdentifier, { type: "cast" }>
): Promise<FarcasterCastPreview | null> => {
  const cached = castCache.get(identifier.canonicalUrl);
  if (cached !== undefined) {
    return cached;
  }

  const response = await fetchWarpcastJson<WarpcastCastResponse>("/v2/cast", {
    hash: identifier.castHash,
  });

  const mapped = mapWarpcastCast(response, identifier.canonicalUrl);
  castCache.set(identifier.canonicalUrl, mapped);
  return mapped;
};

const fetchProfilePreview = async (
  identifier: Extract<FarcasterResourceIdentifier, { type: "profile" }>
): Promise<FarcasterProfilePreview | null> => {
  const cached = profileCache.get(identifier.canonicalUrl);
  if (cached !== undefined) {
    return cached;
  }

  const response = await fetchWarpcastJson<WarpcastUserResponse>(
    "/v2/user-by-username",
    {
      username: identifier.username,
    }
  );

  const mapped = mapWarpcastUser(response, identifier.canonicalUrl);
  profileCache.set(identifier.canonicalUrl, mapped);
  return mapped;
};

const fetchChannelPreview = async (
  identifier: Extract<FarcasterResourceIdentifier, { type: "channel" }>
): Promise<FarcasterChannelPreview | null> => {
  const cached = channelCache.get(identifier.canonicalUrl);
  if (cached !== undefined) {
    return cached;
  }

  const response = await fetchWarpcastJson<WarpcastChannelResponse>(
    "/v2/channel",
    {
      channelId: identifier.channel,
    }
  );

  const mapped = mapWarpcastChannel(response, identifier.canonicalUrl);
  channelCache.set(identifier.canonicalUrl, mapped);
  return mapped;
};

const hasFrameMeta = (html: string): boolean =>
  /<meta[^>]+(?:name|property)=["']fc:frame["'][^>]*>/i.test(html);

const extractMetaContent = (html: string, name: string): string | undefined => {
  const metaPattern = new RegExp(
    String.raw`<meta[^>]+(?:name|property)=["']${escapeRegExp(name)}["'][^>]*>`,
    "i"
  );
  const metaTag = metaPattern.exec(html)?.[0];
  if (!metaTag) {
    return undefined;
  }
  const contentMatch = /content=["']([^"']+)["']/i.exec(metaTag);
  if (!contentMatch) {
    return undefined;
  }
  return contentMatch[1]?.trim();
};

const extractTitle = (html: string): string | undefined => {
  const rawTitle = /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1];
  if (!rawTitle) {
    return undefined;
  }
  return rawTitle.trim();
};

const resolveUrl = (
  base: string,
  value: string | undefined
): string | undefined => {
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value, base).toString();
  } catch {
    return undefined;
  }
};

const shouldPropagateUrlGuardError = (error: UrlGuardError): boolean =>
  error.kind === "host-not-allowed" ||
  error.kind === "dns-lookup-failed" ||
  error.kind === "ip-not-allowed";

type FetchHtmlResult =
  | {
      readonly html: string;
      readonly finalUrl: string;
    }
  | {
      readonly blockedReason: string;
    };

/**
 * Fetches frame HTML with public URL guarding and a bounded response body.
 */
const fetchHtml = async (url: URL): Promise<FetchHtmlResult | null> => {
  try {
    const response = await fetchPublicUrl(
      url,
      {
        method: "GET",
        headers: {
          accept: HTML_ACCEPT_HEADER,
        },
      },
      {
        ...PUBLIC_URL_OPTIONS,
        maxRedirects: MAX_REDIRECTS,
        timeoutMs: FETCH_TIMEOUT_MS,
        redirectStatusCodes: REDIRECT_STATUS_CODES,
        userAgent: USER_AGENT,
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }

      throw new Error(`Frame fetch failed with status ${response.status}`);
    }

    assertContentType(response.headers, isHtmlContentType, "HTML", {
      allowMissing: true,
    });
    const html = await readLimitedText(response, HTML_RESPONSE_MAX_BYTES);
    const finalUrl = response.url || url.toString();
    return { html, finalUrl };
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return {
        blockedReason:
          "Farcaster frame response is too large to process safely.",
      };
    }

    if (error instanceof UnsupportedContentTypeError) {
      return {
        blockedReason:
          "Farcaster frame URL did not return readable HTML metadata.",
      };
    }

    if (error instanceof UrlGuardError) {
      if (shouldPropagateUrlGuardError(error)) {
        throw error;
      }

      return null;
    }

    throw error instanceof Error
      ? error
      : new Error("Failed to fetch frame HTML");
  }
};

/**
 * Reads and normalizes a Farcaster frame preview, including blocked outcomes.
 */
const detectFramePreview = async (
  url: URL
): Promise<FarcasterFramePreview | FarcasterUnsupportedPreview | null> => {
  const cached = frameCache.get(url.toString());
  if (cached !== undefined) {
    return cached;
  }

  const result = await fetchHtml(url);
  if (!result) {
    frameCache.set(url.toString(), null);
    return null;
  }

  if ("blockedReason" in result) {
    const unsupported: FarcasterUnsupportedPreview = {
      type: "unsupported",
      canonicalUrl: url.toString(),
      reason: result.blockedReason,
    };
    frameCache.set(url.toString(), unsupported);
    return unsupported;
  }

  const { html, finalUrl } = result;

  if (!hasFrameMeta(html)) {
    frameCache.set(url.toString(), null);
    return null;
  }

  const resolvedImage = resolveUrl(
    finalUrl,
    extractMetaContent(html, "fc:frame:image") ||
      extractMetaContent(html, "og:image") ||
      extractMetaContent(html, "twitter:image")
  );

  const buttons: string[] = [];
  for (let index = 1; index <= 4; index += 1) {
    const label = extractMetaContent(html, `fc:frame:button:${index}`);
    if (label) {
      buttons.push(label);
    }
  }

  const title =
    extractMetaContent(html, "og:title") ||
    extractMetaContent(html, "twitter:title") ||
    extractTitle(html);

  const siteName = extractMetaContent(html, "og:site_name");

  const preview: FarcasterFramePreview = {
    type: "frame",
    canonicalUrl: finalUrl,
    frame: {
      frameUrl: finalUrl,
      title: title ?? undefined,
      siteName: siteName ?? undefined,
      imageUrl: resolvedImage,
      buttons,
    },
  };

  frameCache.set(url.toString(), preview);
  return preview;
};

const toUnavailable = (
  canonicalUrl: string | undefined,
  reason?: string
): FarcasterUnavailablePreview => ({
  type: "unavailable",
  canonicalUrl,
  reason,
});

const toUnsupported = (
  canonicalUrl?: string,
  reason?: string
): FarcasterUnsupportedPreview => ({
  type: "unsupported",
  canonicalUrl,
  reason,
});

const handleResource = async (
  resource: FarcasterResourceIdentifier
): Promise<FarcasterPreviewResponse> => {
  if (resource.type === "cast") {
    const preview = await fetchCastPreview(resource);
    return (
      preview ?? toUnavailable(resource.canonicalUrl, "Cast not available")
    );
  }

  if (resource.type === "profile") {
    const preview = await fetchProfilePreview(resource);
    return (
      preview ?? toUnavailable(resource.canonicalUrl, "Profile not available")
    );
  }

  if (resource.type === "channel") {
    const preview = await fetchChannelPreview(resource);
    return (
      preview ?? toUnavailable(resource.canonicalUrl, "Channel not available")
    );
  }

  return toUnsupported(undefined, "Unsupported Farcaster resource");
};

const isUrlGuardError = (error: unknown): error is UrlGuardError =>
  error instanceof UrlGuardError ||
  (typeof error === "object" &&
    error !== null &&
    (error as { name?: string | undefined }).name === "UrlGuardError");

const handleGuardError = (error: unknown, fallbackStatus = 400) => {
  if (isUrlGuardError(error)) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  const message =
    error instanceof Error ? error.message : "Invalid or forbidden URL";
  return NextResponse.json({ error: message }, { status: fallbackStatus });
};

export async function GET(request: NextRequest) {
  let targetUrl: URL;

  try {
    targetUrl = parsePublicUrl(request.nextUrl.searchParams.get("url"));
  } catch (error) {
    return handleGuardError(error);
  }

  try {
    await assertPublicUrl(targetUrl, PUBLIC_URL_OPTIONS);
  } catch (error) {
    return handleGuardError(error);
  }

  try {
    const resource = parseFarcasterResource(targetUrl);

    if (resource) {
      const response = await handleResource(resource);
      return NextResponse.json(response);
    }

    if (targetUrl.protocol === "http:" || targetUrl.protocol === "https:") {
      const framePreview = await detectFramePreview(targetUrl);
      if (framePreview) {
        return NextResponse.json(framePreview);
      }
    }

    return NextResponse.json(
      toUnsupported(targetUrl.toString(), "Unsupported Farcaster URL")
    );
  } catch (error) {
    if (isUrlGuardError(error)) {
      return handleGuardError(error, error.statusCode);
    }

    const message =
      error instanceof Error
        ? error.message
        : "Unable to resolve Farcaster data";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

// ts-prune-ignore-next-line: Next.js reads this named export as route config
export const dynamic = "force-dynamic";
