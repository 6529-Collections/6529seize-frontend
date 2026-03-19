# Wave Right Sidebar Trending Drops

## Overview

The `About` section includes `Trending`, a ranked list of boosted drops for the
current thread.

This page owns `Trending` rendering, time-window filtering, and card-level
actions. Cross-section jump ownership stays in
[Wave Right Sidebar Jump Actions](feature-right-sidebar-jump-actions.md).

## Location in the Site

- `/waves/{waveId}` and `/messages?wave={waveId}`
- Web right sidebar:
  - rank waves: `About` tab content
  - non-rank waves: default sidebar content (no tab row)
- Hidden while single-drop overlay is open (`drop={dropId}`)

## Entry Points

- Open a wave or direct-message thread.
- Open the `About` section (`About` tab on rank waves).
- Select `Day`, `Week`, or `Month`.
- Select a card to jump in chat, or select the boost button to toggle boost.

## Time Window and Ranking Rules

- Default window on mount: `Day`.
- Window ranges are fixed rolling windows:
  - `Day`: last 24 hours
  - `Week`: last 7 days
  - `Month`: last 30 days
- Cards are sorted by boost count (highest first) for the selected window.
- Maximum list size is five cards.
- `#1` has stronger highlight styling than lower ranks.

## Card Content and Actions

- Card shows rank, author identity, preview text, and current boost count.
- Selecting a card requests an in-thread serial jump in the same wave context.
- Selecting the boost button toggles boost/unboost and does not trigger jump.
- Boost button is disabled when the viewer wallet is not connected.

## Loading, Empty, and Error States

- First load for an uncached window shows three skeleton rows.
- Empty results show `No boosted drops yet`.
- There is no dedicated inline error banner in this panel.
- After retries fail, first-load failures can present as the same empty state.

## Refresh and Recovery

- Requests retry failed fetches (`retry: 2`).
- While mounted, data refreshes every ~30 seconds.
- Changing `Day`/`Week`/`Month` fetches the selected window immediately.
- Leaving `About` or closing the sidebar remounts this panel and resets window
  state to `Day`.
- If the jump target is older than loaded history, older pages load before
  scroll completes.
- If overlay is open (`drop={dropId}`), close overlay to make `Trending`
  actions available again.

## Limitations / Notes

- Fixed time windows only (`Day`, `Week`, `Month`).
- No custom date range.
- No manual refresh button in this panel.
- Maximum visible ranking depth is five cards.
- Ranking scope is the active thread only (no cross-wave ranking).

## Related Pages

- [Wave Sidebars Index](README.md)
- [Wave Right Sidebar Tabs](feature-right-sidebar-tabs.md)
- [Wave Right Sidebar Jump Actions](feature-right-sidebar-jump-actions.md)
- [Wave Drop Boosting](../drop-actions/feature-drop-boosting.md)
- [Waves Index](../README.md)
- [Docs Home](../../README.md)
