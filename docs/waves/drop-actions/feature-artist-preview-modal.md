# Wave Drop Artist Preview Modal

## Overview

The artist activity badge opens a modal for one artist's The Memes activity:
`Active Submissions` and `Winning Artworks`.

The badge state decides which section opens first.

## Location in the Site

- Profile headers on `/{user}` routes that reuse the shared profile header:
  `/{user}`, `/{user}/brain`, `/{user}/collected`, `/{user}/xtdh`,
  `/{user}/stats`, `/{user}/subscriptions`, and `/{user}/proxy`.
- Wave and direct-message drop headers:
  `/waves/{waveId}` and `/messages?wave={waveId}`.
- Single-drop overlays opened with `drop={dropId}` in the current route.
- Meme participation and meme leaderboard drop rows.

## Entry Points

- Select the artist activity badge next to the artist name.
- The badge is hidden when both activity counts are `0`.
- Badge state:
  - Palette: active submissions only, opens `Active Submissions`.
  - Trophy: winning artworks only, opens `Winning Artworks`.
  - Trophy with blue dot: both exist, opens `Active Submissions`.

## User Journey

1. Select the artist activity badge.
2. The modal opens to the section mapped from the badge state.
3. If both datasets exist, tabs are shown for switching between
   `Active Submissions` and `Winning Artworks`.
4. Select a card to open that drop in the current route context:
   - `drop` is set in the URL.
   - Existing query params stay in place.
5. The modal closes after opening a card.
6. Users can also close with close button or backdrop click/tap.
7. In app-wrapper contexts, swipe-down close is also supported.

## Common Scenarios

- On non-touch desktop devices, hovering the badge shows tooltip copy with
  current counts.
- `Active Submissions` loading state shows `Loading submissions...`.
- `Active Submissions` cards show artwork preview, optional title, position,
  current score, submission date, and mini vote control.
- `Winning Artworks` loading state shows `Loading won artworks...`.
- `Winning Artworks` cards show artwork preview (or text fallback), optional
  title, score total, top-voter avatars, voter count, and won date (or created
  date fallback).
- In compact + small-screen thread layouts, selecting a card also closes the
  chat column.

## Edge Cases

- Tabs are hidden when only one dataset exists.
- Active-submission cards can be fewer than profile counts when individual drop
  lookups fail or return unusable data.
- Winning-artwork cards can also be fewer than winner counts for the same
  reason.
- If no cards are renderable, the modal body shows an empty grid (no dedicated
  empty-state message).
- On desktop web, `Esc` does not close this modal.
- Header subtitle is fixed to `The Memes Collection`.

## Failure and Recovery

- The modal has no inline error banner or retry button.
- If item fetches fail, affected cards are omitted.
- Close and reopen the modal to retry with normal fetch behavior.
- If both datasets exist, switching tabs loads the other dataset.

## Limitations / Notes

- This is a contextual viewer, not a profile management surface.
- Badge state and tab availability depend on currently loaded artist activity
  counts.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop Actions Index](README.md)
- [Profile Header Summary](../../profiles/navigation/feature-header-summary.md)
- [Wave Drop Vote Summary and Modal](feature-vote-summary-and-modal.md)
- [Wave Drop Content Display](feature-content-display.md)
- [Wave Leaderboard Drop States](../leaderboard/feature-drop-states.md)
- [Wave Top Voters Lists](../leaderboard/feature-top-voters-lists.md)
- [Docs Home](../../README.md)
