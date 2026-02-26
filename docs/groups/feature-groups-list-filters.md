# Groups List Filters

Parent: [Groups Index](README.md)

## Overview

The `/network/groups` list provides filter controls for narrowing visible groups
by creator identity and group name.

The page keeps filters in the URL (`identity` and `group`) so filtered views can
be refreshed and shared.

## Location in the Site

- Primary list route: `/network/groups`.
- Group detail target from each card: `/network?page=1&group={groupId}`.
- Filter query params on the list route:
  - `identity={handle-or-wallet}`
  - `group={typed-group-name}`

## Entry Points

- Open `Network -> Groups` from the sidebar.
- Open `/network/groups` directly.
- Open a shared link that already contains `identity` and/or `group`.

## User Journey

1. Open `/network/groups`.
2. (Optional) Use `By Identity` to search and select a profile identity.
3. (Optional) Type into `By Group Name`.
4. Review the refreshed card list.
5. Use `My groups` to apply your own creator identity quickly when available.
6. Clear either filter with its clear control to return to a broader list.

## Common Scenarios

- Filter to groups created by a specific identity using `By Identity`.
- Type part of a group name to narrow the list by name.
- Combine identity and group-name filters to narrow results further.
- Use `My groups` when signed in to jump to groups created by your active
  account context.

## Edge Cases

- `By Identity` suggestions open only after at least 3 typed characters.
- Typing in `By Identity` alone does not apply a creator filter until a
  suggestion is selected.
- When `By Group Name` or `By Identity` changes, the list restarts from newest
  results and the `created_at_less_than` cursor parameter is removed.
- `My groups` is shown only when a connected account or proxy context exists.
- In proxy context, `My groups` uses the proxy creator handle.

## Failure and Recovery

- If identity lookup has no matches, users see `No results`.
- If fewer than 3 characters are typed in identity search, users see
  `Type at least 3 characters`.
- If filtered results contain no groups, the grid renders without cards and
  users can recover by clearing or changing filters.
- If data loading fails, users can retry by adjusting filters or reloading the
  page.

## Limitations / Notes

- Group-name filtering updates the URL while typing and applies data requests
  with a short debounce.
- The identity picker searches profile owners and applies the selected identity
  value as the filter key.
- `Create New` is not available while operating through a proxy profile.

## Related Pages

- [Docs Home](../README.md)
- [Groups Index](README.md)
- [Group Card Keyboard Navigation and Actions](feature-group-card-keyboard-navigation-and-actions.md)
- [Group Creation and Edit Flow](feature-group-create-and-edit.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
