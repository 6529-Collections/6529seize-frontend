# Legacy Profile Route Redirects

## Overview

This page documents profile routes kept only for backward compatibility.
These routes redirect to the canonical profile root route.

## Location in the Site

- Legacy routes:
  - `/{user}/identity`
  - `/{user}/waves`
  - `/{user}/groups`
  - `/{user}/followers`
- Canonical destination:
  - `/{user}`

## Entry Points

- Open an old bookmark.
- Open a shared legacy profile link.

## User Journey

1. Open a legacy profile route.
2. The route redirects to `/{user}`.
3. The profile root loads and applies normal canonical-handle normalization.

## Common Scenarios

- `/{user}/identity` redirects permanently to `/{user}` and preserves query
  parameters.
- `/{user}/waves`, `/{user}/groups`, and `/{user}/followers` redirect to
  `/{user}` without preserving query parameters.
- Legacy links continue to reach the same profile, but not a separate tab.

## Edge Cases

- If `{user}` is missing in the route, the route returns not-found.
- If `{user}` is not canonical, the profile route can still apply a second
  redirect to the canonical handle.
- `/{user}/rep` is not a supported legacy alias and does not redirect.

## Failure and Recovery

- If the target profile cannot be resolved, users see the shared not-found
  screen:
  - [Route Error and Not-Found Screens](../../shared/feature-route-error-and-not-found.md)
- If you rely on an old URL for sharing, replace it with `/{user}` or a
  currently supported tab route.

## Related Pages

- [Profiles Index](../README.md)
- [Profile Tabs](feature-tabs.md)
- [Profile Navigation Flow](flow-navigation.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
