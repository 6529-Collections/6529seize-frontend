# Group Card Keyboard Navigation and Actions

Parent: [Groups Index](README.md)

## Overview

Group cards on `/network/groups` open one group-scoped network view.

Signed-in users can run bulk credit actions (`Rep all`, `NIC all`).
Signed-in non-proxy users also get a card options menu with `Edit`/`Clone`,
and creator-only `Delete`.

## Location in the Site

- Groups list route: `/network/groups`
- Card open target: `/network?page=1&group={groupId}`
- Card menu edit/clone target: `/network/groups?edit={groupId}`
- Seize group links rendered in wave/drop chat: `/network?group={groupId}`

## Entry Points

- Open `Network -> Groups`.
- Open `/network/groups` directly.
- Open a seize group link in wave/drop chat content.

## Card Navigation

1. Focus a card in `/network/groups`.
2. Press `Enter` or `Space`, or click the card surface.
3. The app opens `/network?page=1&group={groupId}`.
4. Creator handle links open the creator profile.

In chat link previews, card-surface navigation is unavailable until group data
loads.

## Card Actions

- Signed-in users see `Rep all` and `NIC all`.
- Signed-in non-proxy users see an options menu with `Edit` or `Clone`.
- `Delete` appears only when the signed-in handle matches the group creator.
- Config rows can overflow horizontally; left/right scroll controls appear when
  needed.

## Vote-All State Rules

- Only one card can run `Rep all` or `NIC all` at a time.
- While one card is in vote-all mode:
  - That card leaves idle view, so card-surface navigation is not shown.
  - Other cards keep card-surface navigation.
  - Other cards disable `Rep all`/`NIC all`.
- `Rep all` needs both amount and category.
- `NIC all` needs an amount.
- If the session becomes signed out, vote-all exits and the card returns to
  idle.

## Failure and Recovery

- Delete auth cancelled: no delete is applied.
- Delete API failure: error toast is shown; the card stays in the list.
- Delete success: `Group deleted.` toast is shown and group queries refresh.
- Bulk rate auth cancelled: no credits are sent; retry from the same panel.
- Bulk rate failure while running: error toast is shown; panel closes and card
  returns to idle.
- Bulk rate success: `Rep distributed.` or `NIC distributed.` toast is shown;
  panel closes.
- `Cancel` in vote-all returns the card to idle.

## Limitations / Notes

- Card-surface navigation always opens `/network?page=1&group={groupId}`.
- Group scope is single-target from each card open action.
- This page covers card behavior only, not full create/edit configuration.

## Related Pages

- [Docs Home](../README.md)
- [Groups Index](README.md)
- [Groups List Filters](feature-groups-list-filters.md)
- [Group Creation and Edit Flow](feature-group-create-and-edit.md)
- [Groups List, Create, and Network Scope Flow](flow-groups-list-create-and-network-scope.md)
- [Groups List and Create Actions Troubleshooting](troubleshooting-groups-list-and-create-actions.md)
- [Network Group Scope Flow](../network/flow-network-group-scope.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Internal Link Navigation](../navigation/feature-internal-link-navigation.md)
