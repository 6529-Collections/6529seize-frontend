# Wave Sidebars

## Overview

Use this area for wave and message sidebar behavior:

- right-sidebar panels in selected threads
- left-sidebar wave and DM list rows
- pin, mute, and notification controls that change list and thread behavior

Route scope:

- Thread views: `/waves/{waveId}`, `/messages?wave={waveId}`
- List/sidebar views: `/waves`, `/waves/{waveId}`, `/messages`,
  `/messages?wave={waveId}`
- Mobile Waves/Messages list views that reuse the same row behavior

## Features

### Right Sidebar (Thread View)

- [Wave Right Sidebar Tabs](feature-right-sidebar-tabs.md)
- [Wave Right Sidebar Leaderboard](feature-right-sidebar-leaderboard.md)
- [Wave Right Sidebar Jump Actions](feature-right-sidebar-jump-actions.md):
  canonical owner for serial-jump and drop-overlay open actions from
  `Trending`, `Activity`, `Leaderboard`, and `Winners`.
- [Wave Right Sidebar Group and Curation Management](feature-right-sidebar-group-management.md)
- [Wave Right Sidebar Trending Drops](feature-right-sidebar-trending-drops.md):
  boosted-drop ranking cards (`Day`, `Week`, `Month`) in `About`.

### Left Sidebar and Lists

- [Wave List Navigation](feature-wave-list-navigation.md):
  row open/clear behavior, unread `divider` routing, and stale `wave` query
  cleanup.
- [Brain Wave Row Metadata and Last Drop Indicator](feature-brain-list-last-drop-indicator.md):
  canonical owner for row-name labels, web tooltip rules, `Last drop` timestamp
  source, live refresh, and sorting behavior across wave and DM lists.
- [Brain Wave List Name Tooltips](feature-brain-list-name-tooltips.md):
  legacy deep-link alias that points to the canonical row-metadata page.
- [Pinned Wave Controls](feature-pinned-wave-controls.md): server-backed wave
  pin/unpin controls plus app small-screen local thread shortcuts.
- [Wave Notification Controls and Mute Behavior](feature-wave-notification-controls.md)
- [Wave Left Sidebar Expand Control](feature-left-sidebar-expand-control.md):
  desktop control that closes inline right sidebar and restores the full left
  panel.

## Flows

- [Wave Participation Flow](../flow-wave-participation.md): end-to-end wave
  navigation and interaction.

## Troubleshooting

- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md):
  route, jump, and posting recovery.

## Stubs

- None.

## Related Areas

- [Waves Index](../README.md)
- [Navigation Index](../../navigation/README.md)
- [Profiles Index](../../profiles/README.md)
