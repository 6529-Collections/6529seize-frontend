import { withSentryConfig } from "@sentry/nextjs";
import dotenv from "dotenv";
import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER,
} from "next/constants.js";

import fs from "node:fs";

import { createRequire } from "node:module";

import { NextConfig } from "next";
import { computeVersionFromEnvOrGit, logOnceConfig } from "@/config/version";
import {
  loadAssetsFlagAtRuntime,
  resolveAssetsFlagFromEnv,
} from "@/config/assets";
import {
  loadBakedRuntimeConfig,
  persistBakedArtifacts,
} from "@/config/runtimeConfig";
import { sharedConfig } from "@/config/nextConfig";
const require = createRequire(import.meta.url);
const sentryEnabled = Boolean(process.env["SENTRY_DSN"]);

// ───────
// Helpers
// ───────
const schemaMod = require("./config/env.schema.runtime.cjs");
const { publicEnvSchema } = schemaMod;

const nextConfigFactory = (phase: string): NextConfig => {
  const mode = process.env.NODE_ENV;
  logOnceConfig("NODE_ENV", mode);

  // Build & Dev phases
  if (phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_BUILD) {
    if (mode) dotenv.config({ path: `.env.${mode}` });
    dotenv.config({ path: `.env` });

    const VERSION = computeVersionFromEnvOrGit();
    const ASSETS_FROM_S3 = resolveAssetsFlagFromEnv();
    logOnceConfig("ASSETS_FROM_S3", ASSETS_FROM_S3.toString());

    // Prepare and validate public runtime from process.env
    const shape = publicEnvSchema._def.shape();
    const publicRuntime: Record<string, string | undefined> = {};
    for (const key of Object.keys(shape)) publicRuntime[key] = process.env[key];
    publicRuntime["VERSION"] = VERSION;
    publicRuntime["ASSETS_FROM_S3"] = String(ASSETS_FROM_S3);

    const parsed = publicEnvSchema.safeParse(publicRuntime);
    if (!parsed.success) throw parsed.error; // FAIL-FAST at build
    const publicEnv = parsed.data;

    // Persist baked artifacts for runtime
    persistBakedArtifacts(publicEnv, ASSETS_FROM_S3);

    // Compose config
    const assetPrefix = ASSETS_FROM_S3
      ? `https://dnclu2fna0b2b.cloudfront.net/web_build/${VERSION}`
      : "";

    return {
      ...sharedConfig(publicEnv, assetPrefix),
      env: {
        PUBLIC_RUNTIME: JSON.stringify(publicEnv),
        API_ENDPOINT: publicEnv.API_ENDPOINT,
        ALLOWLIST_API_ENDPOINT: publicEnv.ALLOWLIST_API_ENDPOINT,
        BASE_ENDPOINT: publicEnv.BASE_ENDPOINT,
        VERSION,
        ASSETS_FROM_S3: String(ASSETS_FROM_S3),
        NEXTGEN_CHAIN_ID:
          publicEnv.NEXTGEN_CHAIN_ID === undefined
            ? undefined
            : String(publicEnv.NEXTGEN_CHAIN_ID),
        MOBILE_APP_SCHEME: publicEnv.MOBILE_APP_SCHEME,
        CORE_SCHEME: publicEnv.CORE_SCHEME,
        IPFS_API_ENDPOINT: publicEnv.IPFS_API_ENDPOINT,
        IPFS_GATEWAY_ENDPOINT: publicEnv.IPFS_GATEWAY_ENDPOINT,
        IPFS_MFS_PATH: publicEnv.IPFS_MFS_PATH,
        TENOR_API_KEY: publicEnv.TENOR_API_KEY,
        WS_ENDPOINT: publicEnv.WS_ENDPOINT,
        DEV_MODE_MEMES_WAVE_ID: publicEnv.DEV_MODE_MEMES_WAVE_ID,
        DEV_MODE_WALLET_ADDRESS: publicEnv.DEV_MODE_WALLET_ADDRESS,
        DEV_MODE_AUTH_JWT: publicEnv.DEV_MODE_AUTH_JWT,
        USE_DEV_AUTH: publicEnv.USE_DEV_AUTH,
        STAGING_API_KEY: publicEnv.STAGING_API_KEY,
        AWS_RUM_APP_ID: publicEnv.AWS_RUM_APP_ID,
        AWS_RUM_REGION: publicEnv.AWS_RUM_REGION,
        AWS_RUM_SAMPLE_RATE: publicEnv.AWS_RUM_SAMPLE_RATE,
        ENABLE_SECURITY_LOGGING: publicEnv.ENABLE_SECURITY_LOGGING,
        VITE_FEATURE_AB_CARD: publicEnv.VITE_FEATURE_AB_CARD,
        FEATURE_AB_CARD: publicEnv.FEATURE_AB_CARD,
        PEPE_CACHE_TTL_MINUTES: publicEnv.PEPE_CACHE_TTL_MINUTES,
        PEPE_CACHE_MAX_ITEMS: publicEnv.PEPE_CACHE_MAX_ITEMS,
        FARCASTER_WARPCAST_API_BASE: publicEnv.FARCASTER_WARPCAST_API_BASE,
        FARCASTER_WARPCAST_API_KEY: publicEnv.FARCASTER_WARPCAST_API_KEY,
      },
      async generateBuildId() {
        return VERSION;
      },
    };
  }

  // Production server phase
  if (phase === PHASE_PRODUCTION_SERVER) {
    const VERSION = fs.readFileSync(".next/BUILD_ID", "utf8").trim();
    logOnceConfig("VERSION (from BUILD_ID)", VERSION);

    const publicEnv = loadBakedRuntimeConfig(VERSION); // FAIL-FAST inside
    const ASSETS_FROM_S3 = loadAssetsFlagAtRuntime();
    logOnceConfig("ASSETS_FROM_S3", ASSETS_FROM_S3.toString());

    const assetPrefix = ASSETS_FROM_S3
      ? `https://dnclu2fna0b2b.cloudfront.net/web_build/${VERSION}`
      : "";

    return sharedConfig(publicEnv, assetPrefix);
  }

  // Fallback (shouldn’t happen)
  return { reactStrictMode: false, compress: true, poweredByHeader: false };
};

const sentryWrappedConfig = withSentryConfig(nextConfigFactory, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "seize-ff",

  project: "6529-frontend",

  // Only print logs for uploading source maps in CI
  silent: !process.env["CI"],

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});

export default (phase: string): NextConfig => {
  if (!sentryEnabled) {
    return nextConfigFactory(phase);
  }
  return sentryWrappedConfig(phase);
};
