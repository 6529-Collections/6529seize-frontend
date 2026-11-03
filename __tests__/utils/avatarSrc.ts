import type { ImageScale } from "@/helpers/image.helpers";

/** A first-party CDN profile picture that the media resizer can scale. */
export const CDN_AVATAR_URL =
  "https://d3lqz0a4bldqgf.cloudfront.net/pfp/user/avatar.gif";

/** The resized derivative path the resizer serves for `CDN_AVATAR_URL`. */
export const scaledAvatarPath = (scale: ImageScale) =>
  `/pfp/user/${scale}/avatar.gif`;

/**
 * Returns the source an image element requests. Optimized next/image elements
 * point at the image optimizer, so their encoded `url` parameter is decoded.
 */
export const getRequestedImageSrc = (image: Element | null): string =>
  decodeURIComponent(image?.getAttribute("src") ?? "");
