# Groups List Filters

Parent: [Groups Index](README.md)

## Overview

`/network/groups` has two list filters:

- `By Identity` filters by group creator identity.
- `By Group Name` filters by group name text.

Filter state lives in the URL, so filtered views survive reload and can be
shared.

## Location in the Site

- Route: `/network/groups`
- Group-scope target from card activation: `/network?page=1&group={groupId}`
- Filter query parameters:
  - `identity={handle-or-wallet}`
  - `group={typed-group-name}`

## Entry Points

- Open `Network -> Groups` from the sidebar.
- Open `/network/groups` directly.
- Open a shared `/network/groups` URL with `identity` and/or `group`.

## User Journey

1. Open `/network/groups`.
2. (Optional) In `By Identity`, type at least 3 characters, then select a
   profile suggestion.
3. (Optional) Type in `By Group Name`.
4. (Optional) Use `My groups` to set the identity filter quickly.
5. Review the updated card grid.
6. Scroll to load more cards, open a card, or clear filters.

## Common Scenarios

- Show groups by one creator identity.
- Narrow results by group-name text.
- Combine both filters for tighter results.
- Use `My groups`, then add a group-name filter to narrow your own groups.
- Share a filtered URL with `identity` and/or `group` query params.

## Edge Cases

- Identity suggestions start after 3 typed characters.
- Typing identity text alone does not apply the identity filter until a
  suggestion is selected.
- Selected identity suggestions may write a wallet to `identity` even when the
  field displays a profile handle.
- Identity suggestions support keyboard controls: `ArrowUp`, `ArrowDown`,
  `Enter`, and `Escape`.
- Group-name changes update `group` in the URL; clearing the field removes the
  `group` query param.
- Clearing identity removes the `identity` query param.
- Changing either filter clears stale `created_at_less_than` from the URL and
  restarts list pagination from the first page.
- `My groups` appears for connected or proxy sessions.
- In proxy context, `My groups` uses the proxy creator handle; otherwise it
  uses your connected profile handle.
- `Create New` appears only for authenticated, non-proxy sessions.

## Failure and Recovery

- Identity lookup with 3+ characters and no matches shows `No results`.
- The list can show no cards when filters match nothing, or when the fetch
  fails.
- Group-list fetch errors do not show a dedicated inline error state.
- Recovery:
  1. Clear `identity` and `group`, then re-apply one filter at a time.
  2. Re-select identity from suggestions (typing alone does not apply it).
  3. Reload `/network/groups` to trigger a fresh fetch.

## Limitations / Notes

- Identity search only queries profile owners.
- Group-list requests are debounced briefly (~200ms) when filters change.
- Infinite loading requests the next page after the current list reaches the
  page-size threshold.
- This page covers list filtering behavior; create/edit configuration is
  documented separately.
- List filters persist in URL state, but create/edit exit actions return to the
  base list route.

## Related Pages

- [Docs Home](../README.md)
- [Groups Index](README.md)
- [Group Card Keyboard Navigation and Actions](feature-group-card-keyboard-navigation-and-actions.md)
- [Group Creation and Edit Flow](feature-group-create-and-edit.md)
- [Groups List, Create, and Network Scope Flow](flow-groups-list-create-and-network-scope.md)
- [Groups List and Create Actions Troubleshooting](troubleshooting-groups-list-and-create-actions.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
