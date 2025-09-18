export interface LinkPreviewMedia {
  readonly url?: string | null;
  readonly secureUrl?: string | null;
  readonly type?: string | null;
  readonly width?: number | null;
  readonly height?: number | null;
  readonly alt?: string | null;
  readonly [key: string]: unknown;
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
  readonly [key: string]: unknown;
}

const linkPreviewCache = new Map<string, Promise<LinkPreviewResponse>>();

const normalizeUrl = (url: string): string => url.trim();

export const fetchLinkPreview = async (
  url: string
): Promise<LinkPreviewResponse> => {
  const normalizedUrl = normalizeUrl(url);

  if (!normalizedUrl) {
    throw new Error('A valid URL is required to fetch link preview metadata.');
  }

  const cachedResponse = linkPreviewCache.get(normalizedUrl);
  if (cachedResponse) {
    return cachedResponse;
  }

  const params = new URLSearchParams({ url: normalizedUrl });

  const requestPromise = fetch(`/api/open-graph?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  })
    .then(async (response) => {
      if (!response.ok) {
        let errorMessage = 'Failed to fetch link preview metadata.';
        try {
          const body = await response.json();
          if (body && typeof body.error === 'string' && body.error) {
            errorMessage = body.error;
          }
        } catch {
          // ignore parse errors and use default message
        }
        throw new Error(errorMessage);
      }
      return response.json() as Promise<LinkPreviewResponse>;
    })
    .catch((error) => {
      linkPreviewCache.delete(normalizedUrl);
      throw error;
    });

  linkPreviewCache.set(normalizedUrl, requestPromise);

  return requestPromise;
};
