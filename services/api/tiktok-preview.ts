const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 50;

export type TikTokPreviewKind = "video" | "profile";

export interface TikTokPreviewSuccess {
  readonly kind: TikTokPreviewKind;
  readonly canonicalUrl: string;
  readonly authorName: string | null;
  readonly authorUrl: string | null;
  readonly title: string | null;
  readonly thumbnailUrl: string | null;
  readonly thumbnailWidth: number | null;
  readonly thumbnailHeight: number | null;
  readonly providerName: string | null;
  readonly providerUrl: string | null;
}

export interface TikTokPreviewUnavailable {
  readonly error: "unavailable";
  readonly canonicalUrl?: string;
}

export type TikTokPreviewResult =
  | TikTokPreviewSuccess
  | TikTokPreviewUnavailable;

type CacheEntry = {
  readonly data: TikTokPreviewResult;
  fetchedAt: number;
};

const cache = new Map<string, CacheEntry>();
const aliasMap = new Map<string, string>();
const requests = new Map<string, Promise<TikTokPreviewResult>>();

function getCacheKey(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return trimmed;
  }

  const alias = aliasMap.get(trimmed);
  return alias ?? trimmed;
}

function pruneCache(): void {
  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next();
    if (oldestKey.done) {
      break;
    }
    cache.delete(oldestKey.value);
  }
}

function storePreview(requestUrl: string, data: TikTokPreviewResult): void {
  const trimmedRequest = requestUrl.trim();
  const canonicalKey =
    "canonicalUrl" in data && data.canonicalUrl
      ? data.canonicalUrl.trim()
      : trimmedRequest;

  if (trimmedRequest) {
    aliasMap.set(trimmedRequest, canonicalKey);
  }
  if (canonicalKey) {
    aliasMap.set(canonicalKey, canonicalKey);
  }

  const entry: CacheEntry = {
    data,
    fetchedAt: Date.now(),
  };

  cache.set(canonicalKey, entry);
  pruneCache();
}

export function getCachedTikTokPreview(
  url: string
): { data: TikTokPreviewResult; isFresh: boolean } | null {
  const cacheKey = getCacheKey(url);
  if (!cacheKey) {
    return null;
  }

  const entry = cache.get(cacheKey);
  if (!entry) {
    return null;
  }

  // Refresh LRU ordering
  cache.delete(cacheKey);
  cache.set(cacheKey, entry);

  const isFresh = Date.now() - entry.fetchedAt < CACHE_TTL_MS;
  return { data: entry.data, isFresh };
}

export async function fetchTikTokPreview(
  url: string
): Promise<TikTokPreviewResult> {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    throw new Error("A valid TikTok URL is required.");
  }

  const cacheKey = getCacheKey(trimmedUrl);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const existingRequest = requests.get(cacheKey);
  if (existingRequest) {
    return existingRequest;
  }

  const params = new URLSearchParams({ url: trimmedUrl });

  const requestPromise = fetch(`/api/tiktok?${params.toString()}`, {
    headers: { Accept: "application/json" },
  })
    .then(async (response) => {
      if (response.status === 404) {
        const body = (await response.json()) as TikTokPreviewUnavailable;
        storePreview(trimmedUrl, body);
        return body;
      }

      if (!response.ok) {
        let errorMessage = "Failed to fetch TikTok preview.";
        try {
          const body = await response.json();
          if (body && typeof body.error === "string" && body.error) {
            errorMessage = body.error;
          }
        } catch {
          // ignore JSON parsing errors and use default message
        }
        throw new Error(errorMessage);
      }

      const body = (await response.json()) as TikTokPreviewSuccess;
      storePreview(trimmedUrl, body);
      return body;
    })
    .finally(() => {
      requests.delete(cacheKey);
    });

  requests.set(cacheKey, requestPromise);
  return requestPromise;
}

export function __clearTikTokPreviewCache(): void {
  cache.clear();
  aliasMap.clear();
  requests.clear();
}
