# Brain Wave List Last Drop Indicator

## Overview
Expanded wave and direct-message rows show `Last drop:` under the row name.
The label always uses the newest known timestamp for that row.

## Route Coverage
- Wave rows in the shared left sidebar on `/waves` and `/waves/{waveId}`
- Direct-message rows in the shared left sidebar on `/messages` and
  `/messages?wave={waveId}`
- Mobile Waves and Messages list views that reuse the same row components

## Visibility Rules
- The line appears only on expanded rows.
- Collapsed desktop rows do not show this line.
- The line renders only when a timestamp exists.
- Wave rows can be pinned or unpinned; direct-message rows are unpinned.

## Timestamp Source and Merge
- Overview data provides `metrics.latest_drop_timestamp`.
- Live drop events provide `created_at`.
- The row keeps whichever timestamp is newer.

## Live Updates
1. On load, each row starts from the newest known timestamp.
2. A new drop in an unmuted row updates the timestamp immediately.
3. If the drop is by the connected profile, timestamp updates but unread
   counter does not increase.
4. If the row is active and the tab is visible, timestamp updates but unread
   counter does not increase.
5. If the row is active while the tab is hidden, unread counters can still
   increase until the tab is visible again.
6. Label text refreshes every minute and after timestamp changes
   (`Just now`, `Xm`, `Xh`, `Yesterday`, `Mon D`).
7. Opening a row clears that row's new-drop counter but keeps the newest known
   timestamp.

## Mute and Ordering
- Muted rows skip websocket new-drop processing in this path.
- Muted rows still update after overview refetches.
- Base ordering keeps muted rows below non-muted rows, then sorts by newest
  merged timestamp first.
- In Waves lists, pinned and regular sections are separate; ordering applies
  within each section.

## Failure and Recovery
- If both overview and websocket timestamps are missing, the line stays hidden.
- If websocket delivery pauses, the current label stays until live or refetched
  data updates it.
- If a websocket drop references a wave missing from the current list, the list
  triggers a throttled refetch.

## Notes
- This label uses client-side relative-time formatting and can differ slightly
  from other timestamp surfaces.
- This page covers the row timestamp indicator only.
- Mute controls are documented separately.

## Related Pages
- [Sidebars Index](README.md)
- [Waves Index](../README.md)
- [Wave List Navigation Behavior](feature-wave-list-navigation.md)
- [Wave Notification Controls and Mute Behavior](feature-wave-notification-controls.md)
- [Brain Wave List Name Tooltips](feature-brain-list-name-tooltips.md)
