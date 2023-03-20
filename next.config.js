/** @type {import('next').NextConfig} */

const VERSION = require("child_process")
  .execSync("git rev-parse HEAD")
  .toString()
  .trim();

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.NODE_ENV == "development" ? false : true,
  openAnalyzer: false,
});

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: `default-src 'none'; script-src 'self' 'unsafe-inline' https://www.google-analytics.com https://www.googletagmanager.com/ 'unsafe-eval'; connect-src 'self' ${process.env.REACT_APP_API_ENDPOINT} https://www.googletagmanager.com https://*.google-analytics.com; font-src 'self'; img-src 'self' data: https://d3lqz0a4bldqgf.cloudfront.net https://arweave.net https://*.arweave.net; media-src 'self' https://d3lqz0a4bldqgf.cloudfront.net https://arweave.net https://*.arweave.net; frame-src 'self' https://arweave.net https://*.arweave.net; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net;`,
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
    ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
    API_ENDPOINT: process.env.REACT_APP_API_ENDPOINT,
    BASE_ENDPOINT: process.env.REACT_APP_BASE_ENDPOINT,
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
