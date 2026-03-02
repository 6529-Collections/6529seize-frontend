# Wave Drop Artist Preview Modal

## Overview

The artist activity badge opens an artist preview modal from profile and drop
surfaces. The badge appears when the artist has active main-stage submissions,
winning artworks, or both. The modal shows `Active Submissions` and
`Winning Artworks`; tabs appear only when both sections are available.

## Location in the Site

- Profile headers on `/{user}` and profile tab routes such as
  `/{user}/brain`, `/{user}/collected`, `/{user}/xtdh`, `/{user}/stats`,
  `/{user}/subscriptions`, and `/{user}/proxy`.
- Drop rows in wave and direct-message streams (`/waves/[wave]`,
  `/messages?wave=<waveId>`).
- Meme leaderboard and meme participation rows where drop artist info is shown.
- Single-drop detail surfaces opened in the current route with `?drop=<dropId>`.

## Entry Points

- Click the artist activity badge in a profile header when submission or winner
  counts are present.
- Click the same badge next to artist names in wave/meme drop rows.

## User Journey

1. Open a profile header or drop row that shows artist activity.
2. If the artist has activity, one badge is shown:
   - palette icon: active submissions only.
   - trophy icon: winning artworks only.
   - trophy icon + blue dot: both types; opens `Active Submissions` first.
3. If both types exist, switch tabs between `Active Submissions` and
   `Winning Artworks`.
4. Select a card to close the modal and open that drop in the current route
   context (`drop` query param update).
5. Close with the close button or backdrop click. In app wrapper contexts,
   swipe-down close is also supported.

## Common Scenarios

- Active-only artists show only `Active Submissions`.
- Winners-only artists show only `Winning Artworks`.
- Artists with both always open on `Active Submissions`.
- Badge hover tooltips show on non-touch desktop only.
- Profile headers and drop rows always use one combined badge (never two badges).

## Edge Cases

- Badge visibility is driven by main-stage submission and winner counts; zero
  count means no corresponding state.
- When both states exist, one badge represents both and shows tab controls.
- Tooltip copy is state-aware on desktop (`View X art submissions`,
  `View X winning artworks`, or combined text).
- Clicking inside modal content does not dismiss; close requires close control,
  backdrop, or (app wrapper) swipe-down.

## Failure and Recovery

- While section data is loading, the modal stays open and shows loading states.
- If requests fail or return no items, sections can render without cards
  (no inline error banner in this modal).
- Selecting a card updates the current route context and closes the modal.

## Limitations / Notes

- This is a contextual viewer for current main-stage activity, not a profile
  management surface.
- Navigation stays tied to drop context in the current page/stream.

## Related Pages

- [Profile Header Summary](../../profiles/navigation/feature-header-summary.md)
- [Waves Index](../README.md)
- [Wave Drop Actions Index](README.md)
- [Wave Drop Vote Summary and Modal](feature-vote-summary-and-modal.md)
- [Wave Drop Content Display](feature-content-display.md)
- [Wave Leaderboard Drop States](../leaderboard/feature-drop-states.md)
- [Wave Top Voters Lists](../leaderboard/feature-top-voters-lists.md)
- [Docs Home](../../README.md)
