# Wave Notification Controls and Mute Behavior

## Overview

This page owns wave-level notification mode (`mentions` vs `all messages`) and mute
behavior across thread header controls and sidebar wave rows.

## Location in the Site

- Thread header controls:
  - `/waves/{waveId}`
  - `/messages/{waveId}`
- Sidebar wave rows:
  - `/waves`, `/waves/{waveId}`
  - `/messages`, `/messages/{waveId}`

## Control Availability

- Header controls require a connected profile handle and no proxy session.
- The bell notification menu shows only after `Join` changes to `Joined`.
- If you are not joined, the bell notification menu is hidden but the
  speaker-muted button can still be shown.
- All-message notifications are unavailable when the wave reaches the configured
  follower limit unless the user already has them enabled.
- The `Mute` / `Unmute` action lives in the dedicated speaker-muted control,
  not in the overflow menu.

## Notification Modes

- The bell button opens notification preferences.
- The `@ALL` row turns on notifications for `@ALL` mentions.
- The `Notify for all messages` row turns on notifications for every message.
- If all-message notifications are unavailable by follower limit and not already
  enabled, the all-message row stays visible but disabled.
- If all-message notifications were already enabled before the limit applies,
  the all-message row stays available so the user can disable it.
- While a mode toggle request runs, the clicked button shows a spinner and
  notification controls are temporarily disabled.

## Mute Behavior

- Before joining, the speaker-muted button can mute the wave without joining it.
- In joined + muted state, the bell notification menu is replaced by one
  `Muted` speaker-muted button that unmutes.
- In joined + unmuted state, the speaker-muted button mutes the wave from the
  notification control row.
- Mute is per-wave and does not block opening the wave manually.

## Sidebar and Realtime Effects

- Muted rows show a bell-slash badge on the wave avatar.
- Muted rows suppress unread-count badges.
- Muted waves sort after non-muted waves in wave and DM lists.
- Muted waves skip websocket unread/new-drop accumulation.
- Muted active threads also skip realtime drop processing and typing-indicator
  subscription.
- After mute changes, if the active thread looks stale, reopen the wave or
  reload to resync.

## Failure and Recovery

- If mode or mute requests fail, the prior state stays and an error toast is
  shown.
- If all-message notifications are unavailable due follower limit, use `@ALL`
  mention notifications or mute the wave from the speaker-muted control.
- If header/list state looks stale after a toggle, reopen the wave thread or
  refresh.

## Related Pages

- [Wave Header Controls](../header/feature-wave-header-controls.md)
- [Pinned Wave Controls](feature-pinned-wave-controls.md)
- [Wave List Navigation](feature-wave-list-navigation.md)
- [Brain Wave Row Metadata and Last Drop Indicator](feature-brain-list-last-drop-indicator.md)
- [Wave Chat Typing Indicator](../chat/feature-typing-indicator.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
