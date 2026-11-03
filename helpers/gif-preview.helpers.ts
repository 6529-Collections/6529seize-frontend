import { getScaledImageUri, type ImageScale } from "@/helpers/image.helpers";

// GIF versioning is restricted to the existing first-party resize routes.
const SCALABLE_PREFIXES = [
  "https://d3lqz0a4bldqgf.cloudfront.net/pfp/",
  "https://d3lqz0a4bldqgf.cloudfront.net/rememes/",
  "https://d3lqz0a4bldqgf.cloudfront.net/drops/",
  "https://d3lqz0a4bldqgf.cloudfront.net/waves/",
  "https://d3lqz0a4bldqgf.cloudfront.net/images/",
];

/** Match the pathname, never a query parameter that happens to end in .gif. */
export function isGifImageUrl(url: string): boolean {
  try {
    return new URL(url).pathname.toLowerCase().endsWith(".gif");
  } catch {
    return false;
  }
}

function splitUrlSuffix(url: string) {
  const index = url.search(/[?#]/);
  return index < 0
    ? { path: url, suffix: "" }
    : { path: url.slice(0, index), suffix: url.slice(index) };
}

/** Compatibility preview while the GIF worker rolls out or rejects an input. */
export function getLegacyGifPreviewUri(url: string): string {
  if (!SCALABLE_PREFIXES.some((prefix) => url.startsWith(prefix))) return url;
  const { path, suffix } = splitUrlSuffix(url);
  return (
    path.replace(/(\/(?:AUTO|\d+)x(?:AUTO|\d+))_gifv2(\/[^/]+)$/, "$1$2") +
    suffix
  );
}

/** Opt in for drop previews and banners; leave other image consumers unchanged. */
export function getAnimatedImagePreviewUri(
  url: string,
  scale: ImageScale
): string {
  if (!isGifImageUrl(url)) return getScaledImageUri(url, scale);
  const { path, suffix } = splitUrlSuffix(url);
  const scaled = getScaledImageUri(path, scale);
  if (!SCALABLE_PREFIXES.some((prefix) => scaled.startsWith(prefix)))
    return getScaledImageUri(url, scale);
  // Only version the resize segment immediately before the filename.
  const filenameIndex = scaled.lastIndexOf("/");
  return (
    scaled.slice(0, filenameIndex) +
    "_gifv2" +
    scaled.slice(filenameIndex) +
    suffix
  );
}
