import dotenv from "dotenv";
import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER,
} from "next/constants.js";
import { execSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

function logOnce(label, message) {
  if (!process.env[`__LOG_${label}_ONCE__`]) {
    process.env[`__LOG_${label}_ONCE__`] = "1";
    process.env.__LOG_ENV_ONCE__ = "1";
    console.log(`${label}: ${message}`);
  }
}

function createSecurityHeaders(apiEndpoint = "") {
  return [
    {
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains; preload",
    },
    {
      key: "Content-Security-Policy",
      value: `default-src 'none'; script-src 'self' 'unsafe-inline' https://dnclu2fna0b2b.cloudfront.net https://www.google-analytics.com https://www.googletagmanager.com/ https://dataplane.rum.us-east-1.amazonaws.com 'unsafe-eval'; connect-src * 'self' blob: ${apiEndpoint} https://registry.walletconnect.com/api/v2/wallets wss://*.bridge.walletconnect.org wss://*.walletconnect.com wss://www.walletlink.org/rpc https://explorer-api.walletconnect.com/v3/wallets https://www.googletagmanager.com https://*.google-analytics.com https://cloudflare-eth.com/ https://arweave.net/* https://rpc.walletconnect.com/v1/ https://sts.us-east-1.amazonaws.com https://sts.us-west-2.amazonaws.com; font-src 'self' data: https://fonts.gstatic.com https://dnclu2fna0b2b.cloudfront.net https://cdnjs.cloudflare.com; img-src 'self' data: blob: ipfs: https://artblocks.io https://*.artblocks.io *; media-src 'self' blob: https://*.cloudfront.net https://videos.files.wordpress.com https://arweave.net https://*.arweave.net https://ipfs.io/ipfs/* https://cf-ipfs.com/ipfs/* https://*.twimg.com https://artblocks.io https://*.artblocks.io; frame-src 'self' https://media.generator.seize.io https://media.generator.6529.io https://generator.seize.io https://arweave.net https://*.arweave.net https://ipfs.io/ipfs/* https://cf-ipfs.com/ipfs/* https://nftstorage.link https://*.ipfs.nftstorage.link https://verify.walletconnect.com https://verify.walletconnect.org https://secure.walletconnect.com https://d3lqz0a4bldqgf.cloudfront.net https://www.youtube.com https://www.youtube-nocookie.com https://*.youtube.com https://artblocks.io https://*.artblocks.io; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com/css2 https://dnclu2fna0b2b.cloudfront.net https://cdnjs.cloudflare.com http://cdnjs.cloudflare.com https://cdn.jsdelivr.net; object-src data:;`,
    },
    { key: "X-Frame-Options", value: "SAMEORIGIN" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "same-origin" },
    { key: "Permissions-Policy", value: "geolocation=()" },
  ];
}

const nextConfigFactory = (phase) => {
  const mode = process.env.NODE_ENV;
  logOnce("NODE_ENV", mode);

  // Build & Dev phases: validate from process.env and bake config
  if (phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_BUILD) {
    if (mode) dotenv.config({ path: `.env.${mode}` });
    dotenv.config({ path: `.env` });

    const schemaMod = require("./config/env.schema.runtime.cjs");
    const { publicEnvSchema } = schemaMod;

    let VERSION = process.env.VERSION;
    if (VERSION) {
      logOnce("VERSION (explicit)", VERSION);
    } else {
      try {
        VERSION = execSync("git rev-parse HEAD").toString().trim();
        logOnce("VERSION (from git HEAD)", VERSION);
      } catch {
        VERSION = "6529seize";
        logOnce("VERSION (default)", VERSION);
      }
    }

    // Single source of truth for asset hosting: ASSETS_FROM_S3 only
    const ASSETS_FROM_S3 =
      (process.env.ASSETS_FROM_S3 ?? "false").toString().toLowerCase() ===
      "true";
    logOnce("ASSETS_FROM_S3", ASSETS_FROM_S3);

    // Build public runtime from schema keys
    const shape = publicEnvSchema._def.shape();
    /** @type {Record<string, any>} */
    const publicRuntime = {};
    for (const key of Object.keys(shape)) {
      publicRuntime[key] = process.env[key];
    }
    publicRuntime.VERSION = VERSION;

    const parsed = publicEnvSchema.safeParse(publicRuntime);
    if (!parsed.success) throw parsed.error; // FAIL-FAST at build

    const publicEnv = parsed.data;

    const nextConfig = {
      assetPrefix: ASSETS_FROM_S3
        ? `https://dnclu2fna0b2b.cloudfront.net/web_build/${VERSION}`
        : "",
      reactStrictMode: false,
      compress: true,
      productionBrowserSourceMaps: true,
      sassOptions: { quietDeps: true },
      experimental: {
        webpackMemoryOptimizations: true,
        webpackBuildWorker: true,
      },
      images: {
        loader: "default",
        domains: [
          "6529.io",
          "arweave.net",
          "localhost",
          "media.generator.seize.io",
          "d3lqz0a4bldqgf.cloudfront.net",
        ],
        minimumCacheTTL: 86400,
      },
      transpilePackages: ["react-tweet"],
      env: {
        PUBLIC_RUNTIME: JSON.stringify(publicEnv),
        API_ENDPOINT: publicEnv.API_ENDPOINT,
        ALLOWLIST_API_ENDPOINT: publicEnv.ALLOWLIST_API_ENDPOINT,
        BASE_ENDPOINT: publicEnv.BASE_ENDPOINT,
        ALCHEMY_API_KEY: publicEnv.ALCHEMY_API_KEY,
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
      },
      async generateBuildId() {
        return VERSION;
      },
      poweredByHeader: false,
      async headers() {
        return [
          {
            source: "/:path*",
            headers: createSecurityHeaders(publicEnv.API_ENDPOINT),
          },
        ];
      },
      webpack: (config, { dev, isServer }) => {
        config.resolve.alias.canvas = false;
        config.resolve.alias.encoding = false;
        config.resolve.alias[
          "@react-native-async-storage/async-storage"
        ] = false;
        config.resolve.alias["react-native"] = false;
        if (!dev && !isServer) config.devtool = "source-map";
        return config;
      },
      turbopack: {
        resolveAlias: {
          canvas: "./stubs/empty.js",
          encoding: "./stubs/empty.js",
          "@react-native-async-storage/async-storage": "./stubs/empty.js",
          "react-native": "./stubs/empty.js",
        },
      },
    };

    return nextConfig;
  }

  // Production server phase: validate baked PUBLIC_RUNTIME and use BUILD_ID
  if (phase === PHASE_PRODUCTION_SERVER) {
    const buildId = fs.readFileSync(".next/BUILD_ID", "utf8").trim();
    logOnce("VERSION (from BUILD_ID)", buildId);
    const VERSION = buildId;

    // Validate baked config (fail-fast). This guarantees runtime matches build.
    const schemaMod = require("./config/env.schema.runtime.cjs");
    const { publicEnvSchema } = schemaMod;
    const baked = process.env.PUBLIC_RUNTIME
      ? JSON.parse(process.env.PUBLIC_RUNTIME)
      : {};
    const parsed = publicEnvSchema.safeParse({ ...baked, VERSION });
    if (!parsed.success) throw parsed.error; // FAIL-FAST at runtime
    const publicEnv = parsed.data;

    const ASSETS_FROM_S3 =
      (process.env.ASSETS_FROM_S3 ?? "false").toString().toLowerCase() ===
      "true";
    logOnce("ASSETS_FROM_S3", ASSETS_FROM_S3);

    const nextConfig = {
      assetPrefix: ASSETS_FROM_S3
        ? `https://dnclu2fna0b2b.cloudfront.net/web_build/${VERSION}`
        : "",
      reactStrictMode: false,
      compress: true,
      productionBrowserSourceMaps: true,
      sassOptions: { quietDeps: true },
      experimental: {
        webpackMemoryOptimizations: true,
        webpackBuildWorker: true,
      },
      images: {
        loader: "default",
        domains: [
          "6529.io",
          "arweave.net",
          "localhost",
          "media.generator.seize.io",
          "d3lqz0a4bldqgf.cloudfront.net",
        ],
        minimumCacheTTL: 86400,
      },
      transpilePackages: ["react-tweet"],
      poweredByHeader: false,
      async headers() {
        return [
          {
            source: "/:path*",
            headers: createSecurityHeaders(publicEnv.API_ENDPOINT),
          },
        ];
      },
      webpack: (config, { dev, isServer }) => {
        config.resolve.alias.canvas = false;
        config.resolve.alias.encoding = false;
        config.resolve.alias[
          "@react-native-async-storage/async-storage"
        ] = false;
        config.resolve.alias["react-native"] = false;
        if (!dev && !isServer) config.devtool = "source-map";
        return config;
      },
      turbopack: {
        resolveAlias: {
          canvas: "./stubs/empty.js",
          encoding: "./stubs/empty.js",
          "@react-native-async-storage/async-storage": "./stubs/empty.js",
          "react-native": "./stubs/empty.js",
        },
      },
    };

    return nextConfig;
  }

  // Fallback (shouldn’t happen)
  return {
    reactStrictMode: false,
    compress: true,
    poweredByHeader: false,
  };
};

export default nextConfigFactory;
