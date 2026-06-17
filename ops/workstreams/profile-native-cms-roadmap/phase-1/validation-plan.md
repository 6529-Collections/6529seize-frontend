# Phase 1 Validation Plan

Last updated: 2026-06-17.

## Purpose

Define expected validator behavior for schemas, fixtures, hash vectors, agent
patches, and future FE/BE contract tests.

## Severity Levels

- `error`: blocks publish.
- `warning`: publish may proceed with explicit user awareness.
- `note`: optional improvement.

## Error Shape

Validation errors should use:

- `severity`.
- `code`.
- `message`.
- `path`.
- Optional `page_id`.
- Optional `block_id`.
- Optional `suggested_fix`.

The shape is defined in `schemas/validation-result-v1.schema.json`.

## Valid Fixture Expected Results

All files under `fixtures/valid/` should:

- Parse as JSON.
- Match `schemas/cms-package-v1.schema.json`.
- Have unique route paths.
- Include at least one signature.
- Include at least one storage receipt.
- Include a route for `/{handle}/index.html`.
- Include page metadata title, description, locale, and canonical URL.

## Invalid Fixture Expected Results

`fixtures/invalid/missing-signature.package.json`:

- Expected code: `signature.required`.
- Expected path: `/signatures`.
- Expected severity: `error`.

`fixtures/invalid/route-collision.package.json`:

- Expected code: `route.duplicate_path`.
- Expected path: `/payload/routes`.
- Expected severity: `error`.

`fixtures/invalid/unknown-block.package.json`:

- Expected code: `block.unknown_type`.
- Expected path: `/payload/pages/0/blocks/0/block_type`.
- Expected severity: `error`.

## Semantic Validators Needed After Schema Parse

The JSON schema does not cover all protocol invariants. Implementation must add
semantic validation for:

- Route uniqueness.
- Route page references.
- Route kind variants:
  - `page` requires `page_id` and forbids `target`.
  - `alias` and `redirect` require `target` and forbid `page_id`.
- Navigation page references.
- Asset references.
- NFT media profile asset references.
- Room placement references.
- Canonical route/profile handle match, including alias and redirect routes.
- Reserved app route conflicts.
- Storage receipt hash/provider consistency.
- Signature signer authority.
- Production rejection of `fixture` signatures.
- Signer wallet normalization and EIP-55 checksum validation before authority
  checks.
- Pointer expected-previous concurrency.
- Unsafe URL schemes across page canonical URLs, asset URIs, navigation URLs,
  and URL-bearing fields inside block-specific properties.
- Unknown URL-bearing properties on extensible blocks.
- Unknown block types fail closed in V1.
- Missing media dimensions.
- Missing poster/fallback for heavy media.
- Unsupported interactive policy.

## FE/BE Shared Fixture Plan

Phase 1 docs live in the frontend repo. Before production code lands:

1. Move executable schemas to `lib/profile-cms/protocol/v1/` or a shared
   6529mono package.
2. Keep JSON fixtures in a location both FE and BE CI can consume.
3. Add FE tests that parse and render valid fixtures.
4. Add BE tests that parse, validate, sign-check, store, and pointer-check the
   same fixtures.
5. Add a compatibility rule that fixture changes require both FE and BE review.

## Current Artifact Validation Evidence

Completed in the docs-only Phase 0/1 pass:

- All Phase 1 JSON schemas and fixtures parse as JSON.
- All valid fixtures have unique route paths.
- `invalid/route-collision.package.json` intentionally duplicates
  `/punk6529/index.html`.

Completed in Wave 0 executable bridge:

- `lib/profile-cms/protocol/v1/` exports a Zod schema mirror, canonical JSON
  helper, SHA-256 helper, and semantic validator.
- Valid fixture corpus passes the executable validator.
- Invalid fixture corpus returns the documented error codes for missing
  signature, duplicate route, and unknown block type.
- Fixture signatures/storage are accepted in default fixture/dev mode and
  rejected when production options disable them.
- Optional hash enforcement catches payload and package mutations once computed
  hashes are applied.
- Hash shape validation rejects uppercase hex and non-`sha256:` prefixes.

Still not completed:

- Literal draft-2020-12 JSON Schema execution. The runtime bridge uses Zod plus
  semantic validation; if we need exact JSON Schema execution, add a direct AJV
  dependency in a later shared-package pass.
- Full production signature authority verification, EIP-1271/Safe verification,
  pointer expected-previous concurrency, and storage provider receipt checks.
- Replacement of every placeholder fixture root hash. The helper can compute
  hashes now, but fixtures keep placeholder-shaped values until the publish
  package format is signed off.
