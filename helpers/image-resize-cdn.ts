import { getAppEnvironment } from "../config/appEnvironment";

const IMAGE_RESIZE_CDN_ORIGIN = "https://d3lqz0a4bldqgf.cloudfront.net";
export const STAGING_DROP_MEDIA_HOSTNAME = "media.staging.6529.io";
export const STAGING_DROP_MEDIA_ORIGIN = `https://${STAGING_DROP_MEDIA_HOSTNAME}`;
const DROP_MEDIA_PATH = "/drops/";

export function allowsStagingDropMedia(baseEndpoint: string): boolean {
  return getAppEnvironment(baseEndpoint).hostname === "staging.6529.io";
}

export const SCALABLE_IMAGE_PREFIXES = [
  ...["pfp", "rememes", "drops", "waves", "images"].map(
    (folder) => `${IMAGE_RESIZE_CDN_ORIGIN}/${folder}/`
  ),
  `${STAGING_DROP_MEDIA_ORIGIN}${DROP_MEDIA_PATH}`,
];

export function isDropMediaCdnUrl(url: URL): boolean {
  return (
    (url.origin === IMAGE_RESIZE_CDN_ORIGIN ||
      url.origin === STAGING_DROP_MEDIA_ORIGIN) &&
    !url.username &&
    !url.password &&
    url.pathname.startsWith(DROP_MEDIA_PATH)
  );
}
