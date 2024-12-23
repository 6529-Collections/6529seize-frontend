export enum ImageScale {
  W_AUTO_H_50 = "AUTOx50",
  W_100_H_AUTO = "100xAUTO",
  W_200_H_200 = "200x200",
}

const SCALABLE_PREFIXES = [
  "https://d3lqz0a4bldqgf.cloudfront.net/images/",
  "https://d3lqz0a4bldqgf.cloudfront.net/pfp/",
  "https://d3lqz0a4bldqgf.cloudfront.net/rememes/",
  "https://d3lqz0a4bldqgf.cloudfront.net/drops/",
  "https://d3lqz0a4bldqgf.cloudfront.net/waves/",
];

export function getScaledImageUri(url: string, scale: ImageScale): string {
  const scalableUrl = SCALABLE_PREFIXES.find((prefix) =>
    url.startsWith(prefix)
  );
  if (!scalableUrl) {
    return url;
  }
  const path = url.slice(scalableUrl.length);
  const pathParts = path.split("/");
  const fileName = pathParts.pop();
  const folder = pathParts.join("/");
  if (!fileName) {
    return url;
  }
  const fileNameParts = fileName.split(".");
  if (fileNameParts.length <= 1) {
    return url;
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
  return url;
}
