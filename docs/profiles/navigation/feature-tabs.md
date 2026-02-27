# Profile Routes and Tab Visibility

## Overview

Profiles use tab routes under `/{user}`.
`/{user}` is the default `Identity` tab (`Rep` + `NIC`).

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
- Click profile tabs in the header area.
- Open a shared deep link for a tab route.

## User Journey

1. Open a profile URL.
2. The app loads the profile and normalizes the URL to the canonical handle when needed.
3. The profile header and tab bar render.
4. If the current tab is hidden in the current context, the app moves to the first visible tab.
5. Switch tabs or share the current URL.

## Common Scenarios

- `/{user}` opens the Identity tab (`Rep` + `NIC`).
- `/{user}/stats` opens Stats directly.
- Visiting by wallet or non-canonical handle redirects to canonical handle URL.
- Tab clicks preserve only `?address=...` from the query string.
- Canonical-handle redirects keep query params, but repeated keys are normalized into comma-separated values.

## Edge Cases

- `Brain` is hidden when Waves is disabled.
- `Subscriptions` is hidden on iOS when country is not `US`.
- `Proxy` is hidden when viewing another profile.
- If a user opens a hidden tab route, the app redirects to the first visible tab.
- Unknown tab routes return not-found.
- Legacy aliases `/{user}/identity`, `/{user}/waves`, `/{user}/groups`, and
  `/{user}/followers` redirect to `/{user}`:
  [Legacy Profile Route Redirects](feature-legacy-profile-route-redirects.md).
- `/{user}/rep` is unsupported and should be replaced with `/{user}`.

## Failure and Recovery

- If the profile or route is not found, users see the shared not-found surface:
  - [Route Error and Not-Found Screens](../../shared/feature-route-error-and-not-found.md)
- If profile loading fails for a non-404 reason, reload the route to retry.

## Limitations / Notes

- Tab availability changes by device and context.
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
