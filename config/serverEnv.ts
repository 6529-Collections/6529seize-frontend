import { serverEnvSchema, type ServerEnv } from "./serverEnv.schema";

if (globalThis.window !== undefined) {
  throw new TypeError("serverEnv can only be accessed on the server side");
}

const getServerEnv = (): ServerEnv | null => {
  if (typeof process === "undefined" || !process.env) {
    return null;
  }

  const raw = {
    SSR_CLIENT_ID: process.env["SSR_CLIENT_ID"],
    SSR_CLIENT_SECRET: process.env["SSR_CLIENT_SECRET"],
    GITHUB_LINK_STATUS_PREVIEW_TOKEN:
      process.env["GITHUB_LINK_STATUS_PREVIEW_TOKEN"],
  };

  const parsed = serverEnvSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }

  return parsed.data;
};

export const getServerEnvOrThrow = (): ServerEnv => {
  const env = getServerEnv();
  if (!env) {
    throw new Error(
      "SSR_CLIENT_ID and SSR_CLIENT_SECRET must be set as runtime environment variables"
    );
  }
  return env;
};

export const serverEnv: ServerEnv | null = getServerEnv();

// Optional server-only values. They are read at request time and are never
// part of the public runtime config, so no browser bundle can contain them.
const getOptionalServerValue = (
  value: string | undefined
): string | undefined => {
  const normalized = value?.trim();
  return normalized || undefined;
};

/**
 * `x-6529-auth` value for server-side requests to a gated (staging) API when
 * the incoming request carries no visitor access cookie.
 */
export const getStagingApiKey = (): string | undefined =>
  getOptionalServerValue(process.env["STAGING_API_KEY"]);

export const getFarcasterWarpcastApiKey = (): string | undefined =>
  getOptionalServerValue(process.env["FARCASTER_WARPCAST_API_KEY"]);
