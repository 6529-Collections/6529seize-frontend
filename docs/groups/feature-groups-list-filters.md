# Groups List Filters

Parent: [Groups Index](README.md)

## Overview

`/network/groups` supports two list filters:

- `By Identity` for group creator identity.
- `By Group Name` for group name text.

Filters are written to the URL so filtered views can be refreshed or shared.

## Location in the Site

- Route: `/network/groups`
- Group-scope target from card activation: `/network?page=1&group={groupId}`
- Filter query parameters:
  - `identity={handle-or-wallet}`
  - `group={typed-group-name}`
- Pagination cursor used by infinite loading: `created_at_less_than={timestamp}`

## Entry Points

- Open `Network -> Groups` from the sidebar.
- Open `/network/groups` directly.
- Open a shared `/network/groups` URL that already includes filter params.

## User Journey

1. Open `/network/groups`.
2. (Optional) Use `By Identity` and select a profile suggestion.
3. (Optional) Type in `By Group Name`.
4. Review the updated card grid.
5. Use `My groups` to apply your own creator identity quickly.
6. Clear filters to return to a broader list.

## Common Scenarios

- Show groups by one creator identity.
- Narrow results by group-name text.
- Combine both filters for tighter results.
- Use `My groups` to jump to your own groups.

## Edge Cases

- Identity suggestions start after 3 typed characters.
- Typing identity text alone does not apply the identity filter until a
  suggestion is selected.
- Identity suggestions support keyboard controls: `ArrowUp`, `ArrowDown`,
  `Enter`, and `Escape`.
- Group-name updates are debounced, then written to `group` in the URL.
- When either filter changes, `created_at_less_than` is cleared and list
  pagination restarts.
- `My groups` appears when a connected profile or proxy context exists.
- In proxy context, `My groups` uses the proxy creator handle.
- `Create New` appears only for authenticated, non-proxy sessions.

## Failure and Recovery

- Identity lookup with no matches shows `No results`.
- Identity lookup with fewer than 3 characters shows `Type at least 3
  characters`.
- If filters return no groups, the grid stays empty until filters are changed
  or cleared.
- If a fetch fails, reload the page or change filters to trigger a fresh
  request.

## Limitations / Notes

- Identity search only queries profile owners.
- This page covers list filtering behavior; create/edit configuration is
  documented separately.
- List filters persist in URL state, but create/edit exit actions return to the
  base list route.

## Related Pages

- [Docs Home](../README.md)
- [Groups Index](README.md)
- [Group Card Keyboard Navigation and Actions](feature-group-card-keyboard-navigation-and-actions.md)
- [Group Creation and Edit Flow](feature-group-create-and-edit.md)
- [Groups List and Create Actions Troubleshooting](troubleshooting-groups-list-and-create-actions.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
