import LruTtlCache from "@/lib/cache/lruTtl";

import { parseTwitterOEmbed } from "./parser";
import type { TweetPreview, TwitterOEmbedResponse } from "./types";
import { parseTweetUrl } from "./url";

const TWITTER_OEMBED_ENDPOINT = "https://publish.twitter.com/oembed";
const TWITTER_SYNDICATION_ENDPOINT =
  "https://cdn.syndication.twimg.com/tweet-result";
const TWITTER_PREVIEW_CACHE_TTL_MS = 10 * 60 * 1000;
const TWITTER_PREVIEW_CACHE_MAX_ITEMS = 500;
const TWITTER_PREVIEW_FETCH_TIMEOUT_MS = 8000;
const TWITTER_MEDIA_FETCH_TIMEOUT_MS = 5000;

const previewCache = new LruTtlCache<string, Promise<TweetPreview>>({
  max: TWITTER_PREVIEW_CACHE_MAX_ITEMS,
  ttlMs: TWITTER_PREVIEW_CACHE_TTL_MS,
});

type FetchTweetPreviewOptions = {
  readonly fetchImpl?: typeof fetch;
};

const getSyndicationToken = (tweetId: string): string =>
  ((Number(tweetId) / 1e15) * Math.PI).toString(36).replaceAll(/(0+|\.)/g, "");

const readString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const readNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const normalizeProfileImageUrl = (
  value: string | undefined
): string | undefined => value?.replace("_normal.", "_bigger.");

const removeTrailingMediaUrl = (
  text: string | undefined,
  mediaLink: string | undefined
): string | undefined => {
  if (!text) {
    return undefined;
  }

  const withoutMedia = mediaLink
    ? text.replace(
        new RegExp(
          `\\s*${mediaLink.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`
        ),
        ""
      )
    : text;
  const trimmed = withoutMedia.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const isImageUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname.toLowerCase();
    return (
      hostname.endsWith("twimg.com") ||
      pathname.endsWith(".jpg") ||
      pathname.endsWith(".jpeg") ||
      pathname.endsWith(".png") ||
      pathname.endsWith(".webp")
    );
  } catch {
    return false;
  }
};

const findFirstImageUrl = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return isImageUrl(value) ? value : undefined;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const imageUrl = findFirstImageUrl(entry);
      if (imageUrl) {
        return imageUrl;
      }
    }
    return undefined;
  }

  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  for (const key of ["url", "media_url_https", "media_url", "src"]) {
    const imageUrl = findFirstImageUrl(record[key]);
    if (imageUrl) {
      return imageUrl;
    }
  }

  for (const entry of Object.values(record)) {
    const imageUrl = findFirstImageUrl(entry);
    if (imageUrl) {
      return imageUrl;
    }
  }

  return undefined;
};

const findMediaImageUrl = (
  record: Record<string, unknown>
): string | undefined => {
  for (const key of ["photos", "mediaDetails"]) {
    const imageUrl = findFirstImageUrl(record[key]);
    if (imageUrl) {
      return imageUrl;
    }
  }

  return undefined;
};

const readRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;

const findVideoUrl = (record: Record<string, unknown>): string | undefined => {
  const video = readRecord(record["video"]);
  const videoVariants = Array.isArray(video?.["variants"])
    ? video["variants"]
    : [];
  for (const variant of videoVariants) {
    const variantRecord = readRecord(variant);
    const src = readString(variantRecord?.["src"]);
    if (src) {
      return src;
    }
  }

  const mediaDetails = Array.isArray(record["mediaDetails"])
    ? record["mediaDetails"]
    : [];
  for (const mediaDetail of mediaDetails) {
    const videoInfo = readRecord(readRecord(mediaDetail)?.["video_info"]);
    const variants = Array.isArray(videoInfo?.["variants"])
      ? videoInfo["variants"]
      : [];
    for (const variant of variants) {
      const variantRecord = readRecord(variant);
      const url = readString(variantRecord?.["url"]);
      if (url) {
        return url;
      }
    }
  }

  return undefined;
};

const findVideoPosterUrl = (
  record: Record<string, unknown>
): string | undefined => {
  const videoPoster = readString(readRecord(record["video"])?.["poster"]);
  return videoPoster ?? findMediaImageUrl(record);
};

const extractMetaImage = (html: string): string | undefined => {
  const match =
    /<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image|twitter:image:src)["'][^>]+content=["']([^"']+)["'][^>]*>/i.exec(
      html
    );
  return match?.[1] && isImageUrl(match[1]) ? match[1] : undefined;
};

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
  fetchImpl: typeof fetch
): Promise<Response> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetchImpl(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

function assertOEmbedResponse(value: unknown): TwitterOEmbedResponse {
  if (typeof value !== "object" || value === null) {
    throw new Error("Invalid Twitter oEmbed response.");
  }

  const record = value as Record<string, unknown>;
  if (typeof record["html"] !== "string") {
    throw new Error("Twitter oEmbed response did not include HTML.");
  }

  return {
    ...(typeof record["url"] === "string" ? { url: record["url"] } : {}),
    ...(typeof record["author_name"] === "string"
      ? { author_name: record["author_name"] }
      : {}),
    ...(typeof record["author_url"] === "string"
      ? { author_url: record["author_url"] }
      : {}),
    html: record["html"],
  };
}

async function fetchSyndicationMediaImageUrl(
  tweetId: string,
  fetchImpl: typeof fetch
): Promise<string | undefined> {
  const endpoint = new URL(TWITTER_SYNDICATION_ENDPOINT);
  endpoint.searchParams.set("id", tweetId);
  endpoint.searchParams.set("lang", "en");
  endpoint.searchParams.set("token", getSyndicationToken(tweetId));

  const response = await fetchWithTimeout(
    endpoint,
    { headers: { Accept: "application/json" } },
    TWITTER_MEDIA_FETCH_TIMEOUT_MS,
    fetchImpl
  );

  if (!response.ok) {
    return undefined;
  }

  return findFirstImageUrl(await response.json());
}

function parseSyndicationPreview(
  payload: unknown,
  href: string,
  tweetId: string
): TweetPreview | undefined {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const record = payload as Record<string, unknown>;
  if (record["__typename"] !== "Tweet") {
    return undefined;
  }

  const user =
    typeof record["user"] === "object" && record["user"] !== null
      ? (record["user"] as Record<string, unknown>)
      : {};
  const entities =
    typeof record["entities"] === "object" && record["entities"] !== null
      ? (record["entities"] as Record<string, unknown>)
      : {};
  const mediaEntries = Array.isArray(entities["media"])
    ? entities["media"]
    : [];
  const firstMedia =
    typeof mediaEntries[0] === "object" && mediaEntries[0] !== null
      ? (mediaEntries[0] as Record<string, unknown>)
      : {};
  const authorHandle = readString(user["screen_name"]);
  const mediaLink = readString(firstMedia["url"]);
  const text = removeTrailingMediaUrl(readString(record["text"]), mediaLink);
  const authorUrl = authorHandle
    ? `https://twitter.com/${authorHandle}`
    : undefined;
  const mediaImageUrl = findMediaImageUrl(record);
  const mediaVideoUrl = findVideoUrl(record);
  const mediaPosterUrl = mediaVideoUrl ? findVideoPosterUrl(record) : undefined;
  const authorProfileImageUrl = normalizeProfileImageUrl(
    readString(user["profile_image_url_https"])
  );
  const createdAtIso = readString(record["created_at"]);
  const authorName = readString(user["name"]);
  const favoriteCount = readNumber(record["favorite_count"]);
  const conversationCount = readNumber(record["conversation_count"]);

  return {
    tweetId,
    url: href,
    ...(authorName ? { authorName } : {}),
    ...(authorUrl ? { authorUrl } : {}),
    ...(authorHandle ? { authorHandle } : {}),
    ...(authorProfileImageUrl ? { authorProfileImageUrl } : {}),
    ...(text ? { text } : {}),
    ...(mediaLink ? { mediaLink } : {}),
    ...(mediaImageUrl ? { mediaImageUrl } : {}),
    ...(mediaVideoUrl ? { mediaVideoUrl } : {}),
    ...(mediaPosterUrl ? { mediaPosterUrl } : {}),
    ...(createdAtIso ? { createdAtIso } : {}),
    ...(favoriteCount !== undefined ? { favoriteCount } : {}),
    ...(conversationCount !== undefined ? { conversationCount } : {}),
  };
}

async function fetchSyndicationPreview(
  href: string,
  tweetId: string,
  fetchImpl: typeof fetch
): Promise<TweetPreview | undefined> {
  const endpoint = new URL(TWITTER_SYNDICATION_ENDPOINT);
  endpoint.searchParams.set("id", tweetId);
  endpoint.searchParams.set("lang", "en");
  endpoint.searchParams.set("token", getSyndicationToken(tweetId));

  const response = await fetchWithTimeout(
    endpoint,
    { headers: { Accept: "application/json" } },
    TWITTER_PREVIEW_FETCH_TIMEOUT_MS,
    fetchImpl
  );

  if (!response.ok) {
    return undefined;
  }

  return parseSyndicationPreview(await response.json(), href, tweetId);
}

async function fetchTweetPageMetaImageUrl(
  href: string,
  fetchImpl: typeof fetch
): Promise<string | undefined> {
  const response = await fetchWithTimeout(
    href,
    {
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
      },
    },
    TWITTER_MEDIA_FETCH_TIMEOUT_MS,
    fetchImpl
  );

  if (!response.ok) {
    return undefined;
  }

  return extractMetaImage(await response.text());
}

async function resolveTweetMediaImageUrl(
  href: string,
  tweetId: string,
  fetchImpl: typeof fetch
): Promise<string | undefined> {
  try {
    const imageUrl = await fetchSyndicationMediaImageUrl(tweetId, fetchImpl);
    if (imageUrl) {
      return imageUrl;
    }
  } catch {
    // Media is optional. Keep the text preview even if image resolution fails.
  }

  try {
    return await fetchTweetPageMetaImageUrl(href, fetchImpl);
  } catch {
    return undefined;
  }
}

async function fetchTweetPreviewUncached(
  href: string,
  options: FetchTweetPreviewOptions = {}
): Promise<TweetPreview> {
  const parsed = parseTweetUrl(href);
  if (!parsed) {
    throw new Error("Invalid Twitter/X status URL.");
  }

  const endpoint = new URL(TWITTER_OEMBED_ENDPOINT);
  endpoint.searchParams.set("url", href);
  endpoint.searchParams.set("omit_script", "true");
  endpoint.searchParams.set("dnt", "true");

  const fetchImpl = options.fetchImpl ?? fetch;

  try {
    const syndicationPreview = await fetchSyndicationPreview(
      href,
      parsed.tweetId,
      fetchImpl
    );
    if (syndicationPreview) {
      return syndicationPreview;
    }
  } catch {
    // Fall back to oEmbed below.
  }

  const response = await fetchWithTimeout(
    endpoint,
    { headers: { Accept: "application/json" } },
    TWITTER_PREVIEW_FETCH_TIMEOUT_MS,
    fetchImpl
  );

  if (!response.ok) {
    throw new Error(`Twitter oEmbed failed with status ${response.status}.`);
  }

  const oembed = assertOEmbedResponse(await response.json());
  const preview = parseTwitterOEmbed(oembed, href, parsed.tweetId);
  const mediaImageUrl = await resolveTweetMediaImageUrl(
    href,
    parsed.tweetId,
    fetchImpl
  );

  return {
    ...preview,
    ...(mediaImageUrl ? { mediaImageUrl } : {}),
  };
}

export function fetchTweetPreview(
  href: string,
  options: FetchTweetPreviewOptions = {}
): Promise<TweetPreview> {
  const parsed = parseTweetUrl(href);
  if (!parsed) {
    return Promise.reject(new Error("Invalid Twitter/X status URL."));
  }

  const cacheKey = `twitter:syndication-v1:${parsed.tweetId}`;
  const cached = previewCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const request = fetchTweetPreviewUncached(href, options).catch(
    (error: unknown) => {
      previewCache.delete(cacheKey);
      throw error;
    }
  );
  previewCache.set(cacheKey, request);

  return request;
}
