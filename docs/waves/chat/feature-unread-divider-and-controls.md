# Wave Chat Unread Divider and Jump Controls

## Overview

When a wave has unread activity, the message list can insert a divider labeled
`New Messages` at the unread boundary. The divider is typically driven by a
`divider` query value created from the wave’s first-unread serial.
A floating control jumps to that point and keeps unread navigation available
while users read older messages.

On mobile, the same control combines with the bottom pending-message control so both
actions stay within reach.
On desktop, the control can be dismissed with a close action, a right-swipe
gesture, or Escape (unless focus is inside a dialog).

## Location in the Site

- `/waves/{waveId}`
- `/messages?wave={waveId}`
- Wave detail message list on both desktop and mobile.

## Entry Points

- Open a wave from the Brain or messages list while it has unread drops
  (the row link includes `divider=<serial_no>`).
- Open a wave through a row whose URL includes `divider=<serial_no>`.
- Open a `serialNo` link after list navigation adds `divider` to the URL.
- Open a `serialNo` link without `divider`; if the thread already has unread
  metadata, the current unread boundary is used.
- Use drop actions to mark a message as unread (see `Mark a Drop as Unread`).

## User Journey

1. Open a wave where the list reports `first_unread_drop_serial_no` or a
   direct thread link includes `serialNo`.
2. The chat renders an unread divider at `divider` (or the current first-unread
   boundary when `divider` is not available).
3. If the divider is outside the viewport, a floating control appears:
   - Arrow direction points to where unread content starts relative to your current
     scroll position.
4. Click/tap the control to scroll directly to the first unread serial.
5. If the divider remains off-screen after navigation, the control remains available
   until context changes.
6. Once you return to the unread divider position, the control auto-hides.
7. Sending a new message clears the divider state for the active chat.

- You can dismiss the control without jumping by swiping it right or pressing
  Escape.

## Common Scenarios

- A row opened from a muted-but-following wave still navigates as usual; only
  unread tracking behavior may differ based on your mute state.
- Opening a wave directly to a serial (`serialNo`) with a `divider` query
  preserves an unread anchor near the intended boundary after initial hydration.
- On iOS mobile, unread and pending-message controls can be shown together as a
  compact combined control group.
- On desktop, the close action is available to hide the unread control temporarily,
  and swiping right from the unread control dismisses it without changing scroll.
- If new messages arrive while the divider stays out of view, the control remains
  available without forcing automatic scroll jumps.
- If users read past the divider position, the control auto-dismisses.

## Edge Cases

- If `divider` or `serialNo` query values are invalid, or `divider` is missing but
  unread metadata exists, the chat still opens normally and uses the best available
  known unread boundary where possible.
- If the divider serial is not part of loaded data yet, the control remains available
  and resolves as data renders.
- If users navigate in and out of the unread boundary, the control can reappear or hide
  based on current scroll position and divider context.
- Dismissing the control removes it only for that current unread boundary.
  It can reappear when the divider changes or the thread is reopened.

## Failure and Recovery

- If URL cleanup for `divider`/`serialNo` fails temporarily, users can still
  continue reading from the current thread; reloading the same thread keeps list
  context.
- If unread jump actions stall on a large list, users can manually scroll and retry
  via the floating control.
- If unread metadata arrives late, the divider may appear after initial hydration.
- If you dismiss the control and need it again for the same boundary, reopen the
  same thread (or navigate away and back) to clear the dismissal state.

## Limitations / Notes

- The unread divider is available only when a valid unread serial is known.
- A jump controls only a boundary position, not a full unread message selection UI.
- After jump and normal usage, divider controls are intended as a temporary
  navigation aid while users return to their reading position.

## Related Pages

- [Wave Chat Scroll Behavior](feature-scroll-behavior.md)
- [Wave Drop Open and Copy Links](../drop-actions/feature-open-and-copy-links.md)
- [Wave Chat Typing Indicator](feature-typing-indicator.md)
- [Wave Drop Actions - Mark as Unread](../drop-actions/feature-mark-as-unread.md)
- [Wave Sidebars Features](../sidebars/README.md)
