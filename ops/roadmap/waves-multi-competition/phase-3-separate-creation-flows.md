# Phase 3: Separate Creation Flows

[Back to the master roadmap](./README.md)

## Tracking

- Status: In progress (shipped scope and open acceptance tracked separately)
- Delivery: Hub creation, native drafts, publication and administration shipped in production.
- Remaining: Record final product/device acceptance and resolve the original
  combined Rank/Approve shortcut requirement; it is not claimed as shipped.
- Responsible roles: Frontend + backend + product; assign named owners when scheduling the remaining work.
- Evidence: [Production status and open gates](./native-delivery/production-status-2026-10-01.md),
  [native implementation](./native-delivery/implementation-evidence.md) and
  [current decisions](./phase-0/decision-register.md).
- Roadmap numbering is distinct from delivery Phases 1–4. The sections below
  define the milestone and remaining obligations; they are not a claim that
  every listed acceptance check has passed.

## Outcome

Wave creation produces a discussion hub without requiring competition settings,
and administrators can create and edit a competition draft as a separate
resource.

The current enabled frontend creates a hub, then offers separate competition
creation. Legacy create-wave APIs remain available to supported older clients;
the originally planned combined Rank/Approve shortcut is not implemented.
Keep that requirement open until implemented or explicitly superseded by a
product decision; separate creation is not evidence that the shortcut shipped.

## Entry Criteria

- Phase 2 exit criteria are complete.
- Wave and competition state are separate in the frontend.
- Native competition draft schema and read APIs are deployed.
- Creation, publication, archive/clone, and edit policies are approved.
- Native execution remains disabled until Phase 4.

## In Scope

- Hub-only wave creation.
- Native competition draft create/update/archive operations.
- Extracted competition wizard.
- Optional “create first competition” follow-up.
- Admin entry points for additional competitions.
- Draft validation, review, conflict handling, and permission checks.
- Preserved old creation APIs plus the new hub-then-competition journey.
- Original combined Rank/Approve compatibility shortcut (outstanding).
- Help content changes prepared for the eventual feature rollout.

## Out of Scope

- General production publication of native competitions before execution is
  deployed.
- Native submissions, votes, decisions, or outcomes.
- Per-competition visibility or admin roles.
- Removal of the existing create-wave API.

## Backend Work

### Hub Creation

Support creating a wave whose persisted responsibility is the hub:

- Overview, description, picture, and links.
- Visibility and wave administrators.
- Chat, moderation, and slow-mode settings.
- Parent/subwave relationship where applicable.

The legacy projection of a native hub is chat-only. Old clients must not be
required to understand a competition to join or use its chat.

Creating a native competition in an existing legacy wave never changes the
immutable primary competition returned by its legacy GET APIs.

### Competition Draft Commands

Implement approved OpenAPI-first commands for:

- Create draft.
- Update draft with optimistic concurrency/version checking.
- Validate draft for publication.
- Archive an unused draft according to policy.
- Publish, gated so it cannot activate before Phase 4 workers are ready.

Every command verifies that the caller is an authorized wave administrator and
that the competition belongs to the supplied wave.

Publication validation should cover groups, dates, required metadata/media,
credit rules, outcomes, duplicate settings, signatures, and mutually exclusive
Rank/Approve settings.

### Configuration Integrity

- Increment the configuration version when signable rules change.
- Make competition type immutable after publication.
- Define which future dates may be extended or shortened safely.
- After the first accepted entry, freeze credit/signature/submission/timing/
  decision/outcome rules. Participation/voting access groups and presentation
  remain editable with an audited config version.
- Entries themselves remain immutable, including unsigned entries.
- Published competitions finish through configured rules; no manual end/cancel
  actions. Archive drafts or terminal records; clone terminal configurations.
- Reject edits that would reinterpret accepted entries or votes.
- Record lifecycle transitions and privileged admin actions for auditability.

## Frontend Work

### Wave Wizard

Reduce wave creation to hub concerns:

1. Overview.
2. Visibility, groups, and administrators as required for the hub.
3. Chat/moderation rules.
4. Description and review.

Do not ask for Rank/Approve, competition dates, submission requirements,
voting credits, thresholds, winners, or outcomes in the hub flow.

### Competition Wizard

Extract and adapt the existing competition-related steps:

1. Competition overview and type.
2. Participation and voting groups.
3. Dates and lifecycle preview.
4. Entry/drop requirements.
5. Competition rules and signatures.
6. Voting and credit settings.
7. Outcomes/distribution.
8. Review and publication readiness.

The wizard operates on competition draft state, not wave configuration.
Validation errors identify the owning step and preserve entered values.

### Entry Points

Provide:

- “Create a wave” for a hub without a competition.
- Optional “Create the first competition” after successful hub creation.
- “New competition” for eligible wave administrators.
- Draft resume/edit entry points.
- A clear follow-up from hub creation to the separate competition wizard.
- Outstanding original shortcut: choosing Rank/Approve at the old entry point
  creates a hub and its first competition. Preserve this requirement until a
  product amendment or implementation closes it.

If either step of hub-then-competition creation fails, show the successfully
created resource and a recoverable next action. Do not hide a created hub or
silently create duplicate competitions on retry.

## Competition Administration UX

Administrators need explicit states for:

- No competitions yet.
- Draft incomplete.
- Draft valid and ready to publish.
- Upcoming published competition.
- Active competition, whose unsafe fields are locked.
- Ended or archived competition; retained cancellation states remain readable.
- Multiple drafts or competitions with overlapping dates.

Show destructive and irreversible lifecycle actions with the consequences for
entries, votes, outcomes, and notifications.

## Idempotency and Recovery

- Hub and competition creation commands accept idempotency keys.
- The hub-then-competition journey uses separate stable keys for the hub and first
  competition.
- Retrying after a timeout returns the original resource rather than creating
  a duplicate.
- Optimistic concurrency prevents two administrators from silently
  overwriting the same draft.
- If a selected group is deleted or becomes inaccessible, publication
  validation blocks and identifies the invalid dependency.

## Feature Controls

Separate controls are required for:

- Hub-only creation UI.
- Native competition draft creation.
- Native publication.
- Admin/user cohorts.

Native publication remains off in production until Phase 4 execution and
rollback paths have passed their gates.

## Deployment Order

1. Deploy backend hub/draft commands with all new writes disabled.
2. Validate authorization, idempotency, audit, and optimistic concurrency.
3. Deploy frontend hub and competition wizards behind admin/internal flags.
4. Enable draft creation in non-production and internal production cohorts.
5. Exercise recovery from partial hub/competition creation failures.
6. Prepare help-index changes for the eventual user-visible rollout.
7. Leave general native publication disabled until Phase 4.

## Validation

### Backend

- Hub creation without competition fields.
- Draft create/update/validate/archive authorization.
- Idempotent retries and concurrency conflicts.
- Type/lifecycle immutability rules.
- Group/date/outcome/credit validation.
- Old create-wave endpoint regression coverage.
- Legacy projection of a native hub as chat-only.
- Permanent GET projection of an existing wave remains tied to its original
  competition after additional drafts or competitions are created.

### Frontend

- Hub wizard does not require competition decisions.
- Competition wizard preserves all current Rank/Approve configuration
  capabilities.
- Per-step validation, navigation, reload/resume, and unsaved-change behavior.
- The hub-then-competition journey creates exactly one hub and one draft.
- When delivered, the combined shortcut creates exactly one hub and draft and
  recovers safely from partial failure.
- Partial failure provides a usable recovery path.
- Non-admin users cannot see or invoke admin actions.
- Desktop, mobile, keyboard, and screen-reader review.
- Loading, empty, API error, validation error, and conflict states.

### Product Scenarios

- Create a chat hub and stop.
- Create a hub and immediately create a Rank draft.
- Return later and create an Approve draft.
- Create two drafts with overlapping schedules.
- Edit a draft from another admin session and resolve a version conflict.
- Attempt publication with missing or deleted dependencies.

## Rollback

- Disable new creation entry points.
- Keep existing wave creation available.
- Keep created hubs usable as chat waves.
- Preserve competition drafts for later recovery; do not delete them.
- Leave native publication disabled.

## Deliverables

- Hub-only wave create API and UI.
- Native competition draft commands.
- Reusable competition wizard.
- Admin entry points and draft management.
- Separate creation steps and partial-failure recovery.
- Original combined shortcut, or an explicit product amendment resolving it.
- Prepared help-index/user documentation update for rollout.
- Creation rollback runbook.

## Exit Criteria

- A wave can be created and used without any competition.
- A competition draft can be created later without modifying the wave's hub
  identity.
- Existing Rank/Approve creation intent has a non-duplicating hub-then-competition
  path, while supported older creation clients retain compatibility.
- Draft configuration covers all settings required by the native runtime.
- No native competition can activate before Phase 4 workers are deployed.

## Next Phase

Phase 4 runtime is deployed. Close remaining creation acceptance records and
follow the [remaining sequence](./native-delivery/production-status-2026-10-01.md#remaining-sequence).
