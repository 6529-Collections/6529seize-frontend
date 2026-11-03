# Default competition delivery evidence

[Approved contract](../default-competition.md) · [Master roadmap](../README.md)

Status as audited on 2026-10-02: merged. Review and CI are tracked in [backend PR #2131](https://github.com/6529-Collections/6529seize-backend/pull/2131)
and [frontend PR #4147](https://github.com/6529-Collections/6529seize-frontend/pull/4147).
[Frontend production deployment](https://github.com/6529-Collections/6529seize-frontend/actions/runs/37003539308)
succeeded at `4bd1c80f05c9f845779b75abd5b92d737cc1c6aa`.
[Related production E2E](https://github.com/6529-Collections/6529seize-frontend/actions/runs/37005453102)
failed in the Museum collection pack; native-competition and social packs passed.
This deployment evidence does not establish legacy migration acceptance or claim
a green aggregate production E2E run.

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

The familiar wave tab strip remains available on competition detail and
collection routes. Its competition views retain an explicitly selected ID even
when the current default changes; Competitions opens the collection. Explicit
Chat intent is recorded even from a bare wave URL.

## Validation

- Backend: full local suite passed (675 suites, 8,440 tests), plus 50 review
  follow-up selector/service/API/index regression tests. Legacy adapter parity,
  actual MySQL covering-index EXPLAIN, root/API packaging, TypeScript and lint
  passed. The reviewed endpoint/index changes passed GitHub CI with no new bot
  findings; current head status lives in the linked PR.
- Frontend: 211 focused competition/context/mobile tests passed, including
  viewer-key invalidation, selection refresh, editor-route exclusion, form pinning
  and explicit/default tab precedence. Changed-file quality, full TypeScript,
  Playwright types and docs links passed. React Doctor reported no errors
  (96/100 for initial implementation, 98/100 for review follow-up); warnings
  concern existing component size/state/effects and route-Suspense-covered
  search-param consumers. Production build passed with public CI configuration.
- Browser: native competition sandbox retains existing vote isolation, shared
  chat, history, draft editing, submission and recovery journeys. Added implicit
  entry, corresponding tabs, explicit reload/history, server boundary refresh,
  open-entry pinning and zero-default chat coverage on desktop and mobile.
  All 20 desktop/mobile browser checks passed, including legacy desktop alias,
  simulated native-app entry and selection-error recovery.
- The analytics script loader is locally stubbed so telemetry cannot cause
  nondeterministic external writes; the sandbox mutation guard remains strict.
- The existing `native-competition-sandbox` pack remains registered in
  `tests/packs.manifest.cjs` and the protected native-competition PR CI lane.
  Chat URL expectations now retain explicit selection to prevent default reentry;
  competition-tab URLs now retain view to satisfy reload/Back/Forward requirements.
- Product docs and canonical/generated help corpus describe the implemented UX.
  Current merge/deployment evidence is recorded above; this does not close migration gates.
- Stable-tab follow-up: 79 focused tests cover route transitions, direct detail
  reload without default data, explicit competition precedence and bare-URL Chat
  intent and a visible collection tab before hub availability loads. The
  desktop/mobile pack also checks familiar tabs across inner-view
  changes, reload, Back/Forward and collection navigation. Existing inner-tab
  selectors are scoped to the competition panel because familiar labels now
  remain available in the wave header as requested.
- Review follow-up: serial-target Chat intent wins over retained FAQ/Sales tab
  queries, and My Votes uses the same explicit/default competition ID as tab
  availability. Six reproducing unit cases and a desktop/mobile selection-error
  journey cover these gaps; the focused context/navigation/mobile set passes
  110 tests, including preservation of legacy competition views on serial-target
  entry links.

## Zero-downtime release order

1. Backend `dbMigrationsLoop`: apply the additive online legacy-decision index,
   verify it exists. The migration refuses blocking fallback and preserves the
   index on rollback.
2. Backend `api` (`seizeAPI`): deploy and verify selection plus frozen GET parity.
3. Only after backend success, merge/deploy frontend in that environment, then
   require the related desktop/mobile E2E run before further promotion.

No native decision/leaderboard worker, consumer or legacy data cutover is needed.
Rollback frontend navigation before rolling back its endpoint; keep the index
and competition data. Future delivery Phase 2 changes stop at reviewed green PRs.
