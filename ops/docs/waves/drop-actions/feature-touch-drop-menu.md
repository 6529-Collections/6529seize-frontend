# Wave Drop Touch Menu (Long-Press and Touch Action Button)

## Overview

Use the touch drop menu to run drop actions without leaving the thread.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages/{waveId}`
- Single-drop overlay in the current thread route: `?drop={dropId}`
- Touch leaderboard list cards that expose the compact slide-up action sheet

## Entry Points

- Open a wave, direct-message thread, or single-drop overlay in the compact
  mobile/tablet layout on a touch surface.
- Press and hold an eligible drop, or use `Open drop actions` when that button
  is the touch entry surface.
- On leaderboard list cards, press and hold the card to open the compact
  slide-up sheet.

## Menu Entry Rules

- Touch drops in compact mobile/tablet layouts: press and hold for about
  `500ms`.
- Compact touch layouts use the touch sheet even when the browser also reports
  hover support.
- Chat drops in compact mobile/tablet layouts can also expose `Open drop
actions` in the drop header.
- Desktop-width layouts with hover support use desktop drop action controls
  instead of the touch sheet, even when the hardware reports a touchscreen.
- Desktop-width touch surfaces without hover support keep the touch sheet so
  drop actions remain reachable.
- Hybrid touchscreen desktops/laptops use desktop drop action controls when
  their browser reports hover support.
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

- Touch drops on compact mobile/tablet layouts open the menu after a
  press-and-hold.
- Chat drops on compact mobile/tablet layouts can use `Open drop actions`
  instead of long-press.
- Winner and participation drops support touch long-press in compact
  mobile/tablet layouts and on touch-only desktop-width surfaces without hover.
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
- Touchscreen laptops and desktops are treated as desktop interaction surfaces
  at desktop-width viewports when hover controls are available. Touch-only
  desktop-width surfaces keep the touch sheet fallback.
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
