# Phase 0: Contract and Baseline

[Back to the master roadmap](./README.md)

## Tracking

- Status: Complete
- Delivery target: Repository delivery Phase 3 for this frontend-owned
  documentation/contract package; no runtime or schema deployment
- Staging validation: prove the signed documentation commit is present on
  `1a-staging` and that the ordinary frontend deploy, HTTP version check, and
  repository health gates remain green. It is delivery evidence, not runtime
  acceptance of the future competition design.
- Owner: Frontend, backend, product, security, and operations domain owners
- Evidence: [Phase 0 evidence index](./phase-0/README.md),
  [decision register](./phase-0/decision-register.md),
  [permanent GET manifest](./phase-0/public-get-compatibility-manifest.md),
  [OpenAPI snapshot](./phase-0/baseline/public-get-openapi-snapshot.json), and
  [runtime route manifest](./phase-0/baseline/runtime-get-route-manifest.json)

## Outcome

The team has an approved domain contract, compatibility policy, API direction,
data inventory, risk model, and measurable baseline before production code or
schema is changed.

This phase exists to prevent frontend, API, data migration, and decision-engine
work from adopting different meanings for “wave,” “competition,” “entry,” or
“winner.”

## Entry Criteria

- The master roadmap has been reviewed by frontend and backend owners.
- Current frontend and backend `main` branches are available for source and
  schema inspection.
- Product owners can decide the open user-experience and lifecycle questions.

## In Scope

- Domain and field-ownership decisions.
- Existing API, schema, worker, event, and UI inventory.
- Permanent public GET compatibility manifest and mutation deprecation policy.
- Proposed native API resources and URL structure.
- User journeys and information architecture.
- Security, signing, moderation, and privileged-competition analysis.
- Baseline metrics and parity definitions.
- Feature-flag, rollout, and rollback design.

## Out of Scope

- Production schema changes.
- New competition writes.
- User-visible creation or navigation changes.
- Legacy data backfills.

## Required Decisions

Record an explicit answer and rationale for each item:

1. Can one drop enter multiple competitions in the first native release?
2. Are competition submissions ordinary chat drops, activity records, filtered
   views, or some combination of these?
3. What are the default notifications for competition publication, start,
   entry, end, cancellation, and winner events?
4. Which competition fields can be edited after publication or after the first
   entry/vote?
5. What happens to entries and votes when a competition is cancelled?
6. Can an ended competition ever be reopened?
7. What is the canonical competition detail URL?
8. Do wave admins automatically control every competition in the first
   release?
9. Which current GET endpoints are externally available and therefore covered
   by the permanent compatibility guarantee?
10. How are Main Stage and other privileged competition capabilities assigned?

Use the defaults in the master roadmap when product requirements do not justify
additional scope.

All ten answers, their rationale, owner, and downstream gate are recorded in
the [decision register](./phase-0/decision-register.md). Approved defaults are
the implementation baseline. D-05 and D-17 are deliberately deferred to named
owners before the later mutation/rollout phases they affect; neither blocks the
additive Phase 1 schema/read estimate.

## Domain Contract

Produce a field-ownership matrix with at least these columns:

| Field or behavior | Current owner | Target owner | Legacy projection | Migration phase |
| --- | --- | --- | --- | --- |
| Wave identity and description | Wave | Wave | Unchanged | N/A |
| Chat and slow mode | Wave | Wave | Unchanged | N/A |
| Competition type | Wave | Competition | Legacy wave type | 1–7 |
| Participation settings | Wave | Competition | Legacy wave settings | 1–7 |
| Voting settings | Wave | Competition | Legacy wave settings | 1–7 |
| Outcomes | Wave | Competition | Legacy outcomes | 1–7 |
| Submission state | Drop type | Competition entry | Derived legacy entry | 1–5 |
| Winner state | Drop type/decision | Competition entry/decision | Derived legacy winner | 1–5 |
| Decision schedule | Wave | Competition | Legacy schedule | 1–5 |
| Credit budget | Wave/drop | Competition/entry | Legacy semantics | 1–5 |

Complete the matrix for every wave competition field and every dependent
table, endpoint, worker, cache key, event, notification, metric, and UI state.

## Source and Data Inventory

### Backend

Inventory and classify:

- Wave entity fields and API schemas.
- Drop types and submission/winner transitions.
- Participation validation and maximum-application queries.
- Voting, credit spend, voter state, and rank history.
- Leaderboards and snapshots.
- Decision scheduling, pauses, retries, and outcomes.
- Winner announcements, distributions, claims, and minting.
- Websocket messages, notifications, cache invalidation, and metrics.
- Environment-configured special wave IDs.
- Database migration and independent Lambda deployment boundaries.

Create a frozen contract record for every externally available GET endpoint:

- Path and query/path parameters.
- Authentication and authorization behavior.
- Success, empty, not-found, forbidden, and validation status codes.
- Response fields, types, required/null behavior, and enum values.
- Pagination, filtering, ordering, and tie behavior.
- Representative contract-valid fixtures for each supported wave type/state.

Each dependency should be labelled as wave-only, competition-specific, mixed,
or unknown.

### Frontend

Inventory and classify:

- Wave create configuration and validation.
- API models and wave-minimum projections.
- Timers and lifecycle helpers.
- Chat, leaderboard, submissions, winners, outcome, voters, and My Votes tabs.
- Desktop and mobile navigation.
- Wave rules and specification displays.
- React Query keys, invalidations, optimistic updates, and websocket handling.
- Drop submission/winner context and competition badges.
- Special presentation rules for Main Stage or other named waves.
- Deep links, browser reload behavior, and stored tab selection.

## API Proposal

Draft OpenAPI resources for review. The proposal should cover at least:

- Listing competitions within a wave.
- Reading one competition.
- Creating and updating a draft competition.
- Publishing, ending, cancelling, and archiving.
- Listing and creating competition entries.
- Voting for an entry.
- Reading leaderboard, decisions, winners, outcomes, voters, and pauses.
- Stable IDs and pagination.
- Legacy/native storage mode visibility for internal diagnostics, without
  exposing implementation details unnecessarily to public clients.
- Event payload additions for competition and entry identity.

Decision D-18 resolves native resources to
`/v3/waves/{wave_id}/competitions...`; existing unversioned and v2 GETs remain
permanent compatibility façades. Never define a legacy projection that chooses
one of several native competitions implicitly.

The proposal must retain every endpoint in the permanent GET manifest. For an
existing competition wave, wave-scoped GETs resolve its immutable original
competition. For a new native hub, legacy GETs return the same contract-valid
behavior as a chat wave and do not expose new competitions.

## UX and Information Architecture Proposal

Produce desktop and mobile flow diagrams for:

- Creating a wave without a competition.
- Creating the first competition after wave creation.
- Creating another sequential or parallel competition.
- Switching between active, upcoming, and completed competitions.
- Navigating from chat content to the competition containing its entry.
- Handling zero, one, or many competitions.
- Viewing an ended or cancelled competition.
- Administering drafts and published competitions.

Define which navigation belongs to the hub and which belongs to the selected
competition. Reuse established wave visual patterns where useful, but do not
model competitions as subwaves.

## Baseline and Parity Plan

Before implementation, record how the current system will be measured:

- Competition configuration returned for representative waves.
- Entry/submission counts.
- Vote totals and remaining-credit calculations.
- Leaderboard ordering and tie behavior.
- Decision timing, selected winners, outcomes, and distributions.
- Paused competition behavior.
- Main Stage claims/mint eligibility.
- API latency and decision lag.
- Old endpoint and client-version traffic where available.

Select representative fixtures for `CHAT`, `RANK`, `APPROVE`, paused,
completed, Main Stage, large-leaderboard, and unusual-credit configurations.
Production data must not be copied into repository fixtures.

## Security and Integrity Review

Threat-model at least:

- Replaying a signed entry or vote in another competition.
- Changing configuration after signatures, entries, or votes exist.
- Spending a competition budget through a parallel competition.
- Guessing an entry ID that belongs to a different wave or competition.
- Double decision execution during storage-mode cutover.
- Duplicate outcomes, claims, mints, or winner announcements.
- Unauthorized competition administration.
- Old clients posting against a native multi-competition hub.

## Deliverables

- [Domain vocabulary and exhaustive ownership matrix](./phase-0/domain-contract.md).
- [API and event contract proposal](./phase-0/native-api-and-events-proposal.md).
- [UX information architecture and lifecycle journeys](./phase-0/ux-information-architecture.md).
- [Backend](./phase-0/backend-dependency-inventory.md) and
  [frontend](./phase-0/frontend-dependency-inventory.md) dependency inventories.
- [Permanent public GET compatibility and mutation policy](./phase-0/public-get-compatibility-manifest.md).
- Frozen [OpenAPI](./phase-0/baseline/public-get-openapi-snapshot.json),
  [runtime route](./phase-0/baseline/runtime-get-route-manifest.json), and
  [representative fixture](./phase-0/baseline/representative-fixtures.json)
  records.
- [Security and signing decision record](./phase-0/security-integrity-review.md).
- [Baseline and parity-measurement plan](./phase-0/baseline-parity-plan.md).
- [Feature flags, execution modes, rollout, rollback, and observability](./phase-0/rollout-rollback-observability.md).
- [Decision register](./phase-0/decision-register.md).

## Validation

- Frontend, backend, product, and operations owners review the deliverables.
- Every current competition field and dependent subsystem has a target owner.
- Every unresolved product question has an owner and blocks the phase that
  depends on it.
- Proposed API resources can represent zero, one, sequential, and parallel
  competitions without ambiguity.
- Every current external GET path has a recorded compatibility contract and
  permanent projection rule.
- Compatibility behavior is defined for existing waves, new hubs, and clients
  that never adopt the new API.

## Exit Criteria

- All required decisions are recorded.
- There are no unknown high-risk dependencies in the execution or privileged
  winner flows.
- Phase 1 schema and read API work can be estimated without redefining the
  domain.
- The rollback strategy does not require deleting or reversing existing data.
- The permanent GET contract test suite can be implemented without unresolved
  response or error semantics.

## Completion Assessment

- **Decisions:** complete. The register resolves the baseline and assigns the
  two later-phase product choices to named functional owners and gates.
- **Dependencies:** complete. The backend/frontend inventories cover entities,
  routes, drop lifecycle, voting/credits, leaderboards, decisions/pauses,
  outcomes, notifications, websockets, caches, metrics, signatures,
  claims/minting, special IDs, migrations, deployable workers, creation,
  generated models, timers, tabs, navigation, rules, query state, entry/winner
  context, presentation, deep links, and responsive states.
- **GET compatibility:** complete. The census freezes 296 mounted GET route
  shapes, including every one of the 183 OpenAPI GET operations, plus actual
  authentication and projection rules. Machine schemas and synthetic fixtures
  are sufficient to implement structural, golden, adapter-parity, and old-client
  CI tests without redefining semantics.
- **Domain/API/UX:** complete. Proposed resources represent zero, one,
  sequential, and parallel competitions with stable IDs and explicit context;
  competitions are not subwaves.
- **Security/execution:** complete. Replay, configuration, cross-scope,
  authorization, dual-execution, duplicate-side-effect, capability, migration,
  and old-client risks have controls and verification cases.
- **Delivery/rollback:** complete. The future zero-downtime order is additive
  and reversible; rollback disables execution/flags and retains all data.

Roadmap Phase 1 can be estimated and started without changing this domain
contract. Deferred D-05 blocks native cancellation compensation policy in
roadmap Phase 4, and D-17 blocks broad cancelled-history presentation in
roadmap Phase 6; neither is an unknown execution or privileged-winner dependency.

## Next Phase

Proceed to [Phase 1: Additive Backend Foundation](./phase-1-additive-backend-foundation.md).
