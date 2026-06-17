# Phase 1 Protocol And Fixture Foundation

Last updated: 2026-06-17.

## Goal

Create the shared package contract and fixture corpus that lets frontend,
backend, renderer, storage, builder, wallet gallery, art display, 3D, and
AI-agent lanes build in parallel without architecture drift.

## Deliverables

- Schema index.
- V1 package schema.
- V1 agent patch schema.
- V1 validation result schema.
- Valid fixture corpus.
- Invalid fixture corpus.
- Hash/canonicalization test vectors.
- Validation plan.

## Directories

- `schemas/`: JSON schemas and schema index.
- `fixtures/valid/`: packages expected to validate.
- `fixtures/invalid/`: packages expected to fail validation for documented
  reasons.

## Phase 1 Status

Delivered as planning/protocol artifacts in this repo:

- `schema-index.md`
- `schemas/cms-package-v1.schema.json`
- `schemas/agent-patch-v1.schema.json`
- `schemas/validation-result-v1.schema.json`
- `fixtures/README.md`
- Valid fixtures:
  - `minimal-profile-homepage.package.json`
  - `wallet-gallery.package.json`
  - `collection-page.package.json`
  - `nft-detail.package.json`
  - `art-media.package.json`
  - `exhibition-room.package.json`
  - `legacy-migration.package.json`
- Invalid fixtures:
  - `missing-signature.package.json`
  - `route-collision.package.json`
  - `unknown-block.package.json`
- `hash-test-vectors.md`
- `validation-plan.md`

## Notes

These schemas are the first protocol foundation, not the final generated API
model. Implementation PRs should either use these directly or move them into a
shared protocol package with identical semantics.

Wave 0 now mirrors the package contract into executable TypeScript under
`lib/profile-cms/protocol/v1/`:

- Zod schema mirror for package, payload, agent patch, and validation result.
- Strict canonical JSON helper.
- SHA-256 helpers and real hash vectors.
- Semantic validator against the Phase 1 fixture corpus.

The JSON Schema files remain the protocol reference. A later shared-package pass
can decide whether to add a direct AJV dependency for literal draft-2020-12
execution or keep the Zod mirror as the runtime validator.
