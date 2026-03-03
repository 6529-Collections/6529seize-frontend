# Legacy Profile Route Redirects

## Overview

Old profile-tab URLs still resolve so existing links keep working.
Each supported legacy alias redirects to profile root: `/{user}`.

## Location in the Site

- Legacy aliases:
  - `/{user}/identity`
  - `/{user}/waves`
  - `/{user}/groups`
  - `/{user}/followers`
- Destination: `/{user}`

## Entry Points

- Open an old bookmark.
- Open a shared link that uses a removed profile-tab route.

## User Journey

1. Open a legacy profile route.
2. The route redirects to `/{user}`.
3. If `{user}` is not the canonical handle, profile routing may redirect again
   to the canonical handle route.
4. Profile loads on the Identity tab.

## Redirect Behavior by Route

| Legacy route | Redirect type | Query behavior | Result |
| --- | --- | --- | --- |
| `/{user}/identity` | Permanent | Preserved | Lands on `/{user}` |
| `/{user}/waves` | Temporary | Dropped | Lands on `/{user}` |
| `/{user}/groups` | Temporary | Dropped | Lands on `/{user}` |
| `/{user}/followers` | Temporary | Dropped | Lands on `/{user}` (not a followers tab) |

## Common Scenarios

- `/{user}/identity?tab=a&tab=b` first redirects to `/{user}?tab=a&tab=b`.
- `/{user}/waves?foo=bar`, `/{user}/groups?foo=bar`, and
  `/{user}/followers?foo=bar` redirect to `/{user}` without query parameters.
- If `{user}` is a wallet or non-canonical handle, the destination route can
  apply a second redirect to canonical handle.

## Edge Cases

- During the second canonical-handle redirect, repeated query keys can be
  normalized into comma-separated values.
- `/{user}/rep` is not a supported legacy alias and does not redirect.
- Unknown `/{user}/<subroute>` paths return not-found.

## Failure and Recovery

- If the target profile cannot be resolved, users see the shared not-found
  screen:
  - [Route Error and Not-Found Screens](../../shared/feature-route-error-and-not-found.md)
- Replace saved legacy links with `/{user}` or a supported tab route.

## Related Pages

- [Profiles Index](../README.md)
- [Profiles Navigation Index](README.md)
- [Profile Routes and Tab Visibility](feature-tabs.md)
- [Profile Navigation Flow](flow-navigation.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
