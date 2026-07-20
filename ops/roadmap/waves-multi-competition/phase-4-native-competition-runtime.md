# Phase 4: Native Competition Runtime

[Back to the master roadmap](./README.md)

## Tracking

- Status: Not started
- Delivery target: To be selected
- Owner: Unassigned
- Evidence: Add links to decisions, implementation, validation, and deployment
  records as the phase advances.

## Outcome

Native competitions can accept entries and votes, maintain isolated
leaderboards, execute decisions, produce outcomes, and coexist sequentially or
in parallel within one wave.

This is the first phase in which multi-competition behavior may become
operational for controlled cohorts.

## Entry Criteria

- Phase 3 exit criteria are complete.
- Native competition drafts contain every required execution setting.
- Decision, retry, cancellation, edit, and signature rules are approved.
- Worker deployment boundaries and feature controls are documented.
- Test fixtures cover parallel Rank and Approve competitions.

## In Scope

- Native competition publication and lifecycle scheduling.
- Native entry creation and moderation.
- Competition-scoped voting and credit budgets.
- Native leaderboard and snapshot execution.
- Native decision, winner, outcome, and pause execution.
- Competition-aware events, notifications, metrics, and cache invalidation.
- Privileged competition capabilities.
- Controlled production cohorts.

## Out of Scope

- Bulk migration of existing competitions.
- Removal of legacy workers or tables.
- Per-competition visibility/admin delegation unless separately approved.
- Cross-competition credit pools.

## Native Entry Lifecycle

Entry commands operate on an explicit competition and produce a stable entry
ID. Validate:

- Competition belongs to the wave containing the drop.
- Competition is published and accepting entries.
- Participation group and submitter identity.
- Maximum applications and duplicate policy.
- Metadata/media requirements.
- Terms, signature, configuration version, and replay protection.
- Any restriction on entering one drop into multiple competitions.

Moderation commands support the approved withdrawn and disqualified behavior.
They must define whether past votes remain visible, count toward history, or
are excluded from decisions.

The drop remains stable wave content. Entry state, including winner state,
changes independently.

## Native Voting

Votes target a competition entry, not only a drop. Enforce:

- Entry belongs to the specified competition.
- Competition and voting period are valid.
- Voting group eligibility.
- Signature and configuration version.
- Negative-vote policy.
- Per-entry vote cap.
- Competition-scoped credit budget.
- Idempotency and concurrency-safe spend accounting.

A voter spending credits in one competition must not change their available
credits in another parallel competition.

Legacy vote endpoints remain available. Their compatibility handler resolves
the stable legacy competition and dispatches according to that competition's
storage mode.

This mutation compatibility may follow a separate deprecation policy. All
current external GET endpoints remain permanently compatible regardless of the
mutation policy.

## Leaderboards and Snapshots

Native leaderboard processing is keyed by competition and entry. It must
preserve approved ranking, tie, time-lock, threshold, and hidden-vote behavior.

The snapshot worker:

- Discovers only competitions assigned to the native engine.
- Is safe when legacy and native competitions share a wave.
- Never aggregates votes across competitions.
- Uses idempotent snapshot keys.
- Exposes competition-specific lag and failure metrics.

## Decision Execution

The decision engine discovers due native competitions through their own
schedule, not the wave's `next_decision_time`.

Required guarantees:

- One active execution lease per competition decision window.
- Unique decision identity prevents duplicate finalization.
- Retries are idempotent across decision, winners, entry status, outcomes,
  distributions, announcements, and claims.
- A native winner updates entry status without changing drop identity.
- Pauses and resumed schedules are competition-specific.
- One competition failing does not block another competition in the same wave.
- A cancelled or archived competition cannot execute accidentally.
- Legacy workers ignore native competitions.

## Outcomes, Distributions, and Privileged Capabilities

Outcomes and distributions are read from the competition. Any external side
effect must be protected by a unique competition decision/outcome key.

Replace wave-ID-only privilege checks with designated competition capabilities
for flows such as:

- Main Stage winner announcements.
- Minting or claim eligibility.
- Curation or quorum presentation.
- Metrics recorded only for designated competitions.

During compatibility, a legacy competition may inherit its capability from the
current special wave configuration. Native competitions receive capabilities
through explicit configuration. Unrelated competitions in the same wave must
never inherit privileged behavior.

## Events and Notifications

Events retain `wave_id` and add competition and entry identity as appropriate.
Define events for:

- Competition published, started, paused, resumed, ended, cancelled, archived.
- Entry created, withdrawn, disqualified, or selected as winner.
- Vote/leaderboard changes at the approved aggregation level.
- Decision and outcome completion.

Wave-level subscribers may receive lifecycle announcements according to the
approved defaults. Avoid per-entry notification volume unless a user explicitly
opts in.

Frontend cache invalidation should update the affected competition and the
wave's aggregate summaries without refreshing unrelated competitions.

## Compatibility Writes

Before any legacy competition is migrated in Phase 5, existing write endpoints
must be able to dispatch by competition storage mode:

- Legacy mode uses current wave/drop/vote execution.
- Native mode resolves the stable competition/entry and uses native commands.

This lets old mutation clients keep operating for the approved support period
after a legacy competition is moved to native storage. If an old write request
is ambiguous for a hub with multiple native competitions, it fails safely
rather than selecting one. Legacy GETs are never ambiguous: they use the
immutable primary competition or a chat-only native-hub projection.

## Deployment Order

1. Deploy any remaining additive runtime tables and indexes.
2. Deploy decision, leaderboard, notification, distribution, and claim workers
   that understand both modes, with native discovery disabled.
3. Deploy APIs for native lifecycle, entries, votes, and compatibility writes,
   with native publication/execution disabled.
4. Deploy the frontend capable of native competition operations.
5. Enable native publication and execution in non-production.
6. Run full parallel-competition and failure-retry scenarios.
7. Enable an internal production cohort.
8. Expand only after decision, vote, credit, and side-effect telemetry is
   healthy.

Backend runtime support must be completely deployed before the dependent
frontend is enabled.

## Validation

### Entry and Voting

- Parallel competition eligibility and credit isolation.
- Signature replay across competition IDs and config versions is rejected.
- Maximum applications and duplicate policies under concurrency.
- Withdrawal/disqualification behavior before and after voting.
- Old and native endpoint authorization and ambiguity handling.

### Leaderboard and Decisions

- Rank and Approve behavior, thresholds, ties, time locks, and maximum winners.
- Participation/voting boundary timestamps.
- Pauses, resumes, cancellations, retries, and delayed worker execution.
- Two competitions in one wave becoming due simultaneously.
- Duplicate worker delivery and lease contention.
- One competition failing while another completes.
- Winner entry state changes without drop mutation.

### Side Effects

- Outcomes and distributions are emitted once.
- Notifications and websocket messages carry correct IDs.
- Claims/mints are available only for the designated competition.
- Unrelated competition winners in a privileged wave receive no privilege.
- Metrics and cache invalidation are competition-scoped.

### Frontend

- Switching between simultaneous competitions does not leak timers, votes,
  credits, leaderboard rows, or selected tabs.
- Chat remains one shared hub timeline.
- Entry links open the correct competition.
- Ended, cancelled, paused, upcoming, and active states render correctly.
- Mobile/desktop navigation remains usable with several competitions.

## Observability Gates

- No duplicate decision, winner, outcome, distribution, claim, or announcement.
- Decision lag stays within the approved threshold.
- Vote totals and remaining credits are internally consistent.
- No cross-competition cache or credit contamination.
- Native worker retry rates are understood and bounded.
- Old-client ambiguous write attempts are measured and fail safely.

## Rollback

- Stop publishing new native competitions.
- Disable native discovery in workers.
- Allow already active native competitions to follow the pre-approved incident
  path: continue on a known-good worker version or pause safely.
- Do not route a partially executed native competition into the legacy engine.
- Preserve all native records for diagnosis and resumption.
- Keep hub chat available.

The incident runbook must distinguish “disable new work” from “pause active
competition,” because abruptly switching engines is unsafe.

## Deliverables

- Native entry, voting, leaderboard, decision, outcome, and pause execution.
- Competition-aware events, notifications, caching, and metrics.
- Privileged competition capability routing.
- Legacy endpoint compatibility dispatch.
- Parallel-competition integration and browser evidence.
- Native runtime incident and rollback runbook.

## Exit Criteria

- Controlled native competitions complete end to end without legacy execution.
- Two parallel competitions in one wave have isolated entries, credits,
  leaderboards, decisions, and outcomes.
- Duplicate delivery and retries produce no duplicate side effects.
- Privileged competition behavior is no longer granted solely by sharing a
  wave ID.
- Existing external GET clients continue receiving their frozen response
  contracts; old mutation clients dispatch or fail safely according to the
  separate mutation support policy.
- The system is ready to migrate existing competitions individually.

## Next Phase

Proceed to [Phase 5: Legacy Data Migration](./phase-5-legacy-data-migration.md).
