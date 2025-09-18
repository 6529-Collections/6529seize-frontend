export interface LinkPreviewMedia {
  readonly url?: string | null;
  readonly secureUrl?: string | null;
  readonly type?: string | null;
  readonly width?: number | null;
  readonly height?: number | null;
  readonly alt?: string | null;
  readonly [key: string]: unknown;
}

export type InstagramResourceKind =
  | "post"
  | "reel"
  | "tv"
  | "profile"
  | "story"
  | "highlight";

export type InstagramPreviewStatus = "available" | "protected" | "unavailable";

export interface InstagramPreviewResponse {
  readonly canonicalUrl: string;
  readonly resource: InstagramResourceKind;
  readonly status: InstagramPreviewStatus;
  readonly authorName?: string | null;
  readonly authorUrl?: string | null;
  readonly caption?: string | null;
  readonly thumbnailUrl?: string | null;
  readonly thumbnailWidth?: number | null;
  readonly thumbnailHeight?: number | null;
  readonly uploadDate?: string | null;
  readonly username?: string | null;
}

export interface LinkPreviewResponse {
  readonly requestUrl?: string | null;
  readonly url?: string | null;
  readonly title?: string | null;
  readonly description?: string | null;
  readonly siteName?: string | null;
  readonly mediaType?: string | null;
  readonly contentType?: string | null;
  readonly favicon?: string | null;
  readonly favicons?: readonly string[] | null;
  readonly image?: LinkPreviewMedia | null;
  readonly images?: readonly LinkPreviewMedia[] | null;
  readonly instagram?: InstagramPreviewResponse | null;
  readonly [key: string]: unknown;
}

interface CacheEntry {
  data?: LinkPreviewResponse;
  expiresAt: number;
  ongoing?: Promise<LinkPreviewResponse>;
}

const linkPreviewCache = new Map<string, CacheEntry>();

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const STALE_RETRY_MS = 5 * 60 * 1000;

const normalizeUrl = (url: string): string => url.trim();

const requestPreview = async (
  normalizedUrl: string
): Promise<LinkPreviewResponse> => {
  const params = new URLSearchParams({ url: normalizedUrl });

  const response = await fetch(`/api/open-graph?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    if (
      payload &&
      typeof payload === "object" &&
      "instagram" in payload &&
      (payload as Record<string, unknown>).instagram
    ) {
      return payload as LinkPreviewResponse;
    }

    let errorMessage = "Failed to fetch link preview metadata.";
    if (
      payload &&
      typeof payload === "object" &&
      typeof (payload as { error?: unknown }).error === "string" &&
      (payload as { error: string }).error
    ) {
      errorMessage = (payload as { error: string }).error;
    }

    throw new Error(errorMessage);
  }

  return (payload ?? {}) as LinkPreviewResponse;
};

export const fetchLinkPreview = async (
  url: string
): Promise<LinkPreviewResponse> => {
  const normalizedUrl = normalizeUrl(url);

  if (!normalizedUrl) {
    throw new Error('A valid URL is required to fetch link preview metadata.');
  }

  const cachedEntry = linkPreviewCache.get(normalizedUrl);

  if (cachedEntry) {
    if (cachedEntry.ongoing) {
      return cachedEntry.ongoing;
    }

    if (cachedEntry.data) {
      const staleData = cachedEntry.data;
      if (cachedEntry.expiresAt > Date.now()) {
        return Promise.resolve(staleData);
      }

      const revalidationPromise = requestPreview(normalizedUrl)
        .then((data) => {
          linkPreviewCache.set(normalizedUrl, {
            data,
            expiresAt: Date.now() + TWENTY_FOUR_HOURS_MS,
          });
          return data;
        })
        .catch(() => {
          linkPreviewCache.set(normalizedUrl, {
            data: staleData,
            expiresAt: Date.now() + STALE_RETRY_MS,
          });
          return staleData;
        });

      linkPreviewCache.set(normalizedUrl, {
        data: staleData,
        expiresAt: cachedEntry.expiresAt,
        ongoing: revalidationPromise,
      });

      void revalidationPromise.catch(() => undefined);

      return Promise.resolve(staleData);
    }
  }

  const requestPromise = requestPreview(normalizedUrl)
    .then((data) => {
      linkPreviewCache.set(normalizedUrl, {
        data,
        expiresAt: Date.now() + TWENTY_FOUR_HOURS_MS,
      });
      return data;
    })
    .catch((error) => {
      linkPreviewCache.delete(normalizedUrl);
      throw error;
    });

  linkPreviewCache.set(normalizedUrl, {
    expiresAt: Date.now() + TWENTY_FOUR_HOURS_MS,
    ongoing: requestPromise,
  });

  return requestPromise;
};
