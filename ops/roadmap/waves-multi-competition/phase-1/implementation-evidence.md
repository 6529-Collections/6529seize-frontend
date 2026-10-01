# Phase 1 Implementation and Validation Evidence

## Current Status — 2026-10-01

This file preserves the dated foundation follow-up evidence below. Its local-only
scope, pending deployment, remaining-credit gap and not-started frontend status
are historical, superseded by the [production assessment](../native-delivery/production-status-2026-10-01.md).
Independent credit comparison and native frontend/runtime are now shipped.
Production parity/performance acceptance and migration compatibility remain open.
D-05/D-17 have been resolved in the amended [decision register](../phase-0/decision-register.md).
Do not use the earlier preview or rollback instructions as the active native
release runbook; preserve unified reads while current frontend consumers depend
on them.

## Historical Assessment — 2026-09-28

Roadmap Phase 1 remains **In progress**. The original additive foundation is on
main, but that fact does not establish its staging/production acceptance gates.
This follow-up completed local implementation, checks, and a localhost preview
in isolated worktrees. It is now proceeding to repository **delivery Phase 3**:
PR review/check completion followed by staging deployment and related E2E.
Deployment evidence must be recorded in the associated PRs; local results below
do not establish staging acceptance. Production is outside this delivery.

The main-branch audit found that the shadow comparator received two instances
of `LegacyCompetitionAdapter`. Its historical matches did not independently
validate the new read path. Historical completion statements in this record
must not be used as production parity evidence.

D-05 remains deferred to the roadmap Phase 4 native-mutation gate; D-17 remains
deferred to the roadmap Phase 6 presentation rollout gate. Roadmap Phase 2
frontend migration is not included in this follow-up.

## Source Baselines

- Backend main: `9ca146a4f8ab51c1f17babca64ac59a63ce10d21`.
- Frontend main: `fbc351e1aeaa41a3a8bf0f3c6d8e055e808a1923`.
- Both worktrees start from newly fetched main refs.
- The original foundation was merged in backend PR #1773 and frontend PR #3376.
- Frozen Phase 0 census: 296 mounted GET route shapes and 183 OpenAPI GET
  operations. These are the frozen baseline counts, not today's total API size.
- No OpenAPI or generated-model changes are required by this follow-up.

## Current Implementation

The original foundation provides 13 competition entities, stable legacy-primary
mapping/backfill, a legacy adapter, native read repository, unified service,
execution router, feature flags, and 14 additive `/v3/waves` read operations.
Ordinary wave writes maintain the mapping; legacy decision/leaderboard workers
consult execution routing even when unified reads are disabled. Native writes,
execution, and hub creation are still not implemented/enabled by this milestone.

The follow-up replaces the self-comparison with an independent legacy-table
baseline. The candidate traverses the unified adapter's paged domain reads.
Both use one repeatable-read transaction and one timestamp. The baseline does
not call the adapter or the competition repository's legacy read methods, and
it checks special-wave configuration against stored capability assignments.
No native vote mirroring, executor, or migration is needed for this comparison.

Complete samples persist 12 supported categories atomically, using the source
prefix `legacy-read-v2:`. Older observations must be excluded from acceptance
statistics. Collection or persistence failures leave the API response intact;
they log only sample identifiers and a safe failure reason. One sample may run
per API process at a time. Each raw source/candidate collection is capped at
10,000 rows; an oversized sample is skipped, never silently truncated.
Samples use the existing SQL execution budget with a 2-second overall deadline,
500 ms statement limit, and 250 ms finalization reserve. The primary connection
keeps reads and observation writes in one atomic snapshot. Skip reasons and
sample duration are logged for coverage and latency monitoring.

The comparison covers configuration/lifecycle, entry membership/status, vote
totals and spending, leaderboard order/ranks/ties, decisions/winners,
outcomes/distributions, pauses, and capabilities. Generated IDs and
configuration-version binding remain independently covered by existing tests.
The baseline and candidate share the pure phase calculator; its semantics are
validated by the separate phase tests, not independently by shadow matching.

**Remaining-credit coverage is still a gap.** The existing voter contract
contains votes and credit spending, not a remaining-credit budget. The previous
`CREDIT_AVAILABLE` observation merely compared the voter array. This follow-up
stops emitting that misleading category. Neither spending matches nor these
local checks satisfy the roadmap's remaining-credit acceptance criterion.

Production frontend code still has no `ApiCompetition`/`ApiWaveV3` consumers or
v3 competition requests. This milestone adds no competition creation UI.

## Local Validation

Current results are from the isolated follow-up worktrees. Package operations
use the repository-local `6529` wrapper. MySQL integration tests use disposable
Testcontainers databases. The initial browser validation used a separate local
MySQL container and synthetic data. At the user's request, the manual preview
was then restarted against the existing local database and normal local Redis.
Its competition schema was already aligned, and the idempotent backfill found
no missing mappings. Existing waves were preserved, and the browser
displayed the existing wave list and profile feed.

| Check                                                | Current result                                                                                                                                                                            |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend focused competition/service/API/flags tests  | 15 suites, 82 tests passed on Node 22.22.0.                                                                                                                                               |
| Backend `6529 run lint`                              | Passed, zero warnings.                                                                                                                                                                    |
| Backend `6529 run tsc -- --noEmit`                   | Passed on Node 22.22.0.                                                                                                                                                                   |
| API package `6529 run build`                         | Passed generation, bundle, and deployable zip creation; generated source remained unchanged.                                                                                              |
| Frontend Phase 1 contract test                       | Passed all 5 cases, including the prohibition on production v3 consumers.                                                                                                                 |
| Full backend `6529 run test -- --maxWorkers=2` suite | 637 suites, 7,962 tests passed on the local Node 24.6.0 runtime. The focused follow-up above also passed on the deployment major, Node 22.                                                |
| Local HTTP smoke                                     | All 14 v3 read operations returned 200 for seeded resources; cursor paging, Chat zero-competition behavior, and wrong-parent 404 passed. Legacy wave, leaderboard, and drop reads passed. |
| Committed local shadow sample                        | All 12 supported categories matched, including winner/outcome/distribution/pause fixtures.                                                                                                |
| Browser preview                                      | Rank leaderboard list view, Chat (including the prior winner), and Outcome render the synthetic data.                                                                                     |

The new MySQL tests prove independent parity for Rank and Approve fixtures,
locked leaderboards with and without snapshots, more than one 500-row entry
page, concurrent vote updates, and capability mapping drift. A mutation test
corrupts the candidate leaderboard through the real service and verifies stored
mismatches while the request succeeds. A persistence fault test proves partial
observations roll back. Slow-query and stalled-reader tests verify deadlines,
empty rolled-back observations, and successful subsequent sampling. Both real
readers reject 10,001 source rows. The legacy epoch-zero end sentinel and
voter-state uniqueness are covered. Unit tests cover safe-off sampling,
one-sample concurrency, exact collection boundaries, transaction acquisition
failures, deployed source tagging, a single timestamp, and log redaction.

The earlier 2026-07-20 command/test tallies are historical (available in Git
history), not results rerun against today's main. No staging or production
checks were performed in this local delivery.

## Local Testing

The current preview runs the existing frontend and built backend API against
the user's usual local database. It uses the original local environment settings
plus unified reads and 100% shadow sampling; all native mutation/execution flags
remain false. Open the normal Waves page to browse existing local waves. The
earlier synthetic fixtures remain in their separate database and are not copied
into the usual database.

The initial synthetic browser checks used the Rank wave's
**Leaderboard → List view** for text-only entries, then
**Chat**, **Outcome**, and a drop detail. Grid view expects artwork media, so
these text fixtures do not appear there. Browsing is anonymous; posting and
voting still require the existing wallet login. No test credentials for shared
environments are used.

The v3 APIs are tested directly: list competitions, open the returned stable
competition ID, page entries/leaderboard, and inspect voters, decisions, winners,
outcomes/distribution, pauses, and configuration versions. Chat waves return an
empty competition list. A competition under the wrong parent is masked with 404. The frontend continues using legacy routes and does not trigger shadow
sampling itself; the competition detail API request triggers a sample.

The source-based API dev launcher currently encounters pre-existing module
interop problems in the Museum JSON/Passport imports. The preview uses the
normal esbuild output, loads its local-only environment before startup, and
runs with the API assets directory as its working directory.

## Deployment Order and Rollback

For this follow-up delta, deploy only backend service **`api`** (Lambda `seizeAPI`) after verifying that
the original additive schema and mappings are present. No migration service,
worker, or frontend runtime deployment is required solely for these changes.
A future Phase 2 frontend migration must follow successful backend deployment.
The original foundation rollout order remains migration/schema → routing-aware
legacy workers → API → dependent frontend.

Disable unified reads and shadow comparison to roll back this read feature.
Leave additive schema/mappings in place. Ordinary wave writes and existing
workers still depend on that foundation; disabling v3 does not remove it.
The backend runbook at `docs/competition-read-boundary-runbook.md` describes
sampling, observation queries, and rollback.

## Outstanding Acceptance Gates

| Gate                                                        | State                                                                                                                            |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Independent local legacy read comparison                    | Supported categories pass; mutation tests prove disagreement is observable.                                                      |
| Independent remaining-credit comparison                     | Not implemented; do not count `CREDIT_AVAILABLE` as verified.                                                                    |
| Frozen GET compatibility                                    | Local route/OpenAPI and representative fixture regressions pass; this is not exhaustive live native-backed HTTP coverage.        |
| Staging deployment, health, and relevant E2E                | Pending delivery Phase 3; record actual deployment and E2E runs in the associated PRs. Do not infer acceptance from main merges. |
| Production sample threshold and zero unexplained mismatches | Unverified; requires a later authorized rollout and `legacy-read-v2:` observations.                                              |
| Production query cost, latency, and skipped-sample rate     | Unverified; inspect before expanding sampling, including competitions exceeding the row bound.                                   |
| Native-backed permanent façade after migration              | Remains dependent on later migration/runtime work and live contract validation.                                                  |
| Frontend migration readiness                                | Generated contracts exist; roadmap Phase 2 remains Not started.                                                                  |
