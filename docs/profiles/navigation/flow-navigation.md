# Profile Navigation Flow

## Overview

This flow explains how profile URLs under `/{user}` resolve, redirect, and stay
valid across tabs and contexts.

## Routes in Scope

- Supported routes:
  - `/{user}`
  - `/{user}/brain`
  - `/{user}/collected`
  - `/{user}/xtdh`
  - `/{user}/stats`
  - `/{user}/subscriptions`
  - `/{user}/proxy`
- Legacy aliases:
  - `/{user}/identity`
  - `/{user}/waves`
  - `/{user}/groups`
  - `/{user}/followers`

## Flow

1. Open a profile route, shared profile link, or profile stat shortcut.
2. If the URL is a legacy alias:
   - `/{user}/identity` permanently redirects to `/{user}` and keeps query parameters.
   - `/{user}/waves`, `/{user}/groups`, and `/{user}/followers` redirect to `/{user}` and drop query parameters.
3. The app resolves the profile. If `{user}` is not the canonical handle, it redirects to the canonical handle and keeps the current tab route.
4. During canonical-handle redirect, repeated query keys can be normalized into one comma-separated value per key.
5. Tab visibility is resolved from current context:
   - `Brain` only when Waves is enabled.
   - `Subscriptions` hidden on iOS when consent country is not `US`.
   - `Proxy` only on your own profile.
6. If the current tab is hidden, the app replaces the URL with the first visible tab and keeps the full query string.
7. When you click a profile tab, the URL keeps only `?address=...` and drops other query keys.

## Route Outcomes

- Profile stat shortcuts:
  - `TDH` -> `/{user}/collected`
  - `xTDH` -> `/{user}/xtdh`
  - `NIC` and `Rep` -> `/{user}`
  - `Followers` opens a modal and does not change route
- Renaming your handle keeps you on the same tab path under the new handle URL.
- Unknown `/{user}/<subroute>` paths (including `/{user}/rep`) do not resolve to a tab route.
- Missing users and unsupported subroutes show the shared not-found screen.

## Recovery

- Replace saved `/{user}/rep` links with `/{user}` or another supported tab route.
- If profile loading or redirects fail unexpectedly, refresh and retry.
- If a profile URL returns not-found, verify handle/wallet and subroute:
  [Route Error and Not-Found Screens](../../shared/feature-route-error-and-not-found.md).

## Related Pages

- [Profiles Index](../README.md)
- [Profiles Navigation Index](README.md)
- [Profile Header Summary](feature-header-summary.md)
- [Profile Routes and Tab Visibility](feature-tabs.md)
- [Legacy Profile Route Redirects](feature-legacy-profile-route-redirects.md)
- [Profile Identity Tab](../tabs/feature-identity-tab.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
