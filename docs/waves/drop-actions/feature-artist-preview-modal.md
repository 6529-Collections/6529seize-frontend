# Wave Drop Artist Preview Modal

## Overview

Artists in wave and meme drop lists can open a full-screen artist preview from their
badge actions. The modal shows active submissions and, when available, winner artworks.
If both content types exist, the modal shows tabs so users can switch between them.

## Location in the Site

- Memes leaderboard and meme participation drop rows that render artist info.
- Single-wave drop headers in wave streams.
- Single-wave author blocks in wave item details.

## Entry Points

- Click `winner` badge next to an artist name when the badge shows a win count.
- Click `submissions` badge next to an artist name when the badge shows submission count.
- Open a drop row in one of the above contexts and use those badges in that row.

## User Journey

1. Open a wave or meme feed where an artist appears with badges.
2. If the artist has active main-stage submissions, the submission badge is visible.
3. If the artist has winner IDs, the winner badge is visible and shows the win count.
4. Tap or click:
   - a submission badge to open the modal on the `Active Submissions` view.
   - a winner badge to open the modal on the `Winning Artworks` view.
5. If both active and winner content exists, use `Active Submissions` and
   `Winning Artworks` tabs to switch.
6. Select an item card:
   - the modal closes and opens the selected drop in the current wave context.
7. Close using the close button; desktop also supports backdrop click, and mobile app
   surfaces support closing with the same control or swipe-to-close behavior.

## Common Scenarios

- Artists with only active submissions show only the `Active Submissions` view.
- Artists with only winner IDs show only the `Winning Artworks` view.
- Artists with both types open with the clicked badge’s tab preselected.
- Active and winner views support card-level drop interactions and related metadata
  that is already available in those sections (media, ranks, ratings context).

## Edge Cases

- Badge counts are derived from main-stage data and each badge is hidden when the
  corresponding count is zero.
- When both badge types exist, tab controls render; otherwise the modal uses a single
  available view.
- Tap/click inside modal content does not dismiss the modal. Dismiss requires the
  close affordance or backdrop interaction.
- Winner count in the badge is the actual winner total, not a hardcoded value.

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
