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
- If you are not joined, the bell notification menu is hidden but the speaker
  control can still be shown.
- The `Mute` / `Unmute` action lives in the dedicated speaker control, not in
  the overflow menu.

## Notification Modes

- The bell button opens notification preferences.
- On phone layouts, the choices replace the content inside the same `About`
  sheet, which shrinks to fit the two options. Choose a mode, use Back (including
  the phone’s Back action), or press Escape to return to `About` with focus on the bell.
- Close or tapping outside dismisses the whole sheet. Returning from notification
  settings restores the full `About` height, content, and scroll position.
- Desktop and tablet sidebars show an anchored menu. Arrow keys move between
  its choices; Escape closes it and returns focus to the bell.
- Bell and mute tooltips appear with a mouse; touch users can tap the controls
  directly without a lingering tooltip.
- The `Broadcast mentions` row, shown with the `@` icon, turns on notifications
  for the admin-only `@all` and `@contributors` broadcasts.
- The `All messages` row turns on notifications for every message.
- While a mode toggle request runs, the clicked button shows a spinner and
  notification controls are temporarily disabled.

## Mute Behavior

- Before joining, the speaker control can mute the wave without joining it.
- In joined + muted state, the bell notification menu is replaced by one
  red `Muted` speaker-muted button that unmutes.
- In joined + unmuted state, the `Mute` speaker-muted button mutes the wave from
  the notification control row.
- Mute is per-wave and does not block opening the wave manually.

## Sidebar and Realtime Effects

- Muted rows show a bell-slash badge on the wave avatar.
- Muted rows suppress unread-count badges.
- Muted waves sort after non-muted waves in wave and DM lists, including
  subwave rows under an expanded parent and in the mobile subwave bar.
- Muted waves skip websocket unread/new-drop accumulation.
- Open muted threads still receive realtime drop updates, so visible content
  stays current without a refresh.
- Inactive muted threads skip Wave message-store processing and sync when opened.
- Muted threads keep typing-indicator subscription disabled.

## Failure and Recovery

- If mode or mute requests fail, the prior state stays and an error toast is
  shown.
- If header/list state looks stale after a toggle, reopen the wave thread or
  refresh.

## Related Pages

- [Wave Header Controls](../header/feature-wave-header-controls.md)
- [Pinned Wave Controls](feature-pinned-wave-controls.md)
- [Wave List Navigation](feature-wave-list-navigation.md)
- [Brain Wave Row Metadata and Last Drop Indicator](feature-brain-list-last-drop-indicator.md)
- [Wave Chat Typing Indicator](../chat/feature-typing-indicator.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
