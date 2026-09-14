import { getScaledResolvedImageUri, ImageScale } from "@/helpers/image.helpers";

export function documentationSourcePreviewUrl(
  url: string,
  compact: boolean
): string {
  if (url.includes("?") || url.includes("#")) return url;
  return getScaledResolvedImageUri(
    url,
    compact ? ImageScale.AUTOx450 : ImageScale.AUTOx1080
  );
}
