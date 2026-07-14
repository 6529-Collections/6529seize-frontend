import { getNodeEnv, publicEnv } from "@/config/env";

/**
 * These flags resolve from the build-time-baked `publicEnv` (PUBLIC_RUNTIME),
 * mirroring the sibling PROFILE_CMS_BUILDER_* flags. Their values are fixed at
 * build/deploy time, not read live per request — setting the underlying env
 * var on an already-built server has no effect. There is no per-request
 * runtime toggle for these flags by design.
 */
export function isProfileCmsRuntimeEnabledEnv(): boolean {
  return publicEnv.PROFILE_CMS_RUNTIME_ENABLED !== "false";
}

export function shouldUseProfileCmsRuntimeFixturePrimaryEnv(): boolean {
  return (
    getNodeEnv() !== "production" &&
    publicEnv.PROFILE_CMS_RUNTIME_FIXTURE_PRIMARY === "true"
  );
}
