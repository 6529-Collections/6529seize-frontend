# Waves as Multi-Competition Hubs

## Status

This is the master technical roadmap for separating competitions from waves.
It defines the target architecture, compatibility model, sequencing, release
gates, and the phase documents that should be completed in order.

The roadmap describes future work. It is not documentation of current product
behavior.

Roadmap Phase 0 is complete. Its inspected baseline, approved defaults,
machine-readable GET census, decision register, and implementation proposals
are indexed in the [Phase 0 evidence package](./phase-0/README.md). Later phases
remain future work.

## How to Use This Roadmap

Complete the roadmap phases in numerical order. A phase is complete only when
all of its exit criteria are satisfied and its evidence is recorded in the
corresponding phase document or linked implementation artifacts.

Roadmap phases are architecture milestones. They are distinct from the
repository's delivery workflow terminology:

- Delivery Phase 1 means implementing and validating locally.
- Delivery Phase 2 adds pull requests and review/check completion.
- Delivery Phase 3 adds staging deployment and validation.
- Delivery Phase 4 adds production deployment and release notes.

For example, “roadmap Phase 2 to delivery Phase 3” means completing the
frontend-context milestone and taking that work through staging.

## Goal

A wave becomes a durable discussion hub that can host zero, one, or many
competitions over its lifetime. Competitions may run sequentially or in
parallel without creating separate chat destinations or consuming each other's
voting budgets.

The migration must preserve current waves, current competition results, old
client behavior, and uninterrupted chat, voting, decision, and winner flows.
Every GET API contract available to external clients at the Phase 0 baseline
remains backwards compatible permanently, even after its data is served from
the native competition model.

## Current Constraint

The current system treats the wave as both the discussion container and the
competition aggregate:

- Competition type and configuration are stored on the wave.
- Wave creation requires participation, voting, and outcome settings.
- Submissions and winners are represented through drop types.
- Votes, leaderboards, pauses, outcomes, and decisions are keyed by wave.
- Frontend navigation and timers assume one competition context per wave.
- Some privileged flows infer competition meaning from special wave IDs.

This means the change cannot be limited to creation UI or a new
`competitions[]` response field. The domain identity used by submission,
voting, decision execution, winner handling, and special integrations must
move from wave to competition.

## Target Domain

```mermaid
graph TD
    W["Wave: durable hub"] --> C1["Competition"]
    W --> C2["Competition"]
    W --> D["Drops and chat content"]
    C1 --> E1["Competition entries"]
    C2 --> E2["Competition entries"]
    E1 --> D
    E2 --> D
    C1 --> R1["Votes, leaderboard, decisions, outcomes"]
    C2 --> R2["Votes, leaderboard, decisions, outcomes"]
```

### Wave

The wave owns durable hub concerns:

- Identity, name, description, picture, creator, and timestamps.
- Visibility and membership context.
- Wave administrators.
- Chat configuration, moderation, and slow mode.
- Parent/subwave relationships.
- Following, muting, REP, scoring, pinned content, and aggregate activity.

### Competition

The competition owns the rules and lifecycle of one contest:

- Stable ID and owning `wave_id`.
- Type: `RANK` or `APPROVE`.
- Title, description, and presentation settings.
- Participation group, limits, requirements, terms, and signature policy.
- Voting group, credit policy, limits, thresholds, and signature policy.
- Participation, voting, and decision timing.
- Winner limits, decision strategy, outcomes, and distributions.
- Pauses, next-decision state, and configuration version.
- Stored lifecycle and audit information.
- Optional system capabilities for privileged competitions.

`CHAT` is not a competition type in the target model. Chat is a wave
capability.

Recommended stored lifecycle values are `DRAFT`, `PUBLISHED`, `ENDED`,
`CANCELLED`, and `ARCHIVED`. User-facing phases such as upcoming, submissions
open, voting open, deciding, and completed should be derived from lifecycle and
dates.

### Competition Entry

A competition entry connects stable wave content to one competition:

- Stable entry ID.
- `competition_id` and `drop_id`.
- Submitter and submission timestamp.
- Entry status such as active, withdrawn, disqualified, or winner.
- Winning timestamp, rank, and decision reference where applicable.
- Configuration/signature version needed to validate the submission.

Winning changes the entry, not the drop. This avoids mutating content identity
and permits the domain to support one drop entering multiple competitions in a
future product iteration.

### Competition-Owned Records

Native votes, vote-credit spending, leaderboard rows, voter state, pauses,
decisions, winners, outcomes, distributions, and historical snapshots are
keyed by `competition_id` and, where relevant, `competition_entry_id`.

The current wave-scoped voting credit meaning maps to a competition-scoped
budget. Parallel competitions must not consume each other's credits. A future
cross-competition budget would be a separate, explicitly named policy.

## Compatibility Architecture

Use a strangler migration with one competition interface and two storage
implementations.

### Legacy Adapter

Every existing non-chat wave is exposed through the new API as having exactly
one stable legacy competition. The adapter continues to use the existing wave,
drop, vote, leaderboard, decision, pause, and outcome records until that
competition is migrated.

Legacy chat waves expose no competition.

### Native Repository

New competitions use additive competition, entry, voting, leaderboard,
decision, pause, and outcome storage. Native records do not require immediate
rewriting of legacy history.

### Compatibility Rules

- Existing `RANK` and `APPROVE` waves retain their current API and UI behavior.
- Existing clients continue to see the legacy wave projection permanently.
- A new multi-competition hub projects as chat-only to legacy clients.
- A legacy response must never select an arbitrary “active competition.”
- New responses carry stable competition and entry IDs.
- Websocket and notification payloads retain `wave_id` and add optional
  `competition_id` and `competition_entry_id`.
- Each competition has one declared storage/execution mode so legacy and native
  workers cannot both finalize it.
- Schema removal is allowed only after the permanent GET façade can produce the
  frozen contract entirely from retained/native data.

### Permanent Public GET Guarantee

Phase 0 records every GET endpoint available to external clients, including its
path, parameters, authorization behavior, status codes, response shape,
required/null fields, pagination, ordering, and error semantics. That inventory
is a permanent compatibility manifest.

For those GET contracts:

- Paths and accepted request parameters remain available indefinitely.
- Existing successful and error responses remain wire-compatible.
- Existing `RANK` and `APPROVE` waves receive an immutable
  `legacy_primary_competition_id`.
- Wave-scoped legacy competition reads always project that original primary
  competition, even after the wave gains additional competitions.
- They never switch to the newest, active, or otherwise selected competition.
- Entry/submission/winner fields in legacy drop responses are projected relative
  to the original primary competition.
- A new native hub with no legacy primary competition returns a contract-valid
  chat-wave projection. Its new competitions are intentionally undiscoverable
  through legacy GETs.
- The compatibility façade may read native tables, archived history, or
  purpose-built read models, but external behavior does not depend on the old
  physical schema remaining in use.
- Contract fixtures and regression tests remain in CI after migration work is
  complete.

Permanent compatibility does not make new multi-competition functionality
available to old clients. It guarantees that capabilities and resources they
already understand continue to work. Mutation APIs have a separate support
policy; this permanent guarantee applies to GET APIs.

## Product Defaults for the First Native Release

- Competition visibility inherits from the wave.
- Wave administrators manage competitions.
- Participation and voting groups remain competition-specific.
- Voting credits are isolated per competition.
- Sequential and parallel competitions are supported.
- Competition entries remain visible as stable drops in the hub with explicit
  competition context.
- The schema supports reuse of a drop, while the first UI may restrict a drop
  to one active competition if required for moderation or signing safety.
- Wave followers receive restrained lifecycle announcements rather than a
  notification for every entry.
- Subwaves remain separate discussion destinations and are not used as
  permanent competition containers.

Any departure from these defaults must be captured as a decision before the
affected phase begins.

## Cross-Phase Engineering Rules

### Additive and Reversible

- Add new tables, columns, API fields, and event fields before using them.
- Do not reinterpret existing rows in place while old readers are active.
- Keep legacy data available until native results have passed parity checks.
- Use feature flags and per-competition execution modes for rollback.
- Make data migrations idempotent, checkpointed, observable, and restartable.

### API and Schema

- Define backend APIs OpenAPI-first and regenerate clients.
- Do not hand-edit generated frontend API models.
- Keep every current public GET endpoint and its frozen contract permanently.
- Treat legacy GET routes as a supported façade, not a temporary migration
  shim.
- Use competition-scoped endpoints for entries, votes, leaderboards,
  decisions, outcomes, voters, and pauses.
- Include configuration version in signed competition actions so signatures
  cannot be replayed against another competition or incompatible rules.

### Frontend State

- Wave state and competition state have separate providers and cache keys.
- Competition selection is keyed by `(wave_id, competition_id)`.
- URLs identify the selected competition for sharing and reload safety.
- Loading, empty, error, cancelled, ended, and parallel-competition states are
  designed explicitly for desktop and mobile.

### Execution Safety

- Decision and leaderboard workers must understand a storage mode before a
  competition can enter it.
- Unique execution keys prevent duplicate decisions, winners, distributions,
  claims, and announcements.
- Decision retries are idempotent.
- Special minting or claims capabilities are attached to a designated
  competition, not inferred only from wave ID.

### Observability

Metrics and logs should be segmentable by:

- Wave ID and competition ID.
- Legacy or native storage mode.
- Worker and API version.
- Competition lifecycle and computed phase.
- Decision lag and retry count.
- Parity result and mismatch category.

Alerts must cover duplicate decisions, delayed decisions, vote-total
mismatches, entry-eligibility mismatches, backfill failures, and unexpected old
endpoint behavior.

## Zero-Downtime Deployment Pattern

For any phase that activates native storage or behavior, deploy in this order:

1. Additive database schema and migration support.
2. Background workers that understand both models, with native work disabled.
3. Backend APIs and compatibility reads, with native writes disabled.
4. Backfills and shadow comparisons where required.
5. Frontend support for legacy and native models.
6. Cohort-based feature enablement.
7. Per-competition execution cutover after all required workers are live.

When a change spans both repositories, backend compatibility must be fully
deployed before the dependent frontend is merged or deployed. New native
competitions must never become executable while any required decision,
leaderboard, notification, or claim worker is unaware of them.

## Roadmap

Use `Not started`, `In progress`, `Blocked`, or `Complete` for phase status.
Update this table and the phase's tracking section together.

| Phase | Milestone | Status | User-visible impact |
| --- | --- | --- | --- |
| [0](./phase-0-contract-and-baseline.md) | Contract and baseline | Complete | None |
| [1](./phase-1-additive-backend-foundation.md) | Additive backend foundation | Not started | None |
| [2](./phase-2-frontend-competition-context.md) | Frontend competition context | Not started | No intended visual change |
| [3](./phase-3-separate-creation-flows.md) | Separate hub and competition creation | Not started | New creation/admin flow behind rollout controls |
| [4](./phase-4-native-competition-runtime.md) | Native competition execution | Not started | Multiple competitions become operational for cohorts |
| [5](./phase-5-legacy-data-migration.md) | Legacy data migration | Not started | No intended behavior change |
| [6](./phase-6-progressive-rollout.md) | Progressive rollout | Not started | Multi-competition hubs become broadly available |
| [7](./phase-7-retire-wave-coupling.md) | Retire internal legacy coupling | Not started | Legacy execution/storage are removed while current GET contracts remain supported |

## Global Success Criteria

The roadmap is complete when:

- A wave can exist indefinitely without a competition.
- A wave can run multiple sequential or parallel competitions.
- Chat history and drop identity remain stable across competition lifecycles.
- Voting budgets, eligibility, leaderboards, decisions, and outcomes are
  isolated per competition.
- Current waves retain correct submissions, votes, winners, outcomes, and
  privileged integrations.
- External clients using any current GET API continue working without changes.
- Existing wave-scoped GETs permanently project the wave's immutable original
  competition, while new hub competitions remain available only through new
  APIs.
- No competition can be processed simultaneously by legacy and native engines.
- Native behavior has passed parity, staging, production-cohort, and
  observability gates.
- Legacy wave competition storage and execution paths are no longer required;
  the permanent GET façade is served from native/retained read data.

## Decisions That Must Be Recorded

Maintain resolved decisions in this master document or a linked decision
record. At minimum, record:

- Whether the same drop may enter multiple competitions in the first release.
- How competition submissions appear in the shared chat timeline.
- Competition notification defaults.
- Which published competition fields remain editable.
- The public URL structure for competition detail.
- Rules for ending, cancelling, archiving, and reopening competitions.
- How special competitions receive minting, claims, curation, quorum, or other
  system capabilities.
- The exact manifest of GET APIs currently available to external clients and
  therefore covered by the permanent compatibility guarantee.
