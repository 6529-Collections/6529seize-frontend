import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { publicEnv } from "@/config/env";
import {
  UrlGuardError,
  assertPublicUrl,
  fetchPublicUrl,
  parsePublicUrl,
  type UrlGuardOptions,
} from "@/lib/security/urlGuard";
import { escapeRegExp } from "@/lib/text/regex";
import {
  parseFarcasterResource,
  type FarcasterResourceIdentifier,
} from "@/src/services/farcaster/url";
import type {
  FarcasterCastPreview,
  FarcasterChannelPreview,
  FarcasterFramePreview,
  FarcasterPreviewResponse,
  FarcasterProfilePreview,
  FarcasterUnavailablePreview,
  FarcasterUnsupportedPreview,
} from "@/types/farcaster.types";

const WARPCAST_API_BASE =
  publicEnv.FARCASTER_WARPCAST_API_BASE ?? "https://api.warpcast.com";
const WARPCAST_API_KEY = publicEnv.FARCASTER_WARPCAST_API_KEY ?? undefined;

const CAST_CACHE_TTL_MS = 20 * 60 * 1000;
const PROFILE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CHANNEL_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FRAME_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const FETCH_TIMEOUT_MS = 6000;
const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);
const MAX_REDIRECTS = 4;
const USER_AGENT =
  "6529seize-farcaster/1.0 (+https://6529.io; Fetching Farcaster metadata)";
const HTML_ACCEPT_HEADER =
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8";

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

type CacheEntry<T> = {
  readonly value: T;
  readonly expiresAt: number;
};

const castCache = new Map<string, CacheEntry<FarcasterCastPreview | null>>();
const profileCache = new Map<
  string,
  CacheEntry<FarcasterProfilePreview | null>
>();
const channelCache = new Map<
  string,
  CacheEntry<FarcasterChannelPreview | null>
>();
const frameCache = new Map<string, CacheEntry<FarcasterFramePreview | null>>();

const getCacheValue = <T>(
  cache: Map<string, CacheEntry<T>>,
  key: string
): T | undefined => {
  const entry = cache.get(key);
  if (!entry) {
    return undefined;
  }

  if (entry.expiresAt > Date.now()) {
    return entry.value;
  }

  cache.delete(key);
  return undefined;
};

const setCacheValue = <T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  value: T,
  ttlMs: number
): void => {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
};

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

    return (await response.json()) as T;
  } catch (error) {
    if ((error as { name?: string | undefined }).name === "AbortError") {
      throw new Error("Warpcast request aborted");
    }

    throw error instanceof Error ? error : new Error("Warpcast request failed");
  } finally {
    cancel();
  }
};

type WarpcastUserResponse = {
  readonly result?: {
    readonly user?: {
      readonly fid?: number | undefined;
      readonly username?: string | undefined;
      readonly displayName?: string | undefined;
      readonly pfp?: { readonly url?: string | undefined } | undefined;
      readonly profile?: {
        readonly bio?: { readonly text?: string | undefined } | undefined;
      } | undefined;
    } | undefined;
  } | undefined;
};

type WarpcastCastEmbed = {
  readonly url?: string | undefined;
  readonly castId?: { readonly fid?: number | undefined; readonly hash?: string | undefined } | undefined;
  readonly metadata?: { readonly image?: string | undefined } | undefined;
  readonly type?: string | undefined;
};

type WarpcastCastAuthor = {
  readonly fid?: number | undefined;
  readonly username?: string | undefined;
  readonly displayName?: string | undefined;
  readonly pfp?: { readonly url?: string | undefined } | undefined;
};

type WarpcastCastResponse = {
  readonly result?: {
    readonly cast?: {
      readonly hash?: string | undefined;
      readonly text?: string | undefined;
      readonly timestamp?: string | undefined;
      readonly embeds?: readonly WarpcastCastEmbed[] | undefined;
      readonly author?: WarpcastCastAuthor | undefined;
      readonly channel?: {
        readonly id?: string | undefined;
        readonly name?: string | undefined;
        readonly imageUrl?: string | undefined;
      } | undefined;
      readonly reactions?: {
        readonly likes?: number | undefined;
        readonly recasts?: number | undefined;
      } | undefined;
      readonly replies?: {
        readonly count?: number | undefined;
      } | undefined;
    } | undefined;
  } | undefined;
};

type WarpcastChannelResponse = {
  readonly result?: {
    readonly channel?: {
      readonly id?: string | undefined;
      readonly name?: string | undefined;
      readonly description?: string | undefined;
      readonly imageUrl?: string | undefined;
    } | undefined;
    readonly recentCast?: {
      readonly text?: string | undefined;
      readonly author?: {
        readonly username?: string | undefined;
      } | undefined;
    } | undefined;
  } | undefined;
};

const mapWarpcastUser = (
  data: WarpcastUserResponse | null,
  canonicalUrl: string
): FarcasterProfilePreview | null => {
  if (!data?.result?.user) {
    return null;
  }

  const { user } = data.result;

  return {
    type: "profile",
    canonicalUrl,
    profile: {
      fid: typeof user.fid === "number" ? user.fid : undefined,
      username: typeof user.username === "string" ? user.username : undefined,
      displayName:
        typeof user.displayName === "string" ? user.displayName : undefined,
      avatarUrl:
        typeof user.pfp?.url === "string" && user.pfp.url
          ? user.pfp.url
          : undefined,
      bio:
        typeof user.profile?.bio?.text === "string"
          ? user.profile.bio.text
          : undefined,
    },
  };
};

type WarpcastCastData = NonNullable<
  NonNullable<WarpcastCastResponse["result"]>["cast"]
>;

const asString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" ? value : undefined;

const mapCastEmbed = (
  embed: WarpcastCastEmbed
): NonNullable<FarcasterCastPreview["cast"]["embeds"]>[number] | null => {
  const url = asString(embed.url);
  const type = asString(embed.type);
  const imageUrl = asString(embed.metadata?.image);

  if (!url && !imageUrl) {
    return null;
  }

  if (type === "image" || (imageUrl && !type)) {
    return {
      type: "image",
      url,
      previewImageUrl: imageUrl ?? url,
    };
  }

  return {
    type: "link",
    url,
    previewImageUrl: imageUrl,
  };
};

const mapCastEmbeds = (
  embeds: WarpcastCastData["embeds"]
): FarcasterCastPreview["cast"]["embeds"] => {
  if (!Array.isArray(embeds)) {
    return undefined;
  }

  return embeds
    .map(mapCastEmbed)
    .filter(
      (value): value is NonNullable<ReturnType<typeof mapCastEmbed>> =>
        value !== null
    );
};

const mapCastAuthor = (
  author: WarpcastCastAuthor | undefined
): FarcasterCastPreview["cast"]["author"] => ({
  fid: asNumber(author?.fid),
  username: asString(author?.username),
  displayName: asString(author?.displayName),
  avatarUrl: asString(author?.pfp?.url),
});

const mapCastChannel = (
  channel: WarpcastCastData["channel"]
): FarcasterCastPreview["cast"]["channel"] => {
  if (!channel) {
    return null;
  }

  return {
    id: asString(channel.id),
    name: asString(channel.name),
    iconUrl: asString(channel.imageUrl),
  };
};

const mapCastReactions = (
  reactions: WarpcastCastData["reactions"],
  replies: WarpcastCastData["replies"]
): FarcasterCastPreview["cast"]["reactions"] => ({
  likes: asNumber(reactions?.likes),
  recasts: asNumber(reactions?.recasts),
  replies: asNumber(replies?.count),
});

const mapWarpcastCast = (
  data: WarpcastCastResponse | null,
  canonicalUrl: string
): FarcasterCastPreview | null => {
  const cast = data?.result?.cast;

  if (!cast) {
    return null;
  }

  return {
    type: "cast",
    canonicalUrl,
    cast: {
      author: mapCastAuthor(cast.author),
      text: asString(cast.text),
      timestamp: asString(cast.timestamp),
      channel: mapCastChannel(cast.channel),
      embeds: mapCastEmbeds(cast.embeds),
      reactions: mapCastReactions(cast.reactions, cast.replies),
    },
  };
};

const mapWarpcastChannel = (
  data: WarpcastChannelResponse | null,
  canonicalUrl: string
): FarcasterChannelPreview | null => {
  const channel = data?.result?.channel;

  if (!channel) {
    return null;
  }

  const recentCast = data?.result?.recentCast;

  return {
    type: "channel",
    canonicalUrl,
    channel: {
      id: typeof channel.id === "string" ? channel.id : undefined,
      name: typeof channel.name === "string" ? channel.name : undefined,
      description:
        typeof channel.description === "string"
          ? channel.description
          : undefined,
      iconUrl:
        typeof channel.imageUrl === "string" ? channel.imageUrl : undefined,
      latestCast: recentCast
        ? {
            text:
              typeof recentCast.text === "string" ? recentCast.text : undefined,
            author:
              typeof recentCast.author?.username === "string"
                ? recentCast.author.username
                : undefined,
          }
        : null,
    },
  };
};

const fetchCastPreview = async (
  identifier: Extract<FarcasterResourceIdentifier, { type: "cast" }>
): Promise<FarcasterCastPreview | null> => {
  const cached = getCacheValue(castCache, identifier.canonicalUrl);
  if (cached !== undefined) {
    return cached;
  }

  const response = await fetchWarpcastJson<WarpcastCastResponse>("/v2/cast", {
    hash: identifier.castHash,
  });

  const mapped = mapWarpcastCast(response, identifier.canonicalUrl);
  setCacheValue(castCache, identifier.canonicalUrl, mapped, CAST_CACHE_TTL_MS);
  return mapped;
};

const fetchProfilePreview = async (
  identifier: Extract<FarcasterResourceIdentifier, { type: "profile" }>
): Promise<FarcasterProfilePreview | null> => {
  const cached = getCacheValue(profileCache, identifier.canonicalUrl);
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
  setCacheValue(
    profileCache,
    identifier.canonicalUrl,
    mapped,
    PROFILE_CACHE_TTL_MS
  );
  return mapped;
};

const fetchChannelPreview = async (
  identifier: Extract<FarcasterResourceIdentifier, { type: "channel" }>
): Promise<FarcasterChannelPreview | null> => {
  const cached = getCacheValue(channelCache, identifier.canonicalUrl);
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
  setCacheValue(
    channelCache,
    identifier.canonicalUrl,
    mapped,
    CHANNEL_CACHE_TTL_MS
  );
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

const fetchHtml = async (
  url: URL
): Promise<{ html: string; finalUrl: string } | null> => {
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

    const html = await response.text();
    const finalUrl = response.url || url.toString();
    return { html, finalUrl };
  } catch (error) {
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

const detectFramePreview = async (
  url: URL
): Promise<FarcasterFramePreview | null> => {
  const cached = getCacheValue(frameCache, url.toString());
  if (cached !== undefined) {
    return cached;
  }

  const result = await fetchHtml(url);
  if (!result) {
    setCacheValue(frameCache, url.toString(), null, FRAME_CACHE_TTL_MS);
    return null;
  }

  const { html, finalUrl } = result;

  if (!hasFrameMeta(html)) {
    setCacheValue(frameCache, url.toString(), null, FRAME_CACHE_TTL_MS);
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

  setCacheValue(frameCache, url.toString(), preview, FRAME_CACHE_TTL_MS);
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
