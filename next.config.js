/** @type {import('next').NextConfig} */

let VERSION = process.env.VERSION;
let LOAD_S3;

if (VERSION) {
  LOAD_S3 = true;
} else {
  LOAD_S3 = false;
  try {
    VERSION = require("child_process")
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
    value: `default-src 'none'; script-src 'self' 'unsafe-inline' https://dnclu2fna0b2b.cloudfront.net https://www.google-analytics.com https://www.googletagmanager.com/ https://dataplane.rum.eu-west-1.amazonaws.com 'unsafe-eval'; connect-src * 'self' blob: ${process.env.API_ENDPOINT} https://registry.walletconnect.com/api/v2/wallets wss://*.bridge.walletconnect.org wss://*.walletconnect.com wss://www.walletlink.org/rpc https://explorer-api.walletconnect.com/v3/wallets https://www.googletagmanager.com https://*.google-analytics.com https://cloudflare-eth.com/ https://arweave.net/* https://rpc.walletconnect.com/v1/ https://dataplane.rum.us-west-1.amazonaws.com https://dataplane.rum.us-west-2.amazonaws.com https://sts.us-east-1.amazonaws.com https://sts.us-west-2.amazonaws.com; font-src 'self' data: https://fonts.gstatic.com https://dnclu2fna0b2b.cloudfront.net https://cdnjs.cloudflare.com; img-src 'self' data: blob: *; media-src 'self' blob: https://*.cloudfront.net https://videos.files.wordpress.com https://arweave.net https://*.arweave.net https://ipfs.io/ipfs/* https://cf-ipfs.com/ipfs/* https://*.twimg.com; frame-src 'self' https://media.generator.seize.io https://media.generator.6529.io https://generator.seize.io https://arweave.net https://*.arweave.net https://ipfs.io/ipfs/* https://cf-ipfs.com/ipfs/* https://nftstorage.link https://*.ipfs.nftstorage.link https://verify.walletconnect.com https://verify.walletconnect.org https://secure.walletconnect.com https://d3lqz0a4bldqgf.cloudfront.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com/css2 https://dnclu2fna0b2b.cloudfront.net https://cdnjs.cloudflare.com http://cdnjs.cloudflare.com https://cdn.jsdelivr.net; object-src data:;`,
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
  productionBrowserSourceMaps: false,
  sassOptions: {
    quietDeps: true,
  },
  experimental: {
    webpackMemoryOptimizations: true,
    webpackBuildWorker: true,
  },
  images: {
    domains: ["6529.io", "arweave.net", "localhost"],
    unoptimized: true,
    minimumCacheTTL: 86400,
  },
  transpilePackages: ["react-tweet"],
  env: {
    API_ENDPOINT: process.env.API_ENDPOINT,
    ALLOWLIST_API_ENDPOINT: process.env.ALLOWLIST_API_ENDPOINT,
    BASE_ENDPOINT: process.env.BASE_ENDPOINT,
    ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
    VERSION: VERSION,
    NEXTGEN_CHAIN_ID: process.env.NEXTGEN_CHAIN_ID,
    MOBILE_APP_SCHEME: process.env.MOBILE_APP_SCHEME,
    CORE_SCHEME: process.env.CORE_SCHEME,
    IPFS_API_ENDPOINT: process.env.IPFS_API_ENDPOINT,
    IPFS_GATEWAY_ENDPOINT: process.env.IPFS_GATEWAY_ENDPOINT,
    IPFS_MFS_PATH: process.env.IPFS_MFS_PATH,
    TENOR_API_KEY: process.env.TENOR_API_KEY,
    WS_ENDPOINT: process.env.WS_ENDPOINT,
    DEV_MODE_MEMES_WAVE_ID: process.env.DEV_MODE_MEMES_WAVE_ID,
    DEV_MODE_WALLET_ADDRESS: process.env.DEV_MODE_WALLET_ADDRESS,
    DEV_MODE_AUTH_JWT: process.env.DEV_MODE_AUTH_JWT,
    USE_DEV_AUTH: process.env.USE_DEV_AUTH,
    STAGING_API_KEY: process.env.STAGING_API_KEY,
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
    
    // Validate required environment variables at build time
    if (!dev && !isServer) {
      const requiredEnvVars = [
        'BASE_ENDPOINT',
      ];
      
      const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
      
      if (missingEnvVars.length > 0) {
        throw new Error(
          `Missing required environment variables for production build: ${missingEnvVars.join(', ')}. ` +
          `Please set these in your environment or .env.local file. See .env.example for reference.`
        );
      }
      
      // Validate BASE_ENDPOINT format
      const baseEndpoint = process.env.BASE_ENDPOINT;
      try {
        const url = new URL(baseEndpoint);
        if (url.protocol !== 'https:' && !baseEndpoint.includes('localhost') && !baseEndpoint.includes('127.0.0.1')) {
          throw new Error(`BASE_ENDPOINT must use HTTPS in production: ${baseEndpoint}`);
        }
      } catch (error) {
        if (error instanceof TypeError) {
          throw new Error(`BASE_ENDPOINT is not a valid URL: ${baseEndpoint}`);
        }
        throw error;
      }
      
      console.log('[Build] Environment variables validated successfully');
    }
    
    return config;
  },
  turbopack: {
    resolveAlias: {
      canvas: "./stubs/empty.js",
      encoding: "./stubs/empty.js",
    },
  },
};

module.exports = nextConfig;
