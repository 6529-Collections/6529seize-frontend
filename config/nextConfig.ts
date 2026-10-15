import { createSecurityHeaders } from "./securityHeaders";
import { meebits445Headers } from "./meebits445Headers";
import { PublicEnv } from "./env.schema";
import { NextConfig } from "next";
import { HTML_LIMITED_BOT_UA_RE } from "next/dist/shared/lib/router/utils/html-bots";
import { ARWEAVE_GATEWAY_REMOTE_PATTERN_HOSTNAMES } from "../lib/media/arweave-gateways";
import { getMediaResolverHostname } from "../lib/media/decentralized-media";
import { IPFS_GATEWAY_REMOTE_PATTERN_HOSTNAMES } from "../lib/media/ipfs-gateways";
import { STATIC_ALLOWED_IMAGE_HOSTNAMES } from "../lib/media/static-image-hosts";

// A custom htmlLimitedBots value replaces Next's default list, so extend the
// default (Google, Bing, Apple, Yandex, Baidu, social crawlers) with only the
// bots Next does not already list.
const HTML_LIMITED_METADATA_BOTS = new RegExp(
  HTML_LIMITED_BOT_UA_RE.source + "|TelegramBot|Pinterestbot|opentweet",
  "i"
);
const PUBLIC_REVIEW_TRACE_EXCLUDES = [
  "content/public-reviews/**/*",
  "public/review-data/**/*",
];
const OG_IMAGE_SHARP_TRACE_INCLUDES = [
  "node_modules/@img/sharp-libvips-*/**/*",
  "node_modules/.pnpm/@img+sharp-libvips-*/node_modules/@img/sharp-libvips-*/**/*",
];
const MUSEUM_PUBLICATION_TRACE_INCLUDES = [".museum-publication/current.json"];

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
        {
          protocol: "https",
          hostname: "nft2-cdn.alchemy.com",
          port: "",
          pathname: "/cdn-cgi/image/*/eth-mainnet/*",
          search: "",
        },
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
    redirects() {
      return Promise.resolve([
        {
          source: "/delegation/delegation-center",
          destination: "/safe-collecting",
          permanent: true,
        },
        {
          source: "/delegation/wallet-architecture",
          destination: "/safe-collecting/tap-guide",
          permanent: true,
        },
        {
          source: "/delegation/delegation-faq/:path*",
          destination: "/safe-collecting/faq/:path*",
          permanent: true,
        },
        {
          source: "/delegation/:path*",
          destination: "/safe-collecting/:path*",
          permanent: true,
        },
        {
          source: "/about/nft-delegation",
          destination: "/safe-collecting",
          permanent: true,
        },
      ]);
    },
    logging: {
      incomingRequests: false,
    },
    outputFileTracingExcludes: {
      "/*": PUBLIC_REVIEW_TRACE_EXCLUDES,
    },
    outputFileTracingIncludes: {
      "/*": MUSEUM_PUBLICATION_TRACE_INCLUDES,
      "/api/og-metadata/image": OG_IMAGE_SHARP_TRACE_INCLUDES,
    },
    async headers() {
      return [
        {
          source: "/:path*",
          headers: [
            ...createSecurityHeaders(
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
            // Environment-wide, including /access, redirects and public files.
            // Use the baked deployment origin, never NODE_ENV or request headers:
            // staging runs production builds and proxies may rewrite the Host.
            ...(new URL(publicEnv.BASE_ENDPOINT).hostname === "staging.6529.io"
              ? [{ key: "X-Robots-Tag", value: "noindex" }]
              : []),
          ],
        },
        meebits445Headers,
      ];
    },
    turbopack: {
      resolveAlias: {
        canvas: "./stubs/empty.js",
        encoding: "./stubs/empty.js",
        "@react-native-async-storage/async-storage": "./stubs/empty.js",
        "react-native": "./stubs/empty.js",
        "idb-keyval": "./lib/storage/idb-keyval.ts",
        // Browser bundles load non-default locale dictionaries on demand;
        // server rendering keeps every locale synchronous.
        "@/i18n/localeDictionaries": {
          browser: "./i18n/localeDictionaries.browser.ts",
        },
      },
    },
    serverExternalPackages: ["@reown/appkit", "@reown/appkit-adapter-wagmi"],
    experimental: {
      // Next 16.3 defaults `next build` to the project-local `tsc` CLI, which
      // checks the whole tsconfig.json project including `__tests__`. The
      // TypeScript API checker keeps the previous behavior of skipping test
      // files; tests are typechecked by the Jest ratchet, not by the build.
      useTypeScriptCli: false,
    },
  };
}
