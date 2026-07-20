# Phase 5: Legacy Data Migration

[Back to the master roadmap](./README.md)

## Tracking

- Status: Not started
- Delivery target: To be selected
- Owner: Unassigned
- Evidence: Add links to decisions, implementation, validation, and deployment
  records as the phase advances.

## Outcome

Existing single-competition waves can be migrated to native competition
storage one at a time without losing entries, votes, decisions, outcomes, or
special capabilities and without interrupting their hub chat.

Legacy data remains available for rollback until the retirement phase.

## Entry Criteria

- Phase 4 exit criteria are complete.
- Native execution has completed representative production-cohort
  competitions successfully.
- Legacy write endpoints can dispatch by competition storage mode.
- Backfill mappings and parity rules are approved.
- An operational owner and incident window exist for every migration cohort.

## In Scope

- Idempotent legacy-to-native backfill tooling.
- Continuous catch-up/reconciliation during migration.
- Per-competition readiness and execution-mode cutover.
- Legacy API projection backed by native records after cutover.
- Progressive migration of current Rank/Approve competitions.
- Historical-data migration policy.

## Out of Scope

- Dropping legacy tables or columns.
- Removing or incompatibly changing any GET API in the permanent compatibility
  manifest.
- Forcing every historical vote snapshot into native storage if it is not
  required by product or audit needs.
- Broad UX changes.

## Migration Unit and State

The migration unit is one stable legacy competition, not an entire wave table
or all competitions at once.

Track an explicit migration state such as:

- `LEGACY`
- `BACKFILLING`
- `SHADOWING`
- `READY`
- `CUTTING_OVER`
- `NATIVE`
- `ROLLBACK_REQUIRED`

State transitions are auditable and guarded. APIs and workers use the same
authoritative state.

## Backfill Order

Backfill in dependency order:

1. Competition definition and lifecycle.
2. Outcomes and distributions.
3. Entries derived from participatory and winner drops.
4. Pauses and decision schedule.
5. Decisions and winner relationships.
6. Current votes, credit spend, voter state, and leaderboard.
7. Required historical snapshots and archived vote detail.

Historical data may be retained behind the legacy adapter rather than copied
immediately, provided user-visible history and audit obligations remain
correct.

## Identity and Mapping

- Legacy competition IDs are already stable from Phase 1 and do not change.
- Entry IDs are deterministic or stored in a durable mapping so retries cannot
  create duplicates.
- Each legacy participatory/winner drop maps to exactly one legacy competition
  entry under the initial single-competition model.
- Winner status and rank are represented on the entry/decision while legacy
  drop type remains available for compatibility.
- Outcome, decision, winner, and vote mappings use unique source identifiers or
  deterministic keys.

## Online Catch-Up

A one-time snapshot is insufficient because entries, votes, and decisions may
change while backfill runs.

Use an outbox/change-capture or equivalent durable mechanism on authoritative
legacy writes:

1. Record an ordered source watermark.
2. Backfill records up to that watermark.
3. Apply subsequent changes idempotently to native shadow storage.
4. Reconcile counts and value-level parity.
5. Drain through a final cutover watermark.
6. Atomically switch the competition's authoritative mode.
7. Route subsequent old and new API calls to native commands.

Avoid an unobserved best-effort dual write. If dual writing is used, failures
must enter a durable retry queue and prevent readiness until reconciled.

## Cutover Safety

Before marking a competition `READY`, verify:

- Configuration and lifecycle parity.
- Entry and winner mapping completeness.
- Vote and credit totals.
- Leaderboard order and ties.
- Pauses and next-decision schedule.
- Decision and outcome completeness.
- Special capability assignment.
- No unresolved catch-up events.
- Current workers can process the native state.

During cutover:

- Acquire a per-competition migration/execution lease.
- Prevent the legacy decision worker from starting a new decision.
- Finish or safely abort any in-flight legacy execution.
- Apply the final change watermark.
- Atomically switch authoritative storage/execution mode.
- Release native worker discovery only after the mode is committed.

User writes should continue through storage-aware commands. If a very short
retry window is unavoidable, requests must be idempotent and automatically
recoverable rather than silently lost.

## Permanent Legacy GET Projection After Cutover

All GET endpoints in the permanent compatibility manifest continue to return
their frozen legacy shapes, now derived from native competition/entry records
and retained history.

For compatibility:

- Native winner entries may project as winner drops without requiring actual
  drop mutation.
- Wave-scoped rules project from the one migrated legacy competition.
- The immutable `legacy_primary_competition_id` never changes when later
  competitions are added.
- Pagination, ordering, required/null fields, and status/error behavior stay
  contract-compatible.
- Old vote/submission commands dispatch to that stable competition only for
  their separately approved mutation support period.
- Projection is allowed only for a wave's original legacy competition.
- A multi-competition native hub never projects an arbitrary competition.

## Cohort Order

Migrate increasing-risk cohorts:

1. Completed internal/test competitions with no privileged outcomes.
2. Completed ordinary public competitions.
3. Active low-volume competitions with simple voting rules.
4. Paused, high-volume, or unusual-credit competitions.
5. Main Stage and other privileged competitions.

Do not use creation time alone as a risk proxy. Cohorts should consider vote
volume, history size, lifecycle, custom outcomes, pauses, special capabilities,
and old-client traffic.

## Reconciliation and Invariants

At minimum enforce:

- Exactly one legacy competition mapping per non-chat legacy wave.
- Exactly one expected entry mapping per legacy participatory/winner drop.
- No duplicate vote-spend or voter-state records.
- Equal current vote totals and remaining credits.
- Equal leaderboard rank/order after documented normalization.
- Equal decisions, winners, outcomes, and distributions.
- No duplicate claim/mint eligibility.
- One authoritative engine per competition.

Parity exceptions require explicit, reviewed normalization rules. They must not
be dismissed as harmless without evidence.

## Deployment and Operations

1. Deploy backfill, outbox/catch-up, reconciliation, and dashboards with no
   eligible production cohort.
2. Dry-run against representative non-production copies or synthetic fixtures.
3. Backfill completed low-risk production competitions without cutover.
4. Review shadow parity and query performance.
5. Cut over a small completed cohort.
6. Confirm permanent GET projection and native reads.
7. Progress through the risk cohorts with explicit go/no-go review.
8. Migrate privileged competitions last with dedicated side-effect validation.

Every job is restartable and rate-limited so migration load cannot starve live
chat, voting, or decision traffic.

## Validation

- Re-running every backfill step changes no already-correct data.
- Catch-up resumes from durable watermarks after interruption.
- Concurrent entries/votes during backfill appear exactly once natively.
- Decision execution cannot cross engines during cutover.
- Old and new APIs return equivalent current results after cutover.
- Frontend deep links and competition context keep the same stable ID.
- Completed history remains readable.
- Rollback rehearsal succeeds before active high-risk cohorts.
- Privileged outcome/claim/mint behavior is unchanged for its designated
  competition.

## Observability Gates

- Backfill progress, rate, lag, retry count, and terminal failures.
- Catch-up watermark lag.
- Per-category parity mismatches.
- API behavior segmented by storage mode.
- Decision/leaderboard worker discovery by mode.
- Old endpoint traffic against migrated competitions.
- Database load and live request latency.

## Rollback

Before irreversible native-only side effects occur, rollback can atomically
route the competition back to legacy authority after reconciling changes in the
opposite direction.

After native decisions or external side effects have occurred, never blindly
switch engines. Use the competition-specific incident runbook to preserve the
authoritative decision record and either repair native execution or perform a
reviewed reverse reconciliation.

In all cases:

- Stop the affected cohort.
- Preserve both data sets and event logs.
- Keep wave chat available.
- Do not delete native or legacy records during incident response.

## Deliverables

- Idempotent backfill and mapping tools.
- Durable catch-up/change-capture path.
- Reconciliation reports and dashboards.
- Per-competition migration state and cutover controls.
- Permanent native-backed legacy GET façade and contract test suite.
- Cohort ledger and go/no-go checklist.
- Rollback rehearsal evidence and incident runbook.

## Exit Criteria

- All supported existing competitions are either migrated or explicitly
  recorded as temporary legacy exceptions.
- Every migrated competition passes configuration, entry, vote, leaderboard,
  decision, outcome, and capability parity.
- External clients using any current GET API operate correctly through the
  native-backed legacy projection without adopting the new API.
- No migration cohort causes duplicate decisions or side effects.
- Remaining legacy storage/execution usage is measurable and suitable for
  broad rollout and internal retirement planning. Permanent GET façade traffic
  is expected and is not a retirement blocker.

## Next Phase

Proceed to [Phase 6: Progressive Rollout](./phase-6-progressive-rollout.md).
