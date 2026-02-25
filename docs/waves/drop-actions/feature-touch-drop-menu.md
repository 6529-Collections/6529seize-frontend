# Wave Drop Touch Menu (Long-Press and Touch Action Button)

## Overview

On small touch layouts, users open per-drop actions by pressing and holding a
drop card for a short duration. On touch-capable medium+ layouts, users open the
same menu from the drop header action button because long-press is disabled.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Any drop card that uses touch menu support (including winner, outcome, and
  participation card variants).

## Entry Points

- Open a wave or direct-message thread.
- On touch-capable small screens, press and hold a non-temporary drop card to open
  the overflow action sheet.
- On touch-capable medium+ screens, users tap the header action button to open
  the same menu because long-press is intentionally disabled there.
- Choose an action from the drop action menu.

## User Journey

1. Open a thread and locate a target drop.
2. Press and hold the drop card (small touch layouts) or tap the header action
   button (medium+ touch layouts).
3. When the hold duration is long enough, or the header button opens, the action
   menu opens.
4. Select a menu action (`Reply`, `Open`, `Copy link`, `Mark as unread`,
   `Delete`, `Download media`, and other actions available for that context).
5. Confirm the action to continue in the same thread.

## Common Scenarios

- On non-hover small touch layouts (for example phones and narrow tablets), the
  drop action menu opens by long-press instead of hover.
- On touch-capable medium+ layouts, users use the header action button because
  long-press does not trigger the menu.
- Users can access actions without leaving the thread.
- The menu stays consistent with the device-appropriate action surface used in
  the same area of the app.
- Non-hover action set content is shared with the desktop `More` menu so users
  can expect the same actions on each surface.
- `Hide link previews` and `Show link previews` are no longer available from this
  menu; use the link-level controls in the drop body.

## Edge Cases

- Temporary (unsent) drops do not open the long-press action menu.
- Quick movement during hold can cancel the gesture, and the menu will not open.
- On small touch layouts, if long-press is not reliable, the touch action button
  is the fallback access for the same actions.

## Failure and Recovery

- If the menu does not open because the hold is too short, users can hold again
  for a little longer, or use the header action button on medium+ touch layouts.
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
