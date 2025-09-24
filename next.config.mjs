import dotenv from "dotenv";

const mode = process.env.NODE_ENV;

if (mode) {
  dotenv.config({ path: `.env.${mode}` });
}
dotenv.config({ path: `.env` });

// Import compiled CJS schema so we can read the shape (keys) in Node
import schemaMod from "./config/env.schema.runtime.cjs";
const { publicEnvSchema } = schemaMod;

// Build a public runtime object by iterating schema keys
const shape = publicEnvSchema._def.shape();
/** @type {Record<string, any>} */
const publicRuntime = {};
for (const key of Object.keys(shape)) {
  publicRuntime[key] = process.env[key];
}

const parsed = publicEnvSchema.safeParse(publicRuntime);
if (!parsed.success) throw parsed.error;

const publicEnv = parsed.data;

let VERSION = publicEnv.VERSION;
let LOAD_S3;

if (VERSION) {
  LOAD_S3 = true;
} else {
  LOAD_S3 = false;
  try {
    VERSION = require("node:child_process")
      .execSync("git rev-parse HEAD")
      .toString()
      .trim();
  } catch {
    VERSION = "6529seize";
  }
}

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: `default-src 'none'; script-src 'self' 'unsafe-inline' https://dnclu2fna0b2b.cloudfront.net https://www.google-analytics.com https://www.googletagmanager.com/ https://dataplane.rum.us-east-1.amazonaws.com 'unsafe-eval'; connect-src * 'self' blob: ${publicEnv.API_ENDPOINT} https://registry.walletconnect.com/api/v2/wallets wss://*.bridge.walletconnect.org wss://*.walletconnect.com wss://www.walletlink.org/rpc https://explorer-api.walletconnect.com/v3/wallets https://www.googletagmanager.com https://*.google-analytics.com https://cloudflare-eth.com/ https://arweave.net/* https://rpc.walletconnect.com/v1/ https://sts.us-east-1.amazonaws.com https://sts.us-west-2.amazonaws.com; font-src 'self' data: https://fonts.gstatic.com https://dnclu2fna0b2b.cloudfront.net https://cdnjs.cloudflare.com; img-src 'self' data: blob: ipfs: https://artblocks.io https://*.artblocks.io *; media-src 'self' blob: https://*.cloudfront.net https://videos.files.wordpress.com https://arweave.net https://*.arweave.net https://ipfs.io/ipfs/* https://cf-ipfs.com/ipfs/* https://*.twimg.com https://artblocks.io https://*.artblocks.io; frame-src 'self' https://media.generator.seize.io https://media.generator.6529.io https://generator.seize.io https://arweave.net https://*.arweave.net https://ipfs.io/ipfs/* https://cf-ipfs.com/ipfs/* https://nftstorage.link https://*.ipfs.nftstorage.link https://verify.walletconnect.com https://verify.walletconnect.org https://secure.walletconnect.com https://d3lqz0a4bldqgf.cloudfront.net https://www.youtube.com https://www.youtube-nocookie.com https://*.youtube.com https://artblocks.io https://*.artblocks.io; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com/css2 https://dnclu2fna0b2b.cloudfront.net https://cdnjs.cloudflare.com http://cdnjs.cloudflare.com https://cdn.jsdelivr.net; object-src data:;`,
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "same-origin",
  },
  {
    key: "Permissions-Policy",
    value: "geolocation=()",
  },
];
const nextConfig = {
  assetPrefix: LOAD_S3
    ? `https://dnclu2fna0b2b.cloudfront.net/web_build/${VERSION}`
    : "",
  reactStrictMode: false,
  compress: true,
  productionBrowserSourceMaps: true,
  sassOptions: {
    quietDeps: true,
  },
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
    PUBLIC_RUNTIME: JSON.stringify(parsed.data),
    API_ENDPOINT: publicEnv.API_ENDPOINT,
    ALLOWLIST_API_ENDPOINT: publicEnv.ALLOWLIST_API_ENDPOINT,
    BASE_ENDPOINT: publicEnv.BASE_ENDPOINT,
    ALCHEMY_API_KEY: publicEnv.ALCHEMY_API_KEY,
    VERSION,
    NEXTGEN_CHAIN_ID:
      publicEnv.NEXTGEN_CHAIN_ID !== undefined
        ? String(publicEnv.NEXTGEN_CHAIN_ID)
        : undefined,
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
        headers: securityHeaders,
      },
    ];
  },

  webpack: (config, { dev, isServer }) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    config.resolve.alias["@react-native-async-storage/async-storage"] = false;
    config.resolve.alias["react-native"] = false;

    // Fix source maps for Chrome DevTools
    if (!dev && !isServer) {
      config.devtool = "source-map";
    }

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

export default nextConfig;
