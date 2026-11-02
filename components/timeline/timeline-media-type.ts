export enum MediaType {
  IMAGE,
  VIDEO,
  HTML,
  UNKNOWN,
}

const VIDEO_FORMATS = new Set([
  "mp4",
  "mov",
  "webm",
  "ogv",
  "m4v",
  "mpeg",
  "mpg",
]);
const IMAGE_FORMATS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "apng",
  "webp",
  "avif",
  "svg",
  "bmp",
  "ico",
  "tiff",
  "tif",
]);

export function getTimelineMediaType(format: unknown): MediaType {
  if (typeof format !== "string") return MediaType.UNKNOWN;
  const normalized = format.split(";", 1)[0]?.trim().toLowerCase();
  if (!normalized) return MediaType.UNKNOWN;
  if (
    ["html", "htm", "text/html", "application/xhtml+xml"].includes(normalized)
  ) {
    return MediaType.HTML;
  }
  if (normalized.startsWith("video/") || VIDEO_FORMATS.has(normalized)) {
    return MediaType.VIDEO;
  }
  if (normalized.startsWith("image/") || IMAGE_FORMATS.has(normalized)) {
    return MediaType.IMAGE;
  }
  return MediaType.UNKNOWN;
}
