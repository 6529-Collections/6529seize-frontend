# Native Multi-Competition Delivery Evidence

## Scope and status

This implementation covers roadmap Phases 2–4, usable discovery from Phase 6,
and the remaining independent credit-budget comparison from Phase 1. Delivery
Phase 2 means local verification, backend/frontend PRs, review iteration and
passing checks. It does not authorize merging, deployment, activation, legacy
migration or retirement. Roadmap phases stay In progress until their separate
environment acceptance gates are met.

The implementation started from freshly fetched backend main `282fe0adb` and
frontend main `1672474d54`, in isolated development worktrees. The older
foundation delivery's environment rollout remains independent.

## Implemented boundaries

- Additive canonical collection/new/detail routes and a competition context
  scoped by wave, competition and effective viewer. Desktop and mobile use
  the same explicit destination; the mobile shell permits route content.
- Original-primary resources retain the existing experience and mutation
  transport. Native entries do not rewrite cached ApiDrop type or winner data.
  A native-only hub remains CHAT in permanent legacy GET projections.
- Hub-only creation and optional first draft, a draft editor reusing supported
  configuration controls, explicit publication and terminal administration.
  Presentation editing remains available after participation; rules freeze.
- Atomic native entry submission/association, signed destination/content,
  current group/proxy checks, independent budgets and scoped results.
- Separate native Rank/Approve runtime, credit reconciliation, immutable
  winner votes and award descriptors, durable event outbox and effect receipts.
- Explicit operations capability assignment, Main Stage claim provenance,
  current public-parent checks, metrics, TDH and newsletter sources. Ordinary
  competitions in the same wave receive no privilege.
- Shared drop edit/delete and chat-history purge integration; historical
  content snapshots respect current removal/moderation access.
- Exact backend-branch OpenAPI synchronization, product docs and published help
  corpus. Frontend discovery and native mutation controls default off;
  canonical authorized read links remain available.
- Native notification causes and counts require explicit V2 query and device
  registration opt-ins, preserving existing notification clients and badges.

## Concrete policy choices

- D-05 uses the existing conservative cancellation rule: preserve history,
  stop new entries/votes/decisions, no implicit winner/refund/economic activity.
  Derived credits remain derived. Future consumable-credit economics are a
  separate feature.
- D-17 currently uses an explicit History filter for completed, cancelled and
  archived competitions. Deep links remain available to authorized members.
  This is a reversible presentation default; broad rollout still requires its
  product acceptance gate.
- Pause means pause decisions. Rank occurrences inside a pause are skipped;
  future occurrences do not shift. Approve reevaluates on resume and can finish
  a hold after its voting window closes. Exact period-end votes remain valid.
- Native negative credit reductions truncate toward zero to avoid the legacy
  negative-floor overspend defect. This is a correctness fix, not a claim of
  bit-for-bit parity with that defect.
- Existing automatic REP/CIC outcome semantics produce prize descriptors;
  this implementation does not introduce rating grants or issuer economics.
- Command UUIDs live in JSON bodies and successful commands return HTTP 200,
  matching generated-router support. The proposed header/201 alternatives are
  not implemented.
- Signed entries/winners freeze content. Unsigned active edits revalidate rules
  and append versions. Privileged capabilities are immutable after the first
  accepted entry or terminal lifecycle; emergency suspension uses execution
  controls, preserving historical provenance.

## Verification evidence

Focused local verification has passed independent credit parity (four suites,
69 tests), native runtime/concurrency/outbox tests, lifecycle/idempotency and
signature-binding tests, existing drop/purge/privacy regression tests, and
native browser journeys on desktop/mobile. Counts overlap across focused
runs and must not be added as a unique total.

The native browser pack passed all ten desktop/mobile cases covering parallel
budgets/content, navigation and shared chat, draft creation/resume, hub-only
creation, identity nomination, atomic entry content, and missing deep links.
Initial viewport hit-testing and screenshots confirmed unobscured mobile
navigation; no hydration or page errors occurred. The
former foundation no-native-consumer assertion is intentionally replaced by a
native/legacy transport isolation invariant because roadmap Phase 2 explicitly
requires native consumers. Frozen legacy contract expectations remain.

Frontend production compilation, source TypeScript and all 4,526 static pages
passed. Test typechecks passed with the existing Jest ratchet unchanged and
Playwright types green. Full/scoped lint and focused native Jest tests passed;
React Doctor reported 94/100, zero errors.

Backend lint, formatting, API packaging and TypeScript compilation passed.
The full backend suite exercised 655 suites and 8,162 tests: 653 suites passed
initially; the foundation read-route contract needed two assertions updated
for native routes, and an unchanged 80 ms SQL-budget timing test failed under
parallel load. The corrected OpenAPI/frozen-GET and isolated SQL-budget rerun
passed all 39 tests. No timing limits or permanent GET guarantees were relaxed.
Notification-query/device compatibility passed 126 focused tests, and the
shared pause permission/command gate passed 21. Focused counts overlap the
broad run.

The [backend PR](https://github.com/6529-Collections/6529seize-backend/pull/2125)
and [frontend PR](https://github.com/6529-Collections/6529seize-frontend/pull/4116)
record final build/check and review evidence. This
document does not claim staging, production, real queue redrive or cohort parity
from local synthetic fixtures. Do not mark the roadmap complete from a green
local suite or from historical adapter self-comparison observations.

Review follow-up adds private/parent/suppressed anonymous-content tests,
exact boundary vote metrics and durable queue retries with stable notification
IDs. Native wallet messages bind the configured deployment-specific API
host (`audience`) and Ethereum chain 1. Before enabling signed participation,
backend `API_BASE_URL` and frontend `API_ENDPOINT` must name the same API host;
backend verification fails closed if that configuration is missing.

## Future deployment gate

Backend order: `dbMigrationsLoop` → `claimsBuilder` →
`pushNotificationsHandler` → `waveLeaderboardSnapshotterLoop` → `tdhLoop` →
`newsletterLoop` → `waveDecisionExecutionLoop` → `api` → frontend. Keep native
flags off throughout deployment, then follow the backend native runtime
runbook for a separately authorized pilot. Backend readiness precedes even
merging the dependent frontend in each environment. Preserve the user's
staging E2E gate before any production phase.

## Related records

- [Roadmap](../README.md)
- [Decision register](../phase-0/decision-register.md)
- [Foundation evidence](../phase-1/implementation-evidence.md)
- [Competition product guide](../../../docs/waves/competitions/README.md)
