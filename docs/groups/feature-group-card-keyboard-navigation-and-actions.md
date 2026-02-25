# Group Card Keyboard Navigation and Actions

Parent: [Groups Index](README.md)

## Overview

Group cards on `/network/groups` use keyboard-accessible card activation while
keeping nested controls independently interactive.

Card-level activation opens the selected group on the network identity view:
`/network?page=1&group={groupId}`.

## Location in the Site

- Primary list route: `/network/groups`.
- Group-scoped identity target route: `/network?page=1&group={groupId}`.
- Group cards also appear in wave/chat seize-link previews.

## Entry Points

- Open `Network -> Groups` from the sidebar.
- Open `/network/groups` directly.
- Open a seize link that renders an inline group card preview.

## User Journey

1. Open `/network/groups`.
2. Move focus to a group card.
3. Activate the card with `Enter`, `Space`, or click on non-control card
   surface.
4. The app opens `/network?page=1&group={groupId}`.
5. Use nested controls when needed (creator profile link, `Rep all`, `NIC all`,
   config-row scroll controls, and options menu).
6. Open the options menu from the kebab button, then close it with outside
   click, `Escape`, or by selecting an action.

## Common Scenarios

- Keyboard-only users open group-scoped network view with `Enter` or `Space`.
- Users open the creator handle to navigate to the creator profile route.
- Signed-in users start group-wide vote actions with `Rep all` or `NIC all`.
- Users open the options menu for `Edit`/`Clone` (and delete when available).
- Screen-reader users get menu open/closed state from the options trigger.
- Users scroll long config rows with left/right controls.

## Edge Cases

- Card-level activation is available only when the card has a resolved group id.
- While a card is in `Rep all` or `NIC all` mode, card-level navigation is
  paused until returning to idle.
- Only one card can be active for vote-all at a time; other cards keep
  vote-all buttons disabled while another vote-all action is open.
- Signed-out sessions do not show vote-all or edit/clone actions in the groups
  list.
- Card action menus render above card content so menu items stay clickable in
  dense list layouts.

## Failure and Recovery

- If embedded preview card data is still loading, card-level activation stays
  unavailable until the group id resolves.
- If route navigation fails, users remain on the current page and can retry.
- If users open a vote-all action by mistake, they can cancel and return to
  idle card behavior.

## Limitations / Notes

- Card activation always targets page 1 of `/network` with the `group` filter.
- Group cards are single-target navigation surfaces; they do not multi-select
  multiple groups.
- This page covers card interaction behavior, not full group creation/edit form
  field documentation.

## Related Pages

- [Docs Home](../README.md)
- [Groups Index](README.md)
- [Groups List Filters](feature-groups-list-filters.md)
- [Group Creation and Edit Flow](feature-group-create-and-edit.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Internal Link Navigation](../navigation/feature-internal-link-navigation.md)
