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
];

export function getScaledImageUri(url: string, scale: ImageScale): string {
  const resolvedUrl = resolveIpfsUrlSync(url);
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
  if (["gif", "webp", "jpg", "jpeg", "png"].includes(extension.toLowerCase())) {
    return `${scalableUrl}${
      folder.length ? folder + "/" : ""
    }${scale}/${fileName}`;
  }
  return resolvedUrl;
}
