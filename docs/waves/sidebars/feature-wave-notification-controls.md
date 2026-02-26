# Wave Notification Controls and Mute Behavior

## Overview

Wave-specific notification and mute state controls affect both thread behavior and
list-level indicators.

Users can:

- Toggle wave-level mute/unmute from header actions.
- See and update notification mode in wave header settings (mentions/all, when
  available).
- Observe muted waves in the sidebar through a dedicated bell-slash indicator.

## Location in the Site

- Wave header on `/waves/{waveId}` and `/messages?wave={waveId}`
- Left Brain / direct-message sidebar rows on desktop.
- Wave thread opening and real-time surfaces.

## Entry Points

- Open a wave you follow from the wave header.
- Open the wave options menu (`⋮`) for a muted/unmuted wave you can manage.
- Open your Brain list and read notification indicators.

## User Journey

1. Open a followed wave header.
2. Use wave notification controls to:
   - Switch between notification modes (where supported), or
   - Mute/unmute the wave entirely.
3. Return to the Brain sidebar.
4. Muted waves show a bell-slash overlay on the wave icon.
5. While muted:
   - Sidebar rows do not show unread count badges.
   - Unread updates are suppressed in list counters for that wave.
6. Unmuting restores normal unread tracking and list-order rules after refresh.

## Common Scenarios

- Muted rows appear after open-mute without changing row position order logic.
- A muted row still navigates normally when selected.
- A muted row can still show its metadata and controls even when unread counts
  are suppressed.
- If a wave is muted while open, typing indicators clear and then remain off until
  new sessions or state changes re-enable updates.

## Edge Cases

- Mute/unmute request failures surface as error toasts and keep prior state.
- Live websocket updates from muted waves are ignored for unread and active-wave
  message reconciliation.
- Sidebar lists sort muted waves after non-muted entries.
- Muted wave activity still opens normally from notifications or manual navigation.

## Failure and Recovery

- If list counters feel stale after toggling, reloading the route or leaving/re-entering
  the thread refreshes list data.
- If toggle operations fail, users can retry from the header control.
- If a notification action is temporarily blocked by API errors, existing notification
  settings and mute state remain unchanged.

## Limitations / Notes

- Mute state suppresses unread count accumulation and typing subscriptions; it does
  not remove wave history from any surface.
- Muted display is currently represented through sidebar iconography and count behavior
  rather than a dedicated separate badge color state.
- Some notification mode options may be disabled for high-follower wave contexts.

## Related Pages

- [Brain Wave List Name Tooltips](feature-brain-list-name-tooltips.md)
- [Brain Wave List Last Drop Indicator](feature-brain-list-last-drop-indicator.md)
- [Brain Wave List Navigation](feature-wave-list-navigation.md)
- [Wave Chat Typing Indicator](../chat/feature-typing-indicator.md)
- [Wave Chat Unread Divider and Jump Controls](../chat/feature-unread-divider-and-controls.md)
- [Wave Drop Mark as Unread](../drop-actions/feature-mark-as-unread.md)
