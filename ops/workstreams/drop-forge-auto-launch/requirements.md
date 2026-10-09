# Drop Forge Auto Launch — Frontend Requirements Analysis

Status: requirements proposal, 2026-10-09. This PR changes documentation only.
Controls, routes, mention behavior, generated models, and current launch behavior
are not changed. Backend execution requirements are tracked in the companion PR.

Companion: [backend requirements PR #2143](https://github.com/6529-Collections/6529seize-backend/pull/2143).

## Purpose and confirmed scope

Give operators a way to configure, arm, observe, and recover an unattended Drop
Forge launch. Backend owns the operational signer, scheduling, transactions,
durable preparation/execution state, and wave publication. Frontend displays
authoritative state and sends authorized configuration/control requests.

Confirmed scope includes a wave feed whose ID will be manually supplied in
backend environment configuration/secrets; `@dropforgers6529` with a manually
supplied profile-ID list; and investigation/fixes for reported EMMA phase
download and finalize timeouts. Those values need not be collected in a new UI.
Exact UI layout, endpoints, and several operational policies remain proposals.

## Current code evidence

- [Launch writes](../../../components/drop-forge/launch/useLaunchClaimWrites.ts)
  submit `initializeClaim`, `updateClaim`, and `airdrop` using the connected
  browser wallet. Phase windows and prices are supplied at submission.
  Pay Artist sends ETH from that wallet's balance.
- [Drop Forge permissions](../../../hooks/useDropForgePermissions.ts) distinguish
  distribution/craft access, claims access, and creator owner/admin access.
  [Contract admin transactions](../../../components/drop-forge/contract-admins/useContractAdminTransaction.ts)
  remain wallet-signed operations. Backend access does not create a signer.
- [EMMA subscription phase download](../../../components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscription.tsx)
  calls `subscriptions/allowlists/{contract}/{tokenId}/{planId}/{phaseId}` and
  builds CSV files after receiving results. Backend currently performs preparation
  mutations in that request; this is not simply a static file download.
- [EMMA finalize](../../../components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscriptionFooter.tsx)
  posts to `distributions/{contract}/{tokenId}/normalize` and refreshes overview
  on success. Other airdrop exports use distribution endpoints.
- [Global group mentions](../../../helpers/waves/drop-group-mentions.ts) already
  recognize `@devs6529`. [Personal Quick Tags](../../docs/waves/composer/feature-personal-mention-shortcuts.md)
  expand into individual profile mentions and have different semantics.

Reported timeout causes are not confirmed. Backend/upstream evidence is needed
to distinguish request limits, heavy processing, and export problems.

## FE-1: Configure and arm a launch

1. Extend `/drop-forge/launch/{id}` with an automation section using existing
   page patterns. Keep craft/published-metadata preparation as a prerequisite.
   A new route is not required unless design review identifies a reason.
2. Show/edit phase prices, UTC-backed start/end times with clear local timezone
   display, required airdrop categories/order, and the selected completed
   distribution version. Backend validates all configuration independently.
3. Display signer address, chain/contract, permission and gas readiness, payment
   receiver, and configured reporting readiness. Show public addresses/status
   only; signing credentials and secrets stay server-side.
4. Provide review/arm, pause, resume, and cancel controls under backend-enforced
   permissions. Review should make the exact plan, recipient/token totals,
   phases, money destinations, and automated action scope understandable.
   Resume must reconcile existing actions, not blindly restart the plan.
5. Persist configuration through backend APIs. Prevent stale tabs from replacing
   newer revisions using version checks, and require a new review/arm step when
   approved execution inputs change.
6. Explain timing accurately: on-chain windows control mint eligibility, while
   phase changes require confirmed transactions. Present missed-window or
   delayed-transition status rather than promising exact-second activation.

## FE-2: Progress, recovery, and manual coordination

1. Render backend launch state and an action timeline: due, pending, submitted,
   confirmed, failed, uncertain, or blocked as appropriate. Distinguish launch
   paused/cancelled state from outstanding transactions still capable of mining.
2. Include transaction links, claim/phase, airdrop batch progress/counts,
   confirmation status, last update time, and safe error/recovery instructions.
   Avoid optimistic completion based solely on HTTP acceptance or tx hash.
3. Reopening the page or switching devices restores durable backend status.
   Any future status polling must be scoped to active jobs and stop/back off on
   completion, loss of access, background visibility, and repeated errors.
4. Coordinate existing manual initialization/update/airdrop controls with
   automation ownership. Disable or route conflicting actions through an
   explicit takeover workflow; backend must enforce this coordination too.
   Client-side disabling alone cannot prevent a duplicate transaction.
5. Pause/cancel must describe what will stop and what is already irreversible.
   An uncertain transaction must offer reconciliation/status, not a generic
   repeat-airdrop button. Preserve manual operation for claims not managed by
   automation under existing permissions.
6. Owner-only admin changes remain separate. Pay Artist remains manual and
   outside automated payout scope until a separate money-flow decision.

## FE-3: @dropforgers6529 and wave visibility

1. Recognize `@dropforgers6529` as a global group mention in composer suggestions,
   token detection, posted-drop rendering, notification views, and edits/replies
   wherever existing global mention contracts require it.
2. Consume the backend-generated mention enum/models. Backend resolves the
   configured profile IDs, creates notification metadata, and applies access
   rules. Never infer recipients from creator wallets or a frontend-local list.
3. Reserve the token against personal Quick Tag collisions in both repositories.
   Match existing casing/boundary rules and preserve links/code handling.
   Invocation permissions remain a product decision; frontend availability must
   follow the backend contract, including a possible bot-only policy.
4. Link to the configured operations wave where authorized. Wave reports are an
   activity surface; backend transaction state remains the authority for launch
   recovery if posting fails. Show notification-delivery problems distinctly
   from failed chain actions.

## FE-4: EMMA processing and timeout recovery

1. Trace reported cases using plan/card/phase, action, timestamp, status/error,
   and whether a retry succeeded. Cover subscription phase downloads, public or
   special phases, finalize, and airdrop exports as distinct paths.
2. If backend changes long preparation/finalization into jobs, show acceptance,
   processing, completion, failure, and recoverable/unknown states. Store/use
   server job IDs so refresh or an interrupted request does not lose progress.
3. Separate preparing a phase from downloading its completed artifact. Preserve
   JSON/CSV/Manifold output formats and existing consolidation, ordering, and
   subscription/allowlist semantics unless a confirmed defect requires change.
4. On request timeout, explain that completion is unknown and check durable
   status before offering a repeat mutation. Deduplicate concurrent actions
   across tabs through backend identity/version controls.
5. Finalize is available only against a complete compatible phase version; show
   blocked prerequisites and stale results. Prevent conflicting edits/download
   preparation/reset controls while the relevant job owns execution.
6. Keep existing EMMA workflows working during API transition, with a deliberate
   compatibility plan. Do not implement a frontend-only timeout increase as the
   presumed fix for unmeasured backend work.

## Contract and implementation surfaces

Expected backend contracts include versioned plan read/update, arm/pause/resume/
cancel controls, action/transaction status, reporting readiness, preparation-job
status/artifact references, and the new group-mention value. Exact endpoint
names and state enums must be agreed before UI implementation.

Use generated OpenAPI models and `services/api/common-api.ts`; synchronize the
final backend spec and generated frontend artifacts in the implementation task.
Reuse existing query keys/invalidation and avoid competing sources of truth.
No OpenAPI generation is required for this documentation PR.

Likely frontend surfaces are Drop Forge launch state/write/view hooks, EMMA
review subscription/finalize/export components, global mention helpers and
composer consumers, and generated models. New visible behavior must follow
accessibility/localization rules and update the Drop Forge/EMMA user docs and
help-bot knowledge alongside implementation. These proposal docs must not be
presented as currently available user functionality.

## Acceptance scenarios for later implementation

| Scenario | Required outcome |
| --- | --- |
| Configure and arm prepared claim | Operator reviews version/totals/windows; backend returns authoritative state |
| Refresh during automation | Durable action and transaction progress is restored |
| Pause with a submitted transaction | No false cancellation claim; outstanding transaction remains visible |
| Manual conflicting action or stale tab | Conflict is explained and backend rejects unsafe replay/revision |
| Delayed or missed phase transition | Timing status and recovery policy are visible without fake success |
| Error wave post | `@dropforgers6529` renders as a group mention; configured recipients are resolved by backend |
| Wave delivery outage | UI distinguishes reporting failure from transaction outcome |
| Slow/special EMMA phase or finalize | Durable job/status recovery avoids blind repeat mutations |
| Repeated download after preparation | Same completed version and expected output formats are returned |
| Permission/chain/context changes | Unauthorized actions stop and stale results do not leak across contexts |

Review existing Jest and Playwright Drop Forge/EMMA/mention coverage before
implementation, then add focused state/contract tests and representative browser
flows for configuration, refresh recovery, manual takeover, and mention display.
This proposal performs no application tests or browser execution because no
runtime behavior changes.

## Dependencies and decisions before implementation

Backend EMMA diagnosis and durable execution contracts precede frontend controls.
Confirm automation permissions, takeover UX, missed-window wording, airdrop
categories/order, global mention invocation policy, and backend readiness
requirements. The wave ID and recipient profile IDs will be provided manually;
they are deployment inputs, not reasons to hardcode values in the UI.

No frontend deployment is required by this documentation PR. Future API and
mention contract changes must be coordinated with backend before dependent UI
rollout. No desktop/Electron changes are in this scope.
