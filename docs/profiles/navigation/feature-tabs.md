# Profile Routes and Tab Visibility

## Overview

Profile tab routes live under `/{user}`.
`/{user}` is the default `Identity` tab (`Rep` + `NIC`).

## Supported Tab Routes

- `/{user}`: Identity
- `/{user}/brain`: Brain
- `/{user}/collected`: Collected
- `/{user}/xtdh`: xTDH (Beta label in the tab UI)
- `/{user}/subscriptions`: Subscriptions
- `/{user}/proxy`: Proxy

## Route Resolution (Supported Routes)

1. Open a profile route by handle or wallet.
2. The app loads the profile.
3. If the route uses a non-canonical handle, the app redirects to the canonical handle and keeps the tab route.
4. The header and tab bar render for that profile.

## Tab Visibility Rules

- `Brain` is shown only when Waves is enabled.
- `Subscriptions` is hidden on iOS unless consent country is `US`.
- `Proxy` is shown only when you are on your own profile (matched by connected handle or connected wallet).
- If you open `/{user}/proxy` while your signed-in profile session is still loading, the app keeps the `Proxy` tab selected until it can finish the ownership check.
- If the current tab route is hidden in the current context, the app replaces the URL with the first visible tab and keeps the current query string.

## Query-String Behavior

- Clicking a profile tab keeps only `?address=...` and drops other query keys.
- Canonical-handle redirects keep query params, remove `user`, and normalize repeated query keys into comma-separated values (for example `?x=a&x=b` becomes `?x=a,b`).

## Legacy and Unsupported Routes

- `/{user}/identity` redirects to `/{user}` and preserves query params.
- `/{user}/waves`, `/{user}/groups`, and `/{user}/followers` redirect to `/{user}` without query params.
- `/{user}/stats` is no longer a supported profile route and does not redirect.
- `/{user}/rep` is unsupported and does not redirect.
- `/{user}` values that end with probe-like suffixes (`.html`, `.htm`, `.php`, `.asp`, `.aspx`, `.jsp`) are treated as invalid profile slugs and show not-found.
- Unknown `/{user}/<subroute>` routes show not-found.
- Full legacy details: [Legacy Profile Route Redirects](feature-legacy-profile-route-redirects.md).

## Failure and Recovery

- Missing user or invalid profile route: [Route Error and Not-Found Screens](../../shared/feature-route-error-and-not-found.md)
- If profile loading fails with a transient error, reload the page.
- Replace saved `/{user}/stats` links with `/{user}/collected`.
- Replace saved `/{user}/rep` links with `/{user}` or another supported tab route.

## Related Pages

- [Profiles Index](../README.md)
- [Profiles Navigation Index](README.md)
- [Profile Navigation Flow](flow-navigation.md)
- [Profile Header Summary](feature-header-summary.md)
- [Legacy Profile Route Redirects](feature-legacy-profile-route-redirects.md)
- [Profile Identity Tab](../tabs/feature-identity-tab.md)
- [Profile Brain Tab](../tabs/feature-brain-tab.md)
- [Collected Tab, Stats Summary, and Transfer Mode](../tabs/feature-collected-tab.md)
- [Profile xTDH Tab](../tabs/feature-xtdh-tab.md)
- [Profile Subscriptions Tab](../tabs/feature-subscriptions-tab.md)
- [Profile Proxy Tab](../tabs/feature-proxy-tab.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
