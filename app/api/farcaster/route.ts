import { NextRequest, NextResponse } from "next/server";

import {
  type FarcasterPreviewResponse,
  type FarcasterCastPreview,
  type FarcasterProfilePreview,
  type FarcasterChannelPreview,
  type FarcasterFramePreview,
  type FarcasterUnavailablePreview,
} from "@/types/farcaster.types";
import {
  parseFarcasterResource,
  type FarcasterResourceIdentifier,
} from "@/src/services/farcaster/url";

import { ensureUrlIsPublic, validateUrl } from "../open-graph/utils";

const WARPCAST_API_BASE =
  process.env.FARCASTER_WARPCAST_API_BASE ?? "https://api.warpcast.com";
const WARPCAST_API_KEY = process.env.FARCASTER_WARPCAST_API_KEY;

const CAST_CACHE_TTL_MS = 20 * 60 * 1000;
const PROFILE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CHANNEL_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FRAME_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const FETCH_TIMEOUT_MS = 6000;
const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);
const MAX_REDIRECTS = 4;
const USER_AGENT =
  "6529seize-farcaster/1.0 (+https://6529.io; Fetching Farcaster metadata)";

type CacheEntry<T> = {
  readonly value: T;
  readonly expiresAt: number;
};

const castCache = new Map<string, CacheEntry<FarcasterCastPreview | null>>();
const profileCache = new Map<string, CacheEntry<FarcasterProfilePreview | null>>();
const channelCache = new Map<string, CacheEntry<FarcasterChannelPreview | null>>();
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

const createAbortController = (timeoutMs: number): {
  controller: AbortController;
  cancel: () => void;
} => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return {
    controller,
    cancel: () => clearTimeout(timeout),
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
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return null;
    }

    return null;
  } finally {
    cancel();
  }
};

type WarpcastUserResponse = {
  readonly result?: {
    readonly user?: {
      readonly fid?: number;
      readonly username?: string;
      readonly displayName?: string;
      readonly pfp?: { readonly url?: string };
      readonly profile?: {
        readonly bio?: { readonly text?: string };
      };
    };
  };
};

type WarpcastCastEmbed = {
  readonly url?: string;
  readonly castId?: { readonly fid?: number; readonly hash?: string };
  readonly metadata?: { readonly image?: string };
  readonly type?: string;
};

type WarpcastCastAuthor = {
  readonly fid?: number;
  readonly username?: string;
  readonly displayName?: string;
  readonly pfp?: { readonly url?: string };
};

type WarpcastCastResponse = {
  readonly result?: {
    readonly cast?: {
      readonly hash?: string;
      readonly text?: string;
      readonly timestamp?: string;
      readonly embeds?: readonly WarpcastCastEmbed[];
      readonly author?: WarpcastCastAuthor;
      readonly channel?: {
        readonly id?: string;
        readonly name?: string;
        readonly imageUrl?: string;
      };
      readonly reactions?: {
        readonly likes?: number;
        readonly recasts?: number;
      };
      readonly replies?: {
        readonly count?: number;
      };
    };
  };
};

type WarpcastChannelResponse = {
  readonly result?: {
    readonly channel?: {
      readonly id?: string;
      readonly name?: string;
      readonly description?: string;
      readonly imageUrl?: string;
    };
    readonly recentCast?: {
      readonly text?: string;
      readonly author?: {
        readonly username?: string;
      };
    };
  };
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

const mapWarpcastCast = (
  data: WarpcastCastResponse | null,
  canonicalUrl: string
): FarcasterCastPreview | null => {
  const cast = data?.result?.cast;

  if (!cast) {
    return null;
  }

  const embeds: FarcasterCastPreview["cast"]["embeds"] = Array.isArray(
    cast.embeds
  )
    ? cast.embeds
        .map((embed) => {
          const url = typeof embed.url === "string" ? embed.url : undefined;
          const type = typeof embed.type === "string" ? embed.type : undefined;
          const imageUrl =
            typeof embed.metadata?.image === "string"
              ? embed.metadata.image
              : undefined;

          if (!url && !imageUrl) {
            return null;
          }

          if (type === "image" || (imageUrl && !type)) {
            return {
              type: "image" as const,
              url,
              previewImageUrl: imageUrl ?? url,
            };
          }

          return {
            type: "link" as const,
            url,
            previewImageUrl: imageUrl,
          };
        })
        .filter((value): value is NonNullable<typeof value> => Boolean(value))
    : undefined;

  return {
    type: "cast",
    canonicalUrl,
    cast: {
      author: {
        fid: typeof cast.author?.fid === "number" ? cast.author.fid : undefined,
        username:
          typeof cast.author?.username === "string"
            ? cast.author.username
            : undefined,
        displayName:
          typeof cast.author?.displayName === "string"
            ? cast.author.displayName
            : undefined,
        avatarUrl:
          typeof cast.author?.pfp?.url === "string"
            ? cast.author.pfp.url
            : undefined,
      },
      text: typeof cast.text === "string" ? cast.text : undefined,
      timestamp:
        typeof cast.timestamp === "string" ? cast.timestamp : undefined,
      channel: cast.channel
        ? {
            id:
              typeof cast.channel.id === "string" ? cast.channel.id : undefined,
            name:
              typeof cast.channel.name === "string"
                ? cast.channel.name
                : undefined,
            iconUrl:
              typeof cast.channel.imageUrl === "string"
                ? cast.channel.imageUrl
                : undefined,
          }
        : null,
      embeds,
      reactions: {
        likes:
          typeof cast.reactions?.likes === "number"
            ? cast.reactions.likes
            : undefined,
        recasts:
          typeof cast.reactions?.recasts === "number"
            ? cast.reactions.recasts
            : undefined,
        replies:
          typeof cast.replies?.count === "number"
            ? cast.replies.count
            : undefined,
      },
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

const hasFrameMeta = (html: string): boolean => {
  return /<meta[^>]+name=["']fc:frame["'][^>]*>/i.test(html);
};

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const extractMetaContent = (html: string, name: string): string | undefined => {
  const pattern = new RegExp(
    `<meta[^>]+name=["']${escapeRegExp(name)}["'][^>]*content=["']([^"']+)["'][^>]*>`,
    "i"
  );
  const match = pattern.exec(html);
  if (match && match[1]) {
    return match[1].trim();
  }
  return undefined;
};

const extractTitle = (html: string): string | undefined => {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match && match[1] ? match[1].trim() : undefined;
};

const resolveUrl = (base: string, value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value, base).toString();
  } catch {
    return undefined;
  }
};

const fetchHtml = async (
  url: URL
): Promise<{ html: string; finalUrl: string } | null> => {
  let currentUrl = url;
  let redirects = 0;

  while (redirects <= MAX_REDIRECTS) {
    await ensureUrlIsPublic(currentUrl);

    const { controller, cancel } = createAbortController(FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(currentUrl, {
        method: "GET",
        headers: {
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "user-agent": USER_AGENT,
        },
        redirect: "manual",
        signal: controller.signal,
      });

      if (REDIRECT_STATUS_CODES.has(response.status)) {
        const location = response.headers.get("location");
        if (!location) {
          return null;
        }

        currentUrl = new URL(location, currentUrl);
        redirects += 1;
        continue;
      }

      if (!response.ok) {
        return null;
      }

      const html = await response.text();
      return { html, finalUrl: currentUrl.toString() };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return null;
      }

      return null;
    } finally {
      cancel();
    }
  }

  return null;
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

const handleResource = async (
  resource: FarcasterResourceIdentifier
): Promise<FarcasterPreviewResponse> => {
  if (resource.type === "cast") {
    const preview = await fetchCastPreview(resource);
    return preview ?? toUnavailable(resource.canonicalUrl, "Cast not available");
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

  return { type: "unsupported" };
};

export async function GET(request: NextRequest) {
  let targetUrl: URL;

  try {
    targetUrl = validateUrl(request.nextUrl.searchParams.get("url"));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid or forbidden URL";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    await ensureUrlIsPublic(targetUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The provided URL is not allowed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const resource = parseFarcasterResource(targetUrl);

    if (resource) {
      const response = await handleResource(resource);
      return NextResponse.json(response);
    }

    const protocol = targetUrl.protocol.toLowerCase();
    if (protocol === "http:" || protocol === "https:") {
      const framePreview = await detectFramePreview(targetUrl);
      if (framePreview) {
        return NextResponse.json(framePreview);
      }
    }

    return NextResponse.json({ type: "unsupported" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to resolve Farcaster data";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
