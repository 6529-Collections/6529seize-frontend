import {
  getMediaOrigin,
  PROD_MEDIA_ORIGIN,
} from "@/lib/media/first-party-media";

/**
 * Upload CDNs that serve on-demand sizes (`<folder>/AUTOx450/<file>`): the
 * prod CDN, which older data in every environment points to, and this build's
 * media CDN (staging runs its own resizer behind media.staging.6529.io).
 */
const RESIZE_CDN_ORIGINS = [...new Set([PROD_MEDIA_ORIGIN, getMediaOrigin()])];

export const SCALABLE_IMAGE_PREFIXES = RESIZE_CDN_ORIGINS.flatMap((origin) =>
  ["pfp", "rememes", "drops", "waves", "images"].map(
    (folder) => `${origin}/${folder}/`
  )
);
