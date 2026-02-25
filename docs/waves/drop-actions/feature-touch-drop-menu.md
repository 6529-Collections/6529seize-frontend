# Wave Drop Touch Menu (Long-Press and Touch Action Button)

## Overview

On non-hover input surfaces, users open per-drop actions by pressing and holding
a drop card for a short duration. On touch-capable devices, users can also use the
drop header action button to open the same menu directly.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Any drop card that uses touch menu support (including winner, outcome, and
  participation card variants).

## Entry Points

- Open a wave or direct-message thread.
- On touch-capable small screens, press and hold a non-temporary drop card to open
  the overflow action sheet.
- On touch-capable medium+ screens, users can tap the header action button to
  open the same menu without a long-press gesture.
- Choose an action from the drop action menu.

## User Journey

1. Open a thread and locate a target drop.
2. Press and hold the drop card (mobile and smaller touch layouts) or tap the
   header action button (touch-capable medium+ layouts where it is shown).
3. When the gesture/selection is long enough, or the button opens, the action menu
   opens.
4. Select a menu action (reply, quote, copy, mark unread, and other actions
   available for that context).
5. Confirm the action to continue in the same thread.

## Common Scenarios

- On non-hover devices (including phones and some tablets), the drop action menu
  opens by long-press instead of hover.
- On hybrid touch devices, users can still use long-press, or use the touch action
  button in the header when available.
- Users can access actions without leaving the thread.
- The menu stays consistent with the device-appropriate action surface used in
  the same area of the app.

## Edge Cases

- Temporary (unsent) drops do not open the long-press action menu.
- Quick movement during hold can cancel the gesture, and the menu will not open.
- On touch-capable devices, if long-press is not reliable, the touch action button
  is the fallback access for the same actions.

## Failure and Recovery

- If the menu does not open because the hold is too short, users can hold again
  for a little longer, or use the header action button on supported layouts.
- If the gesture is interpreted as a scroll, users can release and retry when the
  feed is stable.
- If a specific action fails after selection, standard action-level error feedback
  remains visible while users stay in the thread.

## Limitations / Notes

- The drop menu is intentionally disabled for temporary draft drops.
- The touch menu is one of multiple action entry options. It may be a long-press
  path or header button depending on device input and layout.

## Related Pages

- [Wave Drop Open and Copy Links](feature-open-and-copy-links.md)
- [Wave Drop Reactions and Rating Actions](feature-reactions-and-ratings.md)
- [Wave Drop Mark as Unread](feature-mark-as-unread.md)
- [Wave Drop Boosting](feature-drop-boosting.md)
- [Docs Home](../../README.md)
