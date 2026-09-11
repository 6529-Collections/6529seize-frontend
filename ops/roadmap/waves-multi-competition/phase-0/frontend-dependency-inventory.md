# Frontend Dependency Inventory

This inventory was inspected from the current frontend main branch. Paths are
frontend-repository relative.

## Create Configuration and Validation

- `components/waves/create-wave/hooks/useWaveConfig.ts` initializes one
  `CreateWaveConfig`, defaults to `CHAT`, and resets the combined configuration
  when wave type changes.
- `types/waves.types.ts` groups overview, groups, dates, drops, voting,
  outcomes, chat, and display state into the same wave configuration.
- `helpers/waves/waves.constants.ts` selects creation steps by `ApiWaveType`:
  chat omits competition steps; rank/approve add dates, drops, voting, and
  outcomes.
- `helpers/waves/create-wave.validation.ts` and
  `helpers/waves/create-wave.helpers.ts` validate and map the combined form to
  one `ApiCreateNewWave`, including decision schedule calculation.
- `components/waves/create-wave/hooks/useCreateWaveSubmission.ts` creates the
  wave, then its description drop and metadata; its partial-failure handling is
  wave-centric.

Target: hub creation writes wave-only fields. Competition creation/admin has a
separate draft form, mutation, validation state, and recovery flow. Shared
controls may be reused, but the state machines are not nested steps of one
transaction.

## Generated Models and Projections

- `generated/models/ApiWave*`, `ApiCreateNewWave*`, `ApiUpdateWave*`,
  `ApiDrop*`, leaderboard, decision, outcome, and notification models are
  generated from backend OpenAPI and must never be hand-edited.
- `services/api/waves-v2-api.ts` maps sidebar `has_competition` to a simplified
  Rank/Chat projection while full wave reads expose current wave type.
- `helpers/waves/wave.helpers.ts`, `services/api/drop-v2-mappers.ts`, and
  wave/drop v2 helpers create wave-minimum and compatibility projections.

Target: regenerate native `Competition`, `CompetitionEntry`, lifecycle, and
page models. Keep current wave/drop generated fields and mapping behavior for
legacy GETs. Internal diagnostic storage mode is not a presentation concern.

## Timers and Lifecycle

- `hooks/useWaveTimers.ts` computes participation and voting phases once per
  selected wave, ticking every second.
- `helpers/waves/time.utils.ts`, `helpers/waves/time.types.ts`,
  `hooks/waves/useDecisionPoints.ts`, and `hooks/useWave.ts` derive first/last
  decisions, pauses, and next decision from wave configuration.
- Leaderboard and decision time components under
  `components/waves/leaderboard/time` consume this single context.

Target: hub has no competition timer. A `CompetitionContext` computes timers
for the selected competition; compact cards may subscribe to coarser phase
updates for many parallel competitions. Server timestamps remain authoritative
and clock/skew/loading states are explicit.

## Tabs, Navigation, and Stored Selection

- `components/brain/ContentTabContext.tsx` chooses chat, leaderboard,
  submissions, sales, winners, outcome, My Votes, polls, and FAQ tabs from one
  wave type/state.
- `types/waves.types.ts` defines `MyStreamWaveTab`; desktop/mobile tab shells
  live under `components/brain/my-stream` and wave header/navigation folders.
- Stored tab preference uses `memes_wave_last_tab_by_id`, mapping only wave ID
  to tab.
- `helpers/navigation.helpers.ts` creates `/waves/{waveId}` and message routes,
  plus serial/drop query links. `components/link-preview/SeizeLinkParser.ts`
  recognizes wave/drop links but no competition identity.

Target: hub tabs (`Chat`, `Competitions`, hub rules/about) remain wave-scoped;
competition tabs are keyed by `(wave_id, competition_id)`. Stored selection and
tab preference use that tuple. Canonical detail is
`/waves/{wave_id}/competitions/{competition_id}`. Existing wave, serial, and
drop links remain valid.

## Rules and Specifications

Current rule/specification rendering under `components/waves/specs`,
`helpers/waves/wave-rules.shared.ts`, and create-rule helpers reads
participation, voting, timing, decision, and outcome values from `ApiWave`.
Target competition specs render an immutable configuration version. Hub rules
render only visibility/chat/moderation. Legacy screens continue using the
legacy wave projection.

## Queries, Invalidations, and Optimistic State

`components/react-query-wrapper/query-keys.ts` defines wave keys including
`WAVES_OVERVIEW`, `WAVES_V2`, `WAVE_SUBWAVES`, `WAVES`, `WAVES_PUBLIC`,
`WAVE`, `DROPS`, `DROPS_LEADERBOARD`, `WAVE_DECISIONS`, `WAVE_OUTCOMES`,
distribution, polls, logs, voters, curations, metadata, followers, and REP.
`ReactQueryWrapper.tsx` broadly invalidates wave and drop families and seeds
wave/drop caches.

`hooks/useWaveCompetitionEntries.ts` is a presentation helper over current
wave/drop filters; its query key still uses `QueryKey.DROPS` and `wave_id`, so
its name does not imply native competition identity.

Target keys are separate and explicit:

```text
[COMPETITIONS, { wave_id, status, cursor, limit }]
[COMPETITION, { wave_id, competition_id }]
[COMPETITION_ENTRIES, { wave_id, competition_id, filters, cursor, limit }]
[COMPETITION_LEADERBOARD, { wave_id, competition_id, cursor, limit }]
[COMPETITION_DECISIONS, { wave_id, competition_id, cursor, limit }]
```

Native mutations invalidate the precise competition family and any affected
wave/drop legacy projection. Optimistic updates include both IDs and rollback
from a captured snapshot; no invalidation guesses an active competition.

## Websocket and Notification Handling

`services/websocket` consumes current drop, vote/rating, reaction,
notification, typing, and subscription events and invalidates wave/drop query
families. Target handlers treat new competition/entry IDs as optional:

- old event: preserve existing behavior;
- new event with IDs: invalidate precise native keys and required legacy keys;
- unknown additive event/field: ignore safely;
- duplicate/out-of-order event: dedupe by event ID/version and refetch.

Notification components continue accepting existing cause and related-drop
fields. New lifecycle notifications navigate only after verifying wave and
competition visibility.

## Drop Entry and Winner Context

- Current submission/winner views filter `PARTICIPATORY` and `WINNER` drops.
- Leaderboard, user-entry, artwork, winner-artist, and quick-vote components
  consume `drop.wave` and `drop.winning_context` as single-wave competition
  context.
- `hooks/useUserArtSubmissions.ts`, `hooks/useUserWinningArtworks.ts`, and meme
  presentation components use Main Stage-specific response/context fields.

Target: drop cards remain reusable chat content. Entry badges and winner
context display stable competition/entry IDs. If a drop has several entries,
the selected context is URL/query/context-driven, never whichever entry is
first. Legacy primary views continue showing original participatory/winner
meaning.

## Special Presentation

Frontend environment/settings expose configured memes/Main Stage, curation,
quorum, and announcement wave IDs. Main Stage submission IDs and winner
context influence artwork cards, leaderboard details, claim/mint affordances,
and special tabs.

Target: generated API capability data on the authorized competition drives
native presentation. During migration, settings map special wave IDs to the
immutable primary competition. Frontend code must not infer that every
competition in a special wave is privileged.

## Desktop and Mobile State Matrix

| State | Desktop | Mobile | Data boundary |
| --- | --- | --- | --- |
| Zero competitions | Chat plus empty competitions panel and admin CTA | Chat with competitions sheet/card | Wave only |
| One competition | Hub nav plus direct competition summary/detail | Competition summary with explicit back to chat | Wave + selected competition |
| Many sequential | Status-grouped list/history; selected detail | Filterable list then full-screen detail | Competition list + selection |
| Many parallel | Overview cards with independent phase/timer; selected detail | Compact active list; one selected detail | No global “active” competition |
| Draft admin | Admin-only drafts and validation | Admin draft list/form with save recovery | Draft competition |
| Ended/cancelled | Read-only banner, entries/results/history | Same, condensed controls | Terminal competition |
| Loading/error/offline | Independent hub/list/detail boundaries with retry | Skeleton/card/detail retry | Preserve route/selection |
| Forbidden/not found | Do not leak existence; safe return to hub | Same | Authorization before context |

## Frontend Estimate Boundary for Roadmap Phase 2

The required work is separable into generated models/API clients, native query
keys, wave and competition providers, URL/selection state, compatibility
adapters, websocket invalidation, timer extraction, and desktop/mobile parity
tests. Roadmap Phase 2 need not change visible behavior; hub/competition
creation is roadmap Phase 3.
