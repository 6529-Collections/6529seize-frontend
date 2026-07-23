# Run Log

## 2026-07-07

- Campaign delivery started from the approved plan (12 sequential PRs).
- PR 1 opened: `qa/device-farm-daily-web` → #3189. Device Farm schedule split
  into daily web (`0 4 * * 0,2-6`) and weekly full (`0 4 * * 1`); plan job
  selects packs by `github.event.schedule`; Discord title generalized.
  Noted in the PR that MOBILE_REPO_TOKEN is still required for the native
  pack to ever run.
- PR 2 built: `claude/e2e-pack-manifest`. tests/packs.manifest.ts (46 packs,
  CJS-styled TS), scripts/sync-e2e-manifest.cjs (byte-identical regeneration
  of the existing script block verified — "already in sync" on first run),
  scripts/e2e-packs.cjs (12 staging packs resolved in workflow order; empty
  resolution hard-fails), staging-e2e.yml migrated with legacy fallback,
  drift step added to Debt Ratchet workflow, README pack tables generated,
  sonar CPD exclusion for the manifest, Jest coverage for both scripts.
