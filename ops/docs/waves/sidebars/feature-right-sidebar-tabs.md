# Wave Right Sidebar Tabs

## Overview

Wave threads show a right-sidebar tab row so users can switch sidebar sections
without leaving the current thread route.

This page owns tab-shell behavior only. Section rendering is documented in the
linked section pages.

## Location in the Site

- `/waves/{waveId}` and `/messages/{waveId}`
- Right sidebar open (`inline` on large web layouts, `overlay` on smaller ones)
- All wave types render base sidebar tabs
- Hidden while full drop overlay is open (`drop={dropId}`)
- Tab row renders only after wave data is available

## Entry Points

- Open a wave thread.
- Open the right sidebar.
- Select a tab button. Scroll the tab strip horizontally when the full row does
  not fit the panel width.

## Tab Availability and Order

- Base tab order for all waves: `About`, `Rules`, `REP`, `Settings`.
- `Rank` and `Approve` waves add `Voters` and `Activity` after `Settings`.
- `Rules` shows automatic wave rules plus optional creator rules.

## Overflow and Keyboard Behavior

- Every available section remains a direct tab in the tab strip.
- The tab strip scrolls horizontally when its tabs do not fit. This behavior is
  CSS-driven and does not depend on viewport measurements in JavaScript.
- The tab strip stays within the panel width. It does not widen the panel or
  make the panel body horizontally scrollable.
- The tab row remains fixed at the top while the active section scrolls
  vertically below it.
- Switching tabs never carries a horizontal scroll offset into the next
  section, including in narrow overlay layouts.
- Tabs support `ArrowLeft`, `ArrowRight`, `Home`, and `End`.

## User Journey

1. Open a wave thread on `/waves/{waveId}` or `/messages/{waveId}`.
2. Open the right sidebar.
3. Select a tab, scrolling the tab strip horizontally first when needed.
4. Sidebar content switches in place without route navigation.

## State Changes and Recovery

- If the active tab is no longer available for the current wave type, the
  sidebar automatically returns to `About`.
- Tab choice is in-session UI state, not a URL tab parameter.
- Closing and reopening the sidebar keeps the current tab choice unless wave
  state rules make that tab unavailable.
- If wave data does not load, the tab row does not appear and the sidebar can
  stay blank.

## Limitations / Notes

- Tab order is fixed by wave-state rules; users cannot reorder tabs.
- This page does not own section rendering behavior for `About`, `Rules`,
  `REP`, `Settings`, `Voters`, or `Activity`.
- `Trending` behavior is part of `About` content and is documented separately.

## Related Pages

- [Wave Sidebars Index](README.md)
- [Waves Index](../README.md)
- [Wave Top Voters Lists](../leaderboard/feature-top-voters-lists.md)
- [Wave Winners Tab](../leaderboard/feature-winners-tab.md)
- [Wave Creation Rules Step](../create/feature-rules-step.md)
- [Wave Right Sidebar Jump Actions](feature-right-sidebar-jump-actions.md)
- [Wave Right Sidebar Leaderboard](feature-right-sidebar-leaderboard.md)
- [Wave Right Sidebar Trending Drops](feature-right-sidebar-trending-drops.md)
- [Wave Right Sidebar Group and Curation Management](feature-right-sidebar-group-management.md)
- [Wave Content Tabs](../chat/feature-content-tabs.md)
- [Wave Leaderboard Decision Timeline](../leaderboard/feature-decision-timeline.md)
- [Docs Home](../../README.md)
