# Delegation Docs Content Delivery Pilot

This pilot implements the content-delivery portion of the
[Delegation Source Of Truth Spec](source-of-truth-spec.md). If this file and
the source-of-truth spec ever conflict, the source-of-truth spec wins.

## Decision

Delegation help articles use this delivery model:

1. Repo-reviewed article HTML lives in the versioned publish bundle at
   `public/delegation-content/{version}/html`.
2. The full versioned publish bundle lives in
   `public/delegation-content/{version}`.
3. Article screenshots, diagrams, ABI files, and other reviewed assets live in
   `content/delegation/assets` and the same public bundle.
4. `content/delegation/manifest.json` records article paths, asset paths,
   summaries, and SHA-256 hashes.
5. IPFS is the intended canonical storage layer after the bundle is published and pinned.
6. S3 or CloudFront can accelerate delivery only as a CID or version-addressed mirror.

Runtime code must not fetch mutable S3 article bodies or article assets by
slug/path.

## Current Pilot State

`ops/scripts/build-delegation-docs-content.mjs` packages the reviewed repo bundle by default. It removes active HTML, strips duplicate leading article headings, verifies packaged asset references, rewrites internal delegation links to absolute app routes, and refreshes the public bundle in place. Set `DELEGATION_DOCS_IMPORT_LEGACY_S3=1` only when intentionally refreshing article HTML from the legacy S3 source. Import mode still requires article assets to already exist as reviewed files under `content/delegation/assets`; new or changed remote assets must be downloaded and reviewed separately before rebuilding.

`ops/scripts/publish-delegation-docs-content.mjs` publishes the reviewed bundle
to the 6529-controlled internal IPFS node from an ops/CI context. Browser
runtime code must never publish docs content or call a write-capable IPFS RPC
endpoint.

The manifest can have `canonicalStorage.rootCid: null` before the first publish.
After the bundle is published and pinned, use the receipt root CID to update the
repo manifest in a reviewed commit.

## Runtime Rules

- `DelegationHTML` resolves articles through the manifest-backed loader.
- The loader verifies the SHA-256 hash before rendering any article body.
- Packaged article asset links are resolved from the verified article URL, so
  a CloudFront or IPFS article loads screenshots, diagrams, and downloads from
  the same bundle source.
- If a root CID is present, the loader may try the configured accelerated URL and IPFS gateways first.
- The checked-in public bundle is the local fallback for development and for the current pilot.
- Browser code must not call writable IPFS RPC APIs or instantiate a write-capable IPFS service for docs publishing.

## Follow-Up Migrations

Similar runtime S3-rendered content exists outside delegation, including About HTML and mapping-tool help HTML. Treat those as separate migrations after this pilot proves the content-package flow.

## Publishing Checklist

1. Review article edits in `public/delegation-content/{version}/html`.
2. Review asset edits in `content/delegation/assets`.
3. Run `node ops/scripts/build-delegation-docs-content.mjs` to rebuild the manifest and public bundle.
4. Publish `public/delegation-content/{version}` to IPFS through the internal
   node:

   ```bash
   DELEGATION_DOCS_IPFS_API_ENDPOINT=https://api-ipfs.6529.io \
     node ops/scripts/publish-delegation-docs-content.mjs
   ```

   Use `--dry-run` to build and receipt the file set without publishing.
5. Keep the generated receipt from `tmp/delegation-docs-publish`. It records the
   root CID, file hashes, IPFS entries, and byte-exact gateway/CDN verification
   results for every published file.
6. Set `DELEGATION_DOCS_IPFS_ROOT_CID` from the receipt and rerun the build
   script. If using CloudFront/S3 acceleration, also set
   `DELEGATION_DOCS_CDN_BASE_URL` to a CID or version-addressed mirror path.
7. Commit the updated manifest/public bundle as a reviewed PR.
8. Verify representative delegation article routes and confirm hash-verified rendering.

The manual GitHub workflow `Publish Delegation Docs Content` runs the same
script. Configure these secrets/vars before using it for a real publish:

- `DELEGATION_DOCS_IPFS_API_ENDPOINT` secret: internal IPFS API endpoint.
- `DELEGATION_DOCS_IPFS_API_BEARER_TOKEN` secret or
  `DELEGATION_DOCS_IPFS_API_AUTH_HEADER` secret: optional auth for the internal
  node.
- `DELEGATION_DOCS_IPFS_GATEWAY_BASE_URL` var: gateway used for post-publish
  verification, normally `https://ipfs.6529.io/ipfs`.
- `DELEGATION_DOCS_CDN_S3_URI` var: optional S3 mirror destination. It may use
  `{cid}` and `{version}` placeholders.
- `DELEGATION_DOCS_CDN_BASE_URL` var: optional CloudFront base URL for
  post-sync hash verification. It may use `{cid}` and `{version}` placeholders.
