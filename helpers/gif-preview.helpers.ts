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

/** Compatibility preview while the GIF worker rolls out or rejects an input. */
export function getLegacyGifPreviewUri(url: string): string {
  if (!SCALABLE_PREFIXES.some((prefix) => url.startsWith(prefix))) return url;
  return url.replace(/(\/(?:AUTO|\d+)x(?:AUTO|\d+))_gifv2\//, "$1/");
}

/** Opt in for drop previews and banners; leave other image consumers unchanged. */
export function getAnimatedImagePreviewUri(
  url: string,
  scale: ImageScale
): string {
  const scaled = getScaledImageUri(url, scale);
  if (
    !isGifImageUrl(url) ||
    !SCALABLE_PREFIXES.some((prefix) => scaled.startsWith(prefix))
  )
    return scaled;
  return scaled.replace(`/${scale}/`, `/${scale}_gifv2/`);
}
