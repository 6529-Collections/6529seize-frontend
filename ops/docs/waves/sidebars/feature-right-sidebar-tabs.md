# Wave Right Sidebar Tabs

## Overview

Wave threads expose shared information sections so users can inspect the active
wave without leaving the current thread route. Desktop renders them in the
right sidebar; the native app renders their navigation in the contextual row
beneath the main tabs and their content in the main `About` view.

This page owns tab-shell behavior only. Section rendering is documented in the
linked section pages.

## Location in the Site

- `/waves/{waveId}` and `/messages/{waveId}`
- Desktop right sidebar open (`inline` on large web layouts, `overlay` on
  smaller ones)
- Native app main `About` view
- All wave types render base sidebar tabs
- Hidden while full drop overlay is open (`drop={dropId}`)
- Tab row renders only after wave data is available

## Entry Points

- Desktop: open a wave thread, open the right sidebar, and select a tab.
- Native app: open an active wave, select the main `About` tab, and select an
  information pill. The information pills replace the subwave pills while
  `About` is active; selecting another main tab restores the subwave pills.

## Tab Availability and Order

- Base section order for all waves: `About`, `Rules`, `REP`, `Settings`.
- `Rank` and `Approve` waves add `Voters` and `Activity` after `Settings`.
- `Rules` shows automatic wave rules plus optional creator rules.
- Desktop labels the first section `About` because it is a standalone sidebar
  tab.
- Native app labels the same first section `Overview` because it is nested
  inside the main `About` view. It shows compact `Overview`, `Rules`, and `REP`
  pills followed by `More`.
- Native `More` contains `Settings` and, for `Rank` or `Approve` waves,
  `Voters` and `Activity`. When one is selected, the trigger displays that
  section name and uses the selected pill treatment.

## Overflow and Keyboard Behavior

- Desktop keeps the four base sections visible and moves competition-only
  `Voters` and `Activity` into `More`, so the fixed-width panel never clips a
  section label.
- Native keeps three compact pills visible and moves remaining sections into
  `More`, avoiding a compressed desktop-style tab row on narrow phones.
- The contextual row and every section share the same panel canvas, including
  the native app where the surrounding wave view uses a different background.
- The native information and subwave bars use the same height, background,
  responsive insets, pill height, and label size, so switching the contextual
  row does not shift the content below it. Active information pills use a
  semibold label; inactive pills use medium weight.
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
3. Select a desktop tab or native information pill. Use `More` for the
   remaining sections.
4. Sidebar content switches in place without route navigation. On native,
   selecting another main tab swaps the contextual row back to subwave pills.

## State Changes and Recovery

- If the active tab is no longer available for the current wave type, the
  sidebar automatically returns to `About`.
- Tab choice is in-session UI state, not a URL tab parameter.
- Closing and reopening the sidebar keeps the current tab choice unless wave
  state rules make that tab unavailable.
- Native keeps the selected information section while switching main tabs for
  the same wave. A selection saved for one wave is not applied to another
  active wave.
- If wave data does not load, the tab row does not appear and the sidebar can
  stay blank.

## Limitations / Notes

- Tab order is fixed by wave-state rules; users cannot reorder tabs.
- This page does not own section rendering behavior for `About`, `Rules`,
  `REP`, `Settings`, `Voters`, or `Activity`.
- `Trending` behavior is part of `About` content and is documented separately.

### Localization fallback debt

- Surface: `/waves/{waveId}` and `/messages/{waveId}` right-sidebar sections.
- Current behavior: panel navigation, section labels, accessible names, and
  empty/loading states use the `en-US` message catalog. Supported locales that
  do not yet provide these keys fall back to `en-US`.
- Locale resolution is intentionally uniform across the panel: components use
  the source catalog until locale-specific right-panel entries are enabled,
  avoiding a partially translated sidebar during the progressive migration.
- Remaining debt: rule values produced by the wave-rule helpers and legacy
  voting-unit labels still come from English domain constants.
- User impact: non-English locales can see English fallback copy within an
  otherwise functional panel.
- Owner/follow-up: Waves frontend maintainers should migrate the remaining
  rule and voting constants when locale-specific catalogs are enabled for this
  surface.

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
