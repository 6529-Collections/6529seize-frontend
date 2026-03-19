import { createRequire } from "node:module";
import type { NextConfig } from "next";

const require = createRequire(import.meta.url);
const { publicEnvSchema } = require("../../../config/env.schema.runtime.cjs");
const standalonePublicEnv = {
  NODE_ENV: "production",
  API_ENDPOINT: "https://api.6529.io",
  ALLOWLIST_API_ENDPOINT: "https://allowlist-api.6529.io",
  BASE_ENDPOINT: "https://thememes.6529.io",
  IPFS_API_ENDPOINT: "https://api-ipfs.6529.io",
  IPFS_GATEWAY_ENDPOINT: "https://ipfs.6529.io",
  NEXTGEN_CHAIN_ID: 1,
  DROP_FORGE_TESTNET: false,
};
const parsedPublicEnv = publicEnvSchema.safeParse(standalonePublicEnv);
if (!parsedPublicEnv.success) {
  throw parsedPublicEnv.error;
}

const nextConfig: NextConfig = {
  distDir: ".next-static-export",
  output: "export",
  trailingSlash: true,
  reactCompiler: true,
  reactStrictMode: false,
  compress: true,
  poweredByHeader: false,
  transpilePackages: ["react-tweet"],
  experimental: {
    externalDir: true,
  },
  sassOptions: {
    quietDeps: true,
  },
  images: {
    loader: "default",
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "6529.io" },
      { protocol: "https", hostname: "staging.6529.io" },
      { protocol: "https", hostname: "arweave.net" },
      { protocol: "https", hostname: "ar-io.net" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "media.generator.seize.io" },
      { protocol: "https", hostname: "d3lqz0a4bldqgf.cloudfront.net" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.seadn.io" },
      { protocol: "https", hostname: "i2.seadn.io" },
      { protocol: "https", hostname: "i2c.seadn.io" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "ipfs.6529.io" },
      { protocol: "https", hostname: "ipfs.io" },
    ],
    minimumCacheTTL: 86400,
    formats: ["image/avif", "image/webp"],
    qualities: [100, 75],
  },
  logging: {
    incomingRequests: false,
  },
  serverExternalPackages: ["@reown/appkit", "@reown/appkit-adapter-wagmi"],
  env: {
    PUBLIC_RUNTIME: JSON.stringify(parsedPublicEnv.data),
  },
};

export default nextConfig;
