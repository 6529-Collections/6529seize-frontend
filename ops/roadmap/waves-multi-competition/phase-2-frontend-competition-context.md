# Phase 2: Frontend Competition Context

[Back to the master roadmap](./README.md)

## Tracking

- Status: Not started
- Delivery target: To be selected
- Owner: Unassigned
- Evidence: Add links to decisions, implementation, validation, and deployment
  records as the phase advances.

## Outcome

The frontend treats wave and competition as separate state domains while
preserving the existing single-competition experience for current waves.

All competition-specific views receive an explicit competition. No native
competition writes or broad visual redesign are introduced in this phase.

## Entry Criteria

- Phase 1 exit criteria are complete.
- Unified read APIs and generated models are deployed and stable.
- Legacy waves have stable competition IDs.
- The approved competition URL and selection rules are recorded.

## In Scope

- Separate wave and competition providers/state.
- Competition-scoped cache keys and invalidation.
- Competition route/deep-link support.
- Conversion of timers, tabs, rules, and competition screens.
- Unified entry/submission context.
- Desktop and mobile compatibility states.
- Legacy-wave visual parity.

## Out of Scope

- Hub-only wave creation.
- Native competition creation.
- Multiple visible competitions for general users.
- Native voting or decision behavior.
- Removing legacy frontend models.

## Frontend Architecture

### Wave Context

Wave state owns:

- Hub identity and description.
- Chat configuration and timeline.
- Visibility, admins, following, muting, REP, and scoring.
- Parent/subwave navigation.
- Aggregate competition counts where available.

### Competition Context

Competition state owns:

- Competition identity, type, lifecycle, and configuration.
- Participation/voting/decision phase.
- Entries, leaderboard, winners, outcomes, voters, and My Votes.
- Competition-specific loading, empty, error, and permission states.

The selected competition is identified by both wave and competition ID. A
competition response whose `wave_id` does not match the current route must fail
safely rather than rendering cross-wave data.

### Query and Cache Identity

Define explicit query keys for:

- Wave competition list and summary counts.
- Competition detail.
- Entries and entry detail.
- Leaderboard and voters.
- Decisions, winners, outcomes, and pauses.
- Current user's votes and remaining credits.

All competition-specific invalidation includes `competition_id`. Wave-level
events may invalidate aggregate summaries without evicting unrelated
competition detail unnecessarily.

## Routing and Selection

Implement the approved shareable route, preferably a path shaped like:

`/waves/{waveId}/competitions/{competitionId}`

Required behavior:

- A direct link restores the selected competition after reload.
- An invalid competition shows a clear not-found/error state without breaking
  wave chat access.
- A competition from another wave is rejected or redirected safely.
- Browser Back and Forward restore competition and local subview correctly.
- Legacy wave routes continue selecting the stable legacy competition.
- Stored selection never overrides an explicit URL competition.

If the final design initially uses a query parameter, the same identity and
reload guarantees apply.

## Component Migration

Convert these areas to consume explicit competition state rather than reading
competition configuration directly from the wave:

- Participation, voting, and decision timers.
- Leaderboard.
- Submissions/entries.
- Winners or approved entries.
- Outcome display.
- Voters and activity tabs.
- My Votes and remaining credits.
- Competition rules/specifications.
- Submission and winner badges/context on drops.
- Admin controls that are inherently competition-specific.

Keep wave rules separate from competition rules, even if both are temporarily
shown within the existing layout.

## Entry Presentation

Evolve submission context to include stable `competition_id` and `entry_id`.
The same drop remains normal wave content and may link to its competition.

For legacy data, derive the new context from the legacy adapter. Do not require
the frontend to infer a winner only from drop type once explicit entry status
is available.

Old event payloads without competition identity must continue to work for
legacy waves for as long as those event versions remain supported. The public
GET compatibility guarantee is permanent and does not depend on frontend
migration completion.

## Visual Compatibility

For a current rank or approve wave with one legacy competition:

- Preserve the existing default tab and primary task.
- Preserve timer and status wording unless a separately approved UX change is
  included.
- Preserve mobile and desktop navigation behavior.
- Avoid adding a redundant one-item competition selector.

Build the underlying states for zero, one, and many competitions, but keep
multi-competition discovery gated until later phases.

## Loading and Failure States

Define and test:

- Wave loaded while competition detail is loading.
- Competition list loaded with no competitions.
- Legacy adapter/API temporarily unavailable.
- Selected competition not found or not visible.
- Competition list refresh after websocket activity.
- Stale deep link to archived or cancelled competition.
- Competition request failure while chat remains usable.
- Partial data such as leaderboard unavailable while competition overview is
  still readable.

Competition failures should not take down the entire wave hub.

## Deployment Order

1. Confirm Phase 1 APIs are deployed and shadow parity remains healthy.
2. Deploy frontend generated clients and internal providers behind a flag.
3. Enable the new read path for internal users and representative legacy
   waves.
4. Compare UI output, timers, queries, and event behavior with the legacy path.
5. Expand the frontend read cohort while retaining immediate fallback.
6. Make the competition context the default for legacy waves only after parity
   gates pass.

No native creation or execution flag is enabled in this phase.

## Validation

### Automated

- Provider and selector tests for zero, one, and multiple competitions.
- Route, reload, Back/Forward, not-found, and cross-wave ID tests.
- Timer parity across upcoming, participation, voting, paused, deciding, and
  completed states.
- Query-key and invalidation isolation tests.
- Legacy websocket payload compatibility tests.
- Entry/winner context tests.
- Existing wave creation and single-competition regression tests.
- Frozen external GET fixtures remain consumable by representative old-client
  contract tests even after the new frontend stops using those routes.

### Browser and Device

- Rank, approve, chat, paused, completed, and special waves.
- Desktop and supported mobile widths.
- Chat remains usable during competition API loading/failure.
- Existing one-competition layout has no unintended selector or tab changes.
- Direct competition links are shareable and reload-safe.
- Keyboard focus and accessible names remain correct in any new navigation
  boundary.

### Observability

- Frontend error rate segmented by legacy/new read path.
- Competition route not-found and cross-wave mismatch counts.
- API latency and cache-miss rates.
- Websocket invalidation volume.
- Fallback-to-legacy usage and reason.

## Rollback

- Disable the competition-context feature flag.
- Restore existing wave-derived selectors and routes.
- Keep generated models and additive route support in place.
- Do not alter backend storage or worker modes.

## Deliverables

- Separate wave and competition providers/selectors.
- Competition-scoped query keys and invalidation.
- Competition route and deep-link behavior.
- Migrated competition-specific components.
- Unified entry/submission context.
- Desktop/mobile compatibility evidence.
- Frontend fallback runbook.

## Exit Criteria

- Current single-competition waves are visually and behaviorally equivalent
  through the new competition context.
- Chat waves work with zero competitions.
- Competition failures are isolated from hub chat.
- Direct links and refreshes restore the correct competition.
- All competition-specific queries include competition identity.
- Native creation can be added without reintroducing wave-derived competition
  state.

## Next Phase

Proceed to [Phase 3: Separate Creation Flows](./phase-3-separate-creation-flows.md).
