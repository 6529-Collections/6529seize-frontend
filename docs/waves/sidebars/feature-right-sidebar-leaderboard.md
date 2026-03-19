# Wave Right Sidebar Leaderboard

## Overview

The right-sidebar `Leaderboard` tab shows a compact ranked-drop list for rank
waves.

Use it for quick in-thread review without leaving the current wave route.

This page owns compact-list behavior only. Drop-open action ownership stays in
[Wave Right Sidebar Jump Actions](feature-right-sidebar-jump-actions.md).

## Location in the Site

- Right sidebar on `/waves/{waveId}` and `/messages?wave={waveId}`
- Rank-wave `Leaderboard` tab in inline and overlay sidebar variants
- Available until voting is completed (includes pre-vote and in-progress time)
- Hidden while a full drop overlay is open (`drop={dropId}`)

## Entry Points

- Open a rank wave thread.
- Open the right sidebar.
- Select `Leaderboard`.

## User Journey

1. Open a rank wave with the right sidebar visible.
2. Select `Leaderboard`.
3. Wait for ranked rows to load.
4. Review row preview, author info, score, and outcome details.
5. Select a row to open that drop in the overlay (`drop` query).
6. Close the overlay to return to the same thread and sidebar context.
7. Scroll to load more rows when available.

## Row Content and Actions

- Top-three rows use winner-style cards and do not show the inline vote button.
- Non-top-three rows can show inline vote controls when voting UI is allowed
  for the viewer/drop.
- Rank labels use ordinal place formatting across rows (`1st`, `2nd`, `3rd`,
  `4th`, and so on).
- Rows can show preview image/media/text content.
- Rows can show `Storm`, `Metadata`, and media indicators with tooltips.
- Rows with configured rewards can show an `Outcome` badge with tooltip
  details.

## States and Edge Cases

- First load has no dedicated inline loading message, so the panel can appear
  blank until data arrives.
- Empty result shows `No drops have been made yet in this wave`.
- Pagination uses bottom intersection loading with a thin loading bar.
- The list auto-refreshes while open and can pick up newly created drops.
- If voting completes while this tab is active, the sidebar switches to
  `About` and removes `Leaderboard` from tabs.
- Non-rank waves never show this tab.

## Failure and Recovery

- Leaderboard requests retry automatically.
- This compact tab has no dedicated inline error banner.
- If first-page fetches keep failing, the tab can remain blank while retries
  continue.
- If pagination fails, already loaded rows remain visible.
- Retry by scrolling again, switching tabs and returning, or reloading the
  thread route.

## Limitations / Notes

- This is a compact summary surface with rank-order rows only.
- No sidebar sort/group/view controls in this tab.
- Use full leaderboard surfaces for broader sorting, filtering, and view modes.

## Related Pages

- [Wave Right Sidebar Tabs](feature-right-sidebar-tabs.md)
- [Wave Right Sidebar Jump Actions](feature-right-sidebar-jump-actions.md)
- [Wave Leaderboard Drop States](../leaderboard/feature-drop-states.md)
- [Wave Leaderboard Gallery Cards](../leaderboard/feature-gallery-cards.md)
- [Wave Outcome Lists](../feature-outcome-lists.md)
