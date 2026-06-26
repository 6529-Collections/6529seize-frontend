import { createSecurityHeaders } from "./securityHeaders";
import { PublicEnv } from "./env.schema";
import { NextConfig } from "next";
import { ARWEAVE_GATEWAY_REMOTE_PATTERN_HOSTNAMES } from "../lib/media/arweave-gateways";
import { getMediaResolverHostname } from "../lib/media/decentralized-media";
import { IPFS_GATEWAY_REMOTE_PATTERN_HOSTNAMES } from "../lib/media/ipfs-gateways";
import path from "node:path";

const HTML_LIMITED_METADATA_BOTS =
  /facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|TelegramBot|redditbot|Pinterestbot|opentweet/i;
const REPO_ROOT = path.resolve(process.cwd());
const NODE_MODULES_PATH = path.resolve(REPO_ROOT, "node_modules");
const SASS_LOAD_PATHS = [
  path.resolve(NODE_MODULES_PATH, "bootstrap", "scss"),
  NODE_MODULES_PATH,
];
const BOOTSTRAP_PROGRESS_PARTIAL =
  "./node_modules/bootstrap/scss/_progress.scss";

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
    sassOptions: {
      loadPaths: SASS_LOAD_PATHS,
      quietDeps: true,
      silenceDeprecations: [
        "color-functions",
        "global-builtin",
        "if-function",
        "import",
      ],
    },
    allowedDevOrigins: getAllowedDevOrigins(),
    images: {
      loader: "default",
      remotePatterns: [
        { protocol: "https", hostname: "6529.io" },
        { protocol: "https", hostname: "staging.6529.io" },
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
    poweredByHeader: false,
    logging: {
      incomingRequests: false,
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
        progress: BOOTSTRAP_PROGRESS_PARTIAL,
        "@react-native-async-storage/async-storage": "./stubs/empty.js",
        "react-native": "./stubs/empty.js",
        "idb-keyval": "./lib/storage/idb-keyval.ts",
      },
    },
    serverExternalPackages: ["@reown/appkit", "@reown/appkit-adapter-wagmi"],
  };
}
