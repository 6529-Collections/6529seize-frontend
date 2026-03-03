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
- [Wave Right Sidebar Jump Actions](feature-right-sidebar-jump-actions.md)
- [Wave Right Sidebar Group and Curation Management](feature-right-sidebar-group-management.md)
- [Wave Right Sidebar Trending Drops](feature-right-sidebar-trending-drops.md):
  boosted-drop ranking cards (`Day`, `Week`, `Month`) in `About`.

### Left Sidebar and Lists

- [Wave List Navigation Behavior](feature-wave-list-navigation.md):
  row open/clear behavior, unread `divider` routing, and stale `wave` query
  cleanup.
- [Brain Wave List Last Drop Indicator](feature-brain-list-last-drop-indicator.md)
- [Brain Wave List Name Tooltips](feature-brain-list-name-tooltips.md)
- [Pinned Wave Controls](feature-pinned-wave-controls.md)
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
