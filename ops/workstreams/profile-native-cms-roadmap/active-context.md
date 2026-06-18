# Active Context

Last updated: 2026-06-17.

## Current State

Phase 0 and Phase 1 are delivered as docs/protocol artifacts in this repo, and
Wave 0 now adds an executable frontend protocol bridge under
`lib/profile-cms/protocol/v1/`.

Available now:

- Phase 0 decision record for URL, storage, signing, hashing, pointer, route,
  analytics, media, art display, AI-agent, and feature-flag choices.
- Phase 0 storm lane map, test matrix, and PR wave plan.
- Phase 1 versioned CMS package and payload JSON schema.
- Phase 1 agent patch and validation-result JSON schemas.
- Phase 1 valid and invalid fixture corpus.
- Phase 1 hash/canonicalization vector plan.
- Executable Zod schema mirror for CMS package, payload, agent patch, and
  validation-result shapes.
- Strict canonical JSON and `sha256:<hex>` helpers.
- Real hash vectors for minimal objects and the minimal profile homepage
  fixture.
- Semantic validator for route, namespace, reference, URL, fixture-mode,
  media, storage, signature, and optional hash checks.
- Jest tests for canonicalization, hashing, and all valid/invalid Phase 1
  fixtures.
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
- Wave 1 frontend runtime bridge work is in progress on
  `codex/profile-cms-runtime-bridge`: App Router support for
  `/{handle}/index.html`, a narrow primary-site API adapter, a V1 static
  renderer, and profile Website link plumbing.

Important limits:

- No builder, publish endpoint, storage adapter, or backend pointer
  implementation has been landed by this Phase 0/1 pass.
- The frontend runtime adapter assumes `GET /api/profile-cms/:handle/primary`
  and documents that boundary in
  `runtime-bridge-integration-assumptions.md`.
- The broader schema is ahead of any authoring experience.
- Real IPFS and Arweave upload adapters are still needed.
- Real wallet signature verification is still needed.
- The executable validator is currently a Zod mirror plus semantic pass. The
  JSON Schema files remain the protocol reference; a later shared-package pass
  should decide whether to add direct AJV execution.
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

The highest leverage next slice is Wave 1 from `phase-0/pr-wave-plan.md`:

1. Decide whether this executable protocol stays in FE temporarily or moves to
   a shared 6529mono package before BE adoption.
2. Add backend tests that consume the same Phase 1 fixture corpus and validation
   result shape.
3. Review and merge the frontend runtime bridge for `/{handle}/index.html`.
4. Align backend primary pointer response to the documented runtime adapter
   envelope.
5. Only then fan out publish/storage, builder, wallet-gallery generation, art
   display, 3D rooms, and AI-agent affordances.

## Decisions To Make Before Coding More

- Human signoff on the Phase 0 decision record.
- Whether public launch should require both IPFS and Arweave receipts instead
  of one required plus one preferred.
- Exact EIP-712 typed-data domain and user-facing signing copy.
- Whether the Wave 0 executable protocol moves into a shared 6529mono package
  before backend implementation, or is copied into BE as a temporary bridge.
- Exact first institutional migration pilot.
