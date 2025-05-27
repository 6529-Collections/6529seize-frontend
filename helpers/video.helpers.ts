const CLOUDFRONT_DOMAIN =
  process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN ??
  "https://d3lqz0a4bldqgf.cloudfront.net";

export interface VideoConversions {
  readonly MP4_1080P: string;
  readonly MP4_720P: string;
  readonly HLS: string;
}

/**
 * Build the "renditions/drops/..." path from the relative path
 */
function buildRenditionUrl(path: string): string {
  return `${CLOUDFRONT_DOMAIN}/renditions/drops/${path}`;
}

/**
 * From an original "drops/..." CloudFront URL, derive HLS / MP4 renditions.
 */
export function getVideoConversions(
  originalUrl: string
): VideoConversions | null {
  // Must start with "/drops/"
  const prefix = `${CLOUDFRONT_DOMAIN}/drops/`;
  if (!originalUrl.startsWith(prefix)) {
    return null;
  }

  // Isolate everything after "/drops/"
  const [_, afterDrops] = originalUrl.split("/drops/");
  if (!afterDrops) {
    return null;
  }

  // Find the last dot (strip extension .mov / .mp4, etc.)
  const lastDotIndex = afterDrops.lastIndexOf(".");
  if (lastDotIndex === -1) {
    return null; // No recognizable extension
  }

  // e.g. "author_<id>/<uuid>"
  const pathWithoutExtension = afterDrops.slice(0, lastDotIndex);

  // Separate the parent folders from final filename
  const lastSlashIndex = pathWithoutExtension.lastIndexOf("/");
  const fileName = pathWithoutExtension.substring(lastSlashIndex + 1);
  const beforeFileName = pathWithoutExtension.substring(0, lastSlashIndex + 1);

  return {
    MP4_1080P: `${buildRenditionUrl(
      `${beforeFileName}${fileName}`
    )}/mp4/${fileName}_1080p.mp4`,
    MP4_720P: `${buildRenditionUrl(
      `${beforeFileName}${fileName}`
    )}/mp4/${fileName}_720p.mp4`,
    HLS: `${buildRenditionUrl(
      `${beforeFileName}${fileName}`
    )}/hls/${fileName}.m3u8`,
  };
}

/**
 * Quick check if the URL is likely a video, based on known file extensions.
 */
export function isVideoUrl(url: string): boolean {
  const videoExtensions = [
    ".mp4",
    ".webm",
    ".ogg",
    ".mov",
    ".avi",
    ".wmv",
    ".flv",
    ".mkv",
  ];
  const lower = url.toLowerCase();
  return videoExtensions.some((ext) => lower.endsWith(ext));
}

// Simple in-memory cache for HEAD requests
const HEAD_CACHE: Record<string, boolean> = {};

/**
 * HEAD request to see if a URL is present (200) or missing (404).
 * Uses a small in-memory cache to avoid repeat HEAD requests.
 */
export async function checkVideoAvailability(url: string): Promise<boolean> {
  if (url in HEAD_CACHE) {
    return HEAD_CACHE[url];
  }
  try {
    const response = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
    });
    HEAD_CACHE[url] = response.ok;
    return response.ok;
  } catch {
    return false;
  }
}
