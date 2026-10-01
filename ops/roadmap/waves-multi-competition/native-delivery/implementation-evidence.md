# Native Multi-Competition Delivery Evidence

## Scope and status

This implementation covers roadmap Phases 2–4, usable discovery from Phase 6,
and independent credit-budget comparison from Phase 1. It was merged, deployed
and enabled in production on 2026-09-30, followed by the frontend Sonar cleanup.
See [production evidence and open gates](./production-status-2026-10-01.md).
Roadmap acceptance, legacy migration and retirement are separate from delivery
Phase 4 completion. The approved [default competition](../default-competition.md)
is a new follow-up, not part of the shipped implementation.

The implementation started from freshly fetched backend main `282fe0adb` and
frontend main `1672474d54`, in isolated development worktrees. Deployment and
acceptance evidence is linked above.

## Implemented boundaries

- Additive canonical collection/new/detail routes and a competition context
  scoped by wave, competition and effective viewer. Desktop and mobile use
  the same explicit destination; the mobile shell permits route content.
- Original-primary resources retain the existing experience and mutation
  transport. Native entries do not rewrite cached ApiDrop type or winner data.
  A native-only hub remains CHAT in permanent legacy GET projections.
- Hub-only creation and optional first draft, a draft editor reusing supported
  configuration controls, explicit publication and terminal administration.
  Presentation and participation/voting access groups remain editable after
  participation; credit/signature/submission/timing/decision rules freeze.
- Atomic native submission of a dedicated competition drop and entry, signed
  destination/content,
  current group/proxy checks, independent budgets and scoped results.
- Separate native Rank/Approve runtime, credit reconciliation, immutable
  winner votes and award descriptors, durable event outbox and effect receipts.
- Explicit operations capability assignment, Main Stage claim provenance,
  current public-parent checks, metrics, TDH and newsletter sources. Ordinary
  competitions in the same wave receive no privilege.
- Shared drop edit/delete and chat-history purge integration; historical
  content snapshots respect current removal/moderation access.
- Exact backend-branch OpenAPI synchronization, product docs and published help
  corpus. Feature controls default off in code; production activation enabled
  discovery, creation, native writes/execution and unified reads.
- Native notification causes and counts require explicit V2 query and device
  registration opt-ins, preserving existing notification clients and badges.

## Concrete policy choices

- D-01/D-02 require one competition per dedicated drop, immutable even when
  unsigned. Existing chat drops cannot be attached. Delete follows existing
  permissions; no withdraw/disqualify actions and no public resurrection through
  history. Deletion releases current spend while restricted audit is retained.
- D-03 emits only winner lifecycle notifications; ordinary mentions/replies
  remain supported. General publication/pause/end announcements are absent.
- D-04 allows audited presentation and participation/voting access edits after
  entries; execution, credit, submission and signing rules freeze.
- D-05 has no manual end/cancel commands. Archive drafts/terminal competitions;
  clone terminal configuration into a separate draft, never reopen it.
- D-17 uses active/upcoming, completed history, all and admin-draft views with
  authorized deep links. D-19 adds the unimplemented default-selection policy.
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
- All submitted entries freeze content, including unsigned entries. Privileged
  capabilities are immutable after the first
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
record final build/check and review evidence. The local checks above remain
local evidence; later deployment/staging/production records and their limits are
in the [production assessment](./production-status-2026-10-01.md). Neither a green
local suite nor historical adapter self-comparisons establish production parity.

Review follow-up adds private/parent/suppressed anonymous-content tests,
exact boundary vote metrics and durable queue retries with stable notification
IDs. Native wallet messages bind the configured deployment-specific API
host (`audience`) and Ethereum chain 1. Before enabling signed participation,
backend `API_BASE_URL` and frontend `API_ENDPOINT` must name the same API host;
backend verification fails closed if that configuration is missing.

## Deployment Order and Subsequent Changes

Backend order: `dbMigrationsLoop` → `claimsBuilder` →
`pushNotificationsHandler` → `waveLeaderboardSnapshotterLoop` → `tdhLoop` →
`newsletterLoop` → `waveDecisionExecutionLoop` → `api` → frontend. Keep native
flags off until dependencies are ready when introducing new runtime behavior;
the recorded production activation has already occurred. Follow the backend
runtime runbook for any separately authorized rollout or rollback. Backend readiness precedes even
merging the dependent frontend in each environment. Preserve the user's
staging E2E gate before any production phase.

## Related records

- [Roadmap](../README.md)
- [Decision register](../phase-0/decision-register.md)
- [Foundation evidence](../phase-1/implementation-evidence.md)
- [Competition product guide](../../../docs/waves/competitions/README.md)
