# Phase 0 Test Matrix

Last updated: 2026-06-17.

## Purpose

Define the validation bar for Phase 1 artifacts and the checks future waves must
inherit.

## Phase 1 Checks

Docs and JSON artifacts:

- All JSON schemas parse as JSON.
- All valid fixtures parse as JSON.
- All invalid fixtures parse as JSON and include documented expected failures.
- `codex-diff-check -- ops/workstreams/profile-native-cms-roadmap` passes.
- Workstream docs contain no accidental non-ASCII.

Manual review:

- Every Phase 0 blocker decision is either locked or marked human-review.
- Every Phase 1 schema has an owning lane.
- Every fixture maps to a launch-critical path.

## Future Phase Checks

Renderer:

- Fixture package renders at `/{handle}/index.html`.
- Metadata/OpenGraph tags render for home, collection, and NFT pages.
- Static export emits `index.html` routes and build manifest.

Publish:

- Package canonicalizes deterministically.
- Package hash matches fixture vector.
- Signature verification rejects wrong signer and altered payload.
- Pointer update rejects stale expected previous pointer.
- Rollback creates new pointer event.

Storage:

- IPFS receipt verifies content id.
- Arweave receipt verifies transaction/content relation.
- CDN acceleration does not count as canonical storage.

Art/NFT display:

- Detail page preserves aspect ratio.
- Grid layout has stable dimensions.
- Posters show before video/3D/interactive load.
- Lightbox keyboard path works.
- 3D canvas is nonblank where enabled.
- Mobile fallback exists for 3D room.

AI-agent affordances:

- Schema bundle export contains all V1 schemas.
- Source packet strips executable/untrusted HTML.
- Agent patch validation rejects unsafe URLs and route collisions.
- Publishing cannot be triggered by patch import alone.

