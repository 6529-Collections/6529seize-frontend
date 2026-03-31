# Wave Right Sidebar Tabs

## Overview

Rank-wave threads show a right-sidebar tab row so users can switch sidebar
sections without leaving the current thread route.

This page owns tab-shell behavior only. Section rendering is documented in the
linked section pages.

## Location in the Site

- `/waves/{waveId}` and `/messages?wave={waveId}`
- Right sidebar open (`inline` on large web layouts, `overlay` on smaller ones)
- Rank waves only
- Hidden while full drop overlay is open (`drop={dropId}`)
- Tab row renders only after wave data is available

## Entry Points

- Open a rank-wave thread.
- Open the right sidebar.
- Select a tab button, or open `More` and select an overflow tab.

## Tab Availability and Order

- Fixed generation order:
  `About`, `Leaderboard` (while voting is not completed), `Winners` (after
  first decision is reached), `Voters`, `Activity`.
- `Voters` and `Activity` stay available for rank waves across wave-time states.
- Non-rank waves do not render this tab row.

## Overflow and Keyboard Behavior

- The first three available tabs render as visible buttons.
- When more than three tabs are available, remaining tabs move into `More`.
- If the active tab is in overflow, the `More` trigger label switches to that
  active tab name.
- Visible tabs support `ArrowLeft`, `ArrowRight`, `Home`, and `End`.
- `More` options are keyboard accessible.

## User Journey

1. Open a rank-wave thread on `/waves/{waveId}` or `/messages?wave={waveId}`.
2. Open the right sidebar.
3. Select a visible tab, or open `More` and pick an overflow tab.
4. Sidebar content switches in place without route navigation.

## State Changes and Recovery

- If voting completes while `Leaderboard` is active, the sidebar automatically
  returns to `About`.
- If `Winners` is active and first-decision availability becomes invalid, the
  sidebar automatically returns to `About`.
- Closing `More` without a selection keeps the current tab.
- Tab choice is in-session UI state, not a URL tab parameter.
- Closing and reopening the sidebar keeps the current tab choice unless wave
  state rules make that tab unavailable.
- If wave data does not load, the tab row does not appear and the sidebar can
  stay blank.

## Limitations / Notes

- Tab order is fixed by wave-state rules; users cannot reorder tabs.
- This page does not own section rendering behavior for `About`,
  `Leaderboard`, `Winners`, `Voters`, or `Activity`.
- `Trending` behavior is part of `About` content and is documented separately.

## Related Pages

- [Wave Sidebars Index](README.md)
- [Waves Index](../README.md)
- [Wave Top Voters Lists](../leaderboard/feature-top-voters-lists.md)
- [Wave Winners Tab](../leaderboard/feature-winners-tab.md)
- [Wave Right Sidebar Jump Actions](feature-right-sidebar-jump-actions.md)
- [Wave Right Sidebar Leaderboard](feature-right-sidebar-leaderboard.md)
- [Wave Right Sidebar Trending Drops](feature-right-sidebar-trending-drops.md)
- [Wave Right Sidebar Group and Curation Management](feature-right-sidebar-group-management.md)
- [Wave Content Tabs](../chat/feature-content-tabs.md)
- [Wave Leaderboard Decision Timeline](../leaderboard/feature-decision-timeline.md)
- [Docs Home](../../README.md)
