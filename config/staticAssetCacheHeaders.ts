import { ROOT_PUBLIC_FILES } from "../lib/proxy/publicPaths";

/**
 * Cache policy for root-level `public/` files.
 *
 * Next serves these with `Cache-Control: public, max-age=0`, so a browser
 * re-validates every image on every page view. Their names carry no content
 * hash, so an `immutable` year-long policy would pin old bytes after a deploy;
 * the policies below bound how stale a copy can be instead.
 *
 * Headers are matched before the filesystem and Next's static file server only
 * fills `Cache-Control` when none is set, so these entries take effect on the
 * file responses. Each source lists exact files from the proxy's `public/`
 * mirror: a wildcard on the extension would also match app routes such as
 * `/<profile-handle>.png`.
 */

// Brand images and icons change a few times a year at most. A day keeps them
// out of the request path for repeat visits; the week of stale-while-revalidate
// lets a returning visitor paint instantly from cache while the browser
// re-checks in the background, so a replaced logo is shown on the next view.
const BRAND_ASSET_CACHE_CONTROL =
  "public, max-age=86400, stale-while-revalidate=604800";

// Regenerated on every deploy (`help-index:sync`, `agent-files:sync`) and read
// by crawlers and the help bot, so new content must reach them quickly. Five
// minutes of freshness still turns repeat reads into ETag revalidations.
const GENERATED_FILE_CACHE_CONTROL =
  "public, max-age=300, stale-while-revalidate=3600";

const GENERATED_FILE_PATHS: readonly string[] = [
  "/help-index.json",
  "/llms.txt",
  "/glossary.json",
];

const BRAND_ASSET_EXTENSION = /\.(?:png|jpe?g|svg|webp|avif)$/i;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Next compiles `source` with path-to-regexp; a parenthesised group is a regex
// that may hold several alternatives for one path segment.
function exactFilesSource(paths: readonly string[]): string {
  return `/:file(${paths.map((path) => escapeRegExp(path.slice(1))).join("|")})`;
}

const BRAND_ASSET_PATHS = [...ROOT_PUBLIC_FILES].filter((path) =>
  BRAND_ASSET_EXTENSION.test(path)
);

export const staticAssetCacheHeaders = [
  {
    source: exactFilesSource(BRAND_ASSET_PATHS),
    headers: [{ key: "Cache-Control", value: BRAND_ASSET_CACHE_CONTROL }],
  },
  {
    source: exactFilesSource(GENERATED_FILE_PATHS),
    headers: [{ key: "Cache-Control", value: GENERATED_FILE_CACHE_CONTROL }],
  },
];
