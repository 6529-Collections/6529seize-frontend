# Wave Chat Typing Indicator

## Overview

Wave chat shows a live typing row above the composer when other participants
type in the current thread.

## Location in the Site

- `/waves/{waveId}`
- `/messages?wave={waveId}`
- Same thread routes when `drop={dropId}` is open
- Bottom overlay of the chat message list in chat view only (not gallery)

## Entry Points

- Open a wave or direct-message thread with existing drops.
- Keep the wave unmuted.
- Wait for another participant to send typing updates for the same wave.

## User Journey

1. Open a thread.
2. When another participant types, a row fades in with three animated dots and
   a handle label.
3. The label updates as people start typing, stop typing, or post.
4. If no new typing signal arrives for about 5 to 6 seconds, the row fades out.

## Label Rules

- One typer: `handle is typing`.
- Two typers: `handle1, handle2 are typing`.
- Three or more typers: `handle1, handle2 and N more people are typing`.
- Handles are ordered by highest participant level first.
- The current viewer's own typing is not echoed back.

## Edge Cases

- Loading and empty-thread states show instead of the typing row.
- Gallery view does not show this row.
- Typing events for other wave IDs are ignored.
- Switching waves clears current typing state.
- Muting a wave clears and disables typing updates.
- Unmuting starts a fresh typing subscription for the active wave.
- Drop-post updates remove that author's typing label immediately.
- Malformed websocket payloads are ignored.

## Failure and Recovery

- If websocket traffic drops, current typing labels time out and clear.
- Wave typing subscription retries are limited to 20 attempts with a 2-second
  delay between attempts.
- If retries are exhausted, switch threads or reload to start a fresh
  subscription cycle.

## Limitations / Notes

- This indicator is a lightweight activity signal, not guaranteed presence or
  delivery state.
- Label refresh is interval-based, so show/hide timing can lag briefly.
- There is no dedicated typing-connection error banner.

## Related Pages

- [Wave Chat Index](README.md)
- [Wave Chat Scroll Behavior](feature-scroll-behavior.md)
- [Wave Chat Composer Availability](feature-chat-composer-availability.md)
- [Wave Notification Controls and Mute Behavior](../sidebars/feature-wave-notification-controls.md)
- [Wave Troubleshooting](../troubleshooting-wave-navigation-and-posting.md)
- [Docs Home](../../README.md)
