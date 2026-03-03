# Brain Wave Row Metadata and Last Drop Indicator

## Overview

This is the canonical owner for Waves and Messages list-row metadata.

- row name labels and tooltip rules
- `Last drop` visibility, timestamp source, and refresh behavior
- live unread/new-drop behavior that updates row badges and divider jumps

Legacy tooltip-only links should resolve here.

## Location in the Site

- Web left sidebar rows on `/waves`, `/waves/{waveId}`, `/messages`, and
  `/messages?wave={waveId}`.
- Mobile/app Waves and Messages list rows that reuse the same `Last drop`
  source but do not use hover tooltips.
- Collapsed web rows hide `Last drop` and show name via tooltip.

## Name Label and Tooltip Behavior

- Web collapsed rows are avatar-first and always expose the row name by hover
  tooltip on non-touch devices.
- Web expanded rows keep names inline and show a tooltip only when the name is
  truncated.
- Truncation is re-measured when row width or viewport size changes.
- Direct-message rows follow the same web tooltip rules as wave rows.
- Direct-message names that include wallet IDs are shown with shortened address
  formatting.
- Touch/mobile list rows do not expose hover tooltips.

On touch devices, users read names inline in the expanded list.

## `Last drop` Visibility and Source

`Last drop` appears only when all conditions are true:

- you can access Waves/Messages content
- the row layout shows metadata (web collapsed rows hide it)
- the row has a known latest-drop timestamp

If no timestamp is known, the line stays hidden.

Timestamp source and precedence:

1. Start with list overview `metrics.latest_drop_timestamp`.
2. Live websocket drops for unmuted rows can move the timestamp forward.
3. When both sources exist, the newer value wins.

## Live Refresh, Unread, and Mute Behavior

- The relative-time label refreshes every 60 seconds, and immediately when the
  timestamp changes.
- Selecting a row resets its live websocket new-drop counter.
- Active-row unread display clears after a short delay (about 1 second).
- Clearing unread/new-drop counters does not clear `Last drop`.
- Your own new drops can update `Last drop` without increasing unread.
- If a row is active and the tab is visible, `Last drop` updates while unread
  stays stable.
- If a row is active and the tab is hidden, unread can increase until the tab
  is visible again.
- Returning to a visible tab resets the active row's live new-drop counter and
  keeps `Last drop`.
- Muted rows ignore live websocket timestamp/unread updates, but later list
  refreshes can still update `Last drop`.

## Sorting and Section Behavior

1. Non-muted rows sort above muted rows.
2. Within each mute group, rows sort by newest timestamp.
3. Pinned and regular wave sections each preserve this ordering.
4. Direct-message rows still show `Last drop`, but row pin controls stay hidden.

## Recovery and Edge Cases

- If a live drop arrives for a wave missing from this list, the list refetches.
- Refetch is skipped when that wave already exists in the opposite list.
- Unknown-wave live-drop refetch is throttled (about every 3 seconds).
- If websocket delivery pauses, current labels remain until live updates or a
  list refresh.
- Reconnect/refetch can refresh stale timestamps.
- If no timestamp is returned after refresh, `Last drop` remains hidden.
- Resizing can change truncation and tooltip eligibility in expanded rows.
- Active-row highlight and unread badges do not block web hover tooltips.

## Related Pages

- [Sidebars Index](README.md)
- [Waves Index](../README.md)
- [Wave List Navigation Behavior](feature-wave-list-navigation.md)
- [Wave Notification Controls and Mute Behavior](feature-wave-notification-controls.md)
- [Pinned Wave Controls](feature-pinned-wave-controls.md)
- [Brain Wave List Name Tooltips](feature-brain-list-name-tooltips.md)
