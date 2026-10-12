# Legacy migration implementation

[Phase 5 scope](../phase-5-legacy-data-migration.md) · [Master roadmap](../README.md)

Pull requests: [backend #2132](https://github.com/6529-Collections/6529seize-backend/pull/2132) and [frontend #4153](https://github.com/6529-Collections/6529seize-frontend/pull/4153).

Status: the original implementation is deployed to staging and passed its related
staging E2E run. The follow-up simplification is in development/review. Production
promotion is separate; no production migration has been performed by this task.

## Delivered capability

The backend's `migrate-wave` command accepts one wave UUID and resolves its
immutable legacy primary competition. The lower-level operator CLI targets that
competition UUID. They provide inspection, audited enrollment, bounded/resumable stages, durable
capture and ordered catch-up, full independent comparisons, readiness,
atomic guarded transfer, verification, reverse reconciliation and guarded rollback
or repair review. The lower-level CLI rejects wave/default/all/native-only targets. Schema rollout
is additive; no legacy table/history/receipt is dropped.

The manually invoked `competitionMigrationLoop` Lambda accepts only
`{"wave_id":"<uuid>"}` in staging or production. AWS IAM invoke access is the
authorization. It derives its environment from the deployed function, migrates
or resumes the selected immutable primary, compares source/native data, transfers
ownership atomically and verifies the result. No operator profile, wave access,
reason, acceptance record, completed pilot, cohort approval or timed parity
windows are required. Large runs continue automatically from saved checkpoints;
a repeated invocation verifies an already migrated wave without recopying it.
Deployment creates no schedule or migration. Real data mismatches and incomplete
backend prerequisites stop safely; native repair-required states retain ownership.
Signed voting, special capabilities, upper-threshold metadata and paginated large
content comparisons are preserved.

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

The one-field invocation, deployment order and failure recovery instructions
are maintained in `docs/legacy-competition-migration-runbook.md` in the backend
repository. Do not execute guessed SQL ownership flips.

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
content-only updates, voter identity rekeys, independent comparisons and mismatches,
transferred Rank/Approve decisions, time-weighted histories, pauses, old vote
retry behavior, publication receipts, permanent reads, reverse reconciliation and
safe/guarded rollback. These tests validate behavior on disposable databases, not production data.

## Migration behavior

The backend performs the comparison and switch automatically. A mismatch before
transfer reports an error and leaves the wave on legacy storage. A developer
investigates/fixes the cause and reinvokes with the same wave ID. Concurrent votes
or edits are captured and caught up before transfer. Successful comparison and
final locked verification require no human approval or timed waiting.

## Future deployment order

Backend additive schema/views/capture first; compatible maintenance, identity and
leaderboard writers next; decision worker and API after their dependencies.
Only after backend health/revision checks merge/deploy the frontend, then require
related E2E before promotion. Deploy the manual migration Lambda after compatible
backend verification. The backend runbook lists exact service units and
capture activation prerequisites. All services must use owner-aware code before
any UUID is enrolled. Rollback retains native ownership after irreversible native
decisions/effects and requires owned repair rather than blind flag reversal.

No new user-facing route, label or workflow is introduced; the existing product
help corpus remains applicable. This UI change preserves that documented behavior
while the data behind frozen old responses changes.
