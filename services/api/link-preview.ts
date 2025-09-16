import { commonApiFetch } from "./common-api";

export interface LinkPreviewMetadata {
  readonly title?: string;
  readonly description?: string;
  readonly image?: string;
  readonly siteName?: string;
  readonly url?: string;
}

export const fetchLinkPreview = async (
  url: string,
  options?: { readonly signal?: AbortSignal }
): Promise<LinkPreviewMetadata> => {
  return commonApiFetch<LinkPreviewMetadata, { url: string }>({
    endpoint: "link-preview",
    params: { url },
    signal: options?.signal,
  });
};
