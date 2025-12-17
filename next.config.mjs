import {withSentryConfig} from "@sentry/nextjs";
import dotenv from "dotenv";
import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER,
} from "next/constants.js";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const sentryEnabled = Boolean(process.env.SENTRY_DSN);

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
      value: `default-src 'none'; script-src 'self' 'unsafe-inline' https://dnclu2fna0b2b.cloudfront.net https://www.google-analytics.com https://www.googletagmanager.com/ https://dataplane.rum.us-east-1.amazonaws.com 'unsafe-eval'; connect-src * 'self' blob: ${apiEndpoint} https://registry.walletconnect.com/api/v2/wallets wss://*.bridge.walletconnect.org wss://*.walletconnect.com wss://www.walletlink.org/rpc https://explorer-api.walletconnect.com/v3/wallets https://www.googletagmanager.com https://*.google-analytics.com https://cloudflare-eth.com/ https://arweave.net/* https://rpc.walletconnect.com/v1/ https://sts.us-east-1.amazonaws.com https://sts.us-west-2.amazonaws.com; font-src 'self' data: https://fonts.gstatic.com https://fonts.reown.com https://dnclu2fna0b2b.cloudfront.net https://cdnjs.cloudflare.com; img-src 'self' data: blob: ipfs: https://artblocks.io https://*.artblocks.io *; media-src 'self' blob: https://*.cloudfront.net https://videos.files.wordpress.com https://arweave.net https://*.arweave.net https://cf-ipfs.com/ipfs/* https://*.twimg.com https://artblocks.io https://*.artblocks.io; frame-src 'self' https://ipfs.io https://ipfs.io/ipfs/ https://cf-ipfs.com https://cf-ipfs.com/ipfs/ https://media.generator.seize.io https://media.generator.6529.io https://generator.seize.io https://arweave.net https://*.arweave.net https://nftstorage.link https://*.ipfs.nftstorage.link https://verify.walletconnect.com https://verify.walletconnect.org https://secure.walletconnect.com https://d3lqz0a4bldqgf.cloudfront.net https://www.youtube.com https://www.youtube-nocookie.com https://*.youtube.com https://artblocks.io https://*.artblocks.io https://docs.google.com https://drive.google.com https://*.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com/css2 https://dnclu2fna0b2b.cloudfront.net https://cdnjs.cloudflare.com http://cdnjs.cloudflare.com https://cdn.jsdelivr.net; object-src data:;`,
    },
    { key: "X-Frame-Options", value: "SAMEORIGIN" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "same-origin" },
    {
      key: "Permissions-Policy",
      value: [
        "accelerometer=()",
        "ambient-light-sensor=()",
        "autoplay=()",
        "battery=()",
        "camera=()",
        "cross-origin-isolated=()",
        "display-capture=()",
        "document-domain=()",
        "encrypted-media=()",
        "execution-while-not-rendered=()",
        "execution-while-out-of-viewport=()",
        "fullscreen=()",
        "geolocation=()",
        "gyroscope=()",
        "keyboard-map=()",
        "magnetometer=()",
        "microphone=()",
        "midi=()",
        "payment=()",
        "picture-in-picture=()",
        "publickey-credentials-get=()",
        "screen-wake-lock=()",
        "sync-xhr=()",
        "usb=()",
        "web-share=()",
        "xr-spatial-tracking=()",
      ].join(", "),
    },
  ];
}

// ───────
// Helpers
// ───────
const schemaMod = require("./config/env.schema.runtime.cjs");
const { publicEnvSchema } = schemaMod;

function computeVersionFromEnvOrGit() {
  let VERSION = process.env.VERSION;
  if (VERSION) {
    logOnce("VERSION (explicit)", VERSION);
    return VERSION;
  }
  try {
    VERSION = execSync("git rev-parse HEAD").toString().trim();
    logOnce("VERSION (from git HEAD)", VERSION);
  } catch {
    VERSION = "6529seize";
    logOnce("VERSION (default)", VERSION);
  }
  return VERSION;
}

function resolveAssetsFlagFromEnv() {
  return (
    (process.env.ASSETS_FROM_S3 ?? "false").toString().toLowerCase() === "true"
  );
}

function persistBakedArtifacts(publicEnv, ASSETS_FROM_S3) {
  try {
    fs.mkdirSync(".next", { recursive: true });
    fs.writeFileSync(
      ".next/PUBLIC_RUNTIME.json",
      JSON.stringify(publicEnv),
      "utf8"
    );
    fs.writeFileSync(
      ".next/ASSETS_FROM_S3",
      ASSETS_FROM_S3 ? "true" : "false",
      "utf8"
    );
  } catch {}
}

function loadBakedRuntimeConfig(VERSION) {
  let baked = {};
  if (process.env.PUBLIC_RUNTIME) {
    baked = JSON.parse(process.env.PUBLIC_RUNTIME);
  } else if (fs.existsSync(".next/PUBLIC_RUNTIME.json")) {
    baked = JSON.parse(fs.readFileSync(".next/PUBLIC_RUNTIME.json", "utf8"));
  }
  const parsed = publicEnvSchema.safeParse({ ...baked, VERSION });
  if (!parsed.success) throw parsed.error; // FAIL-FAST
  return parsed.data;
}

function loadAssetsFlagAtRuntime() {
  let flag = (process.env.ASSETS_FROM_S3 ?? "").toString().toLowerCase();
  if (!flag && fs.existsSync(".next/ASSETS_FROM_S3")) {
    flag = fs.readFileSync(".next/ASSETS_FROM_S3", "utf8").trim().toLowerCase();
  }
  return flag === "true";
}

function sharedConfig(publicEnv, assetPrefix) {
  return {
    assetPrefix,
    reactCompiler: true,
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
      remotePatterns: [
        { protocol: "https", hostname: "6529.io" },
        { protocol: "https", hostname: "staging.6529.io" },
        { protocol: "https", hostname: "arweave.net" },
        { protocol: "http", hostname: "localhost" },
        { protocol: "https", hostname: "media.generator.seize.io" },
        { protocol: "https", hostname: "d3lqz0a4bldqgf.cloudfront.net" },
        { protocol: "https", hostname: "i.seadn.io" },
        { protocol: "https", hostname: "i2.seadn.io" },
        { protocol: "https", hostname: "i2c.seadn.io" },
        { protocol: "https", hostname: "res.cloudinary.com" },
        { protocol: "https", hostname: "ipfs.6529.io" },
        { protocol: "https", hostname: "ipfs.io" },
      ],
      minimumCacheTTL: 86400,
      formats: ["image/avif", "image/webp"],
      qualities: [100, 75],
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
      config.resolve.alias["@react-native-async-storage/async-storage"] = false;
      config.resolve.alias["react-native"] = false;
      config.resolve.alias["idb-keyval"] = path.resolve(
        process.cwd(),
        "lib/storage/idb-keyval.ts"
      );
      if (!dev && !isServer) config.devtool = "source-map";
      config.optimization.minimize = false;
      return config;
    },
    turbopack: {
      resolveAlias: {
        canvas: "./stubs/empty.js",
        encoding: "./stubs/empty.js",
        "@react-native-async-storage/async-storage": "./stubs/empty.js",
        "react-native": "./stubs/empty.js",
        "idb-keyval": "./lib/storage/idb-keyval.ts",
      },
    },
    serverExternalPackages: ["@reown/appkit", "@reown/appkit-adapter-wagmi"],
  };
}

const nextConfigFactory = (phase) => {
  const mode = process.env.NODE_ENV;
  logOnce("NODE_ENV", mode);

  // Build & Dev phases
  if (phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_BUILD) {
    if (mode) dotenv.config({ path: `.env.${mode}` });
    dotenv.config({ path: `.env` });

    const VERSION = computeVersionFromEnvOrGit();
    const ASSETS_FROM_S3 = resolveAssetsFlagFromEnv();
    logOnce("ASSETS_FROM_S3", ASSETS_FROM_S3);

    // Prepare and validate public runtime from process.env
    const shape = publicEnvSchema._def.shape();
    const publicRuntime = {};
    for (const key of Object.keys(shape)) publicRuntime[key] = process.env[key];
    publicRuntime.VERSION = VERSION;
    publicRuntime.ASSETS_FROM_S3 = String(ASSETS_FROM_S3);

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
    logOnce("VERSION (from BUILD_ID)", VERSION);

    const publicEnv = loadBakedRuntimeConfig(VERSION); // FAIL-FAST inside
    const ASSETS_FROM_S3 = loadAssetsFlagAtRuntime();
    logOnce("ASSETS_FROM_S3", ASSETS_FROM_S3);

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
  silent: !process.env.CI,

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

export default (phase, ...rest) => {
  if (!sentryEnabled) {
    return nextConfigFactory(phase);
  }
  return sentryWrappedConfig(phase, ...rest);
};
