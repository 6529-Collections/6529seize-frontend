# Wave Top Voters Lists

## Overview

Rank-wave voting surfaces show `Top voters` rankings at wave scope and at
single-drop scope. Both lists are sorted by descending absolute vote totals and
load more rows as you scroll.

## Location in the Site

- Right sidebar `Voters` tab for rank waves in shared wave/message layouts
  (for example `/waves/{waveId}` and `/messages?wave={waveId}`).
- Non-chat single-drop panels, inside the collapsible `Top voters` section
  (opened with `drop` query state such as `?drop={dropId}`).

## Entry Points

- Open a rank wave, open the right sidebar, and select `Voters`.
- Open a non-chat drop panel and expand `Top voters`.
- Vote on drops to appear in the rankings.

## User Journey

1. Open a voters surface (wave-level or drop-level).
2. The first page loads (20 rows per request).
3. Each row shows rank, voter profile, vote-direction markers, and absolute
   vote total.
4. Scroll to the bottom to request the next page.
5. More rows append until no next page is available.

## Common Scenarios

- The sidebar `Voters` tab ranks voters across the whole wave.
- Single-drop `Top voters` ranks voters for that one drop.
- Voter rows link to voter profiles in both list types.
- A thin loading bar appears while the next page is loading.
- Empty states show `Be the First to Make a Vote` with scope-specific guidance.

## Edge Cases

- The right-sidebar `Voters` tab appears only for rank waves.
- Single-drop `Top voters` renders only for non-chat drops and is collapsed by
  default.
- Positive-only voters show the positive marker only; mixed voters can show
  both positive and negative markers.
- Ethereum-style and auto-generated handles can truncate in the single-drop
  list while still linking to the same profile.
- Data requests run only when a signed-in profile handle is available.

## Failure and Recovery

- Each request retries up to three times with incremental delay.
- If loading a later page still fails, already rendered voters stay visible.
- Reaching list end again re-attempts loading the next page when available.
- If no voters are returned, the UI resolves to the empty-state guidance instead
  of a stuck loading state.

## Limitations / Notes

- Ranking order is fixed to descending absolute vote totals.
- These panels do not support user sorting or filtering.
- Wave-level and drop-level voter rankings are separate scopes.

## Related Pages

- [Waves Index](../README.md)
- [Wave Right Sidebar Tabs](../sidebars/feature-right-sidebar-tabs.md)
- [Wave Drop Vote Summary and Modal](../drop-actions/feature-vote-summary-and-modal.md)
- [Wave Leaderboard Drop States](feature-drop-states.md)
- [Docs Home](../../README.md)
