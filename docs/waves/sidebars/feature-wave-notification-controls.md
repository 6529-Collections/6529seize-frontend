# Wave Notification Controls and Mute Behavior

## Overview

This page owns wave-level notification mode (`mentions` vs `all`) and mute
behavior across thread header controls and sidebar wave rows.

## Location in the Site

- Thread header controls:
  - `/waves/{waveId}`
  - `/messages?wave={waveId}`
- Sidebar wave rows:
  - `/waves`, `/waves/{waveId}`
  - `/messages`, `/messages?wave={waveId}`

## Control Availability

- Header controls require a connected profile handle and no proxy session.
- Notification-mode buttons show only after `Join` changes to `Joined`.
- If you are not joined, notification-mode buttons are hidden.
- `All notifications` is disabled when the wave reaches the configured follower
  limit.
- Author-only options menu (`⋮`) includes `Mute` / `Unmute`.

## Notification Modes

- `Mentions only` (`@`) is the joined default.
- `All notifications` turns on notifications for every drop.
- If `All notifications` is disabled by follower limit, the button stays
  unavailable and shows the limit tooltip.
- While a mode toggle request runs, the clicked button shows a spinner and
  buttons are temporarily disabled.

## Mute Behavior

- In joined + muted state, mode buttons are replaced by one `Muted`
  bell-slash button that un-mutes.
- In joined + unmuted state, this row does not show a separate mute button.
- Author menu still exposes `Mute` / `Unmute`.
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
- If `All notifications` is unavailable due follower limit, use
  `Mentions only`.
- If header/list state looks stale after a toggle, reopen the wave thread or
  refresh.

## Related Pages

- [Wave Header Controls](../header/feature-wave-header-controls.md)
- [Pinned Wave Controls](feature-pinned-wave-controls.md)
- [Wave List Navigation](feature-wave-list-navigation.md)
- [Brain Wave Row Metadata and Last Drop Indicator](feature-brain-list-last-drop-indicator.md)
- [Wave Chat Typing Indicator](../chat/feature-typing-indicator.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
