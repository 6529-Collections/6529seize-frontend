# Pinned Wave Controls

## Overview

This page covers two separate pin-style controls:

- Server pinned waves: `Pin wave` / `Unpin wave` for non-DM waves in the Waves
  list.
- App shortcuts: local recent-thread chips shown above content in the native app
  on small screens.

Both lists are capped at **20** items. They are independent and do not sync.

## Location in the Site

- Header pin button in selected thread routes:
  - `/waves/{waveId}`
  - `/messages?wave={waveId}` (DM route; no `/messages/{waveId}` thread route)
- Left sidebar wave rows in the Waves list (`/waves*` only; DM rows do not show
  row pin controls).
- Native app small-screen (`<1024px`) shortcuts rail above Waves or Messages
  content.
- Legacy `/waves?wave={waveId}` links redirect to `/waves/{waveId}`.

## Entry Points

- Use the thread-header thumbtack (`Pin wave` / `Unpin wave`).
- Use the thumbtack on a non-DM row in the left Waves list.
- In native app small-screen mode, opening a wave or DM thread adds or refreshes
  that thread in the shortcuts rail. Use `x` to remove a chip.

## User Journey

1. Open `/waves/{waveId}` and select `Pin wave` from the header or wave row.
2. The wave appears in the pinned block above regular waves.
3. Unpin from either control to remove it from the pinned block.
4. If 20 waves are already pinned, pinning is blocked until you unpin one.
5. In native app small-screen mode, opened threads are added to local shortcuts
   (newest first, max 20).

## Common Scenarios

- Keep priority waves pinned while switching threads.
- Rotate pinned waves as priorities change.
- Use app shortcuts to jump between recent wave and DM threads.

## Edge Cases

- The same control flips label by state (`Pin wave` vs `Unpin wave`).
- Pin/unpin controls are disabled while that wave request is in progress.
- In desktop expanded sidebars, unpinned row controls appear on hover; pinned
  rows keep the control visible.
- In collapsed web sidebars, row pin controls are hidden.
- DM lists do not expose row pin controls.
- When app shortcuts reach 20, opening another thread keeps the newest 20 and
  drops the oldest.

## Failure and Recovery

- If the 20-wave limit is reached, pinning is blocked and an error toast is
  shown. Unpin another wave, then retry.
- If a server pin/unpin request fails, optimistic UI changes are reverted. Retry
  from the same control.
- If an app shortcut points to a thread that no longer resolves, that chip is
  removed.
- If you remove the currently open shortcut, the app returns to section home
  (`/waves` or `/messages`).

## Limitations / Notes

- Header pin controls are shown only when a connected profile handle is active
  and no profile proxy is active.
- Server pinning applies to non-DM waves in the Waves list.
- App shortcuts are local to the device and are not synced to server-pinned
  waves.
- App shortcuts are only shown in native app small-screen layouts.

## Related Pages

- [Wave Sidebars Index](README.md)
- [Wave List Navigation Behavior](feature-wave-list-navigation.md)
- [Brain Wave List Row Metadata](feature-brain-list-last-drop-indicator.md)
- [Wave Left Sidebar Expand Control](feature-left-sidebar-expand-control.md)
- [Wave Notification Controls and Mute Behavior](feature-wave-notification-controls.md)
