import type { BucketLocation } from "@/lib/validator-page/releasesBucket";

/**
 * The private bucket that holds 6529 AI's release lists and release files.
 * The production instance role may read `feed/*` and `releases/*` and
 * nothing else; nothing in the bucket is public.
 */
export const AI_RELEASES_LOCATION: BucketLocation = {
  bucket: "6529-ai-releases-4d7e988d",
  region: "us-east-1",
};
