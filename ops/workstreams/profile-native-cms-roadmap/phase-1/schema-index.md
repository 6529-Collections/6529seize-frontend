# Phase 1 Schema Index

Last updated: 2026-06-17.

## V1 Schema Names

Package:

- `6529.cms.package.v1`
- `6529.cms.payload.v1`

Agent:

- `6529.cms.agent_patch.v1`
- `6529.cms.validation_result.v1`

## JSON Schema Files

- `schemas/cms-package-v1.schema.json`: primary package/payload schema with
  shared definitions for site manifest, page metadata, content entries, routes,
  storage receipts, signatures, art assets, display variants, NFT media
  profiles, rooms, placements, interactive policy, source packets, validation
  inputs, and build manifests.
- `schemas/agent-patch-v1.schema.json`: patch format for user-owned agents to
  propose draft changes without rewriting a full package.
- `schemas/validation-result-v1.schema.json`: structured validation result
  format for builder UI, agents, CI, and standalone validators.

## Future Schema Split

The current package schema is intentionally consolidated so Phase 1 agents share
one contract. Once implementation starts, it can split into:

- `site-manifest-v1.schema.json`
- `page-v1.schema.json`
- `page-metadata-v1.schema.json`
- `block-v1.schema.json`
- `asset-v1.schema.json`
- `art-asset-v1.schema.json`
- `display-variant-v1.schema.json`
- `nft-media-profile-v1.schema.json`
- `deep-zoom-manifest-v1.schema.json`
- `exhibition-room-v1.schema.json`
- `artwork-placement-v1.schema.json`
- `interactive-policy-v1.schema.json`
- `route-manifest-v1.schema.json`
- `navigation-v1.schema.json`
- `taxonomy-v1.schema.json`
- `source-packet-v1.schema.json`
- `storage-receipt-v1.schema.json`
- `signature-envelope-v1.schema.json`
- `pointer-event-v1.schema.json`
- `static-build-manifest-v1.schema.json`

## Required Fixture Coverage

Valid:

- Minimal profile homepage.
- Wallet gallery with generated collection and NFT routes.
- Collection page with a knowledge packet source.
- NFT detail page with art assets and display variants.
- Mixed media page with image, video, audio, HTML embed, and 3D model assets.
- 3D exhibition room with faithful 2D fallback.
- Legacy institutional route migration package.

Invalid:

- Missing signature.
- Route collision.
- Unknown block type.

## Canonical Hashing

Phase 1 fixture package hashes remain placeholder-shaped where noted, so they
can document the protocol without pretending publish hashes are final.

Wave 0 implementation now provides executable canonical JSON + SHA-256 helpers
under `lib/profile-cms/protocol/v1/`, and `hash-test-vectors.md` includes real
small-object and minimal-homepage vectors. Phase 2 renderer/publish work should
use those helpers rather than inventing a second hash path.
