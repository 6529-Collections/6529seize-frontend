# Active Context

Last updated: 2026-06-17.

## Current State

Phase 0 and Phase 1 are now delivered as docs/protocol artifacts in this repo.
They are ready to seed implementation PRs, but they are not executable product
code yet.

Available now:

- Phase 0 decision record for URL, storage, signing, hashing, pointer, route,
  analytics, media, art display, AI-agent, and feature-flag choices.
- Phase 0 storm lane map, test matrix, and PR wave plan.
- Phase 1 versioned CMS package and payload JSON schema.
- Phase 1 agent patch and validation-result JSON schemas.
- Phase 1 valid and invalid fixture corpus.
- Phase 1 hash/canonicalization vector plan.
- Page types for pages, posts, galleries, collections, NFT/card details, and
  room-style pages.
- Blocks for headings, rich text, images, galleries, quotes, callouts, button
  links, NFT references, collection references, transaction references, and
  generated wallet gallery summaries.
- Theme and share metadata fields.
- Provenance, package hash, payload hash, storage location, and signature
  envelope concepts.
- A dedicated art/NFT display research spec now exists at
  `art-nft-display-best-practices.md`.
- A phase-based agentic storm execution plan now exists at
  `agentic-storm-execution-plan.md`.

Important limits:

- No runtime CMS route, renderer, builder, publish endpoint, storage adapter, or
  pointer implementation has been landed by this Phase 0/1 pass.
- The broader schema is ahead of any authoring experience.
- Real IPFS and Arweave upload adapters are still needed.
- Real wallet signature verification is still needed.
- Live NFT indexing, full collection pages, full NFT pages, and 3D rooms are
  not implemented yet.
- There is no general WYSIWYG/block editor yet.

## Product Decisions Already Made

- The normal profile page remains `/{handle}`.
- The CMS website lives at `/{handle}/index.html`.
- The profile page should show a clear button/link to the CMS site when one is
  published.
- CMS capability should be available to all profiles, not privileged app route
  families.
- Do not build a verified/official content lane into the protocol. Authority
  comes from profile control, signatures, reputation, nIC, and user trust.
- Decentralized storage should be part of the first real publish path, not a
  later migration.
- AWS/CloudFront/S3 may accelerate delivery, but the base artifact should be
  content addressed and independently mirrorable.

## Next Implementation Slice

The highest leverage next slice is Wave 0 implementation from
`phase-0/pr-wave-plan.md`:

1. Move or mirror the Phase 1 schemas into executable protocol code under
   `lib/profile-cms/protocol/v1/` or a shared 6529mono package.
2. Implement RFC 8785 canonical JSON and SHA-256 vectors.
3. Add a real schema and semantic validator against the Phase 1 fixtures.
4. Add FE and BE CI checks that parse and validate the same fixture corpus.
5. Only then begin route/render/publish/builder/gallery parallel waves.

## Decisions To Make Before Coding More

- Human signoff on the Phase 0 decision record.
- Whether public launch should require both IPFS and Arweave receipts instead
  of one required plus one preferred.
- Exact EIP-712 typed-data domain and user-facing signing copy.
- Whether Phase 1 executable schema work starts in this FE repo or immediately
  moves into a shared 6529mono package.
- Exact first institutional migration pilot.
