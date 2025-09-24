import { z } from "zod";
import { validateBaseEndpoint } from "./env.schema.validation";

/**
 * Public runtime env — safe for client & server.
 * Only include vars that are either:
 *  - prefixed with NEXT_PUBLIC_ (Next exposes automatically), OR
 *  - explicitly exposed in next.config.mjs -> export default { env: { ... } }
 */
export const publicEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test", "local"]).optional(),
  API_ENDPOINT: z.string().url(),
  BASE_ENDPOINT: z
    .string({
      required_error:
        "BASE_ENDPOINT environment variable is required. Please set it in your environment or .env.local file.",
    })
    .url("BASE_ENDPOINT must be a valid URL")
    .superRefine(validateBaseEndpoint),
  ALLOWLIST_API_ENDPOINT: z.string().url(),
  ALCHEMY_API_KEY: z.string().min(1, "ALCHEMY_API_KEY is required"),
  NEXTGEN_CHAIN_ID: z.coerce.number().int().positive().optional(),
  MOBILE_APP_SCHEME: z.string().optional(),
  CORE_SCHEME: z.string().optional(),
  IPFS_API_ENDPOINT: z.string().url("IPFS_API_ENDPOINT must be a valid URL"),
  IPFS_GATEWAY_ENDPOINT: z
    .string()
    .url("IPFS_GATEWAY_ENDPOINT must be a valid URL"),
  IPFS_MFS_PATH: z.string().optional(),
  TENOR_API_KEY: z.string().optional(),
  WS_ENDPOINT: z.string().url("WS_ENDPOINT must be a valid URL").optional(),
  DEV_MODE_MEMES_WAVE_ID: z.string().optional(),
  DEV_MODE_WALLET_ADDRESS: z.string().optional(),
  DEV_MODE_AUTH_JWT: z.string().optional(),
  USE_DEV_AUTH: z.string().optional(),
  STAGING_API_KEY: z.string().optional(),
  VERSION: z.string().optional(),
  AWS_RUM_APP_ID: z.string().optional(),
  AWS_RUM_REGION: z.string().optional(),
  AWS_RUM_SAMPLE_RATE: z.string().optional(),

  PORT: z.coerce.number().int().positive().optional(),
  PORT_SEARCH_LIMIT: z.coerce.number().int().positive().optional(),

  NEXT_PUBLIC_FEATURE_AB_CARD: z.string().optional(),
  NEXT_PUBLIC_VITE_FEATURE_AB_CARD: z.string().optional(),
  VITE_FEATURE_AB_CARD: z.string().optional(),
  FEATURE_AB_CARD: z.string().optional(),
  ENABLE_SECURITY_LOGGING: z.string().optional(),

  PEPE_CACHE_TTL_MINUTES: z.string().optional(),
  PEPE_CACHE_MAX_ITEMS: z.string().optional(),

  NEXT_PUBLIC_DEBUG_NAV: z.string().optional(),
  NEXT_PUBLIC_CLOUDFRONT_DOMAIN: z.string().optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
