# Wave Top Voters Lists

## Overview

Rank-wave voter rankings appear in two places:

- wave-level `Voters` tab in the right sidebar
- drop-level `Top voters` section in non-chat single-drop views

Both lists use descending absolute vote totals and load `20` rows per page.
Leaderboard list items can also show a signed `Largest vote` without opening
either list. Grid cards omit that highlight.

## Location in the Site

- Rank-wave thread routes: `/waves/{waveId}` and `/messages/{waveId}`.
- Right-sidebar `Voters` tab for rank waves.
- Non-chat single-drop overlay details in `?drop={dropId}` context.
- Collapsible `Top voters` block inside single-drop info details.

## Entry Points

- Open a rank wave and select `Voters` in the right sidebar.
- Open a non-chat single-drop view from the current thread route.
- Select the single-drop info panel's `Top voters` header row, including its
  `View voters` indicator.

## User Journey

1. Open the wave-level or drop-level voters surface.
2. If a connected profile handle is available, voter data loads in pages of
   `20`.
3. Each row shows:
   - position
   - voter avatar and profile link
   - positive/negative vote markers with tooltip totals; single-drop rows use
     an explicit green `+` and coral `−` instead of color-only markers
   - absolute vote total plus the wave credit label (`TDH`, `XTDH`,
     `TDH + XTDH`, or `Rep`)
4. Reach the list end to request the next page.
5. New rows append until there is no next page.

### Largest Vote on a Card

- Participatory drops in rank waves can show `Largest vote`, a voter profile
  link, and a compact signed amount on standard leaderboard and memes list
  items. Grid cards omit this highlight to keep the artwork and voting controls
  primary.
- On Memes list cards, the voters control and available `Vote` button stay
  together on one row. `Largest vote` appears on a separate line below them.
- The amount is that voter's current allocation on this drop. `+` means a
  positive vote and `−` means a negative vote. It is not their latest vote
  change or their vote total across the wave.
- Largest means greatest size in either direction: a `−11M` allocation is
  larger than a `+7M` allocation for this highlight. It does not identify the
  strongest supporter unless the selected vote is positive.
- Open the drop for separate positive and negative highlights and the
  [current vote distribution](../drop-actions/feature-vote-summary-and-modal.md).

## Common Scenarios

- The sidebar `Voters` tab ranks voters across the whole wave.
- Single-drop `Top voters` ranks voters for that one drop.
- The single-drop `Top voters` list starts collapsed. Select its header row,
  apart from the download control, to toggle it; the indicator reads `View voters`
  when closed and `Hide voters` when open.
  When available, its current-vote ribbon and largest supporting/opposing
  summaries stay visible beneath the header, inside the same section. Only
  the voter rows below the summary expand; the graph does not toggle them.
  Narrow screens use one `Largest votes` label with the signed highlights on
  one row; names shorten as needed while amounts stay visible.
- `Download All` stays visible in the single-drop header, including
  when collapsed. It uses an icon-only button on narrow screens and downloads
  all voters as CSV without toggling the list.
- Drop-level voter data is requested when `Top voters` is expanded.
- A thin loading bar appears while more rows are loading.
- Empty states show `Be the First to Make a Vote` with scope-specific guidance:
  - wave scope: `Vote on drops to see voter rankings appear here.`
  - drop scope: `Vote on this drop to see voter rankings appear here.`
- `Voters` stays available on rank waves even after `Leaderboard` is removed.

## Edge Cases

- The right-sidebar `Voters` tab appears only for rank waves.
- Single-drop `Top voters` renders only for non-chat drops. Its voter list is
  collapsed by default, while any available current-vote summary stays visible.
- Drop-level handle text is truncated for Ethereum-style and auto-generated
  handles.
- Single-drop rows show `+` for positive votes, `−` for negative votes, or both
  when both directions have amounts. A zero-only row shows neither marker.
  These markers identify direction; the adjacent number remains an absolute
  total, not a vote change. Wave-sidebar rows retain their colored markers.
- Without a signed-in profile handle, voter rows can stay empty.
- Card highlights are optional and omitted for winners, chat and approve
  waves, and when no summary is available. A missing highlight does not prove
  that the drop has no votes or no negative votes.
- Reactions and content updates preserve the latest available card highlight.
  Your own or incoming real-time vote changes clear it until the leaderboard's
  next normal refresh. Voting does not force the leaderboard to reload or reorder.

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
- `Top voters` keeps its absolute totals, direction markers, tooltips, and
  ordering. The signed card highlight is separate from those rows.

## Related Pages

- [Wave Leaderboards Index](README.md)
- [Waves Index](../README.md)
- [Wave Right Sidebar Tabs](../sidebars/feature-right-sidebar-tabs.md)
- [Wave Drop Vote Summary and Modal](../drop-actions/feature-vote-summary-and-modal.md)
- [Wave Leaderboard Drop States](feature-drop-states.md)
- [Docs Home](../../README.md)
