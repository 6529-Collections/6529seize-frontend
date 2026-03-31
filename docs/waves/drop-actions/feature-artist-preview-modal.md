# Wave Drop Artist Preview Modal

## Overview

The artist activity badge opens a modal for one artist's The Memes activity:
`Active Submissions` and `Minted to Memes`.

`Minted to Memes` combines:

- main-stage winner drops
- The Memes cards from `artist_of_prevote_cards`

Badge state decides which section opens first.

## Location in the Site

- Profile headers on `/{user}` routes that reuse the shared profile header:
  `/{user}`, `/{user}/brain`, `/{user}/collected`, `/{user}/xtdh`,
  `/{user}/subscriptions`, and `/{user}/proxy`.
- Wave and direct-message drop headers:
  `/waves/{waveId}` and `/messages?wave={waveId}`.
- Single-drop overlays opened with `drop={dropId}` in the current route.
- Meme participation and meme leaderboard drop rows.

## Entry Points

- Select the artist activity badge next to the artist name.
- The badge is hidden when both activity counts are `0`.
- Badge state:
  - Palette: active submissions only, opens `Active Submissions`.
  - Trophy: minted-memes activity only, opens `Minted to Memes`.
  - Trophy with blue dot: both exist, opens `Active Submissions`.
- On non-touch desktop devices, hover tooltip copy reflects current counts and
  uses `minted meme(s)` wording for trophy activity.

## User Journey

1. Select the artist activity badge.
2. The modal opens to the section mapped from the badge state.
3. If both datasets exist, tabs are shown for switching between
   `Active Submissions` and `Minted to Memes`.
4. In `Minted to Memes`:
   - selecting a winner card opens that drop in the current route context
     (`drop` query is set and existing query params are preserved)
   - selecting a prevote card follows its token link to `/the-memes/{tokenId}`
5. The modal closes after opening a winner card through drop context.
6. Users can also close with close button or backdrop click/tap.
7. In app-wrapper contexts, swipe-down close is also supported.

## Common Scenarios

- `Active Submissions` loading state shows `Loading submissions...`.
- `Active Submissions` cards show artwork preview, optional title, position,
  current score, submission date, and mini vote control.
- Submission position labels use ordinal place formatting (`1st`, `2nd`,
  `3rd`, `4th`, and so on).
- `Minted to Memes` loading state shows `Loading minted memes...`.
- `Minted to Memes` can render a mixed grid:
  - winner cards first
  - prevote cards after winners
- Winner cards show artwork preview (or text fallback), optional title, score
  total, top-voter avatars, voter count, and won date (or created-date
  fallback).
- Prevote cards use The Memes collection card layout and link to the token
  route.
- In compact + small-screen thread layouts, opening a winner card through drop
  context also closes the chat column.

## Edge Cases

- Tabs are hidden when only one dataset exists.
- Active-submission cards can be fewer than profile counts when individual drop
  lookups fail or return unusable data.
- Minted-memes cards can be fewer than trophy counts when winner-drop or
  prevote-card lookups fail.
- If no minted-memes cards are renderable, the modal shows `No minted memes
  found.`.
- On desktop web, `Esc` does not close this modal.
- Header subtitle is fixed to `The Memes Collection`.

## Failure and Recovery

- The modal has no inline error banner or retry button.
- If winner-drop or prevote-card fetches fail, affected cards are omitted.
- Close and reopen the modal to retry with normal fetch behavior.
- If both datasets exist, switching tabs loads the other dataset section.

## Limitations / Notes

- This is a contextual viewer, not a profile management surface.
- Badge state and tab availability depend on currently loaded artist activity
  counts.
- Trophy activity count includes both winner drops and `artist_of_prevote_cards`
  entries.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop Actions Index](README.md)
- [Profile Header Summary](../../profiles/navigation/feature-header-summary.md)
- [Wave Drop Vote Summary and Modal](feature-vote-summary-and-modal.md)
- [Wave Drop Content Display](feature-content-display.md)
- [Wave Leaderboard Drop States](../leaderboard/feature-drop-states.md)
- [Wave Top Voters Lists](../leaderboard/feature-top-voters-lists.md)
- [Docs Home](../../README.md)
