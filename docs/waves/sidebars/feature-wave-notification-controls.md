# Wave Notification Controls and Mute Behavior

## Overview

Wave notification controls combine follow-state notifications and mute state.
Muted state also changes list indicators and unread handling.

## Location in the Site

- Wave header on `/waves/{waveId}` and `/messages?wave={waveId}`
- Left sidebar wave/message rows (muted icon and unread-badge behavior)

## Entry Points

- Join a wave (header `Join` button) to enable notification settings.
- In header notification settings, choose:
  - mentions-only
  - all-drops (when allowed)
  - mute/unmute
- If you are the wave author, the header options menu also includes `Mute`/`Unmute`.

## User Journey

1. Open a wave thread and join the wave if needed.
2. In notification settings, switch between mentions-only and all-drops modes.
3. Mute the wave when you want to suppress unread counters and typing updates.
4. In sidebar rows, muted waves show a bell-slash icon instead of unread badges.
5. Unmute to restore normal unread and typing behavior.

## Common Scenarios

- Use mentions-only to reduce noise while still getting direct mentions.
- Use all-drops mode for high-priority waves.
- Mute a wave to stop unread counter growth in list rows.
- Keep navigating muted waves normally from the same sidebar rows.

## Edge Cases

- All-drops mode is disabled when follower count reaches the configured limit.
- Notification settings are hidden when:
  - no connected profile
  - profile proxy mode is active
  - the wave is not joined
- Muted waves are sorted after non-muted waves in the list.

## Failure and Recovery

- If mute/unmute fails, the UI keeps the previous state and shows an error.
- If notification-subscription changes fail, current mode remains unchanged.
- If list counters look stale after toggling, reload the wave to refresh overview
  data.

## Limitations / Notes

- Mute does not remove history or block manual navigation.
- Mute affects unread counter accumulation and typing subscriptions for that wave.
- Muted state is represented by bell-slash iconography in list rows.

## Related Pages

- [Brain Wave List Last Drop Indicator](feature-brain-list-last-drop-indicator.md)
- [Wave List Navigation Behavior](feature-wave-list-navigation.md)
- [Pinned Wave Controls](feature-pinned-wave-controls.md)
- [Wave Chat Typing Indicator](../chat/feature-typing-indicator.md)
