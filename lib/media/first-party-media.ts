import { publicEnv } from "@/config/env";

/**
 * The prod CDN for user uploads (drops, waves, profile pictures, banners).
 * Older data in every environment points here.
 */
export const PROD_MEDIA_ORIGIN = "https://d3lqz0a4bldqgf.cloudfront.net";

function httpsOrigin(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}

/**
 * This build's user-upload CDN origin: NEXT_PUBLIC_CLOUDFRONT_DOMAIN when it is
 * an https URL (staging sets its own media host), otherwise the prod CDN.
 */
export function getMediaOrigin(): string {
  return (
    httpsOrigin(publicEnv.NEXT_PUBLIC_CLOUDFRONT_DOMAIN) ?? PROD_MEDIA_ORIGIN
  );
}

/** True for this build's media CDN and for the prod CDN. */
export function isFirstPartyMediaOrigin(origin: string): boolean {
  return origin === PROD_MEDIA_ORIGIN || origin === getMediaOrigin();
}
