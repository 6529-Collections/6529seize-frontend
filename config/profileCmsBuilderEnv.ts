import { publicEnv } from "@/config/env";

export function isProfileCmsBuilderEnabledEnv(): boolean {
  return getBooleanEnv([
    publicEnv.NEXT_PUBLIC_PROFILE_CMS_BUILDER_ENABLED,
    publicEnv.PROFILE_CMS_BUILDER_ENABLED,
  ]);
}

export function isProfileCmsBuilderApiEnabledEnv(): boolean {
  return getBooleanEnv([
    publicEnv.NEXT_PUBLIC_PROFILE_CMS_BUILDER_API_ENABLED,
    publicEnv.PROFILE_CMS_BUILDER_API_ENABLED,
  ]);
}

function getBooleanEnv(values: ReadonlyArray<string | undefined>): boolean {
  return values.some((value) => {
    if (value === undefined) {
      return false;
    }

    return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
  });
}
