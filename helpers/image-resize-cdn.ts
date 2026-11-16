export const IMAGE_RESIZE_CDN_ORIGIN = "https://d3lqz0a4bldqgf.cloudfront.net";
export const SCALABLE_IMAGE_PREFIXES = [
  "pfp",
  "rememes",
  "drops",
  "waves",
  "images",
].map((folder) => `${IMAGE_RESIZE_CDN_ORIGIN}/${folder}/`);
