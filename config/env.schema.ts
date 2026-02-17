import { z } from "zod";
import { validateBaseEndpoint } from "./env.schema.validation";

/**
 * Public runtime env — safe for client & server.
 * Only include vars that are either:
 *  - prefixed with NEXT_PUBLIC_ (Next exposes automatically), OR
 *  - explicitly exposed in next.config.mjs -> export default { env: { ... } }
 */
export const publicEnvSchema = z.object({
  /**
   * ────────────────
   * CORE / ENVIRONMENT
   * ────────────────
   */
  NODE_ENV: z.enum(["development", "production", "test", "local"]).optional(),
  NEXT_RUNTIME: z.string().optional(),
  VERSION: z.string().optional(),
  ASSETS_FROM_S3: z.enum(["true", "false"]).optional(),

  /**
   * ────────────────
   * API ENDPOINTS
   *   • REQUIRED
   *   • OPTIONAL
   * ────────────────
   */
  // REQUIRED
  ALLOWLIST_API_ENDPOINT: z.string().url(),
  API_ENDPOINT: z.string().url(),
  BASE_ENDPOINT: z
    .string({
      required_error:
        "BASE_ENDPOINT environment variable is required. Please set it in your environment or .env.local file.",
    })
    .url("BASE_ENDPOINT must be a valid URL")
    .superRefine(validateBaseEndpoint),
  // OPTIONAL
  WS_ENDPOINT: z.string().url("WS_ENDPOINT must be a valid URL").optional(),

  /**
   * ────────────────
   * API KEYS / CREDENTIALS
   *   • OPTIONAL
   * ────────────────
   */
  STAGING_API_KEY: z.string().optional(),
  TENOR_API_KEY: z.string().optional(),

  /**
   * ────────────────
   * IPFS CONFIG
   *   • REQUIRED
   *   • OPTIONAL
   * ────────────────
   */
  // REQUIRED
  IPFS_API_ENDPOINT: z.string().url("IPFS_API_ENDPOINT must be a valid URL"),
  IPFS_GATEWAY_ENDPOINT: z
    .string()
    .url("IPFS_GATEWAY_ENDPOINT must be a valid URL"),
  // OPTIONAL
  IPFS_MFS_PATH: z.string().optional(),

  /**
   * ────────────────
   * AUTH / DEV MODE (all optional)
   * ────────────────
   */
  CORE_SCHEME: z.string().optional(),
  DEV_MODE_AUTH_JWT: z.string().optional(),
  DEV_MODE_MEMES_WAVE_ID: z.string().optional(),
  DEV_MODE_CURATION_WAVE_ID: z.string().optional(),
  DEV_MODE_WALLET_ADDRESS: z.string().optional(),
  MOBILE_APP_SCHEME: z.string().optional(),
  NEXTGEN_CHAIN_ID: z.coerce.number().int().positive().optional(),
  USE_DEV_AUTH: z.string().optional(),

  /**
   * ────────────────
   * FARCASTER CONFIG
   * ────────────────
   */
  FARCASTER_WARPCAST_API_BASE: z
    .string()
    .url("FARCASTER_WARPCAST_API_BASE must be a valid URL")
    .optional(),
  FARCASTER_WARPCAST_API_KEY: z.string().optional(),

  /**
   * ────────────────
   * FEATURES / FLAGS (all optional)
   * ────────────────
   */
  ENABLE_SECURITY_LOGGING: z.string().optional(),
  DROP_CONTROL_TESTNET: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  FEATURE_AB_CARD: z.string().optional(),
  NEXT_PUBLIC_CLOUDFRONT_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_DEBUG_NAV: z.string().optional(),
  NEXT_PUBLIC_FEATURE_AB_CARD: z.string().optional(),
  NEXT_PUBLIC_VITE_FEATURE_AB_CARD: z.string().optional(),
  VITE_FEATURE_AB_CARD: z.string().optional(),

  /**
   * ────────────────
   * CACHE / PERFORMANCE (all optional)
   * ────────────────
   */
  PEPE_CACHE_MAX_ITEMS: z.string().optional(),
  PEPE_CACHE_TTL_MINUTES: z.string().optional(),

  /**
   * ────────────────
   * MONITORING / ANALYTICS (all optional)
   * ────────────────
   */
  AWS_RUM_APP_ID: z.string().optional(),
  AWS_RUM_REGION: z.string().optional(),
  AWS_RUM_SAMPLE_RATE: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  SENTRY_REPLAY_ENABLED: z.enum(["true", "false"]).optional(),

  /**
   * ────────────────
   * PORTS / RUNTIME (all optional)
   * ────────────────
   */
  PORT: z.coerce.number().int().positive().optional(),
  PORT_SEARCH_LIMIT: z.coerce.number().int().positive().optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
