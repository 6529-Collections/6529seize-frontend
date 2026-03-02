# Wave Left Sidebar Expand Control

## Overview

On desktop thread views, opening the inline right sidebar collapses the left
sidebar to a compact rail. The top expand control closes the inline right
sidebar and restores the full left panel.

## Location in the Site

- Selected-wave thread routes:
  - `/waves/{waveId}` (canonical wave thread route)
  - `/messages?wave={waveId}` (canonical DM thread route; no
    `/messages/{waveId}` thread path)
- Legacy `/waves?wave={waveId}` links redirect to `/waves/{waveId}`.
- Only when the right sidebar is open in inline desktop mode.

## Entry Points

- Open `/waves/{waveId}` or `/messages?wave={waveId}` on desktop.
- Open the right sidebar so the left sidebar collapses.
- Click the expand button at the top of the collapsed left rail.

## User Journey

1. Open a desktop wave or DM thread with a selected wave.
2. Open the right sidebar in inline mode.
3. Click the top expand control:
   - `Expand messages panel` on `/messages?wave={waveId}`.
   - `Expand waves panel` on `/waves/{waveId}`.
4. The inline right sidebar closes and the left sidebar returns to full width.
5. Continue with the same selected thread.

## Common Scenarios

- Close the inline right sidebar after checking `About`, `Leaderboard`, or other
  right-sidebar tabs.
- Expand the left rail in DM threads to read long conversation names directly.
- Keep the current thread selected while reclaiming list space.

## Edge Cases

- The control is shown only when the left sidebar is collapsed.
- It requires a selected wave and an open inline right sidebar.
- It does not render while a full drop overlay is open.
- It does not render in small-screen/off-canvas layouts where the right
  sidebar uses overlay mode.
- It is not shown when the left sidebar is already full width.

## Failure and Recovery

- If the control is missing, confirm you are on `/waves/{waveId}` or
  `/messages?wave={waveId}`, and that the right sidebar is open inline on
  desktop.
- If you open `/waves?wave={waveId}`, wait for redirect to `/waves/{waveId}`
  and retry.
- If click does not close the sidebar, close and reopen the right sidebar, then
  try again.

## Limitations / Notes

- The control only changes right-sidebar state for the current page view.
- It is desktop-only and depends on right-sidebar inline state.
- Label text is route-sensitive: `Expand messages panel` on
  `/messages?wave={waveId}` and `Expand waves panel` on `/waves/{waveId}`.

## Related Pages

- [Wave Sidebars Index](README.md)
- [Wave List Navigation](feature-wave-list-navigation.md)
- [Wave Right Sidebar Tabs](feature-right-sidebar-tabs.md)
- [Sidebar Navigation](../../navigation/feature-sidebar-navigation.md)
- [Docs Home](../../README.md)
