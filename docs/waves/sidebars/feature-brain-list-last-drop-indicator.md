# Brain Wave List Last Drop Indicator

## Overview
Expanded wave and direct-message rows show a `Last drop:` line under the row
name. The line uses the newest timestamp the client knows.

## Route Coverage
- Waves sidebar rows on /waves and `/waves/{waveId}`
- Messages sidebar rows on /messages and `/messages?wave={waveId}`
- Mobile Waves and Messages list views that reuse the same row renderer

## Visibility Rules
- Expanded rows show `Last drop:` only when `latestDropTimestamp` exists.
- Collapsed desktop rows hide the line.
- Wave rows can be pinned or unpinned; DM rows are unpinned.
- If no timestamp exists, the line is hidden.

## Timestamp Source Rules
- Overview API provides `metrics.latest_drop_timestamp`.
- Websocket drop events provide `created_at`.
- The row keeps the newer value from those two sources.
- Sorting uses that merged timestamp (newest first), with muted rows kept below
  non-muted rows.

## Live Update Behavior
1. Row shows the current `Last drop` value on load.
2. A new drop in an unmuted row updates the timestamp immediately.
3. If the row is active and the tab is visible, timestamp updates but the
   new-drop counter does not increase.
4. If the new drop is authored by the connected profile, timestamp updates but
   the new-drop counter does not increase.
5. The displayed label refreshes every minute (`Just now`, `Xm`, `Xh`,
   `Yesterday`, `Mon D`).

## Mute and Unread Interaction
- Muted rows skip websocket new-drop processing in this path.
- Muted rows still update after overview refetches.
- Opening a row clears its new-drop counter but preserves the newest known
  timestamp.

## Failure and Recovery
- If both overview and websocket timestamps are missing, the line stays hidden.
- If websocket disconnects, the current label stays visible until new data
  arrives.
- If a websocket drop references a wave missing from the current list, the list
  triggers a throttled refetch.

## Limitations / Notes
- This indicator is client-timestamp based and can differ slightly from other
  timestamp surfaces.
- This page covers the row timestamp indicator only.
- Mute controls are documented separately.

## Related Pages
- [Sidebars Index](README.md)
- [Waves Index](../README.md)
- [Wave List Navigation Behavior](feature-wave-list-navigation.md)
- [Wave Notification Controls and Mute Behavior](feature-wave-notification-controls.md)
- [Brain Wave List Name Tooltips](feature-brain-list-name-tooltips.md)
