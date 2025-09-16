export interface YoutubePreviewData {
  readonly title: string;
  readonly authorName?: string;
  readonly authorUrl?: string;
  readonly thumbnailUrl?: string;
  readonly providerName?: string;
}

interface YoutubeOEmbedResponse {
  readonly title: string;
  readonly author_name?: string;
  readonly author_url?: string;
  readonly type?: string;
  readonly height?: number;
  readonly width?: number;
  readonly version?: string;
  readonly provider_name?: string;
  readonly provider_url?: string;
  readonly thumbnail_height?: number;
  readonly thumbnail_width?: number;
  readonly thumbnail_url?: string;
  readonly html?: string;
}

export interface FetchYoutubePreviewParams {
  readonly videoId: string;
  readonly signal?: AbortSignal;
}

const YOUTUBE_OEMBED_ENDPOINT = "https://www.youtube.com/oembed";
const YOUTUBE_WATCH_BASE_URL = "https://www.youtube.com/watch";

export async function fetchYoutubePreview({
  videoId,
  signal,
}: FetchYoutubePreviewParams): Promise<YoutubePreviewData> {
  const sanitizedVideoId = videoId.trim();

  if (!sanitizedVideoId) {
    throw new Error("A valid YouTube video id is required");
  }

  const watchUrl = new URL(YOUTUBE_WATCH_BASE_URL);
  watchUrl.searchParams.set("v", sanitizedVideoId);

  const endpoint = new URL(YOUTUBE_OEMBED_ENDPOINT);
  endpoint.searchParams.set("url", watchUrl.toString());
  endpoint.searchParams.set("format", "json");

  const response = await fetch(endpoint.toString(), { signal });

  if (!response.ok) {
    throw new Error(`Failed to fetch YouTube preview (${response.status})`);
  }

  const data = (await response.json()) as YoutubeOEmbedResponse;

  return {
    title: data.title,
    authorName: data.author_name,
    authorUrl: data.author_url,
    thumbnailUrl: data.thumbnail_url,
    providerName: data.provider_name,
  };
}
