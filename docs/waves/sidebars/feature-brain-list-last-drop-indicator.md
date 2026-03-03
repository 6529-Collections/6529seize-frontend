# Brain Wave List Last Drop Indicator

## What This Shows

Expanded wave and direct-message rows can show `Last drop:` under the row name.

The value uses the newest known drop time for that row from list data plus live
updates.

## Where You See It

- Expanded list rows on `/waves`, `/waves/{waveId}`, `/messages`, and
  `/messages?wave={waveId}`
- Mobile Waves and Messages list screens that reuse the same row behavior
- Not shown in collapsed desktop sidebar rows

## When It Appears

1. You are authenticated and can access Waves/Messages content.
2. The row is in expanded mode.
3. The row has a known latest-drop timestamp.

If no timestamp is known, the `Last drop` line stays hidden.

## How It Updates

1. Initial value comes from list overview timestamps.
2. New live drops in unmuted rows can move `Last drop` forward immediately.
3. The label refreshes every minute.
4. Opening a row clears its live new-drop counter, but keeps the newest `Last drop` time.

## Unread and Mute Behavior

- Your own new drop updates `Last drop` but does not increase unread count.
- If a row is active and the tab is visible, `Last drop` updates but unread does
  not increase.
- If a row is active and the tab is hidden, unread can increase until the tab is
  visible again.
- Muted rows ignore live timestamp/unread updates. Later list refreshes can still
  update `Last drop`.

## Sorting Behavior

- Rows sort by newest `Last drop` time.
- Non-muted rows stay above muted rows.
- Pinned and regular sections both follow this ordering.
- Direct-message rows show `Last drop` but do not show pin controls.

## Recovery and Edge Cases

- If a live drop arrives for a wave missing from this list, the list refetches
  with a cooldown (about every 3 seconds) unless that wave is already in the
  opposite list.
- If websocket delivery pauses, the current label stays until the next live
  update or list refresh.
- Reconnect/refetch can refresh stale timestamps.
- If no timestamp is returned after refresh, the line remains hidden.

## Related Pages

- [Sidebars Index](README.md)
- [Waves Index](../README.md)
- [Wave List Navigation Behavior](feature-wave-list-navigation.md)
- [Wave Notification Controls and Mute Behavior](feature-wave-notification-controls.md)
- [Brain Wave List Name Tooltips](feature-brain-list-name-tooltips.md)
