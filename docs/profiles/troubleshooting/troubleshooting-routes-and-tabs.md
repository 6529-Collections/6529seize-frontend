# Profile Troubleshooting

## Overview

Use this page when a profile does not load as expected, a tab is missing, or a
profile link lands somewhere unexpected.

## Location in the Site

- All profile routes under `/{user}` and `/{user}/<tab>`

## Entry Points

- A profile URL returns a not-found page.
- A visible tab in one session is missing in another.
- A direct tab URL redirects to a different tab or profile URL.

## User Journey

1. Confirm the URL is one of the supported profile routes.
2. Confirm the profile handle or wallet is valid.
3. Check whether tab visibility rules apply to your device/context.
4. Retry after refresh if loading failed unexpectedly.

## Common Scenarios

- `USER OR PAGE` appears:
  - The user handle/wallet does not resolve.
  - The tab path is unsupported.
- This is the shared not-found surface:
  - [Route Error and Not-Found Screens](../../shared/feature-route-error-and-not-found.md)
- Legacy `/{user}/identity`, `/{user}/waves`, `/{user}/groups`, or
  `/{user}/followers` links land on `/{user}`:
  - these are redirect aliases, not dedicated tab routes
  - see [Legacy Profile Route Redirects](../navigation/feature-legacy-profile-route-redirects.md)
- Legacy `/{user}/rep` links return not-found:
  - the separate `rep` route is not supported
  - use `/{user}` for combined Rep and NIC behavior
- Tab missing:
  - `Brain` is hidden when Waves is disabled.
  - `Subscriptions` is hidden on iOS outside the US.
  - `Proxy` is shown only on your own profile.
- Identity tab content differs by screen size:
  - mobile starts with the rep subview
  - switch to the `NIC` score card to reach statements and NIC actions
- Followers quick stat does not open a route:
  - it opens an in-page modal list
- Stats view shows mostly `-` values or empty activity panels:
  - The selected wallet has no activity/holdings for those rows.
  - Stats API requests failed and the UI fell back to empty placeholders.
- Brain tab shows `No Drops to show`:
  - The profile has no drops yet.
  - The drops request failed and the tab fell back to the same empty state.
- Subscriptions controls are disabled:
  - You are viewing another profile.
- Subscriptions tab content is blank:
  - A profile proxy context is active.
- Top-up submit fails immediately:
  - No active wallet connection is available for signing/sending.
  - No valid top-up option is currently selected.
- Redirected to a different handle:
  - The app normalized the URL to the profile's canonical handle.
- Header shows `0 Followers` unexpectedly:
  - Followers summary data failed to load on route render.
  - Refreshing can repopulate the header count.
- Header does not show `Profile enabled: ...`:
  - Profile-created activity logs were unavailable for that route load.
  - Refreshing can restore the date label when logs are reachable.

## Edge Cases

- Entering a profile by wallet can redirect to handle-based URLs.
- Entering a hidden-tab URL can redirect to the first visible tab.
- Entering `/{user}/subscriptions` on iOS outside the US redirects to the
  first visible profile tab.
- Entering `/{user}/proxy` on another user's profile redirects to `/{user}`.
- Entering `/{user}/identity` keeps query parameters while redirecting to
  `/{user}`.
- Entering `/{user}/waves`, `/{user}/groups`, or `/{user}/followers` redirects
  to `/{user}` without preserving query parameters.
- Entering `/{user}/rep` is treated as an unsupported profile route.
- Tab links preserve `address` and drop other query parameters.
- In `Subscriptions`, first upcoming-drop controls can be disabled on minting
  day.

## Failure and Recovery

- Not found state: verify the handle/wallet and tab path, then retry.
- Generic load failure: refresh the page to retry the profile request.
- Brain tab:
  - If drop loading fails, refresh to retry the feed request.
  - If pagination stalls while scrolling, refresh to resume loading older drops.
- Stats tab:
  - `No transactions`, `No distributions found`, or `No TDH history found`
    indicates no data for the current filters or a failed fetch; refresh and
    retry.
- Header summary data:
  - If followers count or profile-enabled date looks stale or incomplete, refresh
    the route to retry header-side data requests.
  - If About text is missing on a profile you cannot edit, verify the profile has
    a BIO statement and refresh the route if a recent profile update should be
    visible.
- Identity tab:
  - If `/{user}/rep` bookmarks fail, replace them with `/{user}`.
  - If statements or NIC actions are not visible on mobile, switch from the rep
    card to the `NIC` card inside the tab.
- Subscriptions tab:
  - If a save action fails, settings remain unchanged and an error toast is
    shown; re-authenticate and retry.
  - If top-up returns a wallet-connection error, reconnect wallet and retry the
    send action.
- If behavior differs by device, test on a non-iOS device and with a US country
  context to confirm visibility-rule impact.

## Limitations / Notes

- Tab visibility is context-dependent and not identical across all users.
- `xTDH` is marked Beta and may evolve separately from other tabs.

## Related Pages

- [Profiles Index](../README.md)
- [Profile Header Summary](../navigation/feature-header-summary.md)
- [Profile Brain Tab](../tabs/feature-brain-tab.md)
- [Profile Routes and Tab Visibility](../navigation/feature-tabs.md)
- [Legacy Profile Route Redirects](../navigation/feature-legacy-profile-route-redirects.md)
- [Profile Identity Tab](../tabs/feature-identity-tab.md)
- [Profile Navigation Flow](../navigation/flow-navigation.md)
