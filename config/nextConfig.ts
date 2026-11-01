import { createSecurityHeaders } from "./securityHeaders";
import { e2eeAssetCacheHeaders } from "./e2eeAssetCacheHeaders";
import { isE2eeFlagEnabled } from "./e2eeFlag";
import { meebits445Headers } from "./meebits445Headers";
import { staticAssetCacheHeaders } from "./staticAssetCacheHeaders";
import { versionReloadImageHeaders } from "./versionReloadImageHeaders";
import { PublicEnv } from "./env.schema";
import { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";
import { HTML_LIMITED_BOT_UA_RE } from "next/dist/shared/lib/router/utils/html-bots";
import { ARWEAVE_GATEWAY_REMOTE_PATTERN_HOSTNAMES } from "../lib/media/arweave-gateways";
import {
  DEFAULT_MEDIA_RESOLVER_ENDPOINT,
  IPFS_PATH_GATEWAY_HOSTS,
  getMediaResolverHostname,
} from "../lib/media/decentralized-media";
import { IPFS_GATEWAY_REMOTE_PATTERN_HOSTNAMES } from "../lib/media/ipfs-gateways";
import { STATIC_ALLOWED_IMAGE_HOSTNAMES } from "../lib/media/static-image-hosts";

// A custom htmlLimitedBots value replaces Next's default list, so extend the
// default (Google, Bing, Apple, Yandex, Baidu, social crawlers) with only the
// bots Next does not already list.
const HTML_LIMITED_METADATA_BOTS = new RegExp(
  HTML_LIMITED_BOT_UA_RE.source + "|TelegramBot|Pinterestbot|opentweet",
  "i"
);
const OG_IMAGE_SHARP_TRACE_INCLUDES = [
  "node_modules/@img/sharp-libvips-*/**/*",
  "node_modules/.pnpm/@img+sharp-libvips-*/node_modules/@img/sharp-libvips-*/**/*",
];
const MUSEUM_PUBLICATION_TRACE_INCLUDES = [".museum-publication/current.json"];

// Upstream size ceiling for the built-in image optimizer. This equals the Next
// 16.3.8 default and is pinned so an upgrade cannot change it silently. It stays
// well above 10 MB because the Memes artwork preview optimizes full-resolution
// uploads (DropImagePreview `preferHighQuality`); a lower ceiling makes the
// optimizer reject those sources and fall back to the downscaled CDN copy.
const IMAGE_MAXIMUM_RESPONSE_BODY_BYTES = 50_000_000;

// URL shapes come from lib/media/decentralized-media.ts: IPFS path gateways
// serve /ipfs/<cid> and /ipns/<name>, the 6529 media resolver also serves
// /arweave/<id>, and subdomain gateways use exactly one label (<id>.<gateway>).
const IPFS_GATEWAY_PATHNAME = "/{ipfs,ipns}/**";
const MEDIA_RESOLVER_PATHNAME = "/{arweave,ipfs,ipns}/**";
const IPFS_PATH_GATEWAY_HOSTNAMES = new Set<string>(IPFS_PATH_GATEWAY_HOSTS);
// Next 16.3.8 matches both `*` and `**` across dots, so a `*.<gateway>` pattern
// would also allow `a.b.<gateway>`. This picomatch extglob matches one label.
const SINGLE_LABEL_WILDCARD = "+([^.])";
// An omitted port matches any port, so pin the default HTTPS port explicitly.
const HTTPS_DEFAULT_PORT = { protocol: "https" as const, port: "" };

function getImageRemotePatterns(publicEnv: PublicEnv): RemotePattern[] {
  const resolverHostnames = new Set([
    getMediaResolverHostname(DEFAULT_MEDIA_RESOLVER_ENDPOINT),
    getMediaResolverHostname(publicEnv.MEDIA_RESOLVER_ENDPOINT),
  ]);
  const gatewayHostnames = new Set([
    ...ARWEAVE_GATEWAY_REMOTE_PATTERN_HOSTNAMES,
    ...IPFS_GATEWAY_REMOTE_PATTERN_HOSTNAMES,
  ]);

  return [
    ...STATIC_ALLOWED_IMAGE_HOSTNAMES.filter(
      (hostname) => !IPFS_PATH_GATEWAY_HOSTNAMES.has(hostname)
    ).map((hostname) => ({ ...HTTPS_DEFAULT_PORT, hostname })),
    ...Array.from(resolverHostnames, (hostname) => ({
      ...HTTPS_DEFAULT_PORT,
      hostname,
      pathname: MEDIA_RESOLVER_PATHNAME,
    })),
    ...Array.from(gatewayHostnames)
      .filter((hostname) => !resolverHostnames.has(hostname))
      .map((hostname) => ({
        ...HTTPS_DEFAULT_PORT,
        hostname: hostname.startsWith("**.")
          ? `${SINGLE_LABEL_WILDCARD}${hostname.slice(2)}`
          : hostname,
        ...(IPFS_PATH_GATEWAY_HOSTNAMES.has(hostname)
          ? { pathname: IPFS_GATEWAY_PATHNAME }
          : {}),
      })),
  ];
}

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
        ...getImageRemotePatterns(publicEnv),
        // Only meaningful against a local backend; never part of a production
        // build.
        ...(publicEnv.NODE_ENV === "development" ||
        publicEnv.NODE_ENV === "local"
          ? [{ protocol: "http" as const, hostname: "localhost" }]
          : []),
      ],
      minimumCacheTTL: 86400,
      formats: ["image/avif", "image/webp"],
      // 100: high-quality Memes artwork preview, and the nearest match for the
      // quality={90} thumbnails. 75: the default.
      qualities: [100, 75],
      maximumResponseBody: IMAGE_MAXIMUM_RESPONSE_BODY_BYTES,
    },
    poweredByHeader: false,
    redirects() {
      return Promise.resolve([
        // CC0 in one minute lives on the 6529 Explained hub until The Memes
        // and CC0 has its own page; a guessed /explained/cc0 goes there.
        {
          source: "/explained/cc0",
          destination: "/explained#cc0",
          permanent: false,
        },
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
        {
          // 6529 Explained's TDH chapter stays at /network/tdh (MAP.md §1).
          source: "/explained/tdh",
          destination: "/network/tdh",
          permanent: true,
        },
        // Versions and boosts, 6529 Explained's TDH shelf page, keeps the
        // Historic boosts route; its own name leads there too.
        {
          source: "/network/tdh/versions",
          destination: "/network/tdh/historic-boosts",
          permanent: true,
        },
        // The 6529 Stream public contract review was removed; its section is
        // being rebuilt at /stream.
        {
          source: "/reviews/6529-stream/:path*",
          destination: "/stream",
          permanent: true,
        },
      ]);
    },
    logging: {
      incomingRequests: false,
    },
    outputFileTracingIncludes: {
      "/*": MUSEUM_PUBLICATION_TRACE_INCLUDES,
      "/api/og-metadata/image": OG_IMAGE_SHARP_TRACE_INCLUDES,
    },
    async headers() {
      const isLocalTooling =
        publicEnv.NODE_ENV === "development" || publicEnv.NODE_ENV === "local";
      return [
        // Development keeps `public/` files uncached so edited assets show up
        // on the next reload.
        ...(publicEnv.NODE_ENV === "development" ||
        publicEnv.NODE_ENV === "local"
          ? []
          : staticAssetCacheHeaders),
        {
          source: "/:path*",
          headers: [
            ...createSecurityHeaders(
              publicEnv["API_ENDPOINT"],
              publicEnv["IPFS_GATEWAY_ENDPOINT"],
              publicEnv["MEDIA_RESOLVER_ENDPOINT"],
              {
                allowInsecureLocalhostConnectSrc: isLocalTooling,
                allowUnsafeEval: isLocalTooling,
                allowWasmUnsafeEval: isE2eeFlagEnabled(
                  publicEnv.NEXT_PUBLIC_E2EE_DM_ENABLED
                ),
                webSocketEndpoint: publicEnv["WS_ENDPOINT"],
                // Local development violations are expected noise; only
                // deployed builds report CSP violations to Sentry.
                sentryDsn: isLocalTooling ? undefined : publicEnv.SENTRY_DSN,
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
        versionReloadImageHeaders,
        e2eeAssetCacheHeaders,
        {
          // Connection links carry one-time credentials in the query string.
          // Later entries override the site-wide same-origin policy above.
          source: "/accept-connection-sharing",
          headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
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
