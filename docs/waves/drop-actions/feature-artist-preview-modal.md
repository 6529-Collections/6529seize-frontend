# Wave Drop Artist Preview Modal

## Overview

Artists in wave and meme drop lists can open a full-screen artist preview from a
single unified activity badge. The badge appears when an artist has active
submissions and/or winner artworks. The modal shows `Active Submissions` and, when
available, `Winning Artworks` views with tabs for switching between them.

## Location in the Site

- Memes leaderboard and meme participation drop rows that render artist info.
- Single-wave drop headers in wave streams.
- Single-wave author blocks in wave item details.

## Entry Points

- Click the artist activity badge next to an artist name when submissions and/or
  win counts are present.
- Open a drop row in one of the above contexts and use those badges in that row.

## User Journey

1. Open a wave or meme feed where an artist appears with badges.
2. If the artist has main-stage activity, the activity badge is visible.
3. If only active submissions exist, the badge uses a palette icon and opens
   `Active Submissions`.
4. If only winner artwork exists, the badge uses a trophy icon and opens
   `Winning Artworks`.
5. If both exist, the badge uses a trophy icon with a blue marker dot and opens
   `Active Submissions` by default.
6. In rows with both content types, use `Active Submissions` and `Winning
   Artworks` tabs to switch.
7. Select an item card:
   - the modal closes and opens the selected drop in the current wave context.
8. Close using the close button; desktop also supports backdrop click, and mobile app
   surfaces support closing with the same control or swipe-to-close behavior.

## Common Scenarios

- Artists with only active submissions show only the `Active Submissions` view.
- Artists with only winner IDs show only the `Winning Artworks` view.
- Artists with both types open with the clicked badge’s tab preselected.
- Active and winner views support card-level drop interactions and related metadata
  that is already available in those sections (media, ranks, ratings context).
- On mobile and touch surfaces, badge hover tooltips are omitted and the badge remains
  clickable.

## Edge Cases

- Badge counts are derived from main-stage data and each behavior is hidden when the
  corresponding count is zero.
- Only one badge is shown at a time; when both counts exist it represents both
  states instead of rendering two separate badges.
- Desktop users see content-aware tooltip text on badge hover (`View X art
  submissions`, `View X winning artworks`, or combined text for both states); mobile
  and touch users do not show this tooltip.
- When both badge states exist, tab controls render; otherwise the modal uses a
  single available view.
- Tap/click inside modal content does not dismiss the modal. Dismiss requires the
  close affordance or backdrop interaction.
- Badge totals are real-time values from the current artist activity data.

## Failure and Recovery

- If active submission data fails to load, the modal shows loading state and can be
  retried by reopening it.
- If winner artwork data fails to load, the modal shows a loading state and can be
  retried by reopening it.
- The modal remains open while loading and only navigates away after a drop card is
  explicitly selected.

## Limitations / Notes

- The modal is a compact, contextual surface for current main-stage competition data only.
- It is not a full profile settings page; navigation is always tied to drop content.
- Close behavior is intentional: interaction inside the modal content is handled in-place,
  and accidental background or card interaction closures are minimized.

## Related Pages

- [Waves Index](../README.md)
- [Wave Drop Vote Summary and Modal](feature-vote-summary-and-modal.md)
- [Wave Drop Content Display](feature-content-display.md)
- [Wave Leaderboard Drop States](../leaderboard/feature-drop-states.md)
- [Wave Top Voters Lists](../leaderboard/feature-top-voters-lists.md)
- [Docs Home](../../README.md)
