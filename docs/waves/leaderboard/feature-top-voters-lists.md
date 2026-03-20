# Wave Top Voters Lists

## Overview

Rank-wave voter rankings appear in two places:
- wave-level `Voters` tab in the right sidebar
- drop-level `Top voters` section in non-chat single-drop views

Both lists use descending absolute vote totals and load `20` rows per page.

## Location in the Site

- Rank-wave thread routes: `/waves/{waveId}` and `/messages?wave={waveId}`.
- Right-sidebar `Voters` tab for rank waves.
- Non-chat single-drop overlay details in `?drop={dropId}` context.
- Collapsible `Top voters` block inside single-drop info details.

## Entry Points

- Open a rank wave and select `Voters` in the right sidebar.
- Open a non-chat single-drop view from the current thread route.
- Expand `Top voters` in the single-drop info panel.

## User Journey

1. Open the wave-level or drop-level voters surface.
2. If a connected profile handle is available, voter data loads in pages of
   `20`.
3. Each row shows:
   - position
   - voter avatar and profile link
   - positive/negative vote markers with tooltip totals
   - absolute vote total plus the wave credit label (`TDH`, `XTDH`,
     `TDH + XTDH`, or `Rep`)
4. Reach the list end to request the next page.
5. New rows append until there is no next page.

## Common Scenarios

- The sidebar `Voters` tab ranks voters across the whole wave.
- Single-drop `Top voters` ranks voters for that one drop.
- Single-drop `Top voters` starts collapsed and expands on demand.
- Drop-level voter data can start loading before the section is expanded.
- A thin loading bar appears while more rows are loading.
- Empty states show `Be the First to Make a Vote` with scope-specific guidance:
  - wave scope: `Vote on drops to see voter rankings appear here.`
  - drop scope: `Vote on this drop to see voter rankings appear here.`
- `Voters` stays available on rank waves even after `Leaderboard` is removed.

## Edge Cases

- The right-sidebar `Voters` tab appears only for rank waves.
- Single-drop `Top voters` renders only for non-chat drops and is collapsed by
  default.
- Drop-level handle text is truncated for Ethereum-style and auto-generated
  handles.
- Positive-only voters show only the green marker; mixed voters can show both
  green and red markers.
- Without a signed-in profile handle, voter rows can stay empty.

## Failure and Recovery

- Voter requests retry up to three times with incremental delay.
- If a later page fails, already loaded rows stay visible.
- If initial requests do not return rows, the surface resolves to empty-state
  guidance instead of showing a dedicated error banner.
- Reloading the wave route starts a fresh fetch attempt.

## Limitations / Notes

- Sorting is fixed to descending absolute vote totals.
- These surfaces do not expose user sorting or filtering controls.
- Data requests require a signed-in profile handle.
- Wave-level and drop-level voter rankings are separate scopes.

## Related Pages

- [Wave Leaderboards Index](README.md)
- [Waves Index](../README.md)
- [Wave Right Sidebar Tabs](../sidebars/feature-right-sidebar-tabs.md)
- [Wave Drop Vote Summary and Modal](../drop-actions/feature-vote-summary-and-modal.md)
- [Wave Leaderboard Drop States](feature-drop-states.md)
- [Docs Home](../../README.md)
