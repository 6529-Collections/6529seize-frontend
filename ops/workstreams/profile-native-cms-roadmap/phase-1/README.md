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

Current validation is docs/artifact-level only: JSON parse and focused semantic
checks have run, but full JSON Schema validation has not run in this pass
because `ajv` is not currently resolvable in the local Node environment.
