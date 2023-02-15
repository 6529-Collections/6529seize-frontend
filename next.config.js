/** @type {import('next').NextConfig} */

const VERSION = require("child_process")
  .execSync("git rev-parse HEAD")
  .toString()
  .trim();

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: true,
  openAnalyzer: false,
});

const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  compress: true,
  productionBrowserSourceMaps: true,
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
};

module.exports = withBundleAnalyzer(nextConfig);
