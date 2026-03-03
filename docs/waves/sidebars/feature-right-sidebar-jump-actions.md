# Wave Right Sidebar Jump Actions

## Overview

Right-sidebar items that represent drops now navigate users to the same wave thread position
instead of opening a separate drop preview route.

Jump actions are available from:

- About `Trending` cards (boosted drops)
- Rank-wave `Leaderboard` rows
- Rank-wave `Winners` rows
- Rank-wave `Activity` entries

All jumps target the drop’s serial position in the active chat list.

## Location in the Site

- Right sidebar `About` tab (`Trending`)
- Right sidebar `Leaderboard`, `Winners`, and `Activity` tabs on rank waves
- Wave surfaces that render the shared sidebar + chat composition stack (`/waves/{waveId}` and `/messages?wave={waveId}`)

## Entry Points

- Open a wave with the right sidebar visible.
- Select one of the sidebar sections above.
- Click a jump-capable card/row/icon that references a drop.

## User Journey

1. A user taps or clicks an item in a jump-capable sidebar section.
2. The app resolves the item serial number from the sidebar data.
3. If the drop is already loaded in chat, the list scrolls smoothly and centers on that drop.
4. If the drop is not yet loaded, chat pagination loads more data and then scrolls to the target.
5. The user remains in the same wave view while reading around the result.

## Common Scenarios

- From `Trending`, open a high-momentum drop in context to compare nearby posts.
- From `Leaderboard` and `Winners`, compare top drops without opening a dedicated drop panel.
- From `Activity`, jump from a vote record directly to the linked drop.

## Edge Cases

- If a jump target is already visible, the movement is immediate and no overlay is opened.
- If many older pages are required, the jump may take longer while history loads.
- Sidebar jump actions do not alter wave selection, filters, or tab state.

## Failure and Recovery

- If jump target resolution fails or the chat scroll operation times out, users can retry by selecting the same item again.
- If network pagination is slow, the sidebar action remains inert until the chat list advances.

## Limitations / Notes

- Right-sidebar jumps are in-thread only; they do not force a standalone `drop` overlay route.
- Jump behavior depends on the same serial-jump mechanics used by chat search and link jumps.

## Related Pages

- [Wave Right Sidebar Trending Drops](feature-right-sidebar-trending-drops.md)
- [Wave Right Sidebar Tabs](feature-right-sidebar-tabs.md)
- [Wave Chat Scroll Behavior](../chat/feature-scroll-behavior.md)
- [Wave Chat Open and Copy Links](../drop-actions/feature-open-and-copy-links.md)
- [Docs Home](../../README.md)
