# Default competition delivery evidence

[Approved contract](../default-competition.md) · [Master roadmap](../README.md)

Status: implemented on development branches; delivery Phase 2 bot review and CI
pending. Not merged or deployed. This delivery phase is separate from roadmap
Phase 2 and makes no production-release claim.

## Read and navigation boundary

The additive default-selection endpoint owns policy across every competition
in a readable wave. Its generated OpenAPI model carries nullable competition ID,
server evaluation time and next time boundary. Viewer-partitioned queries use
server durations, bounded polling, focus refetch and scoped lifecycle invalidation.
No paginated collection or device-clock heuristic chooses the default.

The server uses current legacy wave periods and decision progress, native
publication/completion evidence, null/unbounded dates, exclusive legacy versus
inclusive native ends, pending/paused decisions and Approve completion rules.
Archived completed history ranks by end, never archive time; cancellations and
unpublished drafts cannot win. Equal times use ascending immutable ID. Full
normalization, query cost and migration evidence live in the backend
`docs/default-competition-navigation.md`.

Implicit wave and app-shell entry resolve to a canonical competition route with
an implicit marker. Familiar tabs route to that ID. Explicit tab/competition/entry
navigation and opening a command pin the context. Shared chat and collection
remain available. Reload and browser history preserve explicit competition and
view. Legacy-primary reads, execution, Main Stage capabilities and per-competition
credit stay separate from navigation selection.

## Validation

- Backend: 78 focused selector/service/API, legacy parity and MySQL index tests
  passed. Root and API packaging checks are in progress.
- Frontend: 177 competition/context/mobile tests and 5 selection-query tests passed.
  Lint, full TypeScript, Playwright types and docs links passed. React Doctor
  completed with 96/100 and no errors; warnings concern existing component
  size/state/effects and search-param consumers covered by route Suspense.
  Production build is in progress.
- Browser: native competition sandbox retains existing vote isolation, shared
  chat, history, draft editing, submission and recovery journeys. Added implicit
  entry, corresponding tabs, explicit reload/history, server boundary refresh,
  open-entry pinning and zero-default chat coverage on desktop and mobile.
  All 20 desktop/mobile browser checks passed, including legacy desktop alias,
  simulated native-app entry and selection-error recovery.
- The existing `native-competition-sandbox` pack remains registered in
  `tests/packs.manifest.cjs` and the protected native-competition PR CI lane.
  Chat URL expectations now retain explicit selection to prevent default reentry;
  competition-tab URLs now retain view to satisfy reload/Back/Forward requirements.
- Product docs and canonical/generated help corpus describe the implemented UX.
  Roadmap status remains unmerged and undeployed until a separate release.

## Future zero-downtime release

1. Backend `dbMigrationsLoop`: apply the additive online legacy-decision index,
   verify it exists. The migration refuses blocking fallback and preserves the
   index on rollback.
2. Backend `api` (`seizeAPI`): deploy and verify selection plus frozen GET parity.
3. Only after backend success, merge/deploy frontend in that environment, then
   require the related desktop/mobile E2E run before further promotion.

No native decision/leaderboard worker, consumer or legacy data cutover is needed.
Rollback frontend navigation before rolling back its endpoint; keep the index
and competition data. Phase 2 work stops at reviewed green PRs.
