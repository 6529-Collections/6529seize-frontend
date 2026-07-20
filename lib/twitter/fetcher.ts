import LruTtlCache from "@/lib/cache/lruTtl";
import { parseTwitterOEmbed } from "./parser";
import type { TweetPreview, TwitterOEmbedResponse } from "./types";
import { parseTweetUrl } from "./url";
import {
  extractMetaImage,
  findFirstImageUrl,
  getSyndicationToken,
  parseSyndicationPreview,
} from "./syndication";

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
    throw new TypeError("Invalid Twitter oEmbed response.");
  }

  const record = value as Record<string, unknown>;
  if (typeof record["html"] !== "string") {
    throw new TypeError("Twitter oEmbed response did not include HTML.");
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
    ...(mediaImageUrl
      ? { media: [{ type: "image" as const, imageUrl: mediaImageUrl }] }
      : {}),
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

  const cacheKey = `twitter:syndication-v4:${parsed.tweetId}`;
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
