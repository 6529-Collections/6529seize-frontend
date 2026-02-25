# Profile Header Summary

## Overview

The profile header appears at the top of every profile tab route and provides
identity context, quick stats links, and profile actions.

## Location in the Site

- All profile routes under `/{user}` and `/{user}/<tab>`

## Entry Points

- Open any profile tab route directly.
- Switch to any profile tab from the tab bar.

## User Journey

1. Open a profile route.
2. The app resolves the profile and normalizes the route to the canonical
   handle when needed.
3. The header renders profile identity details (banner, avatar, name/meta,
   about text when applicable).
4. Use quick stat links (`TDH`, `xTDH`, `NIC`, `Rep`, `Followers`) to move to
   related profile routes.
5. Use available actions (follow, direct message, edit controls) based on who
   is viewing the profile.

## Common Scenarios

- Display name priority is handle first, then display name, then wallet-based
  fallback text.
- The metadata row can show classification and `Profile enabled: <Month Year>`.
- About text appears when a bio statement exists; profile owners with edit
  access can still open About editing even without an existing statement.
- Viewing someone else's profile while signed in with a handle can show
  `Follow` and direct-message actions.
- Viewing your own profile with no active proxy context enables profile editing
  controls in the header.
- Submission/win artist badges appear when the profile has main-stage
  submissions or wins.

## Edge Cases

- If no handle exists or display text is emoji-based, the browser tab title can
  fall back to a shortened wallet identifier.
- Canonical-handle redirects preserve current tab path and existing query
  parameters.
- Stats-link rendering requires a route-safe handle or wallet segment.

## Failure and Recovery

- If header-side data requests fail, the profile page still loads:
  - About text can be missing until retry.
  - Profile-enabled date can be omitted.
  - Followers count can fall back to `0`.
- If direct-message creation fails, an error toast is shown and users can retry
  the action.
- If the profile cannot be resolved, users see the `USER OR PAGE` not-found
  screen.

## Limitations / Notes

- Header follower counts are load-time values and are not guaranteed to update
  live while staying on the same route.
- Profiles without stored banner colors can use fallback colors that vary across
  full page reloads.

## Related Pages

- [Profiles Index](README.md)
- [Profile Tabs](feature-profile-tabs.md)
- [Profile Navigation Flow](flow-profile-navigation.md)
- [Profile Tab Content](feature-profile-tab-content.md)
- [Profile Troubleshooting](troubleshooting-profile-pages.md)
