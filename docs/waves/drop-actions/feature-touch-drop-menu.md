# Wave Drop Touch Menu (Long-Press and Touch Action Button)

## Overview

Use the touch drop menu to run drop actions without leaving the thread.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Single-drop overlay in the current thread route: `?drop={dropId}`
- Touch leaderboard list cards that expose the compact slide-up action sheet

## Entry Points

- Open a wave, direct-message thread, or single-drop overlay on a touch device.
- Press and hold an eligible drop, or use `Open drop actions` when that button
  is the touch entry surface.
- On leaderboard list cards, press and hold the card to open the compact
  slide-up sheet.

## Menu Entry Rules

- Chat drops, touch small layouts: press and hold for about `500ms`.
- Chat drops, touch medium+ layouts: tap `Open drop actions` in the drop
  header. Long-press does not open the menu in this layout.
- Winner and participation drops (including memes variants): press and hold the
  drop on touch layouts, including medium+ touch widths.
- If a chat drop is in edit mode, touch-menu entry is blocked for that drop.

## What the Menu Can Show

- quick react buttons
- `Add Reaction` / `Update Reaction`
- `Reply`
- `Boost` / `Remove Boost`
- `Set as pinned drop`
- `Open drop` (non-chat drops only)
- `Copy link`
- `Mark as unread`
- vote controls (when voting is available)
- `Edit Message` / `Delete` (when allowed)

## Availability Rules

- `Open drop` is hidden for chat drops.
- `Mark as unread` is hidden on your own drops and when no profile is
  connected.
- `Set as pinned drop` requires a connected non-proxy wave-admin session.
- `Edit Message` requires connected non-proxy author context.
- `Delete` requires connected non-proxy author context, or a connected
  non-proxy wave admin when admin drop deletion is enabled.
- `Edit Message` is hidden for participatory drops.
- Temporary drops (`temp-*`) show a reduced menu:
  - `Reply` and `Copy link` are disabled.
  - reaction and vote controls are disabled or hidden.
  - `Boost`, `Set as pinned drop`, `Edit Message`, and `Delete` are hidden.

## User Journey

1. Open a touch-supported drop surface.
2. Enter the menu from long-press or the touch action button, depending on the
   current layout.
3. Review the actions available for that drop and your current session state.
4. Select an action.
5. The menu closes or hands off to the selected action flow in the current
   thread.

## Common Scenarios

- Chat drops on touch small layouts open the menu after a press-and-hold.
- Chat drops on touch medium+ layouts use `Open drop actions` instead of
  long-press.
- Winner and participation drops support touch long-press across touch widths.
- Leaderboard list cards keep vertical scrolling responsive until the hold
  completes, then show the compact action sheet.
- Wave admins can use the same touch sheet to change the wave's pinned
  description drop.

## Edge Cases

- Moving about `10px` or more while holding cancels long-press.
- If the hold becomes a scroll gesture, the menu does not open.
- Leaderboard list cards keep native touch scrolling active while waiting for a
  hold, so vertical swipes continue scrolling the thread instead of freezing it.
- Some menu rows stay hidden when ownership, wallet, or voting requirements are
  not met.

## Failure and Recovery

- If the menu does not open, hold a little longer.
- If the hold is treated as scroll, release and retry when the feed is stable.
- If a selected action fails, action-level error feedback stays in the thread
  and you can retry from the menu.

## Limitations / Notes

- Menu composition differs by drop type and current user/session state.
- Link preview visibility actions are not in this menu. Use preview-card
  controls to hide previews, and use the desktop `More` menu to restore them
  after they are hidden.

## Related Pages

- [Wave Drop Open and Copy Links](feature-open-and-copy-links.md)
- [Wave Drop Set as Pinned Drop](feature-set-pinned-drop.md)
- [Wave Drop Reactions and Rating Actions](feature-reactions-and-ratings.md)
- [Wave Drop Mark as Unread](feature-mark-as-unread.md)
- [Wave Drop Boosting](feature-drop-boosting.md)
- [Wave Drop Actions Index](README.md)
- [Docs Home](../../README.md)
