import { publicEnv } from "@/config/env";
import { toConfiguredMediaPlaybackUrl } from "@/lib/media/decentralized-media";

/**
 * URL the audio and video players load for a stored drop media URL. Stored
 * first-party gateway URLs follow the configured media endpoint, like images
 * and HTML; uploads and other hosts are returned unchanged.
 */
export function getMediaPlaybackUrl(src: string): string {
  return toConfiguredMediaPlaybackUrl(src, publicEnv.MEDIA_RESOLVER_ENDPOINT);
}
