# Wave Drop Touch Menu (Long-Press)

## Overview

On non-hover input surfaces, users open per-drop actions by pressing and holding
a drop card for a short duration. This includes phones and tablets where hover
interactions are not available.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Any drop card that uses touch menu support (including winner, outcome, and
  participation card variants).

## Entry Points

- Open a wave or direct-message thread.
- Touch and hold a non-temporary drop card to open the overflow action sheet.
- Choose an action from the drop action menu.

## User Journey

1. Open a thread and locate a target drop.
2. Press and hold the drop card.
3. When the hold duration is long enough, the non-hover drop menu opens.
4. Select a menu action (reply, quote, copy, mark unread, and other actions
   available for that context).
5. Release the press to confirm the selected action.

## Common Scenarios

- On non-hover devices (including phones and some tablets), the drop action menu
  opens by long-press instead of hover.
- On hybrid devices that support hover (for example touch with trackpad/mouse),
  users can use hover-style action controls instead of long-press.
- Users can access actions without leaving the thread.
- The menu stays consistent with the device-appropriate action surface used in
  the same area of the app.

## Edge Cases

- Temporary (unsent) drops do not open the long-press action menu.
- Quick movement during hold can cancel the gesture, and the menu will not open.
- On hover-capable devices, this flow is not shown; users use hover/desktop
  controls instead.

## Failure and Recovery

- If the menu does not open because the hold is too short, users can hold again
  for a little longer.
- If the gesture is interpreted as a scroll, users can release and retry when the
  feed is stable.
- If a specific action fails after selection, standard action-level error feedback
  remains visible while users stay in the thread.

## Limitations / Notes

- The drop menu is intentionally disabled for temporary draft drops.
- The touch menu is only a non-hover entry surface; it is not shown on
  hover-capable desktop-style interactions.

## Related Pages

- [Wave Drop Open and Copy Links](feature-open-and-copy-links.md)
- [Wave Drop Reactions and Rating Actions](feature-reactions-and-ratings.md)
- [Wave Drop Mark as Unread](feature-mark-as-unread.md)
- [Wave Drop Boosting](feature-drop-boosting.md)
- [Docs Home](../../README.md)
