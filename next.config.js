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

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.NODE_ENV !== "development",
  openAnalyzer: false,
});

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: `default-src 'none'; script-src 'self' 'unsafe-inline' https://dnclu2fna0b2b.cloudfront.net https://www.google-analytics.com https://www.googletagmanager.com/ 'unsafe-eval'; connect-src * 'self' blob: ${process.env.API_ENDPOINT} https://registry.walletconnect.com/api/v2/wallets wss://*.bridge.walletconnect.org wss://*.walletconnect.com wss://www.walletlink.org/rpc https://explorer-api.walletconnect.com/v3/wallets https://www.googletagmanager.com https://*.google-analytics.com https://cloudflare-eth.com/ https://arweave.net/* https://rpc.walletconnect.com/v1/; font-src 'self' data: https://fonts.gstatic.com https://dnclu2fna0b2b.cloudfront.net; img-src 'self' data: blob: *; media-src 'self' https://*.cloudfront.net https://arweave.net https://*.arweave.net https://ipfs.io/ipfs/* https://cf-ipfs.com/ipfs/*; frame-src 'self' https://media.generator.seize.io https://generator.seize.io https://arweave.net https://*.arweave.net https://ipfs.io/ipfs/* https://cf-ipfs.com/ipfs/* https://nftstorage.link https://nftstorage.link https://*.ipfs.nftstorage.link https://verify.walletconnect.com https://verify.walletconnect.org https://secure.walletconnect.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com/css2 https://dnclu2fna0b2b.cloudfront.net https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; object-src data:;`,
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
  swcMinify: true,
  compress: true,
  productionBrowserSourceMaps: false,
  images: {
    domains: ["6529.io", "arweave.net", "localhost"],
    unoptimized: true,
    minimumCacheTTL: 86400,
  },
  env: {
    API_ENDPOINT: process.env.API_ENDPOINT,
    ALLOWLIST_API_ENDPOINT: process.env.ALLOWLIST_API_ENDPOINT,
    BASE_ENDPOINT: process.env.BASE_ENDPOINT,
    ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
    VERSION: VERSION,
    NEXTGEN_CHAIN_ID: process.env.NEXTGEN_CHAIN_ID,
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

  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
