# Phase 0 Storm Lanes

Last updated: 2026-06-17.

## Purpose

Assign non-overlapping lanes for Phase 1 and the first implementation waves.

## Lane Map

### Storm Lead

Owned paths:

- `ops/workstreams/profile-native-cms-roadmap/**`

Responsibilities:

- Decision record.
- Phase gates.
- Cross-lane sequencing.
- PR labels and review checklist.

### Schema Captain

Owned paths:

- `ops/workstreams/profile-native-cms-roadmap/phase-1/schemas/**`
- `ops/workstreams/profile-native-cms-roadmap/phase-1/hash-test-vectors.md`

Responsibilities:

- Package schema.
- Payload schema.
- Shared definitions.
- Hash/canonicalization fixtures.

### Fixture Agent

Owned paths:

- `ops/workstreams/profile-native-cms-roadmap/phase-1/fixtures/**`

Responsibilities:

- Valid package corpus.
- Invalid package corpus.
- Fixture README and intended validation results.

### Frontend Renderer Agent

Owned future paths:

- CMS route files under `app/**` once implementation begins.
- CMS renderer components under a future `components/cms/**` or equivalent.

Responsibilities:

- Route resolution.
- Renderer shell.
- Metadata/OpenGraph.
- Static export integration.

### Art Display Agent

Owned future paths:

- Art/NFT display components.
- Media display fixtures and screenshots.

Responsibilities:

- Grids.
- NFT detail page.
- Lightbox.
- Posters.
- Provenance UI.

### Backend Publish Agent

Owned future paths:

- Backend API and storage/pointer implementation in the backend repository.
- FE API client contracts where required.

Responsibilities:

- Package records.
- Validation.
- Signing.
- Pointer ledger.
- Rollback.

### Storage Agent

Owned future paths:

- IPFS/Arweave adapters.
- Storage receipt verification.

Responsibilities:

- Decentralized storage uploads.
- Receipt verification.
- Retry/status model.

### Builder Agent

Owned future paths:

- Builder dashboard and page/block editor.

Responsibilities:

- Draft UX.
- Site tree.
- Validation checklist.
- Publish UX.

### Wallet Gallery Agent

Owned future paths:

- Wallet source loader.
- NFT metadata normalization.
- Gallery generator.

Responsibilities:

- Multi-wallet import.
- Snapshot provenance.
- Generated pages.
- Hide/feature controls.

### AI-Agent Affordance Agent

Owned future paths:

- MCP tool definitions.
- `SKILL.md` files.
- Source packet and patch schemas.

Responsibilities:

- Schema export.
- Source packets.
- MCP read/validate/preview tools.
- Agent patch schema and review flow.

### QA/Security Agent

Owned paths:

- `ops/workstreams/profile-native-cms-roadmap/phase-1/validation-plan.md`
- Future tests/screenshot plans.

Responsibilities:

- Validation matrix.
- Security checklist.
- Accessibility and media checks.
- CI/bot feedback loop.

## Collision Rules

- Schema changes require Schema Captain review.
- Fixture changes require Fixture Agent and Schema Captain review.
- Route shape changes require Storm Lead review.
- Publish/sign/storage changes require Backend Publish Agent and Storage Agent
  review.
- No agent should edit unrelated dirty worktree files.
