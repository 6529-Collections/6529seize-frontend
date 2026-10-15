import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

/** Route that answers missing `/_next/*` files (see `next.config.ts`). */
export const MISSING_NEXT_ASSET_ROUTE = "/api/missing-next-asset";

/**
 * Next serves real `public/` and `.next/static` files before `afterFiles`
 * rewrites run, and dynamic routes match only after them. Without this rule a
 * missing `/_next/static/*.js` falls through to the `[user]/[...cmsPath]`
 * catch-all and renders a full HTML page with status 200.
 */
export const MISSING_NEXT_ASSET_REWRITES = {
  beforeFiles: [],
  afterFiles: [
    { source: "/_next/:path*", destination: MISSING_NEXT_ASSET_ROUTE },
  ],
  fallback: [],
};

/**
 * Production builds only: the dev server serves chunks on demand and runs HMR
 * under `/_next/*`, and version skew and scanner traffic only matter in
 * deployed builds. Production servers read the rule from the build's
 * routes-manifest.
 */
export function getMissingNextAssetRewriteConfig(
  phase: string
): Pick<NextConfig, "rewrites"> {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    return {};
  }
  return {
    rewrites: () => Promise.resolve(MISSING_NEXT_ASSET_REWRITES),
  };
}

function plainTextResponse(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: {
      "Cache-Control":
        "private, no-cache, no-store, max-age=0, must-revalidate",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

/**
 * A tiny, uncached 404 for paths no route or file can serve, mirroring Next's
 * own plain-text 404 for missing `/_next/static` files.
 */
export function plainNotFoundResponse(): Response {
  return plainTextResponse("Not Found", 404);
}

/** A tiny, uncached 503 for when the staging access gate cannot decide. */
export function plainServiceUnavailableResponse(): Response {
  return plainTextResponse("Service Unavailable", 503);
}
