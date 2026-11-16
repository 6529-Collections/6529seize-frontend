import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import { SCALABLE_IMAGE_PREFIXES } from "@/helpers/image-resize-cdn";

export enum ImageScale {
  W_AUTO_H_50 = "AUTOx50",
  W_200_H_200 = "200x200",
  AUTOx450 = "AUTOx450",
  AUTOx600 = "AUTOx600",
  AUTOx800 = "AUTOx800",
  AUTOx1080 = "AUTOx1080",
}

export function getScaledResolvedImageUri(
  resolvedUrl: string,
  scale: ImageScale
): string {
  const scalableUrl = SCALABLE_IMAGE_PREFIXES.find((prefix) =>
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
