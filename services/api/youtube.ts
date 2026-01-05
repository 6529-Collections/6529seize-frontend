export interface YoutubeOEmbedResponse {
  readonly title: string;
  readonly author_name?: string | undefined;
  readonly author_url?: string | undefined;
  readonly provider_name?: string | undefined;
  readonly provider_url?: string | undefined;
  readonly thumbnail_url: string;
  readonly thumbnail_width?: number | undefined;
  readonly thumbnail_height?: number | undefined;
  readonly html: string;
  readonly width?: number | undefined;
  readonly height?: number | undefined;
  readonly type?: string | undefined;
  readonly version?: string | undefined;
}

export const fetchYoutubePreview = async (
  url: string,
  signal?: AbortSignal
): Promise<YoutubeOEmbedResponse | null> => {
  const endpoint = new URL("https://www.youtube.com/oembed");
  endpoint.searchParams.set("format", "json");
  endpoint.searchParams.set("url", url);

  const response = await fetch(endpoint.toString(), { ...(signal !== undefined ? { signal: signal } : {}) });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as YoutubeOEmbedResponse;
};
