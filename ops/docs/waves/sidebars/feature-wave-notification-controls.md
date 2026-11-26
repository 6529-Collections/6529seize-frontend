# Wave Notification Controls and Mute Behavior

## Overview

One bell menu controls wave notification levels and mute. The bell stays in the
same place when muted and changes to a bell-slash.

## Location in the Site

- `About` on `/waves/{waveId}` and `/messages/{waveId}`.
- Wave rows in the sidebar, collapsed rail, and mobile lists show muted status.

## Entry Points

Open a wave's `About` panel and select the bell labelled `Notification settings`.
The control requires a connected profile handle and no proxy session.

## User Journey

1. Open the bell menu.
2. If joined, choose one level under `Notify me about`:
   - `All messages`: every new post.
   - `@all and mentions`: mentions, `@all`, and `@contributors`.
   - `Mentions only`: mentions and replies to you.
3. Choose `Mute` to stop wave alerts, or `Unmute` to restore the saved level.
4. Choosing a level or Mute/Unmute closes the menu.

## Common Scenarios

- Exactly one notification level is selected. Direct mentions, replies, and
  quotes remain eligible at every level, subject to your profile notification
  preferences. Mute suppresses wave alerts, including direct mentions.
- Muting keeps the saved level checked and visible, with level choices disabled.
  `Unmute` remains available.
- Before joining, the same bell menu offers only Mute/Unmute. Muting does not
  join or leave a wave.
- On smaller screens, the choices use the site's standard picker sheet over
  `About`. Selecting a choice, closing the picker, tapping its backdrop, or
  pressing Escape restores focus to the bell. About keeps its content and
  scroll position.
- Desktop and tablet sidebars show an anchored menu. Arrow keys move between
  enabled choices; Home and End reach the first and last actions. Escape returns
  focus to the bell.
- Mouse users can read the bell tooltip. Touch users can open the same choices
  directly without a lingering tooltip.

## Edge Cases

- Muted wave rows show an icon-only bell-slash in neutral iron colours on the
  avatar, separate from the wave score and any number.
- Muted rows hide unread counts and sort after unmuted waves in wave and DM
  lists, expanded subwaves, and the mobile subwave bar.
- Muted waves skip realtime unread accumulation. Open muted threads still show
  new drops live; inactive muted threads sync when opened. Typing indicators
  remain disabled.

## Failure and Recovery

- A saving action shows its own spinner and temporarily disables menu actions.
  The bell remains in place, and reopening it shows the pending action.
- If preferences cannot load, `Retry` appears inside the menu in place of the
  levels. Mute/Unmute remains available.
- A failed save keeps the prior state and shows an error toast.
- If header or list state appears stale, reopen the thread or refresh.

## Limitations / Notes

Mute is per wave and does not prevent opening its content manually. There are
no timed mute durations. Joining and leaving remain separate controls.

## Related Pages

- [Wave Header Controls](../header/feature-wave-header-controls.md)
- [Pinned Wave Controls](feature-pinned-wave-controls.md)
- [Wave List Navigation](feature-wave-list-navigation.md)
- [Brain Wave Row Metadata and Last Drop Indicator](feature-brain-list-last-drop-indicator.md)
- [Wave Chat Typing Indicator](../chat/feature-typing-indicator.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
