import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";

export enum ImageScale {
  W_AUTO_H_50 = "AUTOx50",
  W_200_H_200 = "200x200",
  AUTOx450 = "AUTOx450",
  AUTOx600 = "AUTOx600",
  AUTOx800 = "AUTOx800",
  AUTOx1080 = "AUTOx1080",
}

const BACKEND_IMAGE_SCALE_SEGMENTS = new Set<string>(Object.values(ImageScale));

const RESPONSIVE_DROP_IMAGE_SCALES: ReadonlyArray<{
  readonly maxWidth: number;
  readonly scale: ImageScale;
}> = [
  { maxWidth: 450, scale: ImageScale.AUTOx450 },
  { maxWidth: 600, scale: ImageScale.AUTOx600 },
  { maxWidth: 800, scale: ImageScale.AUTOx800 },
  { maxWidth: 1080, scale: ImageScale.AUTOx1080 },
];

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
  if (!fileName) {
    return resolvedUrl;
  }
  const unscaledPathParts = pathParts.filter(
    (part) => !BACKEND_IMAGE_SCALE_SEGMENTS.has(part)
  );
  const fileNameParts = fileName.split(".");
  if (fileNameParts.length <= 1) {
    return resolvedUrl;
  }
  let extension = fileNameParts.pop()!;
  if (extension.includes("?")) {
    extension = extension.slice(0, extension.indexOf("?"));
  }
  if (["gif", "webp", "jpg", "jpeg", "png"].includes(extension.toLowerCase())) {
    const unscaledFolder = unscaledPathParts.join("/");
    return `${scalableUrl}${
      unscaledFolder.length ? unscaledFolder + "/" : ""
    }${scale}/${fileName}`;
  }
  return resolvedUrl;
}

export function getScaledImageUri(url: string, scale: ImageScale): string {
  return getScaledResolvedImageUri(resolveIpfsUrlSync(url), scale);
}

export function getResponsiveDropImageScale(width: number): ImageScale {
  return (
    RESPONSIVE_DROP_IMAGE_SCALES.find(({ maxWidth }) => width <= maxWidth)
      ?.scale ?? ImageScale.AUTOx1080
  );
}

function getResponsiveDropImageUri(src: string, width: number): string {
  return getScaledImageUri(src, getResponsiveDropImageScale(width));
}

export function responsiveDropImageLoader({
  src,
  width,
}: {
  readonly src: string;
  readonly width: number;
  readonly quality?: number | undefined;
}): string {
  return getResponsiveDropImageUri(src, width);
}
