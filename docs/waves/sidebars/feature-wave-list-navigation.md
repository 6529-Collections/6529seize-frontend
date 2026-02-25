# Wave List Navigation Behavior

## Overview

The left-side Brain wave list supports fast in-app switching between active waves and
direct-message conversations. Selecting a wave updates the active wave state and
renders that wave’s content view in place, while selecting the currently active
wave again clears the active selection and returns to the section home view.

## Location in the Site

- Desktop Brain sidebar on `/`, profile pages, and other routes that show the
  Brain or messages wave list.
- `/waves` for non-direct-message waves.
- `/messages` for direct-message conversations.

## Entry Points

- Open any route with the Brain or messages wave sidebar.
- Click a wave or direct-message row in the sidebar.
- For performance, hover a non-touch wave row to prefetch the destination.

## User Journey

1. Open a route that renders the Brain wave list.
2. Click a wave or DM entry.
3. The list marks that row active and the destination route updates to the selected
   wave.
4. Click the same active row again to clear selection and return to `/waves` or
   `/messages`.
5. Use back/forward browser controls to move through previously selected waves.
6. When a wave row has unread metadata, selection also carries a `divider` query
   value so the thread can open near the first unread boundary.

## Common Scenarios

- Switching quickly among several community waves in `/waves`.
- Navigating among direct messages in `/messages`.
- Moving between tabs while the route remains in the same section, without a full
  page refresh.
- Hovering a wave row on desktop before clicking to warm route data for faster
  transitions.
- Opening an unread wave from the list can restore divider context for that thread.

## Edge Cases

- Touch devices do not show hover prefetch behavior.
- Cmd/Ctrl/Shift/Alt-click and middle-click keep standard browser tab-opening
  behavior.
- Selecting the currently active row always returns to the section home (`/waves`
  or `/messages`) instead of reloading the same wave.
- When browser back/forward navigation changes the URL, the wave list reflects the
  resulting `wave` selection.

## Failure and Recovery

- If a selected wave no longer resolves, the active selection is cleared and the
  view returns to the home context for that section.
- If a route target can’t be loaded, users stay in-app and can use the same list
  entries to choose a valid wave.

## Limitations / Notes

- This behavior applies to user-visible wave-list entries in the desktop Brain list.
- Mobile interaction does not use hover-based prefetch.
- The list updates are scoped to wave/message navigation; other routes continue to
  use normal route transitions.

## Related Pages

- [Sidebar Navigation](../../navigation/feature-sidebar-navigation.md)
- [Sidebars Index](README.md)
- [Wave List Name Tooltips](feature-brain-list-name-tooltips.md)
- [Wave Right Sidebar Tabs](feature-right-sidebar-tabs.md)
- [Docs Home](../../README.md)
