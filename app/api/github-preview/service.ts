import LruTtlCache from "@/lib/cache/lruTtl";
import type { GithubPreviewResponse } from "@/services/api/github-preview-api";
import { getResourceCacheKey, parseGithubResource } from "./service/resource";
import { resolvePreviewForResource } from "./service/previews";

const CACHE_TTL_MS = 2 * 60 * 1000;
const CACHE_MAX_ITEMS = 500;

const cache = new LruTtlCache<string, GithubPreviewResponse>({
  max: CACHE_MAX_ITEMS,
  ttlMs: CACHE_TTL_MS,
});
const inFlight = new Map<string, Promise<GithubPreviewResponse>>();

export const resolveGithubPreview = async (
  rawUrl: string | null,
  options?: { readonly bypassCache?: boolean | undefined }
): Promise<GithubPreviewResponse> => {
  const resource = parseGithubResource(rawUrl);
  const cacheKey = getResourceCacheKey(resource);
  const bypassCache = options?.bypassCache === true;
  const cached = bypassCache ? undefined : cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  if (!bypassCache) {
    const pending = inFlight.get(cacheKey);
    if (pending) {
      return pending;
    }
  }

  const previewRequest = resolvePreviewForResource(resource);

  if (bypassCache) {
    return previewRequest;
  }

  inFlight.set(cacheKey, previewRequest);

  try {
    const preview = await previewRequest;
    cache.set(cacheKey, preview);
    return preview;
  } catch (error) {
    cache.delete(cacheKey);
    throw error;
  } finally {
    inFlight.delete(cacheKey);
  }
};
