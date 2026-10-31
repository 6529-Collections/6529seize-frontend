import { isLocalAppEnvironment } from "./appEnvironment";

const DEV_AUTH_ENV_KEYS = [
  "USE_DEV_AUTH",
  "DEV_MODE_AUTH_JWT",
  "DEV_MODE_WALLET_ADDRESS",
] as const;

type DevAuthEnvKey = (typeof DEV_AUTH_ENV_KEYS)[number];

type DevAuthBuildEnv = Readonly<
  Partial<Record<DevAuthEnvKey, string | undefined>> & {
    BASE_ENDPOINT: string;
  }
>;

const isConfigured = (
  key: DevAuthEnvKey,
  value: string | undefined
): boolean => {
  const normalized = value?.trim();
  if (!normalized) {
    return false;
  }
  return !(key === "USE_DEV_AUTH" && normalized === "false");
};

/**
 * Dev auth is for local development and sandboxes. A production build whose
 * BASE_ENDPOINT is not a loopback host (production, staging or a personal
 * staging host) must not bake it into the public runtime config.
 */
export function assertNoDevAuthInDeployableBuild(env: DevAuthBuildEnv): void {
  if (isLocalAppEnvironment(env.BASE_ENDPOINT)) {
    return;
  }

  const configuredKeys = DEV_AUTH_ENV_KEYS.filter((key) =>
    isConfigured(key, env[key])
  );
  if (configuredKeys.length > 0) {
    throw new Error(
      `Dev auth settings (${configuredKeys.join(", ")}) are only allowed in local builds. ` +
        "Unset them for production builds whose BASE_ENDPOINT is not a local host."
    );
  }
}
