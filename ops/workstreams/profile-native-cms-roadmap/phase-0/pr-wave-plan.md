# Phase 0 PR Wave Plan

Last updated: 2026-06-17.

## Purpose

Name the exact PR order that lets an agentic storm move quickly while preserving
shared protocol invariants.

## Wave 0: Decisions And Fixtures

Repos:

- Frontend repo for Phase 0/1 docs and initial protocol artifacts.
- Backend repo receives copied/generated fixtures once package schema is stable.

PRs:

1. Phase 0/1 decision, schema, fixture, and validation docs.
2. Executable frontend protocol package under `lib/profile-cms/protocol/v1/`.
3. Backend schema/fixture consumption PR.

Gate:

- FE and BE both parse the same fixture corpus.
- Hash test vectors are deterministic in both repos or in a shared package.

## Wave 1: Route And Render

PRs:

1. FE CMS route resolution behind feature flag.
2. FE renderer core against fixtures.
3. FE art/NFT primitive renderer against fixtures.
4. FE static export proof against fixtures.

Gate:

- Fixture package renders at `/{handle}/index.html`.

## Wave 2: Publish Spine

PRs:

1. BE package records and validation.
2. BE signing and profile authorization.
3. BE storage adapters and receipts.
4. BE pointer events and rollback.
5. FE publish/sign/provenance UI.

Gate:

- Signed package publishes and resolves through profile pointer in dev.

## Wave 3: Builder MVP

PRs:

1. FE builder dashboard.
2. FE page/block editor.
3. FE media library.
4. FE validation checklist.
5. FE version history and rollback UI.

Gate:

- User can build and publish a simple profile homepage.

## Wave 4: Wallet Gallery MVP

PRs:

1. Wallet/ENS loader.
2. NFT metadata normalization.
3. Gallery package generator.
4. Generated collection/NFT pages.
5. Media variants/social images.
6. Hide/feature controls.

Gate:

- User can paste wallets and publish a gallery site with home, collection, and
  NFT pages.

## Wave 5: Experience And Decentralization

PRs:

1. Art display polish.
2. 3D room/object viewer MVP.
3. AI-agent affordances.
4. Institutional migration pilot.
5. Standalone validator/exporter/mirror docs.

Gate:

- Public launch readiness checklist passes.
