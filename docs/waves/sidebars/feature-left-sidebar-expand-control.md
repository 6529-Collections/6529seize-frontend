# Wave Left Sidebar Expand Control

## Overview

On desktop thread routes, opening the inline right sidebar collapses the left
waves/messages list into a compact rail.
The top rail button closes the inline right sidebar and restores the full left
panel.

## Location in the Site

- Thread routes with a selected wave:
  - `/waves/{waveId}`
  - `/messages?wave={waveId}` (no `/messages/{waveId}` route)
- Legacy `/waves?wave={waveId}` redirects to `/waves/{waveId}` and keeps other
  query params.
- The control exists only when the right sidebar is inline (`>=1024px`).

## Entry Points

- Open `/waves/{waveId}` or `/messages?wave={waveId}` on desktop.
- In the thread header, click `Toggle right sidebar`.
- In the collapsed left rail, click:
  - `Expand waves panel` on `/waves/{waveId}`
  - `Expand messages panel` on `/messages?wave={waveId}`

## Visibility Rules

The control is visible only when all are true:

- a wave is selected
- the right sidebar is open
- the right sidebar is inline (desktop), not overlay
- no full drop overlay is open (`drop={dropId}` active view)

The control is hidden when any are true:

- `/waves` or `/messages` has no selected wave
- the right sidebar is closed
- the layout is overlay mode (`<1024px`)
- the left panel is already full width

## User Journey

1. Open a desktop wave or DM thread with a selected wave.
2. Click `Toggle right sidebar`.
3. The left panel collapses to a compact rail.
4. Click the top expand control.
5. The right sidebar closes and the left panel expands.
6. The selected thread and URL stay the same.

## Failure and Recovery

- If the control is missing, confirm you are on `/waves/{waveId}` or
  `/messages?wave={waveId}` and that the right sidebar is open.
- If your viewport is below `1024px`, the sidebar opens as overlay, so this
  control is not available.
- If a full drop overlay is open, close it first.
- If the URL is `/waves?wave={waveId}`, wait for redirect to `/waves/{waveId}`
  and retry.

## Limitations / Notes

- The control only changes right-sidebar UI state.
- It does not change selected thread, active tab, or URL.
- Label text follows route prefix:
  - `/messages*` uses `Expand messages panel`
  - `/waves*` uses `Expand waves panel`

## Related Pages

- [Wave Sidebars Index](README.md)
- [Wave List Navigation Behavior](feature-wave-list-navigation.md)
- [Wave Right Sidebar Tabs](feature-right-sidebar-tabs.md)
- [Sidebar Navigation](../../navigation/feature-sidebar-navigation.md)
- [Docs Home](../../README.md)
