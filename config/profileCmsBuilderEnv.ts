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
  // Direct URL rollout; navigation remains unchanged. Flags are baked during build.
  // Any explicit non-true value disables the surface, even if its alias is enabled.
  const configured = values.filter((value) => value !== undefined);
  return configured.every((value) =>
    ["1", "true", "yes", "on"].includes(value.trim().toLowerCase())
  );
}
