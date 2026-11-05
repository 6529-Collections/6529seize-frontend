export const PRODUCTION_ASSET_HOSTNAME = "dnclu2fna0b2b.cloudfront.net";

/**
 * S3 key prefix that holds `_next/static` for every production build.
 *
 * Next names those files by content hash, or scopes them by the build ID, so
 * one shared prefix keeps unchanged files at the same URL across deploys and
 * returning visitors download only what changed. Builds before the shared
 * prefix used `web_build/<commit SHA>`; those objects are kept so their pages
 * still load. `Web Deploy - PROD` writes each object once and never deletes
 * it; see `ops/scripts/publish-shared-static-assets.cjs`.
 */
export const PRODUCTION_SHARED_ASSET_PATH = "web_build/shared";

export const PRODUCTION_ASSET_PREFIX = `https://${PRODUCTION_ASSET_HOSTNAME}/${PRODUCTION_SHARED_ASSET_PATH}`;
