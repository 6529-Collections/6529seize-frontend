# Profile Proxy Tab

## Overview

The `Proxy` tab lists proxy relationships for the profile and lets a profile owner
assign and manage active proxy actions. It includes both `Received` and `Granted`
proxy lists in one surface.

## Location in the Site

- Route: `/{user}/proxy`
- Parent profile: `/{user}`

## Entry Points

- Open `/{user}/proxy` directly.
- Switch to `Proxy` from any profile tab.
- Open a shared profile link that lands on the proxy tab.

## User Journey

1. Open the profile proxy route.
2. Read the top action filter:
   - `All` (default), `Received`, `Granted`.
3. Use `Assign Proxy` to create a new proxy relationship for your own profile.
4. Search a target profile and choose one result.
5. Create proxy actions for that target and return to the list.

## Common Scenarios

- View granted proxies created by the profile and received proxies assigned to the
  profile.
- Show only one side with `Received` or `Granted`.
- Add proxy actions in one of the available action types:
  - Allocate Rep
  - Allocate NIC
  - Create Wave
  - Read Wave
  - Create Drop to Wave
  - Rate Wave Drop
- Configure action expiration and save a non-expiring action.
- Edit existing action credit and expiration values from action rows.
- Accept/reject proxy invitations on the received side.

## Edge Cases

- `Assign Proxy` is hidden unless viewing your own connected profile and no
  proxy profile is active.
- You can add a proxy only to another profile owner and not to yourself.
- For non-owners, the list shows only currently active proxy actions.
- Action rows are grouped by grantor/receiver status and can show `Accepted`,
  `Pending`, `Rejected`, `Active`, or `Revoked`.

## Failure and Recovery

- If proxy target search returns no results, the target combobox stays empty until a
  new query.
- If a target search query is too short (`< 3` characters), no search request is
  sent.
- If a create/edit mutation fails, a toast error is shown and form values remain
  available for retry.
- Accept/reject failures require re-authentication or retry.

## Limitations / Notes

- Action creation and row management are tied to the connected signer state.
- Some controls are owner-only, including `Assign Proxy`, action management, and
  action creation.
- Proxy tabs are unaffected by the profile route query string, and list filters are
  local.

## Related Pages

- [Profiles Index](../README.md)
- [Profile Tab Content](feature-tab-content.md)
- [Profile Tabs](../navigation/feature-tabs.md)
- [Profile Navigation Flow](../navigation/flow-navigation.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
