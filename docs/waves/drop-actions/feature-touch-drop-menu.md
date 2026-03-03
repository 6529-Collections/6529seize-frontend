# Wave Drop Touch Menu (Long-Press and Touch Action Button)

## Overview

Use the touch drop menu to run drop actions without leaving the thread.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Single-drop overlay in the current thread route: `?drop={dropId}`

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
- `Open drop` (non-chat drops only)
- `Copy link`
- `Mark as unread`
- vote controls (when voting is available)
- `Edit Message` / `Delete` (when allowed)

## Availability Rules

- `Open drop` is hidden for chat drops.
- `Mark as unread` is hidden on your own drops and when no profile is
  connected.
- `Edit Message` and `Delete` require connected non-proxy author context.
- `Edit Message` is hidden for participatory drops.
- Temporary drops (`temp-*`) show a reduced menu:
  - `Reply` and `Copy link` are disabled.
  - reaction and vote controls are disabled or hidden.
  - `Boost`, `Edit Message`, and `Delete` are hidden.

## Edge Cases

- Moving about `10px` or more while holding cancels long-press.
- If the hold becomes a scroll gesture, the menu does not open.
- Some menu rows stay hidden when ownership, wallet, or voting requirements are
  not met.

## Failure and Recovery

- If the menu does not open, hold a little longer.
- If the hold is treated as scroll, release and retry when the feed is stable.
- If a selected action fails, action-level error feedback stays in the thread
  and you can retry from the menu.

## Limitations / Notes

- Menu composition differs by drop type and current user/session state.
- `Hide link previews` / `Show link previews` are not in this menu. Use inline
  link controls in drop content.

## Related Pages

- [Wave Drop Open and Copy Links](feature-open-and-copy-links.md)
- [Wave Drop Reactions and Rating Actions](feature-reactions-and-ratings.md)
- [Wave Drop Mark as Unread](feature-mark-as-unread.md)
- [Wave Drop Boosting](feature-drop-boosting.md)
- [Wave Drop Actions Index](README.md)
- [Docs Home](../../README.md)
