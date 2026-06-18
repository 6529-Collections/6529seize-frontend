import { matchesDomainOrSubdomain } from "@/lib/url/domains";

const YOUTUBE_DOMAINS = ["youtube.com", "youtube-nocookie.com"] as const;
const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{6,}$/;
const YOUTUBE_SAFE_PARAM_PATTERN = /^[A-Za-z0-9_-]{1,160}$/;

export interface YoutubeLinkInfo {
  readonly videoId: string;
  readonly url: string;
  readonly playlistId?: string | undefined;
  readonly playlistIndex?: string | undefined;
  readonly startSeconds?: number | undefined;
}

const isYoutubeDomain = (hostname: string): boolean =>
  YOUTUBE_DOMAINS.some((domain) =>
    matchesDomainOrSubdomain(hostname, domain)
  );

const readSafeParam = (
  searchParams: URLSearchParams,
  name: string
): string | undefined => {
  const value = searchParams.get(name)?.trim();
  return value && YOUTUBE_SAFE_PARAM_PATTERN.test(value) ? value : undefined;
};

const parsePlainSeconds = (value: string): number | undefined => {
  if (!/^\d{1,7}s?$/.test(value)) {
    return undefined;
  }

  const seconds = Number.parseInt(value.replace(/s$/i, ""), 10);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
};

export const parseYoutubeStartSeconds = (
  value: string | null | undefined
): number | undefined => {
  const trimmed = value?.trim().toLowerCase();
  if (!trimmed) {
    return undefined;
  }

  const plainSeconds = parsePlainSeconds(trimmed);
  if (plainSeconds !== undefined) {
    return plainSeconds;
  }

  const match = trimmed.match(/^(?:(\d{1,4})h)?(?:(\d{1,4})m)?(?:(\d{1,5})s?)?$/);
  if (!match) {
    return undefined;
  }

  const [, hoursRaw, minutesRaw, secondsRaw] = match;
  if (!hoursRaw && !minutesRaw && !secondsRaw) {
    return undefined;
  }

  const hours = hoursRaw ? Number.parseInt(hoursRaw, 10) : 0;
  const minutes = minutesRaw ? Number.parseInt(minutesRaw, 10) : 0;
  const seconds = secondsRaw ? Number.parseInt(secondsRaw, 10) : 0;
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  return totalSeconds > 0 ? totalSeconds : undefined;
};

const readStartSeconds = (url: URL): number | undefined =>
  parseYoutubeStartSeconds(url.searchParams.get("start")) ??
  parseYoutubeStartSeconds(url.searchParams.get("t"));

export const parseYoutubeLink = (href: string): YoutubeLinkInfo | null => {
  try {
    const url = new URL(href);
    const normalizedHost = url.hostname.replace(/^www\./i, "").toLowerCase();

    let videoId: string | null = null;

    if (normalizedHost === "youtu.be") {
      const pathSegments = url.pathname.split("/").filter(Boolean);
      videoId = pathSegments[0] ?? null;
    } else if (isYoutubeDomain(normalizedHost)) {
      const pathSegments = url.pathname.split("/").filter(Boolean);

      if (url.pathname === "/watch" || url.pathname === "/watch/") {
        videoId = url.searchParams.get("v");
      } else if (pathSegments[0] === "shorts") {
        videoId = pathSegments[1] ?? null;
      } else if (pathSegments[0] === "embed") {
        videoId = pathSegments[1] ?? null;
      } else if (pathSegments[0] === "live") {
        videoId = pathSegments[1] ?? null;
      } else if (pathSegments[0] === "v") {
        videoId = pathSegments[1] ?? null;
      }
    }

    const trimmedVideoId = videoId?.trim();
    if (!trimmedVideoId || !YOUTUBE_VIDEO_ID_PATTERN.test(trimmedVideoId)) {
      return null;
    }

    return {
      videoId: trimmedVideoId,
      url: href,
      playlistId: readSafeParam(url.searchParams, "list"),
      playlistIndex: readSafeParam(url.searchParams, "index"),
      startSeconds: readStartSeconds(url),
    };
  } catch {
    return null;
  }
};

const appendYoutubeContextParams = (
  target: URL,
  info: YoutubeLinkInfo,
  options: { readonly includeStart?: boolean | undefined } = {}
): void => {
  if (info.playlistId) {
    target.searchParams.set("list", info.playlistId);
  }

  if (info.playlistIndex) {
    target.searchParams.set("index", info.playlistIndex);
  }

  if (options.includeStart && info.startSeconds !== undefined) {
    target.searchParams.set("t", `${info.startSeconds}s`);
  }
};

const parseOrFallback = (
  href: string,
  videoId: string
): YoutubeLinkInfo => {
  return parseYoutubeLink(href) ?? { videoId, url: href };
};

export const getYoutubeFetchUrl = (href: string, videoId: string): string => {
  const info = parseOrFallback(href, videoId);
  const canonical = new URL(`https://www.youtube.com/watch?v=${info.videoId}`);
  appendYoutubeContextParams(canonical, info);
  return canonical.toString();
};

export const getYoutubeWatchUrl = (href: string, videoId: string): string => {
  const info = parseOrFallback(href, videoId);
  const canonical = new URL(`https://www.youtube.com/watch?v=${info.videoId}`);
  appendYoutubeContextParams(canonical, info, { includeStart: true });
  return canonical.toString();
};

export const getYoutubeEmbedUrl = (href: string, videoId: string): string => {
  const info = parseOrFallback(href, videoId);
  const embed = new URL(`https://www.youtube-nocookie.com/embed/${info.videoId}`);
  embed.searchParams.set("rel", "0");
  embed.searchParams.set("playsinline", "1");

  if (info.playlistId) {
    embed.searchParams.set("list", info.playlistId);
  }

  if (info.playlistIndex) {
    embed.searchParams.set("index", info.playlistIndex);
  }

  if (info.startSeconds !== undefined) {
    embed.searchParams.set("start", String(info.startSeconds));
  }

  return embed.toString();
};
