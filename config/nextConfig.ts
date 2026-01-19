import { createSecurityHeaders } from "./securityHeaders";
import { PublicEnv } from "./env.schema";
import { NextConfig } from "next";

export function sharedConfig(
  publicEnv: PublicEnv,
  assetPrefix: string
): NextConfig {
  return {
    assetPrefix,
    reactCompiler: true,
    reactStrictMode: false,
    compress: true,
    productionBrowserSourceMaps: true,
    sassOptions: { quietDeps: true },
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
          headers: createSecurityHeaders(publicEnv["API_ENDPOINT"]),
        },
      ];
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
