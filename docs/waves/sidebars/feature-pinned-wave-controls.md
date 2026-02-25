# Pinned Wave Controls

## Overview

Pinned-wave controls let users keep important waves easier to reach across wave
surfaces. Users can pin and unpin from wave-level controls, and pinned waves are
grouped ahead of regular waves in sidebar lists.

The current cap is **20 pinned waves**.

## Location in the Site

- Wave header pin control in wave About/header surfaces (`/waves/{waveId}` and
  `/messages?wave={waveId}` contexts where wave header actions are shown).
- Desktop/web Brain wave list rows in wave-sidebars.
- App small-screen pinned shortcuts rail shown above wave content.

## Entry Points

- Open a wave and use the thumbtack control in the wave header.
- Use the thumbtack control on a wave row in the left wave list.
- In app small-screen mode, open waves to add/update entries in the pinned
  shortcuts rail, then remove with the row `x` control when needed.

## User Journey

1. Open a wave and select `Pin wave` (or select `Unpin wave` if already pinned).
2. Pinned waves are shown in the pinned list section above regular waves.
3. If the user reaches 20 pinned waves and tries to pin another one, pinning is
   blocked and an error message is shown.
4. Unpin any existing wave to free a slot, then pin the new wave.
5. In app small-screen mode, opening a wave promotes it to the pinned shortcuts
   rail and keeps that rail to a maximum of 20 entries.

## Common Scenarios

- Keep high-priority waves in the pinned section while browsing `/waves`.
- Unpin a wave after activity cools down, then pin a different wave.
- Use app pinned shortcuts to switch among recently opened waves without
  returning to the full list.

## Edge Cases

- Pin controls switch behavior by current state (`Pin` vs `Unpin`) for the same
  wave.
- Pin/unpin controls are temporarily disabled while that same wave operation is
  still in progress.
- If app pinned shortcuts are already full (20), opening another wave keeps the
  newest 20 and drops the oldest shortcut entry.
- Direct-message lists do not expose wave-row pin controls.

## Failure and Recovery

- If pin/unpin fails, users see an error toast and can retry from the same
  control.
- If the max-pinned limit is reached, users can unpin another wave first and
  then retry.
- If a pinned app shortcut points to a wave that is no longer available, that
  shortcut is removed from the rail.

## Limitations / Notes

- Maximum pinned waves: `20`.
- The header pin action is shown only for connected-profile contexts where wave
  header actions are available.
- In collapsed web sidebars, pin controls are hidden on rows; expand the sidebar
  or use the wave header pin action.
- Pinned and regular sections still follow the standard wave ordering rules
  within each section.

## Related Pages

- [Wave Sidebars Index](README.md)
- [Wave List Navigation Behavior](feature-wave-list-navigation.md)
- [Brain Wave List Name Tooltips](feature-brain-list-name-tooltips.md)
- [Wave Left Sidebar Expand Control](feature-left-sidebar-expand-control.md)
- [Wave Notification Controls and Mute Behavior](feature-wave-notification-controls.md)
