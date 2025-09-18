export interface LinkPreviewMedia {
  readonly url?: string | null;
  readonly secureUrl?: string | null;
  readonly type?: string | null;
  readonly width?: number | null;
  readonly height?: number | null;
  readonly alt?: string | null;
  readonly [key: string]: unknown;
}

export interface BaseLinkPreviewResponse {
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

export type FacebookPreviewType =
  | "facebook.post"
  | "facebook.video"
  | "facebook.photo"
  | "facebook.page"
  | "facebook.unavailable";

export interface FacebookPostPreviewImage {
  readonly url: string;
  readonly alt: string;
}

export interface FacebookPostPreviewData {
  readonly page: string | null;
  readonly postId: string | null;
  readonly authorName: string | null;
  readonly authorUrl: string | null;
  readonly createdAt: string | null;
  readonly text: string | null;
  readonly images: readonly FacebookPostPreviewImage[];
}

export interface FacebookVideoPreviewData {
  readonly videoId: string | null;
  readonly title: string | null;
  readonly authorName: string | null;
  readonly authorUrl: string | null;
  readonly thumbnail: string | null;
  readonly duration: string | null;
}

export interface FacebookPhotoPreviewData {
  readonly photoId: string | null;
  readonly caption: string | null;
  readonly authorName: string | null;
  readonly authorUrl: string | null;
  readonly image: string | null;
}

export interface FacebookPagePreviewData {
  readonly name: string | null;
  readonly about: string | null;
  readonly avatar: string | null;
  readonly banner: string | null;
}

export type FacebookUnavailableReason =
  | "login_required"
  | "removed"
  | "rate_limited"
  | "error";

export interface FacebookPreviewPayloadBase {
  readonly type: FacebookPreviewType;
  readonly canonicalUrl?: string | null;
}

export type FacebookPreviewPayload =
  | (FacebookPreviewPayloadBase & { readonly type: "facebook.post"; readonly post: FacebookPostPreviewData })
  | (FacebookPreviewPayloadBase & { readonly type: "facebook.video"; readonly video: FacebookVideoPreviewData })
  | (FacebookPreviewPayloadBase & { readonly type: "facebook.photo"; readonly photo: FacebookPhotoPreviewData })
  | (FacebookPreviewPayloadBase & { readonly type: "facebook.page"; readonly page: FacebookPagePreviewData })
  | (FacebookPreviewPayloadBase & {
      readonly type: "facebook.unavailable";
      readonly reason: FacebookUnavailableReason;
    });

export type LinkPreviewResponse =
  | BaseLinkPreviewResponse
  | (BaseLinkPreviewResponse & FacebookPreviewPayload);

export type FacebookLinkPreviewResponse = BaseLinkPreviewResponse & FacebookPreviewPayload;

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
