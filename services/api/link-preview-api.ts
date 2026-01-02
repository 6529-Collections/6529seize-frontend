interface LinkPreviewMedia {
  readonly url?: string | null | undefined;
  readonly secureUrl?: string | null | undefined;
  readonly type?: string | null | undefined;
  readonly width?: number | null | undefined;
  readonly height?: number | null | undefined;
  readonly alt?: string | null | undefined;
  readonly [key: string]: unknown;
}

interface LinkPreviewBase {
  readonly requestUrl?: string | null | undefined;
  readonly url?: string | null | undefined;
  readonly title?: string | null | undefined;
  readonly description?: string | null | undefined;
  readonly siteName?: string | null | undefined;
  readonly mediaType?: string | null | undefined;
  readonly contentType?: string | null | undefined;
  readonly favicon?: string | null | undefined;
  readonly favicons?: readonly string[] | null | undefined;
  readonly image?: LinkPreviewMedia | null | undefined;
  readonly images?: readonly LinkPreviewMedia[] | null | undefined;
  readonly [key: string]: unknown;
}

type GoogleWorkspaceAvailability = "public" | "restricted";

interface GoogleWorkspaceLinksBase {
  readonly open: string;
  readonly preview: string;
}

export interface GoogleDocsLinkPreview extends LinkPreviewBase {
  readonly type: "google.docs";
  readonly fileId: string;
  readonly thumbnail?: string | null | undefined;
  readonly links: GoogleWorkspaceLinksBase & {
    readonly exportPdf?: string | undefined;
  };
  readonly availability: GoogleWorkspaceAvailability;
}

export interface GoogleSheetsLinkPreview extends LinkPreviewBase {
  readonly type: "google.sheets";
  readonly fileId: string;
  readonly gid?: string | null | undefined;
  readonly thumbnail?: string | null | undefined;
  readonly links: GoogleWorkspaceLinksBase & {
    readonly embedPub?: string | undefined;
  };
  readonly availability: GoogleWorkspaceAvailability;
}

export interface GoogleSlidesLinkPreview extends LinkPreviewBase {
  readonly type: "google.slides";
  readonly fileId: string;
  readonly thumbnail?: string | null | undefined;
  readonly links: GoogleWorkspaceLinksBase & {
    readonly exportPdf?: string | undefined;
  };
  readonly availability: GoogleWorkspaceAvailability;
}

export type GoogleWorkspaceLinkPreview =
  | GoogleDocsLinkPreview
  | GoogleSheetsLinkPreview
  | GoogleSlidesLinkPreview;

interface GenericLinkPreviewResponse extends LinkPreviewBase {
  readonly type?: string | null | undefined;
}

export type LinkPreviewResponse =
  | GenericLinkPreviewResponse
  | GoogleWorkspaceLinkPreview;

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
