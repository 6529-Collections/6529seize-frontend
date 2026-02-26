# Group Card Keyboard Navigation and Actions

Parent: [Groups Index](README.md)

## Overview

Group cards on `/network/groups` are keyboard-accessible navigation surfaces
with nested actions for creator navigation, bulk rating, and group management.

Card activation opens the network view scoped to that group:
`/network?page=1&group={groupId}`.

## Location in the Site

- Groups list route: `/network/groups`
- Group-scope target route: `/network?page=1&group={groupId}`
- Group card previews in seize-link chat messages

## Entry Points

- Open `Network -> Groups`.
- Open `/network/groups` directly.
- Open a message containing a seize link that renders a group card preview.

## User Journey

1. Move focus to a card in `/network/groups`.
2. Open the card with `Enter`, `Space`, or click on card surface.
3. The app navigates to `/network?page=1&group={groupId}`.
4. Use nested controls when needed:
   - Creator handle link
   - `Rep all` / `NIC all`
   - Config-row scroll arrows
   - Kebab options menu (`Edit`/`Clone`, and `Delete` when allowed)

## Common Scenarios

- Keyboard users open group-scoped network view without a mouse.
- Signed-in users distribute bulk Rep or NIC from one card.
- Owners open `Edit` or `Delete`; non-owners open `Clone`.
- Users inspect TDH/xTDH/grant/manual-list summary values in config rows.

## Edge Cases

- Only one card can be in `Rep all` or `NIC all` mode at a time.
- While vote-all mode is active on a card, card-level navigation is paused.
- Signed-out users do not see vote-all or edit/clone/delete actions.
- Proxy sessions hide edit/clone/delete actions, but vote-all remains
  available.
- In chat previews, card activation is unavailable until group data resolves.
- Config rows can overflow horizontally; left/right controls appear when
  needed.

## Failure and Recovery

- If route navigation fails, users stay on the current page and can retry card
  activation.
- If delete fails, an error toast is shown and the card remains.
- If delete succeeds, the card is removed from the list and active-group state
  is cleared when needed.
- If bulk rating fails mid-run, the action closes and users can retry from idle
  state.
- Users can cancel vote-all actions to return to normal card behavior.

## Limitations / Notes

- Card activation always targets `/network?page=1&group={groupId}`.
- Cards are single-target navigation elements, not multi-select controls.
- This page covers card behavior, not the full create/edit form.

## Related Pages

- [Docs Home](../README.md)
- [Groups Index](README.md)
- [Groups List Filters](feature-groups-list-filters.md)
- [Group Creation and Edit Flow](feature-group-create-and-edit.md)
- [Groups List and Create Actions Troubleshooting](troubleshooting-groups-list-and-create-actions.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Internal Link Navigation](../navigation/feature-internal-link-navigation.md)
