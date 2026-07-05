# Active Context

Last updated: 2026-07-05.

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
- Wave 1 frontend runtime bridge work is green in PR #2720 on
  `codex/profile-cms-runtime-bridge`: App Router support for
  `/{handle}/index.html`, a narrow primary-site API adapter, a V1 static
  renderer, and profile Website link plumbing.
- The next stacked FE lane is the CMS Builder + Publish UI MVP on
  `codex/profile-cms-builder-mvp`: a hidden feature-flagged
  `/{handle}/cms/builder` route, guided homepage editor, real renderer preview,
  local V1 validation checklist, JSON import/export, and save/validate/publish
  adapter stubs.
- The Phase 7 frontend 3D lane adds a bounded Three.js client island for
  GLB/glTF object viewing and simple exhibition room rendering, plus a
  builder-facing 3D room primitive.
- Phase 5-8 QA/integration is now tracked on
  `codex/cms-phase5-8-qa-integration` with a living checklist at
  `phase-5-8-qa-checklist.md`, fixture renderer coverage for wallet gallery,
  collection, NFT detail, mixed media, and 3D room fallback packages, and an
  opt-in Playwright smoke harness prepared for worker branch integration.

Important limits:

- Backend profile-cms implementation is merged to backend main with 13 endpoints:
  draft/validate/publish/rollback/archive/export/list/by-hash/versions for
  packages; agent schema-bundle + patch validate + source packet; wallet-gallery
  snapshot. Signature verification with EIP-712 + EIP-1271 and replay
  protection. Arweave/IPFS storage receipt validation.
- Storage upload endpoint is in progress on codex/cms-arweave-storage-upload.
  Storage decision: Arweave-first canonical receipts, IPFS pinning fast-follow.
- First institutional migration pilot decided: 6529Museum and 6529capital static
  pages.
- Frontend builder MVP documents its expected backend write endpoints in
  `builder-mvp-integration-assumptions.md` and must not fake a production
  publish.
- The frontend runtime adapter assumes `GET /api/profile-cms/:handle/primary`
  and documents that boundary in
  `runtime-bridge-integration-assumptions.md`.
- The broader schema is ahead of any authoring experience.
- The executable validator is currently a Zod mirror plus semantic pass. The
  JSON Schema files remain the protocol reference; a later shared-package pass
  should decide whether to add direct AJV execution.
- Live NFT indexing, full collection pages, and full NFT pages are not
  implemented yet.
- Full 3D world editing, multi-room navigation, AR/VR, and automatic NFT room
  generation remain future scope. The current 3D lane is a deterministic MVP:
  poster/static preview, deferred room/object loading, faithful 2D art
  surfaces, canonical detail links, and mobile fallback.
- There is no general WYSIWYG/block editor yet.
- The Phase 5-8 smoke harness is opt-in because it needs deployed/staged routes
  and fixture data for the full generated gallery and 3D surfaces.

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

The active critical-path slice is the FE 3D Rooms And Object Viewer lane stacked
on the FE Builder + Publish UI MVP:

1. Keep the builder route hidden behind `PROFILE_CMS_BUILDER_ENABLED` or
   `NEXT_PUBLIC_PROFILE_CMS_BUILDER_ENABLED`.
2. Use the existing V1 protocol helpers without changing hash or
   canonicalization semantics.
3. Render only bounded 3D surfaces: GLB/glTF object viewer and simple room
   frames/artwork placements.
4. Keep 2D NFT/detail pages canonical for inspection and make every 3D artwork
   click/tap path point there.
5. Validate desktop/mobile behavior with browser screenshots and WebGL canvas
   nonblank checks before PR closeout.

## Decisions To Make Before Coding More

- Human signoff on the Phase 0 decision record.
- Whether public launch should require both IPFS and Arweave receipts instead
  of one required plus one preferred.
- Exact EIP-712 typed-data domain and user-facing signing copy.
- Whether the Wave 0 executable protocol moves into a shared 6529mono package
  before backend implementation, or is copied into BE as a temporary bridge.
- Exact first institutional migration pilot.
