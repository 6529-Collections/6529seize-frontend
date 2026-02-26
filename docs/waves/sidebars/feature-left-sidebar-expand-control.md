# Wave Left Sidebar Expand Control

## Overview

When a wave or direct-message thread is open with the right sidebar inline, the left
Brain sidebar is shown in a compact width. A small expand control at the top of the
collapsed left sidebar restores full left-panel width in one action.

The control closes the inline right sidebar, which is what triggers the layout
change from compact to full mode.

## Location in the Site

- `/waves` and `/messages` desktop layouts that render `WebBrainLeftSidebar`.
- Any desktop `/waves/{waveId}` or `/messages?wave={waveId}` view that can display an inline
  right sidebar.

## Entry Points

- Open a wave or direct-message thread so the right sidebar appears inline.
- Confirm the left sidebar is in compact mode.
- Click the expand button at the top of the collapsed left sidebar.

## User Journey

1. Open a wave thread (`/waves/{waveId}` or `/messages?wave={waveId}`) on desktop where the
   right sidebar is visible inline.
2. Observe that the left sidebar switches to compact (icon-only) mode.
3. Click the top expand control:
   - Labeled `Expand waves panel` on wave routes.
   - Labeled `Expand messages panel` on message routes.
4. The inline right sidebar closes and the left sidebar returns to full width.
5. Continue browsing wave or message lists from the expanded left sidebar.

## Common Scenarios

- Open a rank wave with right sidebar tabs, then quickly return to a full wave list
  layout by expanding the left panel.
- Open a direct-message thread and expand from compact sidebar mode to read pinned and
  long wave names without tooltips.
- Move between wave and message sections after enabling focus on the left list.

## Edge Cases

- The button appears only while the left sidebar is rendered in compact mode.
- The control is available only when the inline right sidebar is open on desktop layouts.
- On small-screen/off-canvas layouts and right sidebar overlay mode, left sidebar
  expansion uses the standard sidebar controls; this control does not render there.
- If the left sidebar is already full-width, this button is not shown.

## Failure and Recovery

- If compact mode should disappear unexpectedly, close and reopen the thread; compact mode
  should follow the right-sidebar inline state.
- If the right sidebar remains open after clicking the control, refresh the page as a recovery.
  The layout should resync to default collapsed/open states for the current route.

## Limitations / Notes

- The control does not toggle right sidebar preferences globally; it only updates the
  current page right-sidebar state.
- It is a desktop-only affordance linked to right-sidebar open state; on mobile, use the
  standard sidebar controls.

## Related Pages

- [Wave Sidebars Index](README.md)
- [Wave List Navigation](feature-wave-list-navigation.md)
- [Wave Right Sidebar Tabs](feature-right-sidebar-tabs.md)
- [Sidebar Navigation](../../navigation/feature-sidebar-navigation.md)
- [Docs Home](../../README.md)
