# Pinned Wave Controls

## Overview

Pinned-wave controls keep important waves easy to reach.
Users can pin or unpin from header and sidebar controls.
Pinned waves render ahead of regular waves in sidebar lists.

The maximum is **20 pinned waves**.

## Location in the Site

- Wave header controls on selected-thread routes:
  - `/waves/{waveId}` (canonical wave thread route)
  - `/messages?wave={waveId}` (canonical DM thread route; no
    `/messages/{waveId}` thread path)
- Desktop and app left-sidebar wave rows for non-DM waves.
- App-only small-screen pinned shortcuts rail above thread content.
- Legacy `/waves?wave={waveId}` links redirect to `/waves/{waveId}`.

## Entry Points

- Open a wave thread and use the header thumbtack (`Pin wave` / `Unpin wave`).
- Use the thumbtack on a non-DM row in the left wave list.
- In app small-screen mode, opening a thread adds or refreshes that wave in the
  pinned shortcuts rail; use `x` to remove an entry.

## User Journey

1. Open a thread (`/waves/{waveId}` or `/messages?wave={waveId}`).
2. Select `Pin wave`.
3. The wave appears in the pinned section above regular waves.
4. At 20 pins, new pin attempts are blocked and an error message is shown.
5. Unpin one wave to free a slot, then pin another.
6. On app small screens, opened threads are kept in the shortcuts rail,
   newest-first, capped at 20.

## Common Scenarios

- Keep active waves pinned while switching across threads.
- Unpin lower-priority waves, then pin new priorities.
- Use app shortcuts to switch recent threads without reopening the full list.

## Edge Cases

- Pin controls switch behavior by state (`Pin wave` vs `Unpin wave`).
- Pin/unpin controls are disabled while that wave operation is in progress.
- If app pinned shortcuts are full (20), opening another thread keeps the
  newest 20 and drops the oldest entry.
- Direct-message lists do not expose wave-row pin controls.

## Failure and Recovery

- If pin/unpin fails, users see an error toast and can retry from the same
  control.
- If the max-pinned limit is reached, unpin another wave first, then retry.
- If an app shortcut points to a wave that is no longer available, that entry
  is removed from the rail.

## Limitations / Notes

- The header pin action is shown only when a connected profile is active and no
  profile proxy is active.
- In collapsed web sidebars, pin controls are hidden on rows; expand the sidebar
  or use the wave header pin action.
- Pinned and regular sections still follow the standard wave ordering rules
  within each section.
- App small-screen pinned shortcuts are stored locally on the device.

## Related Pages

- [Wave Sidebars Index](README.md)
- [Wave List Navigation Behavior](feature-wave-list-navigation.md)
- [Brain Wave List Row Metadata](feature-brain-list-last-drop-indicator.md)
- [Wave Left Sidebar Expand Control](feature-left-sidebar-expand-control.md)
- [Wave Notification Controls and Mute Behavior](feature-wave-notification-controls.md)
