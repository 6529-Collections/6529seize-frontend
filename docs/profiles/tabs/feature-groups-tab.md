# Profile Groups Tab

## Overview

The `Groups` tab shows groups authored or associated with the profile owner and
reuses the core network group card experience for navigation, ownership actions,
and optional batch-rate flows.

## Location in the Site

- Route: `/{user}/groups`
- Parent profile: `/{user}`

## Entry Points

- Open `/{user}/groups` directly.
- Switch to `Groups` from any profile tab.
- Open a shared profile link that lands on the groups tab.

## User Journey

1. Open the groups tab and view the filtered group list for the profile.
2. Refine by `By Group Name`.
3. Open a group card to jump to the network group page.
4. If eligible, create a new group or open group actions from the card menu.

## Common Scenarios

- Viewing the owner’s authored groups:
  - the tab defaults `author_identity` to the profile handle.
- Search by group name.
- Viewing detailed group cards with creator and description metadata.
- Open group detail route:
  - `/network?page=1&group=<group-id>`.
- Card actions:
  - Edit own groups from the card menu.
  - Clone non-owned groups from the card menu.
  - Use batch rep/NIC rate controls exposed by the card when available.
- Creating a new group from profile scope.

## Edge Cases

- `Create New` is only shown for the current connected profile and not in proxy
  mode.
- Results are empty when the profile has no matching authored groups for the
  current filters.
- Group cards require profile identity data to show author controls.

## Failure and Recovery

- Empty results return an empty grid with no list items.
- If list loading fails, existing results keep previous state until the query
  request is retried.
- If create/edit flows fail after wallet auth, an inline toast error is shown.

## Limitations / Notes

- On this tab there is no dedicated `My groups` filter mode; the profile owner
  filter is fixed to the current profile.
- The `Create New` action navigates to:
  - `/network/groups?edit=new` (authenticated flow)
- Profile identity filters are applied as query state in the list component only.

## Related Pages

- [Profiles Index](../README.md)
- [Profile Tab Content](feature-tab-content.md)
- [Profile Tabs](../navigation/feature-tabs.md)
- [Network Groups](../../groups/README.md)
- [Profile Navigation Flow](../navigation/flow-navigation.md)
