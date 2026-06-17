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

The manifest currently has `canonicalStorage.rootCid: null` because the frontend repo does not have IPFS publishing credentials. After publishing the bundle directory to IPFS, update the manifest with the root CID and regenerate the public copy.

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
4. Publish `public/delegation-content/{version}` to IPFS from an admin or backend pipeline.
5. Pin the root CID using 6529-controlled infrastructure.
6. Set `DELEGATION_DOCS_IPFS_ROOT_CID` and rerun the build script.
7. If using CloudFront/S3 acceleration, set `DELEGATION_DOCS_CDN_BASE_URL` to a CID or version-addressed mirror path.
8. Verify representative delegation article routes and confirm hash-verified rendering.
