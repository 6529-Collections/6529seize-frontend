# Wave Right Sidebar Jump Actions

## Overview

Right-sidebar drop actions use two patterns:

- `Trending` cards and `Activity` entries jump to a serial position in chat.
- `Leaderboard` and `Winners` rows open the drop overlay (`drop={dropId}`).

Both patterns keep users in the current wave route.

## Location in the Site

- Right sidebar `About` tab (`Trending`) on `/waves/{waveId}` and
  `/messages?wave={waveId}`
- Right sidebar `Activity` tab on rank waves
- Right sidebar `Leaderboard` and `Winners` tabs on rank waves

## Entry Points

- Open a wave thread and open the right sidebar.
- Open one of these sections: `Trending`, `Activity`, `Leaderboard`, `Winners`.
- Select a drop-target card, row, or icon.

## User Journey

1. Open a wave thread with the right sidebar visible.
2. Choose a drop-target section.
3. If you select `Trending` or `Activity`, chat scrolls to the target serial:
   - already loaded target: immediate in-thread jump
   - older target: pagination loads until the target can be shown
4. If you select `Leaderboard` or `Winners`, the app opens that drop in the
   overlay by setting `drop` in the URL query.
5. Closing the drop overlay removes `drop` and returns to the same wave view.

## Common Scenarios

- From `Trending`, jump into context around a boosted drop without opening the
  drop overlay.
- From `Activity`, jump from a vote log entry to that drop in chat.
- From `Leaderboard` or `Winners`, open a full drop overlay for deeper review.

## Edge Cases

- If the target serial is already in view, the jump is immediate.
- While a full drop overlay is open, the right sidebar is hidden until the
  overlay closes.
- These actions do not change selected wave or right-sidebar tab state.

## Failure and Recovery

- If serial-jump pagination is slow, keep the same section open and retry the
  target action.
- If drop-overlay fetch fails, close and reopen the same `Leaderboard` or
  `Winners` row.

## Limitations / Notes

- `Voters` rows do not provide drop-target actions.
- Serial-jump behavior here uses the same in-thread scroll system as
  `serialNo`/search jumps.

## Related Pages

- [Wave Right Sidebar Tabs](feature-right-sidebar-tabs.md)
- [Wave Right Sidebar Leaderboard](feature-right-sidebar-leaderboard.md)
- [Wave Right Sidebar Trending Drops](feature-right-sidebar-trending-drops.md)
- [Wave Chat Scroll Behavior](../chat/feature-scroll-behavior.md)
- [Wave Chat Open and Copy Links](../drop-actions/feature-open-and-copy-links.md)
