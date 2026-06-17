export function isProfileCmsRuntimeEnabledEnv(): boolean {
  return process.env["PROFILE_CMS_RUNTIME_ENABLED"] !== "false";
}

export function shouldUseProfileCmsRuntimeFixturePrimaryEnv(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env["PROFILE_CMS_RUNTIME_FIXTURE_PRIMARY"] === "true"
  );
}
