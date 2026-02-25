# Profile Header Summary

## Overview

The profile header appears at the top of every profile tab route and provides
identity context, cover/avatar visuals, quick stats links, submission/winning
activity visibility, and profile actions.

## Location in the Site

- All profile routes under `/{user}` and `/{user}/<tab>`

## Entry Points

- Open any profile tab route directly.
- Switch to any profile tab from the tab bar.
- Open profile pages from links outside the profile section.
- Click the artist activity badge when it appears.

## User Journey

1. Open a profile route.
2. The app resolves the profile and normalizes the route to the canonical
   handle when needed.
3. The header renders profile identity details:
   - cover image or gradient
   - avatar
   - name and metadata
   - About text when applicable
4. Use quick stat links (`TDH`, `xTDH`, `NIC`, `Rep`, `Followers`) to move to
   related profile routes:
   - `TDH` -> `/{user}/collected`
   - `xTDH` -> `/{user}/xtdh`
   - `NIC` and `Rep` -> `/{user}/identity`
   - `Followers` -> `/{user}/followers`
5. If the profile has main-stage activity, an artist activity badge appears next
   to the name line:
   - palette style for active submissions
   - trophy style for winning artworks
   - trophy with accent marker when both are present
6. Open the Artist Activity modal from the badge.
7. Use available actions (follow, direct message, edit controls) based on who is
   viewing the profile.

## Common Scenarios

- Display name priority is handle first, then display name, then wallet-based
  fallback text.
- The metadata row can show:
  - classification
  - `Profile enabled: <Month Year>` when available
- About area is visible when at least one of these is true:
  - a BIO statement is present in loaded profile data
  - the viewer can edit the profile, which keeps an empty About panel visible for
    adding content
- Long About statements collapse to six lines and show `See more`/`See less`
  on mobile screens.
- On desktop, About content is shown in full.
- The banner editor supports Gradient and Image modes for your own editable
  profile.
- Viewing someone else's profile while signed in with a handle can show `Follow`
  and direct-message actions.
- Viewing your own profile with no active proxy context enables profile editing
  controls in the header.
- The `NIC` and `Rep` quick stat links both route to the same combined identity
  tab (`/{user}/identity`).
- The artist activity badge appears only when at least one of these is true:
  - `active_main_stage_submission_ids` is non-empty
  - `winner_main_stage_drop_ids` is non-empty
- If one count type exists, the modal opens that view first; if both exist, it
  opens `Active Submissions` by default.
- On desktop and mouse-based devices, a tooltip shows the current submission and
  win totals for the badge.

## Edge Cases

- If no handle exists or display text is emoji-based, the browser tab title can
  fall back to a shortened wallet identifier.
- Canonical-handle redirects preserve current tab path and existing query
  parameters.
- Stats-link rendering requires a route-safe handle or wallet segment.
- The profile can show only a gradient background when no banner image is stored.
- Profiles without stored banner colors still use a random fallback gradient pair.

## Failure and Recovery

- If header-side data requests fail, the profile page still loads:
  - Profile-enabled date can be omitted.
  - About text can reflect the latest successful data request; refresh the route
    to retry when expected details are missing.
  - Followers count can fall back to `0`.
- If direct-message creation fails, an error toast is shown and users can retry
  the action.
- If the artist activity modal fails to surface available items, users can reopen
  it to retry.
- If the profile cannot be resolved, users see the `USER OR PAGE` not-found
  screen:
  - [Route Error and Not-Found Screens](../../shared/feature-route-error-and-not-found.md).

## Limitations / Notes

- Header follower counts are load-time values and are not guaranteed to update
  live while staying on the same route.
- Artist activity badges are derived from loaded profile payload fields and are
  not shown if payload values are missing.

## Related Pages

- [Profiles Index](../README.md)
- [Profile Picture Editing](feature-profile-picture-editing.md)
- [Profile Banner Editing](feature-banner-editing.md)
- [Profile Tabs](feature-tabs.md)
- [Profile Identity Tab](../tabs/feature-identity-tab.md)
- [Profile Navigation Flow](flow-navigation.md)
- [Profile Tab Content](../tabs/feature-tab-content.md)
- [Wave Drop Artist Preview Modal](../../waves/drop-actions/feature-artist-preview-modal.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
