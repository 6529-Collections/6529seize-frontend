/** @type {import('next').NextConfig} */

const VERSION = require("child_process")
  .execSync("git rev-parse HEAD")
  .toString()
  .trim();

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.NODE_ENV === "development" ? false : true,
  openAnalyzer: false,
});

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: `default-src 'none'; script-src 'self' 'unsafe-inline' https://d3lqz0a4bldqgf.cloudfront.net https://www.google-analytics.com https://www.googletagmanager.com/ 'unsafe-eval'; connect-src * 'self' ${process.env.API_ENDPOINT} https://registry.walletconnect.com/api/v2/wallets wss://*.bridge.walletconnect.org wss://*.walletconnect.com wss://www.walletlink.org/rpc https://explorer-api.walletconnect.com/v3/wallets https://www.googletagmanager.com https://*.google-analytics.com https://cloudflare-eth.com/ https://arweave.net/* https://rpc.walletconnect.com/v1/; font-src 'self'; img-src 'self' data: blob: *; media-src 'self' https://*.cloudfront.net https://arweave.net https://*.arweave.net https://ipfs.io/ipfs/* https://cf-ipfs.com/ipfs/*; frame-src 'self' https://arweave.net https://*.arweave.net https://ipfs.io/ipfs/* https://cf-ipfs.com/ipfs/*; style-src 'self' 'unsafe-inline' https://d3lqz0a4bldqgf.cloudfront.net https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; object-src data:;`,
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

const LOAD_S3 = process.env.LOAD_S3 === "true";

const nextConfig = {
  assetPrefix: LOAD_S3
    ? `https://d3lqz0a4bldqgf.cloudfront.net/web_build/${VERSION}`
    : "",
  reactStrictMode: false,
  swcMinify: true,
  compress: true,
  productionBrowserSourceMaps: false,
  images: {
    domains: ["6529.io", "arweave.net"],
    unoptimized: true,
    minimumCacheTTL: 86400,
  },
  env: {
    API_ENDPOINT: process.env.API_ENDPOINT,
    ALLOWLIST_API_ENDPOINT: process.env.ALLOWLIST_API_ENDPOINT,
    BASE_ENDPOINT: process.env.BASE_ENDPOINT,
    ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
    VERSION: VERSION,
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
};

module.exports = withBundleAnalyzer(nextConfig);
