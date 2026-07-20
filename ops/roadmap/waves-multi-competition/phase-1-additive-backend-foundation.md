# Phase 1: Additive Backend Foundation

[Back to the master roadmap](./README.md)

## Tracking

- Status: Not started
- Delivery target: To be selected
- Owner: Unassigned
- Evidence: Add links to decisions, implementation, validation, and deployment
  records as the phase advances.

## Outcome

The backend can represent and read both legacy and native competitions through
one contract, while all production writes and execution continue using the
legacy model.

This phase is intentionally additive and not user-visible.

## Entry Criteria

- Phase 0 exit criteria are complete.
- Domain ownership and lifecycle semantics are approved.
- OpenAPI resource shapes and compatibility policy are approved.
- Stable legacy competition ID generation/mapping is decided.

## In Scope

- Additive competition and entry schema.
- Competition repository/service boundary.
- Permanent legacy GET façade and storage adapters.
- Unified read APIs.
- OpenAPI generation and frontend generated-model availability.
- Feature flags and per-competition storage/execution mode.
- Shadow-read parity instrumentation.
- Initial special-competition capability representation.

## Out of Scope

- Native competition creation or voting.
- Native decision execution.
- Frontend navigation changes.
- Destructive migration of legacy rows.
- Removal or semantic changes to existing endpoints.

## Data Model

Add native entities using repository database conventions: central table-name
constants, UUID identifiers, millisecond timestamps where applicable,
repository classes, additive indexes, and no foreign-key constraints unless
the backend standards are deliberately revised.

At minimum define:

### Competition

- `id`
- `wave_id`
- `storage_mode` or equivalent internal routing field
- `legacy_wave_id` or a stable legacy mapping mechanism
- `type`
- `lifecycle`
- Title and description/presentation fields
- Participation configuration
- Voting and credit configuration
- Timing and decision configuration
- Winner and outcome configuration
- Configuration version
- Created, updated, published, ended, cancelled, and archived timestamps as
  required
- Optional system capability/role

Only one mapping may identify a given legacy wave competition. Index lookup by
wave, lifecycle, timing, and legacy mapping.

### Competition Entry

- `id`
- `competition_id`
- `drop_id`
- Submitter identity
- Entry status
- Created, withdrawn, disqualified, and won timestamps as required
- Rank and decision reference where applicable
- Configuration/signature version

Define uniqueness according to the Phase 0 decision on drop reuse. Even if the
first UI prevents reuse, avoid making the schema unable to support it later
unless there is a strong integrity reason.

### Supporting Records

Create or finalize target shapes for native outcomes, distributions, pauses,
decisions, winner records, vote spend, voter state, leaderboard entries, and
historical snapshots. Tables not needed before Phase 4 may be introduced later,
but their key structure must already be settled.

## Competition Service Boundary

All new competition reads go through a service that selects one of:

- A legacy adapter that derives a competition from current wave records.
- A native repository backed by competition tables.

The new public API returns one stable competition shape regardless of storage
mode. Storage mode must not leak into user-facing behavior.

The legacy adapter must:

- Return one stable competition for each non-chat wave.
- Return no competition for a chat wave.
- Derive entries from participatory and winner drops.
- Preserve current dates, groups, voting rules, outcomes, pauses, decisions,
  leaderboard ordering, and credit semantics.
- Preserve current special competition behavior.
- Avoid creating new native vote or decision records.

The permanent GET façade is a separate supported boundary. Initially it may use
the legacy adapter directly. After migration it projects the frozen legacy
contract from native competition/entry data and retained history without
changing external behavior.

## Read API

Implement the approved OpenAPI-first read surface. It should include at least:

- List competitions for a wave, with lifecycle filters and pagination.
- Read a competition by ID.
- List/read entries.
- Read leaderboard, decisions, winners, outcomes, voters, and pauses.
- Competition summary counts on the wave hub response where approved.

Responses and pagination must behave consistently for legacy and native
storage. Generated clients must be regenerated; generated files must not be
edited manually.

Every GET endpoint in the Phase 0 permanent compatibility manifest remains
unchanged and receives contract-regression coverage. New native read resources
are additive.

## Legacy Projection Rules

- Legacy `RANK` and `APPROVE` waves keep returning their existing wave fields.
- Legacy `CHAT` waves continue returning chat behavior.
- Native hub waves must be safe for old clients and project as chat-only.
- Each existing non-chat wave has an immutable
  `legacy_primary_competition_id`; legacy wave-scoped GETs always use it.
- Additional competitions never alter a legacy GET response's selected
  competition.
- Legacy drop submission/winner fields are interpreted relative to that
  primary competition.
- No response may choose an arbitrary native competition as “the wave's
  competition.”
- `has_competition` may remain as a compatibility boolean, while the native
  contract exposes explicit active, upcoming, and completed counts.

## Feature Flags and Routing

Introduce controls with safe defaults:

- Unified competition reads off or internal-only initially.
- Native competition writes disabled.
- Native competition execution disabled.
- Native wave creation disabled.
- Shadow comparisons independently controllable and rate-limited.

Define a single authoritative routing decision for each competition. Workers
and APIs must use the same storage/execution-mode source.

## Shadow Parity

For legacy competitions, compare the current and unified read paths without
changing the response returned to users.

Compare:

- Configuration and lifecycle phase.
- Entry counts and entry/winner status.
- Vote totals and remaining credits.
- Leaderboard order, rank, and ties.
- Pauses, decisions, winners, outcomes, and distributions.
- Special capability assignment.

Record mismatch categories without logging sensitive signed payloads or
production user content.

## Deployment Order

1. Deploy additive schema support through the database migration service.
2. Confirm new tables and indexes exist and old reads/writes are unaffected.
3. Deploy API and service code with new routes disabled or internal-only.
4. Enable sampled shadow reads.
5. Regenerate and validate frontend clients, without consuming them in the UI.
6. Expand shadow-read sampling after performance and mismatch review.

No worker should process a native competition in this phase.

## Validation

### Backend Tests

- Entity/repository tests for native competition and entry records.
- Stable legacy competition mapping tests.
- Unified read contract tests for chat, rank, and approve waves.
- Pagination and lifecycle filter tests.
- Old endpoint regression tests.
- Frozen contract tests for every externally available GET path, including
  parameters, status codes, required/null fields, pagination, and ordering.
- Tests proving additional competitions cannot change the primary competition
  projected by legacy GETs.
- Tests proving new native hubs produce contract-valid chat projections.
- Authorization tests for non-public waves.
- Main Stage/special capability mapping tests.
- Shadow comparison tests, including expected normalization differences.

### Data and Performance

- Every legacy non-chat wave resolves to exactly one stable legacy
  competition.
- Every legacy chat wave resolves to zero competitions.
- Read latency and query load remain within agreed limits.
- No schema change blocks current wave, drop, vote, or decision writes.
- Repeated mapping/backfill setup is idempotent.

### Frontend Contract

- Generated models compile.
- No generated file is manually modified.
- Existing frontend behavior and bundles do not depend on enabled native
  competition reads.

## Rollback

- Disable unified routes and shadow reads.
- Route all reads through existing wave endpoints.
- Leave additive tables in place.
- Do not reverse or delete schema during an incident unless a separate safe
  migration is approved.

## Deliverables

- Native competition and entry entities/repositories.
- Legacy adapter and unified competition service.
- OpenAPI read contracts and generated clients.
- Stable legacy competition mapping.
- Feature flags and storage/execution routing.
- Shadow parity dashboards or queryable metrics.
- Runbook for disabling unified reads.

## Exit Criteria

- Unified reads match legacy behavior for the agreed fixture set and production
  sample threshold.
- Every frozen public GET contract passes against both legacy-backed data and
  representative native-backed projections.
- There are no unexplained winner, vote, leaderboard, outcome, or capability
  mismatches.
- Old endpoints and workers are unchanged in behavior.
- Phase 2 can consume a stable competition contract without enabling native
  writes.

## Next Phase

Proceed to [Phase 2: Frontend Competition Context](./phase-2-frontend-competition-context.md).
