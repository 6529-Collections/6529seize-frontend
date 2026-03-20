# Wave List Navigation

## Overview

Wave and DM rows in the left list control which thread is open.

- Click an inactive row to open that thread.
- Click the active row to clear selection and return to section home.
- Browser back/forward keeps the active row and URL in sync.

## Where It Works

- Web left sidebar on:
  - `/waves` and `/waves/{waveId}`
  - `/messages` and `/messages?wave={waveId}`
- Mobile/app Waves and Messages list views that reuse the same row behavior.

## Route and URL Rules

- Wave rows open `/waves/{waveId}`.
- Direct-message rows open `/messages?wave={waveId}`.
- Active-row re-click returns to `/waves` or `/messages`.
- Direct-message navigation does not use `/messages/{waveId}`.
- If first unread is known, row navigation can add `divider={serialNo}`.

## Interaction Rules

- Non-touch devices: hovering an inactive row can prefetch that thread.
- Touch devices: no hover prefetch.
- Browser-default behavior is kept for modified clicks:
  - Cmd/Ctrl-click
  - Shift/Alt-click
  - Middle-click
  - Right-click/context menu

## History and Shell Behavior

- Inside the `/waves` or `/messages` shell, row changes update URL/history in
  place and keep row highlight aligned.
- Outside those shells, row click performs normal route navigation into the
  selected thread.

## Failure Recovery

- If the selected thread no longer resolves, the app returns to section home
  (`/waves` or `/messages`).
- Recovery removes stale `wave` query values when present.
- After recovery, users can select another row immediately.

## Scope Notes

- This page owns row selection/navigation only.
- Row metadata (`Last drop`, badges, tooltips) is owned by the row-metadata
  page.
- Pin and mute controls are owned by their sidebar control pages.

## Related Pages

- [Wave Sidebars Index](README.md)
- [Waves Index](../README.md)
- [Brain Wave Row Metadata and Last Drop Indicator](feature-brain-list-last-drop-indicator.md)
- [Pinned Wave Controls](feature-pinned-wave-controls.md)
- [Wave Notification Controls and Mute Behavior](feature-wave-notification-controls.md)
- [Wave Right Sidebar Tabs](feature-right-sidebar-tabs.md)
- [Sidebar Navigation](../../navigation/feature-sidebar-navigation.md)
