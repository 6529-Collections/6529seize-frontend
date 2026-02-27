# Profile Header Summary

## Overview

The profile header appears on profile routes under `/{user}` and shows:

- identity and profile metadata
- profile actions (edit, follow, direct message)
- quick stats links (`TDH`, `xTDH`, `NIC`, `Rep`, `Followers`)
- artist activity entry when available

## Location in the Site

- `/{user}`
- `/{user}/brain`
- `/{user}/collected`
- `/{user}/xtdh`
- `/{user}/stats`
- `/{user}/subscriptions`
- `/{user}/proxy`

## Entry Points

- Open a profile URL directly.
- Open a profile link from another area.
- Switch profile tabs.

## User Journey

1. Open a profile route.
2. If needed, the route redirects to the canonical handle and keeps the tab and
   query context.
3. The header renders:
   - banner (image or gradient fallback)
   - profile picture (image or gradient fallback)
   - title row (display name, CIC icon, level, optional artist badge)
   - metadata row (classification and `Profile enabled: <Month Year>` when data
     exists)
   - About panel (when a BIO exists, or when the viewer can edit)
   - stats row (`TDH`, `xTDH`, `NIC`, `Rep`, `Followers`)
4. Use quick stats:
   - `TDH` -> `/{user}/collected`
   - `xTDH` -> `/{user}/xtdh`
   - `NIC` and `Rep` -> `/{user}`
   - `Followers` -> opens the followers modal (no route change)
5. If artist activity exists, a badge appears:
   - palette icon: active submissions only
   - trophy icon: winning artworks only
   - trophy icon plus blue dot: both
6. Click the artist badge to open Artist Activity:
   - active-only: opens `Active Submissions`
   - winners-only: opens `Winning Artworks`
   - both: opens `Active Submissions` first
7. Actions depend on viewer context:
   - own profile with handle and no active proxy: edit banner, profile picture,
     name, classification, and About
   - other profile, signed-in viewer with handle, and target profile with
     handle: follow button
   - after follow, if target has a primary wallet: direct-message button

## Common Scenarios

- Display name fallback order: `handle` -> `display` -> primary wallet -> route
  value.
- Long About text (`>240` chars) is clamped on mobile with `See more` /
  `See less`; desktop stays expanded.
- `Followers` opens a modal list; it does not navigate to a followers tab.
- On non-touch desktop devices, the artist badge shows a tooltip with activity
  counts.

## Edge Cases

- Quick stats links render only when the resolved route segment is route-safe
  (`a-z`, `A-Z`, `0-9`, `.`, `_`, `-`).
- If no banner image is set, the header uses a gradient banner.
- If banner colors are missing, random fallback colors are used.
- If both artist counts are `0` or missing, no artist badge is shown.

## Failure and Recovery

- If header-side fetches fail (BIO statement, profile-enabled date, followers
  count), the profile route still loads and missing header fields are omitted.
- Followers count falls back to `0` if the count request fails.
- If direct-message creation fails, users get an error toast and can retry.
- If profile header edits fail, users get a toast or inline error and can retry.
- If the profile cannot be resolved, users see the shared not-found screen:
  - [Route Error and Not-Found Screens](../../shared/feature-route-error-and-not-found.md).

## Limitations / Notes

- Followers count in the header is a load-time snapshot.
- Direct-message action requires existing follow state and a target primary
  wallet.
- Artist badge and modal tabs depend on loaded
  `active_main_stage_submission_ids` and `winner_main_stage_drop_ids`.

## Related Pages

- [Profiles Index](../README.md)
- [Profiles Navigation Index](README.md)
- [Profile Routes and Tab Visibility](feature-tabs.md)
- [Legacy Profile Route Redirects](feature-legacy-profile-route-redirects.md)
- [Profile Banner Editing](feature-banner-editing.md)
- [Profile Picture Editing](feature-profile-picture-editing.md)
- [Profile Identity Tab](../tabs/feature-identity-tab.md)
- [Profile Navigation Flow](flow-navigation.md)
- [Wave Drop Artist Preview Modal](../../waves/drop-actions/feature-artist-preview-modal.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
