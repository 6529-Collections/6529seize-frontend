# Brain Wave List Last Drop Indicator

## Overview
Expanded wave and direct-message rows can show a `Last drop:` line under the
name. The value is a relative timestamp from the newest known drop for that
row.

## Location in the Site

- Expanded left-list rows on `/waves`, `/waves/{waveId}`, `/messages`, and
  `/messages?wave={waveId}`
- Mobile Waves and Messages list views that reuse the same row component
- Hidden in collapsed desktop sidebar rows

## Entry Points

- Open Waves or Messages list views.
- Keep the list in expanded row mode.
- Look for a row with a known drop timestamp.

## User Journey

1. The row starts from the newest known timestamp
   (`metrics.latest_drop_timestamp` merged with cached websocket time).
2. The label renders as relative time and refreshes every minute.
3. New websocket drops in unmuted rows update the timestamp immediately.
4. Opening a row clears new-drop counters for that row but keeps the newest
   timestamp.

## Common Scenarios

- Your own new drop updates `Last drop` but does not increase unread count.
- If the row is active and the tab is visible, timestamp still updates but
  unread count does not increase.
- If the row is active while the tab is hidden, unread count can increase until
  the tab becomes visible.

## Edge Cases

- Muted rows skip websocket timestamp and unread updates; overview refetch can
  still refresh the timestamp.
- If both overview and websocket timestamps are missing, the line stays hidden.
- If a websocket drop arrives for a wave missing from this list, the list runs
  a throttled refetch unless that wave already exists in the opposite list.
- Pinned and regular wave rows can both show `Last drop`; ordering inside each
  section follows newest merged timestamp, with muted rows after non-muted rows.
- Direct-message rows show `Last drop` but do not show pin controls.

## Failure and Recovery

- If websocket delivery pauses, the current label stays until a later websocket
  event or refetch updates the timestamp.
- If refetch still returns no timestamp, the line remains hidden.

## Limitations / Notes

- Relative labels use `getTimeAgoShort` (`Just now`, `Xm`, `Xh`, `Yesterday`,
  `Mon D`).
- This page covers the row timestamp indicator only.
- Mute controls and unread badge behavior are documented separately.

## Related Pages

- [Sidebars Index](README.md)
- [Waves Index](../README.md)
- [Wave List Navigation Behavior](feature-wave-list-navigation.md)
- [Wave Notification Controls and Mute Behavior](feature-wave-notification-controls.md)
- [Brain Wave List Name Tooltips](feature-brain-list-name-tooltips.md)
