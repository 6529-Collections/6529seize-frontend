# Legacy migration implementation and acceptance

[Phase 5 scope](../phase-5-legacy-data-migration.md) · [Master roadmap](../README.md)

Pull requests: [backend #2132](https://github.com/6529-Collections/6529seize-backend/pull/2132) and [frontend #4153](https://github.com/6529-Collections/6529seize-frontend/pull/4153).

Status: implemented for delivery Phase 2 review. No staging/production deployment,
legacy migration, privileged transfer or engine retirement is part of this task.
A roadmap phase remains open until its production exit criteria are evidenced.

## Delivered capability

The backend's `migrate-wave` command accepts one wave UUID and resolves its
immutable legacy primary competition. The lower-level operator CLI targets that
competition UUID. They provide inspection, audited enrollment, bounded/resumable stages, durable
capture and ordered catch-up, full independent comparison windows, readiness,
atomic guarded transfer, verification, reverse reconciliation and guarded rollback
or repair review. The lower-level CLI rejects wave/default/all/native-only targets. Schema rollout
is additive; no legacy table/history/receipt is dropped.

The manually invoked `competitionMigrationLoop` Lambda provides the same guarded
operation in staging and production through AWS Console JSON events, without
operator shell or database access. It supports read-only inspection by default,
inline reviewed environment acceptance, and bounded automatic continuation of
one explicitly selected wave. Deployment creates no schedule or migration.
Remote operation retains the completed-pilot and seven-window acceptance gates;
local rehearsal retains independent parity without production attestations.
Ordinary negative votes and retained legacy history are supported. Unsupported
privileged, signed-vote, oversized and historical shapes remain owned stops.

The permanent old GET facade reads the original migrated primary from native
configuration, entries, votes, standings, decisions, winners, outcomes,
distributions and pauses. Native-only hubs/submissions retain CHAT semantics in
frozen old GETs. Supported old primary mutations and native commands share the
same transaction ownership fences as actual workers. Legacy publication receipts
close the worker-commit/queue-handoff gap. Native execution retains separate
aggregate/voter history and legacy ordering semantics after transfer.

Frontend cards and drop deep links resolve their scoped native context before
rendering a frozen CHAT response as a submission/winner. Context must match the
wave, drop and competition; a missing/mismatched context leaves the CHAT response
unchanged. Existing default selection, explicit context, forms and navigation
remain separate from immutable primary/execution ownership.

Backend operator training, deployment order, commands and pending JSON template
are maintained in `docs/legacy-competition-migration-runbook.md` in the backend
repository. Do not execute guessed SQL ownership flips or acceptance waivers.

## Validation and browser contract

Focused frontend tests cover matching native context, raw CHAT promotion,
winner provenance, drop-detail rendering and owner/drop/wave mismatches, alongside default-query,
navigation and competition-entry behavior. Full TypeScript passes. React Doctor
scanned the changed React source files with no diagnostics (100/100). The registered
`native-competition-sandbox` pack passed all 24 desktop/mobile browser checks.

Its old v2 native-submission fixture now returns CHAT. This expectation follows
the permanent compatibility contract: old endpoints must not infer an arbitrary
native competition. The browser still proves scoped submission rendering, voting,
deep-link recovery, parallel vote isolation, chat and navigation. No behavioral
check, selector lane, retry or pack registration is weakened.

Disposable backend MySQL tests exercise capture atomicity, interruption/resume,
content-only updates, voter identity rekeys, independent mismatch/window resets,
transferred Rank/Approve decisions, time-weighted histories, pauses, old vote
retry behavior, publication receipts, permanent reads, reverse reconciliation and
safe/guarded rollback. Local fixtures do not establish production acceptance.

## Pending production acceptance

- Representative native **production** Rank and Approve completions with
  reviewed decisions/effects remain unverified; staging and read-only E2E do not
  close this gate.
- GET p95/error baseline/current budgets, decision p95/p99 budgets and verified
  competition backlog/duplicate-effect alerts remain pending measured evidence.
- Each cohort needs a named operator, incident window, deployed compatible
  service revisions, rollback rehearsal and old-client acceptance.
- Each exact UUID needs seven consecutive complete approved zero-mismatch
  comparison windows, fresh final-watermark parity and drained effects.
- Completed nonprivileged cohorts precede active transfers. Complex, privileged,
  signed-vote, high-volume and unsupported rule shapes receive explicit owned
  stops pending reviewed adapter work; Main Stage remains last and blocked by a
  dedicated release-review gate.

Missing evidence is not waived or fabricated. Phase 2 review readiness is
separate from permission to deploy and from permission to operate the migration.

## Future deployment order

Backend additive schema/views/capture first; compatible maintenance, identity and
leaderboard writers next; decision worker and API after their dependencies.
Only after backend health/revision checks merge/deploy the frontend, then require
related E2E before promotion. Deploy the manual migration Lambda after compatible
backend verification and configure the regional operator allowlist. The backend runbook lists exact service units and
capture activation prerequisites. All services must use owner-aware code before
any UUID is enrolled. Rollback retains native ownership after irreversible native
decisions/effects and requires owned repair rather than blind flag reversal.

No new user-facing route, label or workflow is introduced; the existing product
help corpus remains applicable. This UI change preserves that documented behavior
while the data behind frozen old responses changes.
