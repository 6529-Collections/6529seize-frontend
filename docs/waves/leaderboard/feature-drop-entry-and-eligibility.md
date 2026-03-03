# Wave Leaderboard Drop Entry and Eligibility

## Overview

Wave leaderboard entry controls when users can start a new submission and which
entry UI appears. Behavior differs for standard waves, curation waves, and
memes waves, and it is gated by the current account's submission eligibility.

## Location in the Site

- Wave thread leaderboard: `/waves/{waveId}` (legacy
  `/waves?wave={waveId}` redirects here).
- Direct-message thread leaderboard: `/messages?wave={waveId}` (no
  `/messages/{waveId}` route).
- Leaderboard header, empty states, and curation inline composer row.

## Entry Points

- Open a wave and select `Leaderboard`.
- Use `Drop` in the header or default empty state when available.
- In curation leaderboards, use the inline URL drop composer.
- In memes leaderboards, use `Drop` to open the submission modal.

## User Journey

1. Open leaderboard content.
2. The app evaluates login state, proxy state, and submission eligibility.
3. In standard non-curation waves, eligible users can open a create-drop panel
   from `Drop`.
4. In curation waves, eligible users can get a persistent inline curation drop
   composer instead of a header `Drop` button.
5. In memes waves, `Drop` opens the memes submission modal flow.
6. If not eligible, entry controls switch to restriction states (for example
   hidden header `Drop`, disabled default empty-state `Drop`, or curation
   restriction guidance).

## Common Scenarios

- Default empty state shows `No drops to show` and can include a `Drop` action
  (enabled for eligible users, disabled with restriction text otherwise).
- Curation empty state shows `No curated drops yet`; restricted users can see
  curation guidance and a Network Levels link.
- Memes empty state shows `No artwork submissions yet` and keeps artwork
  submission messaging.
- Entry controls honor submission windows and per-user submission caps.

## Edge Cases

- Logged-out users are blocked with a login requirement message.
- Profile-proxy mode blocks submission.
- If submission has not started yet or has ended, create entry is blocked.
- If the user has reached submission limits, create entry is blocked with
  limit messaging.
- Curation restriction messaging can include external Network Levels guidance
  (for example Level 10 requirements).

## Failure and Recovery

- If eligibility blocks submission, switch to an eligible profile/account state
  and reopen `Leaderboard`.
- If create UI opens but submission fails, retry from the same creation surface.
- If wave timing/eligibility changes while browsing, refresh or revisit
  leaderboard to re-evaluate entry controls.

## Limitations / Notes

- Entry availability depends on login state, proxy state, participation
  permissions, submission timing, and wave-specific constraints.
- Curation waves can enforce higher participation-level requirements before
  entry controls appear.
- This page documents entry gating and start points; drop content/format rules
  are documented on composer pages.

## Related Pages

- [Wave Leaderboards Index](README.md)
- [Wave Leaderboard Drop States](feature-drop-states.md)
- [Wave Leaderboard Sort and Group Filters](feature-sort-and-group-filters.md)
- [Wave Curation URL Submissions](../composer/feature-curation-url-submissions.md)
- [Memes Submission Workflows](../memes/feature-memes-submission.md)
- [Docs Home](../../README.md)
