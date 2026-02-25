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
- About area is visible when at least one of these is true:
  - a BIO statement is present in loaded profile data
  - the viewer can edit the profile, which keeps an empty About panel visible for
    adding content
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
  - Profile-enabled date can be omitted.
  - Followers count can fall back to `0`.
  - About text can reflect the latest successful data request; refresh the route
    to retry when expected details are missing.
- If direct-message creation fails, an error toast is shown and users can retry
  the action.
- If the profile cannot be resolved, users see the `USER OR PAGE` not-found
  screen:
  - [Route Error and Not-Found Screens](../../shared/feature-route-error-and-not-found.md).

## Limitations / Notes

- Header follower counts are load-time values and are not guaranteed to update
  live while staying on the same route.
- Profiles without stored banner colors can use fallback colors that vary across
  full page reloads.

## Related Pages

- [Profiles Index](../README.md)
- [Profile Picture Editing](feature-profile-picture-editing.md)
- [Profile Tabs](feature-tabs.md)
- [Profile Navigation Flow](flow-navigation.md)
- [Profile Tab Content](../tabs/feature-tab-content.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
