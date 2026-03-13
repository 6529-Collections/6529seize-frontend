# Wave List Navigation Behavior

## Overview

Sidebar rows set or clear the active thread in Waves and Messages.

- Click an inactive row to open that thread.
- Click the active row to clear selection and return to section home.

## Route Rules

- Wave rows open `/waves/{waveId}`.
- Direct-message rows open `/messages?wave={waveId}`.
- Direct-message threads do not use `/messages/{waveId}`.
- Re-clicking the active row clears selection and returns to `/waves` or
  `/messages`.
- If the first unread drop is known, row navigation can append `divider={n}`.

## Entry Points

- Use the shared left sidebar in `/waves`, `/waves/{waveId}`, `/messages`, or
  `/messages?wave={waveId}`.
- On non-touch devices, hovering an inactive row prefetches that wave.

## User Journey

1. Open the Waves or Messages sidebar list.
2. Click an inactive row.
3. The row becomes active and the URL updates to the thread route.
4. If the first unread drop is known, the URL can include `divider=...`.
5. Click the same active row again to clear selection and return to `/waves` or
   `/messages`.
6. Browser back/forward restores prior selections and keeps active highlight in
   sync.

## Edge Cases

- Touch devices skip hover prefetch.
- Cmd/Ctrl/Shift/Alt-click, middle-click, and right-click keep browser-default
  behavior.
- If navigation starts outside the Waves/Messages shell, row click performs normal
  route navigation into the target thread.

## Failure and Recovery

- If a selected wave no longer resolves, the app returns to section home
  (`/waves` or `/messages`).
- If a stale `wave` query is present during that recovery, it is removed.
- Users can immediately pick another row from the same list.

## Limitations / Notes

- This page covers shared left-sidebar row navigation only.
- Hover-based prefetch is non-touch only.
- Other route and shell behaviors are documented in navigation and layout pages.

## Related Pages

- [Sidebar Navigation](../../navigation/feature-sidebar-navigation.md)
- [Sidebars Index](README.md)
- [Wave List Name Tooltips](feature-brain-list-name-tooltips.md)
- [Wave Right Sidebar Tabs](feature-right-sidebar-tabs.md)
- [Docs Home](../../README.md)
