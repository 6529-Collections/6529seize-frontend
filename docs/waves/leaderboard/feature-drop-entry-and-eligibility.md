# Wave Leaderboard Drop Entry and Eligibility

## Overview

Wave leaderboard surfaces control when users can start a new drop and which
entry UI is shown. Entry behavior differs for standard waves, curation waves,
and memes waves, and it is gated by the current account's submission
eligibility.

## Location in the Site

- My Stream wave leaderboard surfaces: `/waves`
- Wave leaderboard contexts in active wave views:
  `/waves/{waveId}`, `/messages?wave={waveId}`
- Leaderboard header controls, empty states, and curation inline create row

## Entry Points

- Open a wave and select `Leaderboard`.
- Use `Drop` controls in header/empty state when shown.
- In curation leaderboards, use the inline URL drop composer when available.

## User Journey

1. Open leaderboard content.
2. The app evaluates current submission eligibility for your account state.
3. In standard non-curation waves, eligible users can open a create-drop panel
   from `Drop`.
4. In curation waves, eligible users can get a persistent inline curation drop
   composer instead of a header `Drop` button.
5. In memes waves, `Drop` opens the memes submission modal flow.
6. If not eligible, entry controls are hidden or disabled and restriction
   messaging is shown.

## Common Scenarios

- Eligible standard-wave users can create a new drop directly from leaderboard
  surfaces.
- Default empty state shows `No drops to show` and can include a `Drop` action.
- Curation empty state can show `No curated drops yet` with curation-specific
  guidance when submission is restricted.
- Memes empty state shows `No artwork submissions yet` and keeps artwork
  submission messaging.
- Entry controls honor submission windows and per-user submission caps.

## Edge Cases

- Logged-out users can be blocked with a login requirement message.
- Profile-proxy mode can block submission entirely.
- If submission has not started yet or has ended, entry controls are blocked.
- If the user has reached submission limits, `Drop` can appear disabled with a
  limit message.
- Curation restriction messaging can include external Network Levels guidance
  (for example Level 10 requirements).

## Failure and Recovery

- If eligibility blocks submission, switch to an eligible profile/account state
  and reopen the leaderboard.
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
