import { commonApiFetch } from './common-api';

export interface YoutubePreviewThumbnail {
  readonly url: string;
  readonly width: number;
  readonly height: number;
}

export interface YoutubePreviewChannelInfo {
  readonly id: string;
  readonly title: string;
  readonly url: string;
}

export interface YoutubePreview {
  readonly videoId: string;
  readonly url: string;
  readonly title: string;
  readonly description: string;
  readonly channel: YoutubePreviewChannelInfo;
  readonly publishedAt: string;
  readonly duration: string;
  readonly thumbnails: {
    readonly default: YoutubePreviewThumbnail;
    readonly medium: YoutubePreviewThumbnail;
    readonly high: YoutubePreviewThumbnail;
    readonly standard?: YoutubePreviewThumbnail;
    readonly maxres?: YoutubePreviewThumbnail;
  };
}

const youtubePreviewCache = new Map<string, Promise<YoutubePreview>>();

const ensureUrl = (value: string): URL | undefined => {
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value);
  } catch {
    try {
      return new URL(`https://${value}`);
    } catch {
      return undefined;
    }
  }
};

const normaliseVideoId = (value: string | null): string | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const getCanonicalVideoId = (input: string): string | undefined => {
  const parsedUrl = ensureUrl(input);
  if (!parsedUrl) {
    return undefined;
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const normalisedHost = hostname.startsWith('www.')
    ? hostname.slice(4)
    : hostname;
  const pathSegments = parsedUrl.pathname
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (normalisedHost === 'youtu.be') {
    const [id] = pathSegments;
    return normaliseVideoId(id ? decodeURIComponent(id) : null);
  }

  if (
    normalisedHost === 'youtube.com' ||
    normalisedHost === 'youtube-nocookie.com' ||
    normalisedHost.endsWith('.youtube.com') ||
    normalisedHost.endsWith('.youtube-nocookie.com')
  ) {
    const queryId = normaliseVideoId(parsedUrl.searchParams.get('v'));
    if (queryId) {
      return queryId;
    }

    const [first, second] = pathSegments;
    if (
      first &&
      ['embed', 'shorts', 'v', 'live'].includes(first) &&
      second
    ) {
      return normaliseVideoId(second ? decodeURIComponent(second) : null);
    }
  }

  return undefined;
};

export const fetchYoutubePreview = async (
  url: string
): Promise<YoutubePreview> => {
  const trimmedUrl = url.trim();
  const videoId = getCanonicalVideoId(trimmedUrl);
  if (videoId) {
    const cached = youtubePreviewCache.get(videoId);
    if (cached) {
      return cached;
    }
  }

  const fetchPromise = commonApiFetch<YoutubePreview, { url: string }>({
    endpoint: 'youtube',
    params: { url: trimmedUrl },
  });

  if (!videoId) {
    return fetchPromise;
  }

  const cachedPromise = fetchPromise
    .then((preview) => {
      const resolvedPreviewPromise = Promise.resolve(preview);
      youtubePreviewCache.set(videoId, resolvedPreviewPromise);

      const responseVideoId = normaliseVideoId(preview.videoId);
      if (responseVideoId && responseVideoId !== videoId) {
        youtubePreviewCache.set(responseVideoId, resolvedPreviewPromise);
      }

      return preview;
    })
    .catch((error) => {
      youtubePreviewCache.delete(videoId);
      throw error;
    });

  youtubePreviewCache.set(videoId, cachedPromise);
  return cachedPromise;
};
