# Profile Brain Tab

## Overview

The `Brain` tab shows a profile's drop feed, including replies.
Clicking a drop body or quote preview opens that thread in Waves or Messages.

## Location in the Site

- Route: `/{user}/brain`
- Tab visibility: `Brain` is shown only when Waves is available for the current
  viewer context.

## Entry Points

- Open `/{user}/brain` directly.
- Switch to `Brain` from another profile tab.
- Follow a shared Brain-tab URL.

## User Journey

1. Open `/{user}/brain`.
2. Profile route resolution runs first (canonical-handle redirects and
   not-found behavior follow shared profile route rules).
3. If `Brain` is visible and the route resolves to a profile handle, the tab
   loads the first drop page.
4. Select a drop or quote preview to open its thread:
   - public wave drop: `/waves/{waveId}?serialNo={serialNo}`
   - direct-message drop: `/messages?wave={waveId}&serialNo={serialNo}`
5. Scroll to load older drops.

## Common Scenarios

- Visit someone else's profile Brain tab to read latest drops.
- Visit your own profile Brain tab to review recent drops.
- Initial load shows `Loading drops...`.
- Empty feeds show `No Drops to show`.
- Loading older pages shows `Loading more drops...`.

## Edge Cases

- `Brain` is hidden when Waves is unavailable in the current context.
- If the active tab route becomes hidden, profile tab navigation replaces the
  URL with the first visible tab and keeps the current query string.
- Opening `/{user}/brain` while `Brain` is hidden redirects to `/{user}` when
  no wallet is connected, or when a connected profile exists but Waves is still
  unavailable.
- If a wallet is connected but no connected profile handle exists, the hidden
  `/{user}/brain` route can remain on a blank shell until context changes.
- Feed content renders only after profile resolution returns a handle.

## Failure and Recovery

- If the profile route cannot be resolved, users see the shared not-found screen:
  [Route Error and Not-Found Screens](../../shared/feature-route-error-and-not-found.md)
- If the initial drop-feed request fails, users still see `No Drops to show`;
  refreshing retries the request.
- If loading additional pages fails while scrolling, already loaded drops stay
  visible; refresh and retry.

## Limitations / Notes

- The profile feed focuses on reading and opening drops; inline
  reply/quote action controls are not shown in this tab.
- Feed pagination requests 10 drops per page and loads older pages on bottom
  scroll intersection.
- Feed scope comes from the `/{user}` route path; unrelated query parameters do
  not switch the feed owner.

## Related Pages

- [Profiles Index](../README.md)
- [Profile Routes and Tab Visibility](../navigation/feature-tabs.md)
- [Profiles Tabs Index](README.md)
- [Profile Navigation Flow](../navigation/flow-navigation.md)
- [Profile Troubleshooting](../troubleshooting/troubleshooting-routes-and-tabs.md)
- [Loading Status Indicators](../../shared/feature-loading-status-indicators.md)
