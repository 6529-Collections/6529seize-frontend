# Profile Tabs

## Overview

User profiles are tabbed pages under `/{user}`. Each tab has a stable URL, so
users can deep-link to a specific profile section.

## Location in the Site

- Profile root: `/{user}`
- Tab routes:
  - `/{user}` (Brain)
  - `/{user}/identity`
  - `/{user}/collected`
  - `/{user}/xtdh` (Beta)
  - `/{user}/stats`
  - `/{user}/subscriptions`
  - `/{user}/proxy`
  - `/{user}/groups`
  - `/{user}/waves`
  - `/{user}/followers`

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

- Visiting `/{user}` opens the Brain feed for that profile.
- Visiting `/{user}/identity` opens the Identity view directly.
- Visiting `/{user}/stats` opens Stats directly.
- Visiting with `?address=<wallet>` keeps that wallet filter when switching tabs.
- Visiting by wallet or old handle can redirect to the canonical handle URL.
- Browser-tab titles fall back to a shortened wallet identifier when no handle
  is available or display text is emoji-only.

## Edge Cases

- `Brain` and `Waves` tabs are hidden when the Waves feature is disabled.
- `Subscriptions` is hidden on iOS when the country is not `US`.
- If a user lands on a tab that is currently hidden, the app redirects to the
  first visible tab for that profile.
- Canonical-handle redirects keep existing query parameters.

## Failure and Recovery

- If the profile or route is not found, users see the `USER OR PAGE` not-found
  screen.
- If profile loading fails for a non-404 reason, users may see a generic app
  error state. Reloading the page retries the request.

## Limitations / Notes

- Tab availability can change by device and feature context.
- `/{user}` only resolves the Brain tab when Waves is currently visible in the
  tab set.
- Tab links preserve the `address` query parameter but may drop unrelated query
  parameters.
- The `xTDH` tab is labeled Beta.

## Related Pages

- [Profiles Index](README.md)
- [Profile Header Summary](feature-profile-header-summary.md)
- [Profile Brain Tab](feature-profile-brain-tab.md)
- [Profile Identity Statements](feature-profile-identity-statements.md)
- [Profile Tab Content](feature-profile-tab-content.md)
- [Profile Stats Tab](feature-profile-stats-tab.md)
- [Profile Subscriptions Tab](feature-profile-subscriptions-tab.md)
- [Profile Navigation Flow](flow-profile-navigation.md)
- [Profile Troubleshooting](troubleshooting-profile-pages.md)
