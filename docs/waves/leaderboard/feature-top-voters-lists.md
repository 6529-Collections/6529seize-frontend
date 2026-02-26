# Wave Top Voters Lists

## Overview

Wave voting surfaces include ranked `Top voters` lists for both full waves and
single drops. These lists load additional ranked entries as users scroll and
keep voter order continuous as more pages arrive.

## Location in the Site

- Rank-wave right sidebar `Voters` tab in `/waves` and `/messages` layouts.
- Single-drop detail views under the collapsible `Top voters` section.

## Entry Points

- Open a rank wave, open the right sidebar, and select `Voters`.
- Open a drop detail from wave/leaderboard content and expand `Top voters`.
- Cast votes on drops to appear in these rankings.

## User Journey

1. Open either top-voters surface (wave-level or drop-level).
2. The first ranked voters page loads.
3. Each row shows rank, voter profile link, vote-direction indicators, and
   total voting credits used.
4. Scroll to the bottom of the loaded list to trigger the next page.
5. Additional voters append below the existing rows until no more pages remain.

## Common Scenarios

- Wave-level `Voters` tab shows top voters across the entire wave.
- Single-drop `Top voters` shows top voters for only that drop.
- Voter rows are profile links, so users can open voter profiles directly from
  the ranking.
- A thin loading bar appears while additional ranking pages are being fetched.
- If no one has voted yet, the panel shows `Be the First to Make a Vote`.

## Edge Cases

- Single-drop `Top voters` stays collapsed until users expand it.
- Voters with only positive votes show the positive indicator only; voters with
  mixed vote history can show both positive and negative indicators.
- Long or auto-generated handles may be visually truncated in the single-drop
  list while still linking to the same profile.
- If a voter has no handle, the list links using the voter's primary address and
  can appear as an address-style label.
- Additional pages continue from the server-reported current page so ranking
  rows are appended in order.

## Failure and Recovery

- If loading a later page fails, already rendered voters stay visible.
- Retry happens by requesting the next page again (for example by continuing to
  scroll) or refreshing the current view.
- If the first page returns no voters, users see the empty-state guidance
  instead of a persistent loading state.

## Limitations / Notes

- Ranking order is fixed to highest total votes first in these surfaces.
- These panels do not include user-controlled sorting/filtering.
- Wave-level and drop-level voter rankings are separate scopes.

## Related Pages

- [Waves Index](../README.md)
- [Wave Right Sidebar Tabs](../sidebars/feature-right-sidebar-tabs.md)
- [Wave Drop Vote Summary and Modal](../drop-actions/feature-vote-summary-and-modal.md)
- [Wave Leaderboard Drop States](feature-drop-states.md)
- [Docs Home](../../README.md)
