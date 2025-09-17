import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_ENDPOINT: z
    .string({ required_error: "API_ENDPOINT environment variable is required" })
    .min(1, "API_ENDPOINT environment variable is required"),
  BASE_ENDPOINT: z
    .string({ required_error: "BASE_ENDPOINT environment variable is required" })
    .min(1, "BASE_ENDPOINT environment variable is required")
    .default("https://6529.io"),
  VERSION: z
    .string({ required_error: "VERSION environment variable is required" })
    .min(1, "VERSION environment variable is required")
    .default("development"),
  ALLOWLIST_API_ENDPOINT: z.string().optional(),
  ALCHEMY_API_KEY: z.string().optional(),
  AWS_RUM_APP_ID: z.string().optional(),
  AWS_RUM_REGION: z.string().optional(),
  AWS_RUM_SAMPLE_RATE: z.string().optional(),
  CORE_SCHEME: z.string().optional(),
  DEV_MODE_AUTH_JWT: z.string().optional(),
  DEV_MODE_MEMES_WAVE_ID: z.string().optional(),
  DEV_MODE_WALLET_ADDRESS: z.string().optional(),
  ENABLE_SECURITY_LOGGING: z.string().optional(),
  IPFS_API_ENDPOINT: z.string().optional(),
  IPFS_GATEWAY_ENDPOINT: z.string().optional(),
  IPFS_MFS_PATH: z.string().optional(),
  MOBILE_APP_SCHEME: z.string().optional(),
  NEXT_PUBLIC_CLOUDFRONT_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_DEBUG_NAV: z.string().optional(),
  NEXTGEN_CHAIN_ID: z.string().optional(),
  STAGING_API_KEY: z.string().optional(),
  TENOR_API_KEY: z.string().optional(),
  USE_DEV_AUTH: z.string().optional(),
  WS_ENDPOINT: z.string().optional(),
  STAGING_PASSWORD: z.string().optional(),
  CI: z.string().optional(),
  COVERAGE_INCREMENT_PERCENT_ENV: z.string().optional(),
  FILE_SUGGESTION_COUNT: z.string().optional(),
  PROCESS_ID: z.string().optional(),
  TIME_LIMIT_MINUTES: z.string().optional(),
  TOTAL_PROCESSES: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;
export type EnvKey = keyof typeof envSchema.shape;
export type EnvOverrides = Partial<Record<EnvKey, Env[EnvKey] | undefined>>;

export const getEnv = (overrides?: EnvOverrides): Env => {
  const raw = { ...process.env, ...(overrides ?? {}) } as Record<string, unknown>;
  return envSchema.parse(raw);
};

export const resetEnvCache = (): void => {
  // Environment values are read dynamically, so there is no cache to reset.
};

export const env = new Proxy({} as Env, {
  get(_target, property) {
    if (typeof property !== "string") {
      return undefined;
    }
    if (!(property in envSchema.shape)) {
      return undefined;
    }
    return getEnv()[property as EnvKey];
  },
  ownKeys() {
    return Reflect.ownKeys(envSchema.shape);
  },
  getOwnPropertyDescriptor(_target, property) {
    if (typeof property !== "string" || !(property in envSchema.shape)) {
      return undefined;
    }
    return {
      configurable: false,
      enumerable: true,
      value: getEnv()[property as EnvKey],
      writable: false,
    };
  },
  set() {
    throw new Error("Environment variables are read-only. Use process.env to mutate them explicitly.");
  },
}) as Env;
