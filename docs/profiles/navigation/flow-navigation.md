# Profile Navigation Flow

## Overview

This flow covers how users move across profile tabs, how links stay shareable,
and what happens when the current route is not canonical.

## Location in the Site

- Starts anywhere under `/{user}`
- Uses the profile tab bar to move across profile sections

## Entry Points

- Paste a direct profile link in the browser.
- Open a shared profile URL from chat or another page.
- Click a tab from an already-open profile.

## User Journey

1. Open a URL like `/{user}/identity` or `/{user}/stats`.
2. If `{user}` is not the canonical handle, the app redirects to the canonical
   handle while keeping tab context and query parameters.
3. Use the tab bar to move between profile sections.
4. Share the resulting URL to return to the same tab later.

## Common Scenarios

- Open a user by wallet address, then continue browsing on the resolved handle.
- Keep the wallet address filter (`?address=...`) while switching tabs.
- Use profile-header quick stats: `NIC` and `Rep` both route to
  `/{user}/identity`.
- Rename your profile handle and continue on the same tab under the new handle
  URL.
- When a profile has no handle (or only emoji-style display text), the browser
  tab title uses a shortened wallet identifier so tabs stay readable.

## Edge Cases

- If a tab becomes unavailable (feature/device/country conditions), the app
  navigates to the first visible tab for that profile.
- Profile links preserve `address` when switching tabs, but not every other
  query parameter is guaranteed to carry over.
- During canonical-handle redirects, repeated query keys can be normalized into
  single comma-separated values.
- Unknown tab routes do not resolve to a profile tab page.
- Legacy `/{user}/rep` links are treated as unknown tab routes; the supported
  destination is `/{user}/identity`.
- Profiles without a handle (or with emoji-only display text) still render a
  user-specific browser title by falling back to a shortened wallet identifier.

## Failure and Recovery

- Missing users or invalid profile routes show the shared not-found screen:
  [Route Error and Not-Found Screens](../../shared/feature-route-error-and-not-found.md).
- If a redirect target cannot be resolved due to a transient error, reloading
  retries profile resolution.
- If a saved `/{user}/rep` URL fails, replace it with `/{user}/identity` and
  retry navigation.

## Limitations / Notes

- Visibility rules are evaluated at runtime, so the same profile can expose
  different tab sets on different devices or contexts.
- Deep links are stable for the supported tab routes listed in
  [Profile Tabs](feature-tabs.md).

## Related Pages

- [Profiles Index](../README.md)
- [Profile Header Summary](feature-header-summary.md)
- [Profile Tabs](feature-tabs.md)
- [Profile Identity Tab](../tabs/feature-identity-tab.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
