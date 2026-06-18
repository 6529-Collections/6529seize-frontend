# Active Context

Last updated: 2026-06-18.

## Current Goal

Build the wallet gallery MVP shell inside the existing profile CMS builder.

## Branch

`codex/cms-gallery-builder-flow`, based on
`codex/profile-cms-builder-mvp`.

## Assumptions

- Backend gallery snapshot endpoints are not guaranteed to be merged yet.
- The frontend will keep a narrow adapter/mock boundary for snapshot review.
- Backend Phase 5 deterministic wallet-snapshot -> CMS V1 package generation is
  the durable source of truth; frontend package generation is temporary preview
  fallback only.
- Generated packages must stay valid `CmsPackageV1` objects using existing
  blocks, pages, assets, media profiles, source packets, signatures, and storage.
- Publish remains blocked by the existing signed-storage boundary.

## Next Actions

1. Commit with DCO signoff.
2. Push `codex/cms-gallery-builder-flow`.
3. Open the stacked PR against `codex/profile-cms-builder-mvp`.
4. Inspect bot/check feedback and address high-confidence findings.
