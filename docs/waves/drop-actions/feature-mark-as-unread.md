# Wave Drop Mark as Unread

## Overview

Wave drops include a `Mark as unread` action so readers can manually reset where
their unread boundary sits in a thread.

The action is available in:

- Desktop `More` menu on the drop action row.
- Touch action sheet opened from long-press (small touch layouts) or the drop
  header action button (touch medium+ layouts).

## Location in the Site

- `/waves/{waveId}`
- `/messages?wave={waveId}`
- Drop action menus for full drop cards.

## Entry Points

- Open a wave or direct-message thread.
- Locate a drop that is not authored by you.
- Open the drop action menu and select `Mark as unread`.

## User Journey

1. Open a thread and find a drop from another author.
2. Open the drop action menu.
3. Select `Mark as unread`.
4. The action shows a loading spinner while the request is in flight.
5. On success:
   - A toast confirms the action.
   - The thread unread divider updates to the server-reported first unread serial.
   - Existing wave unread counts are updated for both wave and direct-message lists.
6. The unread jump controls can now be used to return to that divider boundary.

## Common Scenarios

- Marking as unread is available only for drops not authored by you.
- The action is exposed through drop action menus, not as a standalone desktop
  row icon.
- The action remains available in both desktop and touch menu flows.
- Existing unread and divider context is replaced with the new boundary returned by
  the API.

## Edge Cases

- The action is hidden for drop authors to prevent self-mark operations.
- Menu-entry visual style differs by surface (desktop dropdown row vs touch
  full-width row) but triggers the same API action.
- If the action is already in progress, the control is disabled until the request
  resolves.

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
