# Production Status and Remaining Work — 2026-10-01

[Master roadmap](../README.md)

## Delivery and Evidence

Native multi-competition functionality is deployed and enabled in production.
Roadmap phases describe architectural milestones; delivery Phase 4 describes
production promotion. Completing that delivery does not close every roadmap
acceptance gate or migrate existing competitions.

| Evidence | Result and boundary |
| --- | --- |
| [Backend PR #2125](https://github.com/6529-Collections/6529seize-backend/pull/2125) | Native commands, credits, runtime and downstream integrations merged. |
| [Frontend PR #4116](https://github.com/6529-Collections/6529seize-frontend/pull/4116) | Competition context, creation, discovery and native interaction merged. |
| [Frontend follow-up #4143](https://github.com/6529-Collections/6529seize-frontend/pull/4143) | Reviewed Sonar follow-up merged. |
| [Backend production deployment](https://github.com/6529-Collections/6529seize-backend/actions/runs/36726828323) | Final API deployment succeeded at `64c94b79386b471396dcc88b9bf2b86f01f8165c`, after dependent services. |
| [Frontend production deployment](https://github.com/6529-Collections/6529seize-frontend/actions/runs/36747875510) | Latest audited frontend deployment succeeded at `b0af0a37cb1cdca38c3e15cc89a9b55ebc27816c`. |
| [Production E2E, attempt 3](https://github.com/6529-Collections/6529seize-frontend/actions/runs/36749984846/attempts/3) | All 16 packs passed on that frontend revision, with retries. This is read-only production compatibility coverage. |
| Production activation record, 2026-09-30 | Unified reads, native writes, native execution and hub creation enabled after backend readiness; frontend production flag enabled. |
| Read-only production audit, 2026-10-01 | API reports the backend revision above; database/Redis healthy. Main Stage v3 hub/competition reads and legacy leaderboard succeed; its original competition retains legacy ownership. |

The release record includes real native Rank and Approve staging executions,
162 API checks across 20 type/credit/scope combinations, and legacy Main Stage
rehearsal. Positive card-set credit on real staging identities was not exercised
because those identities had zero eligible credit. Accelerated fixtures do not
prove a full 24-hour aging interval. Local native browser tests use mocked API
responses; neither those tests nor production read-only E2E prove a complete
native production create/vote/decision lifecycle.

The audit inspected source, release records and live reads. It did not create
production entries/votes/decisions or survey all production native records.

## What Is Shipped

- Phase 1 additive schema, stable legacy-primary mapping and unified reads,
  including independent legacy comparison and independent credit-budget parity.
- Phase 2 competition routes, scoped context/cache identity and explicit detail
  selection, alongside the retained original-competition frontend path.
- Phase 3 hub creation, native drafts, publication and administration.
- Phase 4 native Rank/Approve entries, isolated credits and votes, snapshots,
  decisions, winners, award descriptors, retry-safe outbox/effects and privileged
  integrations. Legacy execution continues independently.
- Phase 6 competition collection/discovery, creation controls, shared chat,
  product/help documentation and production activation.

Current product policy is in the amended [decision register](../phase-0/decision-register.md).
In particular: dedicated immutable competition drops; one competition per drop;
delete rather than withdraw/disqualify; winner-only lifecycle notifications;
editable participation/voting access groups; no manual end/cancel commands.

The new [default competition](../default-competition.md) requirement is approved
but **not deployed**. Development-branch implementation and Phase 2 review/CI
are tracked separately in [delivery evidence](./default-competition-delivery.md). Existing explicit competition routes and the legacy
primary view do not satisfy automatic wave-entry/default-tab selection.

## Coexistence Boundary

Existing competitions, including Main Stage, still use legacy storage and
execution. New native competitions use their own records and runtime. The
current frontend creates native hubs, while old creation APIs remain available.
Creation date alone therefore does not identify the storage mode.

Legacy wave-scoped GETs always project the immutable original primary. A native
hub without a legacy primary projects as chat. A changing UI default must never
replace this mapping, change a worker's execution owner, or redirect a vote that
already names a competition.

Neither legacy-data migration nor engine retirement has shipped. Specifically,
the complete native-backed permanent GET facade, storage-aware old write
dispatch, durable migration catch-up and guarded cutover/rollback are still
work for [Phase 5](../phase-5-legacy-data-migration.md). Copying rows and changing
a storage flag is insufficient.

## Open Acceptance Evidence

These gates remain open until linked evidence demonstrates them. A missing
record is not proof that a deployed component is failing or an alarm is absent.

| Gate | Current evidence / required closeout | Responsible role |
| --- | --- | --- |
| Representative native production completion | Staging native execution and production compatibility pass. Record representative production-native Rank/Approve completion and side-effect correctness before migrating legacy competitions. | Backend + operations |
| Independent production parity | Independent comparison code is present. Record coverage and zero critical mismatches, plus seven consecutive full comparison windows without non-critical read mismatches before each storage-mode cutover. Old self-comparison samples do not qualify. | Backend + operations |
| Performance and alerts | The audit found aggregate Lambda health, not recorded decision-lag p95/p99 budgets, endpoint GET p95/error budgets, or verified competition-specific backlog/duplicate-effect alerts. Attach measurements, thresholds and operational alert evidence. | Operations |
| Original creation shortcut | The enabled UI uses separate hub/competition creation. The Phase 3 combined Rank/Approve shortcut remains unimplemented; implement it or record an explicit product amendment before closing that requirement. | Frontend + product |
| Rollout acceptance | Record cohort outcomes, device/accessibility/support acceptance and known coverage limits. Shipped controls do not themselves prove all Phase 6 exit criteria. | Frontend + product + operations |
| Migrated-client compatibility | Old primary views work against legacy data. Prove frozen GET contracts and supported old writes against native-backed migrated data during Phase 5. | Backend + frontend |

The [baseline acceptance requirements](../phase-0/baseline-parity-plan.md#acceptance-thresholds)
and [observability plan](../phase-0/rollout-rollback-observability.md) remain in
force. They required operational thresholds before native enablement; this
reconciliation records the evidence gap rather than retroactively declaring
that gate passed. Assign named execution owners when scheduling closeout.

## Remaining Sequence

1. Keep this roadmap, its decisions and linked evidence aligned with production.
2. Release the implemented default-competition experience after its linked PR
   review/CI gates, following the backend-first order in delivery evidence. This
   Phase 6 follow-up can ship during legacy/native coexistence without migrating
   old data first.
3. Prepare Phase 5 compatibility routing, restartable backfill, durable catch-up,
   parity reporting and cutover/rollback. Engineering can proceed while
   operational evidence is collected; production cutover waits for its gates.
4. Migrate completed low-risk competitions first, then active/unusual/high-volume
   competitions, and Main Stage/other privileged competitions last.
5. Complete remaining Phase 6 acceptance and Phase 7 retirement. Preserve
   permanent GET contracts and required historical data throughout.

## Deployment Boundary

This roadmap correction changes documentation only: no frontend deployment,
backend Lambda redeployment or schema change is required.

The native release used backend-first order: `dbMigrationsLoop` →
`claimsBuilder` → `pushNotificationsHandler` →
`waveLeaderboardSnapshotterLoop` → `tdhLoop` → `newsletterLoop` (production) →
`waveDecisionExecutionLoop` → `api` → frontend. Future changes deploy only
their affected dependencies, with backend compatibility ready before dependent
frontend merge/deployment. Each follow-up must record its own order and evidence.
