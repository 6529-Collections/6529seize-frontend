# Phase 6: Progressive Rollout

[Back to the master roadmap](./README.md)

## Tracking

- Status: Not started
- Delivery target: To be selected
- Owner: Unassigned
- Evidence: Add links to decisions, implementation, validation, and deployment
  records as the phase advances.

## Outcome

Multi-competition hubs become the normal supported product model through a
controlled rollout, while single-competition waves and external GET clients
that never update continue to behave safely.

The phase converts a proven architecture into a complete, understandable user
experience for zero, one, sequential, and parallel competitions.

## Entry Criteria

- Phase 5 exit criteria are complete.
- Native runtime and migrated competitions have stable production evidence.
- High-risk parity mismatches are resolved.
- Support, moderation, and operations have incident runbooks.
- User-facing help content is ready to ship with the enabled cohorts.

## In Scope

- General competition discovery and switching.
- Active, upcoming, draft, ended, cancelled, and archived views.
- Broad enablement of hub-only and additional-competition creation.
- Existing-wave opt-in or automatic transition policy.
- Notification and activity tuning.
- Help corpus, admin guidance, and support readiness.
- Cohort expansion and operational monitoring.

## Out of Scope

- Removal or incompatible change of permanent legacy GET contracts.
- Unrelated competition features such as brackets, teams, or cross-wave
  tournaments.
- Per-competition visibility/admin expansion unless separately approved.

## Final Hub Information Architecture

The wave remains the stable destination. It provides:

- Shared chat/content.
- Competition discovery.
- Wave-level rules, admins, and notification controls.
- Aggregate activity and status.

Competition detail provides its own local navigation:

- Overview and rules.
- Entries or proposals.
- Leaderboard or approval state.
- Winners and outcomes.
- Voters/activity where allowed.
- My Votes and remaining credits.

Avoid creating one permanent top-level wave tab per competition. Use a
competition collection/selector and a local competition sub-navigation so the
layout remains usable when a wave has many completed competitions.

## Competition Discovery

Present at least:

- Active competitions, prioritizing actionable participation/voting state.
- Upcoming competitions.
- Drafts visible only to authorized admins.
- Completed competitions.
- Cancelled/archived competitions according to the approved visibility policy.

The UI must explain when multiple competitions are active simultaneously and
keep each timer, entry action, vote budget, and leaderboard visibly associated
with its competition.

On mobile, a compact selector may reuse established pill/switcher visual
patterns, but must remain distinct from root/subwave navigation.

## Existing-Wave Transition

Use the approved transition policy:

- Current competition waves initially retain their familiar one-competition
  presentation.
- Owners may opt into the hub experience when creating an additional
  competition.
- A global automatic transition occurs only after analytics and support
  evidence show that the hub presentation is understood.
- Existing deep links continue resolving to the stable legacy competition.
- Existing legacy GET responses continue projecting that same competition
  regardless of the hub navigation selected by newer clients.

Creating an additional competition is the natural point at which a legacy
single-competition wave must adopt the hub navigation.

## Creation Rollout

Enable independently:

- Hub-only wave creation.
- Create-first-competition follow-up.
- Additional competition creation in existing waves.
- Native Rank publication.
- Native Approve publication.
- Parallel schedules.
- High-risk/custom outcomes.
- Privileged competition capabilities.

This allows simple native competitions to reach general availability before
every advanced configuration is enabled.

## Notifications and Activity

Review production volume and tune defaults for:

- Publication and upcoming reminders.
- Participation and voting opening/closing.
- Pause, resume, cancellation, and end.
- Winner/outcome announcements.
- Entry activity.

Users following a wave should receive enough context to discover important
competitions without receiving entry-level spam. If per-competition follow or
mute controls are added, wave-level defaults and inheritance must remain clear.

## Help and Education

Update the frontend-owned help corpus in the same release as visible rollout.
Document:

- Waves as discussion hubs.
- Creating a wave without a competition.
- Creating and administering competitions.
- Switching between parallel competitions.
- Where entries, votes, leaderboards, winners, and outcomes live.
- What ended, cancelled, and archived states mean.
- Why competition voting credits are isolated.
- How existing single-competition waves behave.

Use concise in-product empty-state guidance for the first competition and admin
entry points. Avoid forcing a migration explanation on users who only need to
participate.

## Rollout Cohorts

Suggested progression:

1. Staff and internal wave admins.
2. Selected experienced public admins.
3. New chat hubs creating their first simple competition.
4. Existing waves adding a sequential competition.
5. Waves running simple parallel competitions.
6. General Rank and Approve availability.
7. Advanced outcomes and privileged competitions.

Each cohort requires a recorded go/no-go review. Cohorts can progress by
capability rather than waiting for every advanced configuration.

## Deployment Order

For each rollout increment:

1. Confirm all required backend workers and APIs are already deployed.
2. Deploy frontend/help support while the capability remains disabled.
3. Enable internal cohort and verify real production telemetry.
4. Expand to the next admin/wave cohort.
5. Hold or reverse the specific capability flag if its gate fails.
6. Keep unaffected competitions and wave chat operational.

When frontend and backend changes are combined, deploy backend compatibility
before enabling or deploying dependent frontend behavior.

## Validation

### Product Journeys

- Create and use a wave with no competitions.
- Run one Rank or Approve competition.
- Complete one competition and start another.
- Run Rank and Approve competitions in parallel.
- Switch between competitions without state leakage.
- View and share a completed competition.
- Cancel a draft/upcoming/active competition according to policy.
- Existing wave owner adds a second competition and adopts hub navigation.

### UX and Accessibility

- Zero, one, many, loading, empty, failure, cancelled, and archived states.
- Desktop, mobile, keyboard, and screen-reader operation.
- Long competition names and large completed histories.
- Clear competition association for entries, votes, credits, and timers.
- Chat remains usable when competition requests fail.
- Back/Forward, reload, and copied links preserve selection.

### Operational

- Native creation and publication success/failure rates.
- Entry, vote, leaderboard, and decision error rates.
- Decision lag and duplicate-side-effect alerts.
- Cross-competition credit and cache isolation.
- Legacy GET façade traffic, contract failures, and latency. Continued GET
  traffic is expected rather than treated as deprecation debt.
- Old mutation endpoint/client traffic and ambiguity failures under its
  separate support policy.
- Notification volume and mute/unfollow behavior.
- Support issue categories and admin abandonment points.

## Rollback

- Disable the affected creation or advanced-capability flag.
- Keep existing native competitions readable.
- Pause rather than engine-switch an unsafe active competition.
- Fall back to the familiar one-competition presentation for waves that have
  only one competition.
- Keep wave chat and completed competition history available.
- Re-enable a cohort only after the failure has a verified remediation.

## Deliverables

- Complete hub and competition navigation.
- Cohort-based feature controls.
- Existing-wave transition behavior.
- Final loading/empty/error/lifecycle states.
- Updated user help corpus and admin guidance.
- Product, accessibility, device, and operational evidence.
- Rollout ledger and go/no-go records.

## Exit Criteria

- New waves can be created without competitions by default.
- Eligible admins can create multiple sequential or parallel competitions.
- Users can discover, enter, vote in, and revisit the correct competition.
- Existing single-competition waves remain understandable and correct.
- Production metrics show no cross-competition state or execution leakage.
- Remaining legacy storage, mutation, and engine usage is low, known, and
  attributable.
- Permanent GET façade health is proven under native-backed data.
- Product and operations approve retiring internal legacy coupling without
  retiring the frozen GET contracts.

## Next Phase

Proceed to [Phase 7: Retire Wave Competition Coupling](./phase-7-retire-wave-coupling.md).
