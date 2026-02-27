# Profile Tabs

## Overview

Profiles use tab routes under `/{user}`.
`Identity` (`Rep` + `NIC`) is the default tab and canonical profile route.

## Location in the Site

- Profile root and default tab:
  - `/{user}` (`Identity`)
- Additional tab routes:
  - `/{user}/brain`
  - `/{user}/collected`
  - `/{user}/xtdh` (Beta)
  - `/{user}/stats`
  - `/{user}/subscriptions`
  - `/{user}/proxy`

## Entry Points

- Open a profile URL directly by handle or wallet.
- Click tabs in the profile header area.
- Open a shared deep link that includes a tab route.

## User Journey

1. User opens a profile URL.
2. The app loads the profile and resolves redirects when needed.
3. The profile header and tab bar are shown.
4. User switches tabs or shares the current tab URL.

## Common Scenarios

- Visiting `/{user}` opens the Identity tab (`Rep` + `NIC`).
- Visiting `/{user}/brain` opens the Brain feed when Waves are enabled.
- Visiting `/{user}/stats` opens Stats directly.
- Visiting with `?address=<wallet>` keeps that wallet filter when switching tabs.
- Visiting by wallet or old handle can redirect to the canonical handle URL.
- Browser-tab titles fall back to a shortened wallet identifier when no handle
  is available or display text is emoji-only.

## Edge Cases

- `Brain` is hidden when Waves are disabled.
- `Subscriptions` is hidden on iOS when the country is not `US`.
- `Proxy` is hidden when viewing another profile.
- If a user lands on a tab that is currently hidden, the app redirects to the
  first visible tab for that profile.
- Canonical-handle redirects keep existing query parameters.
- Profile tab links preserve only `address` from the query string.
- Legacy aliases `/{user}/identity`, `/{user}/waves`, `/{user}/groups`, and
  `/{user}/followers` redirect to `/{user}`:
  [Legacy Profile Route Redirects](feature-legacy-profile-route-redirects.md).
- Legacy `/{user}/rep` links are unsupported and should be updated to `/{user}`.

## Failure and Recovery

- If the profile or route is not found, users see the shared not-found surface:
  - [Route Error and Not-Found Screens](../../shared/feature-route-error-and-not-found.md)
- If profile loading fails for a non-404 reason, users may see a shared app
  error state. Reloading the route retries the request.

## Limitations / Notes

- Tab availability can change by device and feature context.
- Profile quick stats for both `NIC` and `Rep` land on `/{user}`.
- The `xTDH` tab is labeled Beta.

## Related Pages

- [Profiles Index](../README.md)
- [Profile Header Summary](feature-header-summary.md)
- [Legacy Profile Route Redirects](feature-legacy-profile-route-redirects.md)
- [Profile Brain Tab](../tabs/feature-brain-tab.md)
- [Profile Identity Tab](../tabs/feature-identity-tab.md)
- [Profile Identity Statements](../tabs/feature-identity-statements.md)
- [Profile Stats Tab](../tabs/feature-stats-tab.md)
- [Profile Subscriptions Tab](../tabs/feature-subscriptions-tab.md)
- [Profile Navigation Flow](flow-navigation.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
- [Route Error and Not-Found Screens](../../shared/feature-route-error-and-not-found.md)
