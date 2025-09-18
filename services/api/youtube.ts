export interface YoutubeOEmbedResponse {
  readonly title: string;
  readonly author_name?: string;
  readonly author_url?: string;
  readonly provider_name?: string;
  readonly provider_url?: string;
  readonly thumbnail_url: string;
  readonly thumbnail_width?: number;
  readonly thumbnail_height?: number;
  readonly html: string;
  readonly width?: number;
  readonly height?: number;
  readonly type?: string;
  readonly version?: string;
}

export const fetchYoutubePreview = async (
  url: string,
  signal?: AbortSignal
): Promise<YoutubeOEmbedResponse | null> => {
  const endpoint = new URL("https://www.youtube.com/oembed");
  endpoint.searchParams.set("format", "json");
  endpoint.searchParams.set("url", url);

  const response = await fetch(endpoint.toString(), { signal });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as YoutubeOEmbedResponse;
};
