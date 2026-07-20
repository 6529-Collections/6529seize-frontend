# Feature Flags, Rollout, Rollback, and Observability

## Control Model

Three independent controls prevent a UI flag from activating execution:

1. **Capability flags** decide whether APIs/UI expose a feature to a cohort.
2. **Storage mode** on each competition is immutable:
   `LEGACY_ADAPTER` or `NATIVE`.
3. **Execution mode** on each competition is an audited state machine:
   `DISABLED` → `SHADOW` → `ACTIVE`, with `ACTIVE` → `DISABLED` available as
   an emergency stop. Transitions use compare-and-set and an operator audit
   record.

`SHADOW` may calculate and record parity but cannot acquire active executor
leases, write winners/outcomes/claims/mints, publish notifications, or mutate
credits. Capability flags cannot override execution mode.

## Logical Feature Flags

Names below describe responsibilities; roadmap Phase 1 should map them to the
established flag/config system without coupling callers to raw environment
variables.

| Flag | Default | Scope | Effect |
| --- | --- | --- | --- |
| Native competition reads | Off | server/cohort | Expose v3 list/detail reads; compatibility reads always remain available. |
| Legacy adapter shadow compare | Off | server/sample | Compare legacy and adapter responses; no client change. |
| Competition context UI | Off | frontend/cohort | Load native list/context while retaining current presentation. |
| Separate hub creation | Off | frontend/cohort | Create wave-only hubs. |
| Competition draft/admin | Off | server + frontend/cohort | Create/edit drafts; execution remains disabled. |
| Competition publication | Off | server/cohort | Publish validated configs; does not activate votes/decisions alone. |
| Native entries and votes | Off | server/cohort/competition | Allow signed mutations only when lifecycle and execution prerequisites pass. |
| Native execution | Off | operator + competition mode | Permit due-decision worker to acquire a lease for `ACTIVE` competition. |
| Native notification fan-out | Off | server/cohort | Emit restrained lifecycle events/notifications. |
| Capability integrations | Off | capability + competition | Enable Main Stage/claim/mint path only after dedicated parity gate. |

Flags are evaluated server-side for every mutation. Frontend flags improve
discovery but are not authorization or safety controls. Flag evaluations and
mode changes are observable and auditable.

## Zero-Downtime Deployment Order

Any phase that adds runtime behavior deploys backend compatibility before the
frontend that consumes it:

1. **Database schema:** deploy `dbMigrationsLoop` with additive competition,
   config-version, entry, lifecycle-event, capability, mode, nonce,
   idempotency/outbox, and immutable primary-mapping structures. Old code must
   ignore them. Validate migration and read/write health.
2. **Passive workers:** deploy dual-aware `waveLeaderboardSnapshotterLoop`,
   wave drop/score metric workers, notification/push consumers, claim/media,
   mint-announcement, TDH/NFT, and other special-ID consumers with native work
   disabled. Wait for each independent Lambda deployment and smoke check.
3. **Decision worker:** deploy dual-aware `waveDecisionExecutionLoop` with
   native execution disabled and shadow side effects impossible. Verify legacy
   decisions continue.
4. **Backend API:** deploy permanent compatibility façade, native read APIs,
   diagnostics, and disabled command handlers. Regenerate clients only after
   deployed OpenAPI is compatible.
5. **Backfill/read models:** run idempotent checkpointed primary mapping and
   synthetic/production shadow reads. Retain source data and quarantine
   orphans.
6. **Frontend:** deploy clients, providers, routes, and hidden/disabled UI.
   Older frontend clients continue against permanent GETs.
7. **Cohort reads:** enable native reads/context to internal users, then small
   cohorts; monitor compatibility and parity.
8. **Drafts/publication:** enable separate creation and drafts, then publication
   with execution disabled. Validate lifecycle/events.
9. **Entry/vote cohort:** activate signed native entries/votes for a
   non-privileged competition after all consumers are ready.
10. **Execution cutover:** set one competition to `SHADOW`, satisfy full parity
    windows, then audited CAS to `ACTIVE`. Expand gradually.
11. **Privileged capability:** Main Stage/claims/mints is a separate final
    cohort after exact claim/mint/announcement parity and duplicate alarms.

When backend and frontend changes share a repository delivery, backend schema,
workers, and API must reach the target environment successfully before the
dependent frontend branch is merged/deployed. A worker's new version must be
healthy before the next dependent worker is deployed.

Roadmap Phase 0 itself contains documentation/contract artifacts only and does
not activate this sequence.

## Rollout Cohorts

```text
CI synthetic fixtures
→ production read shadow (no client exposure)
→ staff read-only
→ staff draft-only
→ one non-privileged native competition in SHADOW
→ one non-privileged native competition ACTIVE
→ small opted-in waves
→ broader cohorts
→ privileged capability cohort
→ general availability
```

Each arrow requires frozen GET checks, error/latency health, zero critical
parity mismatch, no duplicate side effects, successful rollback rehearsal,
and owner approval recorded in operations evidence. Expansion is per
competition/cohort, never a global irreversible switch.

## Rollback

Rollback is disable-and-route, not delete-and-reverse:

1. Stop cohort expansion.
2. For execution incidents, atomically move affected native competitions from
   `ACTIVE` to `DISABLED`; let in-flight lease/idempotency rules settle.
3. Disable native entry/vote/publication command flags as needed.
4. Disable frontend creation/native context flags; users retain hub chat and
   old clients retain chat/primary projections.
5. Route native reads to the last known-good repository/read model or keep them
   read-only. Permanent legacy GETs continue through primary/chat façade.
6. Roll back API/workers only to versions that still understand the additive
   schema and queued event versions. Never restore a worker that could execute
   native rows as legacy.
7. Preserve all native, audit, nonce, idempotency, outbox, comparison, and
   source legacy data for diagnosis/replay.
8. Resume through `DISABLED` → `SHADOW` → `ACTIVE` after the fix and full gate.

Database rollback does not drop columns/tables or rewrite source rows while any
deployed code, event, or permanent façade may need them. Forward-fix migrations
are preferred. A compatibility regression pages immediately and rolls back
the offending read mapper/flag without changing primary mappings.

## Observability Dimensions

Every native-aware log/metric/trace includes, where safe and applicable:

- wave and competition ID (restricted logs where identity is sensitive);
- entry/drop/decision ID for scoped investigation;
- legacy/native storage mode and execution mode;
- API/worker version and config version;
- stored lifecycle and computed phase;
- capability name;
- parity category/result and canonical value hashes;
- executor lease/idempotency/outbox key state;
- event ID/version, retry count, queue age, and trace ID.

Existing wave metrics remain intact so rollout does not break current
dashboards. No signatures, nonces, raw terms, wallets, private content, auth
headers, or full response payloads are logged.

## Metrics and Alerts

| Signal | Segment | Alert/gate |
| --- | --- | --- |
| Frozen GET request count/status/latency | route, auth mode, client family, projection | 4xx/5xx or p95 regression; missing baseline traffic visibility blocks mutation deprecation. |
| Legacy projection selection | wave, primary/chat result | Any non-primary selection or native leak is critical. |
| Adapter parity | category, mode, API/worker version | Any auth, primary, credit, winner, claim/mint mismatch is critical; other nonzero mismatches block rollout. |
| Entry/vote accepted/rejected | competition, phase, reason | Cross-parent/config/signature/credit anomalies alert. |
| Credit invariant | competition/voter hash | Negative remaining, cross-competition delta, or cap breach is critical. |
| Decision due/start/complete lag | competition, worker version | Delayed/missed decision and retry budget alarms. |
| Executor lease contention | competition, mode | Legacy/native overlap or multiple active leases is critical. |
| Duplicate constraint/idempotency hit | side-effect type | Unexpected decision/winner/outcome/claim/mint/announcement duplicate is critical. |
| Queue age/retries/DLQ | worker/event version | Established budgets; any privileged side-effect DLQ pages. |
| Backfill progress/checksum/orphan | migration/cohort | Stalled, checksum drift, or orphan blocks cutover. |
| Frontend load/error/retry | hub/list/detail/action, viewport | Native context errors or old-route regressions block cohort expansion. |
| Flag/mode transition | actor, previous/new, reason | Unauthorized or invalid transition pages and is rejected. |

Numeric SLO/alert thresholds use measured current endpoint and worker baselines.
Documentation does not invent weaker budgets. The parity plan defines the
additional relative latency guard and exact-integrity gates.

## Runbook Gates

Before any activation, operators confirm schema version, deployed worker/API
versions, mode/flag snapshot, fixture and parity results, old-client smoke,
queue/DLQ health, capability mapping, rollback target, and dashboards/alerts.
After activation, record exact competition/cohort, mode change, time, actor,
metrics links, and rollback outcome. Schema removal is never a rollout gate;
the permanent GET façade outlives physical legacy storage.
