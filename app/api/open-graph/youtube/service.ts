import {
  assertContentType,
  isJsonContentType,
  readLimitedJson,
} from "@/lib/fetch/limitedBody";
import { fetchPublicUrl } from "@/lib/security/urlGuard";
import { matchesDomainOrSubdomain } from "@/lib/url/domains";
import type { YoutubeVideoLinkPreview } from "@/services/api/link-preview-api";
import {
  getYoutubeEmbedUrl,
  getYoutubeFetchUrl,
  getYoutubeWatchUrl,
  parseYoutubeLink,
} from "@/src/services/youtube/url";
import LruTtlCache from "@/lib/cache/lruTtl";

import type { PreviewPlan } from "../compound/service";
import { LINK_PREVIEW_USER_AGENT } from "../utils";

const YOUTUBE_PREVIEW_TTL_MS = 5 * 60 * 1000;
const YOUTUBE_OEMBED_MAX_BYTES = 64 * 1024;
const YOUTUBE_OEMBED_CACHE_MAX_ITEMS = 200;
const YOUTUBE_THUMBNAIL_DOMAINS = ["ytimg.com", "img.youtube.com"] as const;

const youtubeOEmbedCache = new LruTtlCache<
  string,
  Promise<YoutubeOEmbedResponse>
>({
  max: YOUTUBE_OEMBED_CACHE_MAX_ITEMS,
  ttlMs: YOUTUBE_PREVIEW_TTL_MS,
});

interface YoutubeOEmbedResponse {
  readonly title?: unknown;
  readonly author_name?: unknown;
  readonly author_url?: unknown;
  readonly provider_name?: unknown;
  readonly provider_url?: unknown;
  readonly thumbnail_url?: unknown;
  readonly thumbnail_width?: unknown;
  readonly thumbnail_height?: unknown;
}

const readString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const readNumber = (value: unknown): number | undefined => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  return value;
};

const readTrustedYoutubeThumbnailUrl = (
  value: unknown
): string | undefined => {
  const rawUrl = readString(value);
  if (!rawUrl) {
    return undefined;
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return undefined;
  }

  if (parsed.protocol !== "https:") {
    return undefined;
  }

  const hostname = parsed.hostname.toLowerCase();
  return YOUTUBE_THUMBNAIL_DOMAINS.some((domain) =>
    matchesDomainOrSubdomain(hostname, domain)
  )
    ? parsed.toString()
    : undefined;
};

const fetchYoutubeOEmbedUncached = async (
  fetchUrl: string
): Promise<YoutubeOEmbedResponse> => {
  const endpoint = new URL("https://www.youtube.com/oembed");
  endpoint.searchParams.set("format", "json");
  endpoint.searchParams.set("url", fetchUrl);

  const response = await fetchPublicUrl(endpoint, {
    headers: {
      accept: "application/json",
      "user-agent": LINK_PREVIEW_USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error("YouTube preview unavailable.");
  }

  assertContentType(response.headers, isJsonContentType, "JSON", {
    allowMissing: true,
  });

  return readLimitedJson<YoutubeOEmbedResponse>(
    response,
    YOUTUBE_OEMBED_MAX_BYTES
  ).then((payload) => {
    if (
      !readString(payload.title) &&
      !readTrustedYoutubeThumbnailUrl(payload.thumbnail_url)
    ) {
      throw new Error("YouTube preview unavailable.");
    }

    return payload;
  });
};

const fetchYoutubeOEmbed = (fetchUrl: string): Promise<YoutubeOEmbedResponse> => {
  const cached = youtubeOEmbedCache.get(fetchUrl);
  if (cached) {
    return cached;
  }

  const request = fetchYoutubeOEmbedUncached(fetchUrl).catch((error) => {
    youtubeOEmbedCache.delete(fetchUrl);
    throw error;
  });
  youtubeOEmbedCache.set(fetchUrl, request);
  return request;
};

export function createYoutubePlan(url: URL): PreviewPlan | null {
  const linkInfo = parseYoutubeLink(url.toString());
  if (!linkInfo) {
    return null;
  }

  return {
    cacheKey: `youtube:video:v1:${getYoutubeWatchUrl(
      url.toString(),
      linkInfo.videoId
    )}`,
    execute: async () => {
      const fetchUrl = getYoutubeFetchUrl(url.toString(), linkInfo.videoId);
      const payload = await fetchYoutubeOEmbed(fetchUrl);
      const title = readString(payload.title);
      const thumbnailUrl = readTrustedYoutubeThumbnailUrl(
        payload.thumbnail_url
      );

      if (!title && !thumbnailUrl) {
        throw new Error("YouTube preview unavailable.");
      }

      const authorName = readString(payload.author_name);
      const authorUrl = readString(payload.author_url);
      const thumbnailWidth = readNumber(payload.thumbnail_width);
      const thumbnailHeight = readNumber(payload.thumbnail_height);
      const providerName = readString(payload.provider_name);
      const providerUrl =
        readString(payload.provider_url) ?? "https://www.youtube.com/";
      const watchUrl = getYoutubeWatchUrl(url.toString(), linkInfo.videoId);
      const embedUrl = getYoutubeEmbedUrl(url.toString(), linkInfo.videoId);
      const image = thumbnailUrl
        ? {
            url: thumbnailUrl,
            secureUrl: thumbnailUrl,
            width: thumbnailWidth,
            height: thumbnailHeight,
          }
        : null;
      const data: YoutubeVideoLinkPreview = {
        type: "youtube.video",
        requestUrl: url.toString(),
        url: watchUrl,
        title: title ?? null,
        description: null,
        siteName: providerName ?? null,
        mediaType: "video",
        source: providerName ?? null,
        provider: providerName ?? null,
        providerUrl,
        videoId: linkInfo.videoId,
        watchUrl,
        embedUrl,
        thumbnailUrl: thumbnailUrl ?? null,
        thumbnailWidth: thumbnailWidth ?? null,
        thumbnailHeight: thumbnailHeight ?? null,
        image,
        images: image ? [image] : [],
        author: authorName ?? null,
        authorName: authorName ?? null,
        authorUrl: authorUrl ?? null,
        playlistId: linkInfo.playlistId ?? null,
        playlistIndex: linkInfo.playlistIndex ?? null,
        startSeconds: linkInfo.startSeconds ?? null,
      };

      return { data, ttl: YOUTUBE_PREVIEW_TTL_MS };
    },
  };
}
