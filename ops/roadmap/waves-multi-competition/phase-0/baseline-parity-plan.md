# Baseline and Parity Measurement Plan

## Objective

Prove that the legacy adapter and, later, a native migration preserve the
frozen external GET contract and current competition results. Parity is
evaluated per immutable legacy primary competition; new native competitions
are validated against native invariants and must remain invisible in old GET
competition projections.

No production row or personally identifying production value is committed.
Repository tests use the synthetic fixture matrix. Production measurements use
aggregated counts, keyed hashes, IDs in restricted telemetry, and sampled
shadow comparisons under existing data controls.

## Baseline Measurements

For each selected legacy competition, capture at a consistent read snapshot:

| Area | Baseline | Comparison rule |
| --- | --- | --- |
| Configuration | Type; participation/voting scopes, requirements, terms/signatures, dates, credit policy, thresholds, limits, decision strategy, outcomes, pauses | Canonical field-by-field equality including missing vs null, enum, array order, and config version mapping. |
| Entries | Participatory/winner drop IDs, authors, submission timestamps, statuses, metadata/media requirements | Exact ID/count/status equality; no orphan or cross-wave entry. |
| Credits | Available, spent, remaining by voter; per-drop cap; negative-vote behavior; NFT/category/creditor policy | Exact integer equality by voter/entry and independent namespace checks. |
| Votes | Current vote, real-time/weighted totals, edit history, voter state | Exact values and ordered logs at snapshot. |
| Leaderboard | Ordered drop/entry IDs, rating, real-time rating, prediction, rank, viewer state, total/page metadata | Exact ordered equality, including ties and page boundaries. |
| Decisions | Scheduled and actual time, status, winner IDs/ranks, additional-action flags | Exact ordered equality and no duplicate decision key. |
| Outcomes | Legacy index, type, description, distribution items and order | Exact equality; stable outcome ID maps to same legacy index. |
| Pauses | Start/end and excluded decision occurrences | Exact interval equality and decision suppression. |
| Claims/mints | Eligible winning entry/drop, claim root/action, meme-card mapping, mint and announcement key | Exact eligibility and at-most-one side effect. |
| Performance | GET latency, adapter latency, decision lag, worker retries, cache hit/miss | Thresholds below; segmented by mode. |
| Compatibility traffic | Requests by frozen GET operation/route-only path, auth mode, client/user-agent family, status | Aggregate only; used to prevent unmeasured deprecation assumptions. |

## Representative Matrix

| Fixture | Contract focus | Required reads/actions |
| --- | --- | --- |
| CHAT / zero competitions | Null/empty config, no leaderboard/decision/outcome | wave/overview/drop/feed/leaderboard/decision/outcome legacy reads |
| RANK open | participation, votes, rank ordering | wave, entries, leaderboard, voters, remaining credit |
| APPROVE open | threshold/duration/max winners, REP credit | wave, leaderboard, voter state, projected decision eligibility |
| Paused | timer and decision exclusion | wave pauses, decision points, worker due-set |
| Completed | winner context, decisions, outcomes/distributions | drop, leaderboard, decisions, winners, outcome pages |
| Main Stage | explicit capability, claim/mint/mapping | special projection, mapping and claim reads, idempotency keys |
| Large leaderboard | paging, tie order, performance | first/middle/last pages in both directions, filters |
| Unusual credit | CARD_SET_TDH, null categories, negative votes/caps | config, credit, votes, voter state |
| Native hub / one | chat legacy projection hides competition | old wave/drop/leaderboard/decision plus native `/v3` reads |
| Native hub / parallel | no global active competition, isolated credits | two native `/v3` detail/entry/leaderboard/credit sets plus old chat projection |
| Legacy plus newer native | immutable primary selection | every affected old GET must remain tied to original |
| Cancelled | preserved history and disabled execution | native reads; entry/vote/decision/claim rejection/no-op |

The concrete fictional IDs, timestamps, values, and expected assertions are in
`baseline/representative-fixtures.json`.

## Contract Test Layers

### Static contract

- Compare every baseline OpenAPI path operation, parameter, response, security
  override, and reachable schema to the frozen snapshot.
- Additive paths/fields are reviewed and snapshot-appended. Removal, narrowing,
  enum reduction, auth change, or required/null change fails.
- Traverse the Express mount graph and compare 296 baseline GET route shapes,
  auth classification, and OpenAPI linkage. A missing or stricter/looser route
  fails.
- Assert that the cited 183 OpenAPI operations, 296 runtime route shapes, 357
  reachable schemas, and 113 runtime-only routes equal the machine manifests;
  documentation/count drift fails CI.
- Validate every canonical table identifier in the dependency inventory against
  `src/constants/db-tables.ts` before schema or adapter estimation consumes it.

### Golden integration

Build complete response objects from the frozen OpenAPI schema plus fixture
overrides. Execute old endpoints through the same middleware stack and assert:

- exact status and error envelope for success, empty, 400, 401, 403 where
  applicable, masked 404, and conditional API-gate 401;
- both global-gate modes: with `ACTIVATE_API_PASSWORD=false`, route auth alone
  applies; with it `true`, missing/invalid `x-6529-auth` returns the frozen 401
  envelope and a valid deployment credential falls through to the unchanged
  route-auth behavior;
- schema validation and old generated-client deserialization;
- fields/types/enums/required/null semantics;
- exact ordered page contents, metadata, filters, and tie behavior;
- optional-auth personalization with unauthenticated, direct actor, and proxy
  actor contexts.

### Adapter parity

For each legacy fixture and production shadow sample, run legacy and new
repository readers against the same logical snapshot. Canonicalize only
explicitly non-contract data such as trace IDs. Compare field-level values and
ordered IDs. Store mismatch category/count; never “fix” parity by excluding a
field silently.

### Execution parity

`SHADOW` execution calculates entries, credit, leaderboard, due decisions,
winners, outcomes, and privileged eligibility but performs no state change or
external side effect. Compare against active legacy execution for identical
scheduled occurrences. Shadow code uses separate scratch/audit storage and
cannot acquire active executor leases.

## Parity Categories

```text
CONFIG_FIELD
ENTRY_MEMBERSHIP
ENTRY_STATUS
PRIMARY_COMPETITION_SELECTION
CREDIT_AVAILABLE
CREDIT_SPEND
VOTE_TOTAL
LEADERBOARD_ORDER
LEADERBOARD_FIELD
DECISION_DUE_SET
WINNER_SET_OR_ORDER
OUTCOME_OR_DISTRIBUTION
PAUSE_HANDLING
CLAIM_OR_MINT_ELIGIBILITY
AUTH_OR_VISIBILITY
STATUS_OR_ERROR
SCHEMA_OR_NULLABILITY
PAGINATION_OR_FILTER
```

Every mismatch records wave/competition identifiers in restricted logs,
storage modes, config versions, worker/API version, category, canonical value
hashes, and trace/event IDs. Payloads and wallet/profile data are not emitted
to broad metrics.

## Current Operational Threshold Baseline

The repository currently defines no decision-lag p95/p99 alarm for
`waveDecisionExecutionLoop` and no endpoint p95 SLO alarm for the API. The
worker is scheduled once per minute with reserved concurrency 1 and a 900-second
timeout; its checked-in CloudWatch threshold is only the out-of-memory alarm at
one event in one 60-second period. API request logging treats a request as slow
at `SLOW_API_REQUEST_THRESHOLD`, defaulting to 1,000 ms, but that warning cutoff
is not an endpoint p95 SLO. These are current-state observations from the worker
Serverless configuration and API request middleware, not proposed cutover
budgets.

Before roadmap Phase 4 can enable native execution, operations must measure and
record production decision-lag p95/p99 and endpoint-specific GET p95/error-rate
budgets, then configure alerts and rollback gates. Absence of those measured
budgets blocks cutover; it does not authorize a weaker default.

## Acceptance Thresholds

- Frozen GET contract tests: 100% pass; zero unreviewed snapshot drift.
- Synthetic configuration, entries, credits, vote totals, ordering, decisions,
  winners, outcomes, pauses, and capability eligibility: exact equality.
- Production shadow samples: zero security, authorization, primary-selection,
  duplicate-side-effect, winner, claim, or mint mismatch.
- Non-critical read mismatch rate: zero for seven consecutive full comparison
  windows before a competition mode cutover; any mismatch resets the window.
- Decision lag: native shadow p95/p99 no worse than the measured pre-rollout
  budget required above; there is no checked-in decision-lag budget to inherit.
- API latency: compatibility-adapter p95 must stay within the endpoint
  baseline/SLO established above and no more than 10% or 25 ms above its
  measured baseline, whichever is greater; error rate must not increase
  materially.
- Backfill: 100% eligible rows processed, zero unresolved orphans, stable
  rerun checksum, and checkpoint resume tested.

## Measurement Sequence

1. Run schema/router static tests on every change.
2. Run synthetic golden and adapter parity in backend CI.
3. Establish production baseline dashboards before deploying native readers.
4. Deploy dual-read code disabled, then enable sampled read shadowing.
5. Resolve every mismatch and repeat the full window.
6. Backfill one non-privileged cohort and rerun read parity.
7. Enable execution shadow only after all relevant workers are dual-aware.
8. Cut over one competition through audited mode CAS after acceptance.
9. Keep old data and adapter available; continue permanent GET tests after all
   migrations.

## Old-Client Coverage

Pin at least one generated frontend client from the baseline and a raw HTTP
fixture client. They exercise legacy Rank, Approve, Chat, native-hub chat
projection, private/missing resources, pagination, and additive websocket
payloads. Usage dashboards segment frozen operation/route, status, auth mode,
and coarse client family so mutation deprecation decisions are evidence-based.
