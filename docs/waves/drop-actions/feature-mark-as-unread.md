# Wave Drop Mark as Unread

## Overview

Wave drops include a `Mark as unread` action so readers can manually reset where
their unread boundary sits in a thread.

The action is available in:

- Desktop drop action row (`mark unread` icon).
- Desktop more-actions menu item.
- Mobile long-press action menu item.

## Location in the Site

- `/waves/{waveId}`
- `/messages?wave={waveId}`
- Wave drop action row and row menus.

## Entry Points

- Open a wave or direct-message thread.
- Locate a drop that is not authored by you.
- Use the mark-as-unread control.

## User Journey

1. Open the thread and hover a non-own drop (or long-press on mobile).
2. Select `Mark as unread`.
3. The action shows a loading spinner while the request is in flight.
4. On success:
   - A toast confirms the action.
   - The thread unread divider updates to the server-reported first unread serial.
   - Existing wave unread counts are updated for both wave and direct-message lists.
5. The unread jump controls can now be used to return to that divider boundary.

## Common Scenarios

- Marking as unread for someone else’s drop is available for signed-in users who are
  not using an active profile proxy.
- The action is included in the per-drop overflow menu, so it remains accessible
  when the compact action row is crowded.
- The action is not shown on temporary draft drops.
- Existing unread and divider context is replaced with the new boundary returned by
  the API.

## Edge Cases

- The action is hidden for drop authors to prevent self-mark operations.
- Temporary draft drops do not support mark-unread.
- Mobile controls show a full-width menu item, while desktop uses icon + tooltip
  entry points.

## Failure and Recovery

- If the request fails, users see an error toast.
- If the update fails, existing unread state remains unchanged.
- Users can retry after the toast by re-selecting `Mark as unread` on the same drop.

## Limitations / Notes

- The action does not modify existing content; it only changes unread position and
  surface counters.
- Unread count visibility depends on wave unread-state synchronization and mute
  rules.
- You can only mark unread from currently available list data in an open thread.

## Related Pages

- [Wave Chat Unread Divider and Jump Controls](../chat/feature-unread-divider-and-controls.md)
- [Wave Chat Scroll Behavior](../chat/feature-scroll-behavior.md)
- [Wave Drop Open and Copy Links](feature-open-and-copy-links.md)
- [Wave Sidebars Features](../sidebars/README.md)
- [Docs Home](../../README.md)
