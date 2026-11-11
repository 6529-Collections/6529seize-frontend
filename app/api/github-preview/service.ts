import LruTtlCache from "@/lib/cache/lruTtl";
import type { GithubPreviewResponse } from "@/services/api/github-preview-api";
import { getResourceCacheKey, parseGithubResource } from "./service/resource";
import { resolvePreviewForResource } from "./service/previews";

// Only public metadata passes the fetchers/preview gates. Previously public
// snapshots can remain visible for this TTL after upstream visibility changes.
const CACHE_TTL_MS = 2 * 60 * 1000;
const CACHE_MAX_ITEMS = 500;
// A refresh re-fetches only a snapshot at least this old, so however many
// viewers poll one link, GitHub sees at most one request per link in this
// interval. Visible status badges poll every 30 seconds.
const MIN_REFRESH_INTERVAL_MS = 20 * 1000;

type CachedPreview = {
  readonly preview: GithubPreviewResponse;
  readonly fetchedAt: number;
};

const cache = new LruTtlCache<string, CachedPreview>({
  max: CACHE_MAX_ITEMS,
  ttlMs: CACHE_TTL_MS,
});
const inFlight = new Map<string, Promise<GithubPreviewResponse>>();

// A failed load leaves the cache as it was: a refresh that fails keeps the
// still-valid snapshot (and answers with it), and failures themselves are
// never cached.
const loadPreview = async (
  cacheKey: string,
  resource: ReturnType<typeof parseGithubResource>
): Promise<GithubPreviewResponse> => {
  const previewRequest = resolvePreviewForResource(resource);
  inFlight.set(cacheKey, previewRequest);

  try {
    const preview = await previewRequest;
    cache.set(cacheKey, { preview, fetchedAt: Date.now() });
    return preview;
  } finally {
    if (inFlight.get(cacheKey) === previewRequest) {
      inFlight.delete(cacheKey);
    }
  }
};

export const resolveGithubPreview = async (
  rawUrl: string | null,
  options?: { readonly bypassCache?: boolean | undefined }
): Promise<GithubPreviewResponse> => {
  const resource = parseGithubResource(rawUrl);
  const cacheKey = getResourceCacheKey(resource);
  const cached = cache.get(cacheKey);
  const refreshDue =
    options?.bypassCache === true &&
    cached !== undefined &&
    Date.now() - cached.fetchedAt >= MIN_REFRESH_INTERVAL_MS;

  if (cached && !refreshDue) {
    return cached.preview;
  }

  const pending = inFlight.get(cacheKey) ?? loadPreview(cacheKey, resource);
  if (!cached) {
    return pending;
  }

  // A refresh that fails answers with the retained snapshot.
  return pending.catch(() => cached.preview);
};
