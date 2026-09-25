import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";

export enum ImageScale {
  W_AUTO_H_50 = "AUTOx50",
  W_200_H_200 = "200x200",
  AUTOx450 = "AUTOx450",
  AUTOx600 = "AUTOx600",
  AUTOx800 = "AUTOx800",
  AUTOx1080 = "AUTOx1080",
}

const SCALABLE_PREFIXES = [
  "https://d3lqz0a4bldqgf.cloudfront.net/pfp/",
  "https://d3lqz0a4bldqgf.cloudfront.net/rememes/",
  "https://d3lqz0a4bldqgf.cloudfront.net/drops/",
  "https://d3lqz0a4bldqgf.cloudfront.net/waves/",
  "https://d3lqz0a4bldqgf.cloudfront.net/images/",
];

export function getScaledResolvedImageUri(
  resolvedUrl: string,
  scale: ImageScale
): string {
  const scalableUrl = SCALABLE_PREFIXES.find((prefix) =>
    resolvedUrl.startsWith(prefix)
  );
  if (!scalableUrl) {
    return resolvedUrl;
  }
  const path = resolvedUrl.slice(scalableUrl.length);
  const pathParts = path.split("/");
  const fileName = pathParts.pop();
  const folder = pathParts.join("/");
  if (!fileName) {
    return resolvedUrl;
  }
  const fileNameParts = fileName.split(".");
  if (fileNameParts.length <= 1) {
    return resolvedUrl;
  }
  let extension = fileNameParts.pop()!;
  if (extension.includes("?")) {
    extension = extension.slice(0, extension.indexOf("?"));
  }
  if (
    ["gif", "webp", "jpg", "jpeg", "png", "avif"].includes(
      extension.toLowerCase()
    )
  ) {
    return `${scalableUrl}${
      folder.length ? folder + "/" : ""
    }${scale}/${fileName}`;
  }
  return resolvedUrl;
}

export function getScaledImageUri(url: string, scale: ImageScale): string {
  return getScaledResolvedImageUri(resolveIpfsUrlSync(url), scale);
}

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
