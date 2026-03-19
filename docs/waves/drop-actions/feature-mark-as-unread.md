# Wave Drop Mark as Unread

## Overview

Use `Mark as unread` to set your unread boundary at a selected drop so you can
jump back to that spot later.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Single-drop overlay in the current thread route: `?drop={dropId}`
- Drop action menus on full drop cards

## Entry Points

- Open a wave or direct-message thread.
- Open the drop action menu:
  - Desktop: `More` (`...`).
  - Chat drops, touch small layouts: long-press a drop.
  - Chat drops, touch medium+ layouts: use the drop header action button.
  - Winner/participation drops, touch layouts: long-press the drop content.
- Select `Mark as unread`.

## What Happens

1. Select `Mark as unread` from a drop menu.
2. The action shows a spinner and is disabled while the request runs.
3. On success:
   - You see `Marked as unread`.
   - Waves and Messages unread counts refresh.
   - The thread refreshes unread metadata.
   - If the server returns an unread boundary serial, the divider moves there.
   - The menu closes.
4. Use unread jump controls to return to the boundary.

## Availability and Edge Cases

- If no connected profile is available, the action is hidden.
- In standard profile sessions, the action is hidden on your own drops.
- Desktop and touch menus run the same mark-unread request.
- Repeated taps/clicks are blocked while one request is in flight.

## Failure and Recovery

- On failure, you see an error toast (server message when available, otherwise
  `Failed to mark as unread`).
- Existing unread state stays unchanged.
- The menu stays open, so you can retry immediately.

## Notes

- The action does not change drop content. It only updates unread position and
  unread counters.
- This is a menu action, not a standalone desktop action-row button.

## Related Pages

- [Wave Chat Unread Divider and Jump Controls](../chat/feature-unread-divider-and-controls.md)
- [Wave Drop Touch Menu](feature-touch-drop-menu.md)
- [Wave Drop Open and Copy Links](feature-open-and-copy-links.md)
- [Wave Drop Actions Index](README.md)
- [Docs Home](../../README.md)
