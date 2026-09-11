import { createSecurityHeaders } from "./securityHeaders";
import { PublicEnv } from "./env.schema";
import { NextConfig } from "next";
import { ARWEAVE_GATEWAY_REMOTE_PATTERN_HOSTNAMES } from "../lib/media/arweave-gateways";
import { getMediaResolverHostname } from "../lib/media/decentralized-media";
import { IPFS_GATEWAY_REMOTE_PATTERN_HOSTNAMES } from "../lib/media/ipfs-gateways";
import { STATIC_ALLOWED_IMAGE_HOSTNAMES } from "../lib/media/static-image-hosts";

const HTML_LIMITED_METADATA_BOTS =
  /facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|TelegramBot|redditbot|Pinterestbot|opentweet/i;
const PUBLIC_REVIEW_TRACE_EXCLUDES = [
  "content/public-reviews/**/*",
  "public/review-data/**/*",
];
const OG_IMAGE_SHARP_TRACE_INCLUDES = [
  "node_modules/@img/sharp-libvips-*/**/*",
  "node_modules/.pnpm/@img+sharp-libvips-*/node_modules/@img/sharp-libvips-*/**/*",
];

function getAllowedDevOrigins(): string[] {
  return (
    process.env["NEXT_ALLOWED_DEV_ORIGINS"]
      ?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? []
  );
}

export function sharedConfig(
  publicEnv: PublicEnv,
  assetPrefix: string
): NextConfig {
  return {
    assetPrefix,
    reactCompiler: true,
    reactStrictMode: false,
    htmlLimitedBots: HTML_LIMITED_METADATA_BOTS,
    compress: true,
    allowedDevOrigins: getAllowedDevOrigins(),
    images: {
      loader: "default",
      remotePatterns: [
        ...STATIC_ALLOWED_IMAGE_HOSTNAMES.map((hostname) => ({
          protocol: "https" as const,
          hostname,
        })),
        {
          protocol: "https",
          hostname: getMediaResolverHostname(publicEnv.MEDIA_RESOLVER_ENDPOINT),
        },
        ...ARWEAVE_GATEWAY_REMOTE_PATTERN_HOSTNAMES.map((hostname) => ({
          protocol: "https" as const,
          hostname,
        })),
        ...IPFS_GATEWAY_REMOTE_PATTERN_HOSTNAMES.map((hostname) => ({
          protocol: "https" as const,
          hostname,
        })),
        { protocol: "http", hostname: "localhost" },
      ],
      minimumCacheTTL: 86400,
      formats: ["image/avif", "image/webp"],
      qualities: [100, 75],
    },
    poweredByHeader: false,
    logging: {
      incomingRequests: false,
    },
    outputFileTracingExcludes: {
      "/*": PUBLIC_REVIEW_TRACE_EXCLUDES,
    },
    outputFileTracingIncludes: {
      "/api/og-metadata/image": OG_IMAGE_SHARP_TRACE_INCLUDES,
    },
    async headers() {
      return [
        {
          source: "/:path*",
          headers: createSecurityHeaders(
            publicEnv["API_ENDPOINT"],
            publicEnv["IPFS_GATEWAY_ENDPOINT"],
            publicEnv["MEDIA_RESOLVER_ENDPOINT"],
            {
              allowInsecureLocalhostConnectSrc:
                publicEnv.NODE_ENV === "development" ||
                publicEnv.NODE_ENV === "local",
              allowUnsafeEval:
                publicEnv.NODE_ENV === "development" ||
                publicEnv.NODE_ENV === "local",
              webSocketEndpoint: publicEnv["WS_ENDPOINT"],
            }
          ),
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
