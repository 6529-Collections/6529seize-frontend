import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Required server vars
  API_ENDPOINT: z.string().url("API_ENDPOINT must be a valid URL"),
  BASE_ENDPOINT: z.string().url("BASE_ENDPOINT must be a valid URL"),
  VERSION: z.string().optional(),

  // Optional server vars
  ALLOWLIST_API_ENDPOINT: z
    .string()
    .url("ALLOWLIST_API_ENDPOINT must be a valid URL"),
  ALCHEMY_API_KEY: z.string().min(1, "ALCHEMY_API_KEY is required"),
  AWS_RUM_APP_ID: z.string().optional(),
  AWS_RUM_REGION: z.string().optional(),
  AWS_RUM_SAMPLE_RATE: z.string().optional(),
  CORE_SCHEME: z.string().min(1, "CORE_SCHEME is required"),
  DEV_MODE_AUTH_JWT: z.string().optional(),
  DEV_MODE_MEMES_WAVE_ID: z.string().optional(),
  DEV_MODE_WALLET_ADDRESS: z.string().optional(),
  ENABLE_SECURITY_LOGGING: z.string().optional(),
  IPFS_API_ENDPOINT: z.string().url("IPFS_API_ENDPOINT must be a valid URL"),
  IPFS_GATEWAY_ENDPOINT: z
    .string()
    .url("IPFS_GATEWAY_ENDPOINT must be a valid URL"),
  IPFS_MFS_PATH: z.string().optional(),
  MOBILE_APP_SCHEME: z.string().min(1, "MOBILE_APP_SCHEME is required"),
  NEXTGEN_CHAIN_ID: z.string().optional(),
  PEPE_CACHE_TTL_MINUTES: z.string().optional(),
  PEPE_CACHE_MAX_ITEMS: z.string().optional(),
  STAGING_API_KEY: z.string().optional(),
  TENOR_API_KEY: z.string().optional(),
  USE_DEV_AUTH: z.string().optional(),
  WS_ENDPOINT: z.string().optional(),
  STAGING_PASSWORD: z.string().optional(),
  CI: z.string().optional(),
  COVERAGE_INCREMENT_PERCENT_ENV: z.string().optional(),
  FILE_SUGGESTION_COUNT: z.coerce.number().int().positive().optional(),
  PROCESS_ID: z.string().optional(),
  TIME_LIMIT_MINUTES: z.coerce.number().int().positive().optional(),
  TOTAL_PROCESSES: z.coerce.number().int().positive().optional(),
  VITE_FEATURE_AB_CARD: z.string().optional(),
  NEXT_PUBLIC_VITE_FEATURE_AB_CARD: z.string().optional(),
  NEXT_PUBLIC_FEATURE_AB_CARD: z.string().optional(),
  FEATURE_AB_CARD: z.string().optional(),
  PORT: z.coerce.number().int().positive().optional(),
  PORT_SEARCH_LIMIT: z.coerce.number().int().positive().optional(),
  NEXT_PUBLIC_CLOUDFRONT_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_DEBUG_NAV: z.string().optional(),
  // If you expose your base endpoint to the client, define it here:
  NEXT_PUBLIC_BASE_ENDPOINT: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
