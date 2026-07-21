# Phase 7: Retire Wave Competition Coupling

[Back to the master roadmap](./README.md)

## Tracking

- Status: Not started
- Delivery target: To be selected
- Owner: Unassigned
- Evidence: Add links to decisions, implementation, validation, and deployment
  records as the phase advances.

## Outcome

The application no longer depends on competition configuration or execution
being stored on the wave. Legacy storage adapters, workers, mutation paths, and
obsolete schema are retired in a measured order.

Every GET API that was externally available at the Phase 0 baseline remains
permanently backwards compatible through a supported façade over native or
retained read data. Cleanup removes internal coupling, not those contracts.

## Entry Criteria

- Phase 6 exit criteria are complete.
- All active competitions use native execution.
- Remaining legacy exceptions have owners and retirement dates.
- The permanent GET contract suite passes against native-backed projections.
- Data retention, audit, and historical-view requirements are approved.

## In Scope

- Stop creation of legacy competition waves.
- Stop legacy competition writes and worker discovery.
- Remove frontend dependence on competition fields in wave responses.
- Make the permanent legacy GET façade independent of legacy physical storage.
- Retire old mutation APIs only according to their separate support policy.
- Remove drop-type winner/submission lifecycle dependence.
- Archive or remove obsolete schema only after retention gates pass.

## Out of Scope

- Product redesign unrelated to the separation.
- Immediate deletion of audit/history data.
- Removal, renaming, or incompatible behavior change of any external GET
  endpoint in the Phase 0 compatibility manifest.
- Combining cleanup with new competition features.

## Retirement Principles

- Stop producing legacy data before removing its storage paths.
- Move internal consumers to native contracts before removing legacy storage.
- Treat permanent GET traffic as supported product usage, not retirement debt.
- Keep GET paths, parameters, status codes, response shapes, required/null
  behavior, pagination, ordering, and error semantics compatible.
- Stop workers before removing their scheduling fields or tables.
- Archive or retain historical data before destructive schema cleanup.
- Treat schema deletion as a separate low-urgency release.

## Step 1: Freeze Legacy Creation

- Remove or disable backend paths that create a wave-owned Rank/Approve
  competition.
- Keep the compatibility creation shortcut, but make it create a native hub and
  native competition.
- Verify all supported frontends use hub and competition commands.
- Alert on any unexpected legacy creation attempt.

Do not proceed until no valid product flow requires new legacy competition
rows.

## Step 2: Stop Legacy Writes and Execution

- Move all remaining competitions to native storage/execution or record a
  reviewed permanent archive exception.
- Route supported old write endpoints through native commands.
- Disable legacy decision and leaderboard discovery.
- Disable legacy outcome, announcement, claim, and snapshot side effects.
- Keep read-only legacy data and reconciliation available.

Verify that no due competition remains dependent on wave-level decision
scheduling before removing worker support.

## Step 3: Remove Frontend Coupling

Remove production frontend reads of wave-owned competition configuration:

- Wave type as competition selection.
- Wave participation/voting settings.
- Wave decision timers and pauses.
- Winner/submission inference from drop type.
- Wave-only competition cache keys.
- Special competition presentation inferred only from wave ID.

Wave summaries may retain explicit competition counts and links. Competition
detail comes only from competition resources.

Keep telemetry temporarily for missing competition identity in old events and
cached data.

## Step 4: Harden the Permanent GET Façade

Move every endpoint in the Phase 0 public GET manifest onto an explicitly
owned compatibility layer backed by native competition/entry records and
retained history.

- Preserve paths, accepted parameters, authorization, status codes, response
  shapes, required/null behavior, enums, pagination, ordering, and errors.
- Keep an immutable `legacy_primary_competition_id` for every original
  Rank/Approve wave.
- Always project that original competition from wave-scoped legacy GETs,
  regardless of newer active or selected competitions.
- Project submission/winner state relative to that primary competition.
- Return a contract-valid chat-wave projection for native hubs with no legacy
  primary competition.
- Do not expose new competitions through legacy GETs.
- Keep frozen fixtures and consumer-style contract tests in permanent CI.
- Measure façade correctness, latency, and errors without using traffic volume
  as a reason for removal.

The façade is production architecture, not a temporary shim. Internal services
and the current frontend should still use native APIs so new functionality does
not become constrained by the frozen contract.

## Step 5: Normalize Drop and Entry Semantics

- Make entry context authoritative for submission and winner status.
- Stop mutating drops between participatory and winner identities.
- Update historical readers to join or resolve competition entries.
- Preserve stable links and media/content identity.
- Keep legacy drop-type translation in the permanent GET façade.

Internal/native models simplify drop types around content semantics rather than
competition lifecycle. The façade performs the permanent wire translation for
old clients.

## Step 6: Remove Legacy Storage Adapters and Workers

Remove:

- Reads from obsolete legacy competition storage.
- Legacy execution/storage-mode branches after every competition is native.
- Wave-scoped decision and leaderboard execution.
- Legacy migration catch-up after its retention window.
- Migration-only reconciliation metrics and alerts.

Retain:

- Permanent GET route handlers and projection translators.
- Immutable legacy primary competition mappings.
- Contract fixtures and regression tests.
- Façade correctness, latency, and availability metrics.

Retain native incident, idempotency, decision, and side-effect protections.
They are permanent correctness requirements, not migration scaffolding.

## Step 7: Schema and Data Cleanup

Only after native application, permanent GET façade, worker, and audit readers
no longer depend on the obsolete physical schema:

- Archive required legacy history.
- Verify backups and restore procedures.
- Remove obsolete wave competition columns.
- Remove obsolete wave-scoped vote, leaderboard, decision, pause, outcome, and
  winner tables or fields.
- Remove obsolete indexes and mapping tables.
- Update schema documentation and operational dashboards.

Break cleanup into small migrations. Do not combine all table/column deletion
into one irreversible deployment.

## Deployment Order

1. Deploy frontend and backend versions that no longer produce legacy data but
   can still read it.
2. Disable legacy worker discovery and monitor for missed work.
3. Move internal frontend/backend readers to native contracts.
4. Deploy the permanent GET façade entirely against native/retained read data.
5. Remove legacy storage adapters and eligible mutation endpoints.
6. Observe at least the approved stability interval while permanent contract
   tests and façade telemetry remain healthy.
7. Perform separately reviewed schema/data cleanup releases without removing
   the GET façade.

Backend removal must not precede deployed frontend removal. Database cleanup
must not precede backend and worker removal.

## Validation

- No new legacy competition rows or wave competition writes occur.
- No active/due competition depends on legacy workers.
- Frontend works when legacy competition fields are absent.
- Every frozen external GET contract passes against native-backed data.
- Representative unchanged external clients receive the same paths, statuses,
  shapes, pagination, ordering, and error semantics.
- Adding or selecting another competition never changes the immutable primary
  competition projected by a legacy GET.
- New native hubs remain contract-valid chat projections to old clients.
- Historical competition links, entries, votes, winners, and outcomes remain
  readable according to retention policy.
- Claims/mints and privileged competition records remain auditable.
- Backups can restore any data scheduled for deletion.
- Removal releases pass staging with representative existing and native waves.

## Observability Gates

- Legacy create/write count remains zero.
- Legacy worker discovery remains zero.
- Permanent GET façade traffic, latency, availability, and contract failures.
- Requests and responses segmented by projection type: legacy primary or
  chat-only native hub.
- Old mutation endpoint traffic by client version under its separate policy.
- Events missing competition identity.
- Obsolete storage adapter invocation count remains zero.
- Historical read failures after each retirement step.
- Native decision, vote, and leaderboard health remains stable.

## Rollback

Before schema deletion, restore an internal legacy storage reader by deploying
the last compatible application version and re-enabling its non-executing
adapter. The permanent external GET façade stays available throughout.

Do not re-enable legacy decision execution for a native competition.

For schema cleanup:

- Use verified backups and archive tables.
- Prefer recoverable rename/archive steps before final deletion where
  practical.
- Define a restore procedure and maximum acceptable recovery time for each
  destructive migration.
- Stop cleanup immediately if an unknown consumer or history gap appears.

## Deliverables

- Legacy creation and write paths removed.
- Legacy workers retired.
- Frontend and API competition ownership fully native.
- Permanent native-backed legacy GET façade and compatibility manifest.
- Permanent consumer-style GET contract tests.
- Drop/entry semantics normalized.
- Legacy storage adapters removed.
- Historical retention/archive completed.
- Separately reviewed schema cleanup and restore evidence.
- Final architecture and operational documentation.

## Exit Criteria

- Wave records contain only durable hub responsibilities.
- All competition behavior uses explicit competition and entry identity.
- All active execution is competition-scoped.
- Current clients use native competition contracts while unchanged external
  GET clients remain fully compatible through the permanent façade.
- Legacy storage adapter and worker traffic is zero.
- Permanent GET projection traffic may remain non-zero and is fully supported.
- Every Phase 0 external GET contract remains available and passes regression
  tests against native/retained data.
- Required history remains correct and auditable.
- Obsolete schema is removed or intentionally archived with a documented owner
  and retention period.
- The global success criteria in the master roadmap are satisfied.

## Roadmap Complete

Return to the [master roadmap](./README.md) and record final evidence against
its global success criteria.
