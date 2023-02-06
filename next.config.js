/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  compress: true,
  images: {
    domains: ["6529.io", "arweave.net"],
    unoptimized: true,
    minimumCacheTTL: 86400,
  },
  env: {
    ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
    ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
    API_ENDPOINT: process.env.REACT_APP_API_ENDPOINT,
    BASE_ENDPOINT: process.env.REACT_APP_BASE_ENDPOINT,
  },
};

module.exports = nextConfig;
