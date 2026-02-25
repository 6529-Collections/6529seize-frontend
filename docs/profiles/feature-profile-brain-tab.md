# Profile Brain Tab

## Overview

The `Brain` tab shows a profile's drop feed on the profile root route. It lets
users read that profile's recent drops and open each drop in its source wave or
direct-message thread.

## Location in the Site

- Route: `/{user}`
- Visible as the `Brain` tab when Waves features are enabled for the current
  runtime context.

## Entry Points

- Open `/{user}` directly.
- Switch to `Brain` from another profile tab.
- Follow a shared profile root URL.

## User Journey

1. Open a profile root URL.
2. The page resolves the profile and loads the first set of drops.
3. Scroll to load older drops as needed.
4. Select a drop to open it in the related wave or direct-message thread.

## Common Scenarios

- Visit someone else's profile root to read their latest drops.
- Visit your own profile root to review your recent drops.
- While the first page is loading, the tab shows `Loading drops...` with a
  centered spinner.
- If no drops are available, the page shows `No Drops to show`.
- While older drops are loading during scroll, the page shows `Loading more drops...`.

## Edge Cases

- `Brain` is hidden when Waves is disabled; profile routing falls back to the
  first visible tab.
- Direct-message drops open in the messages route instead of a public wave
  route.
- If profile resolution is still in progress, the drop list can remain
  unavailable until profile data is ready.

## Failure and Recovery

- If the profile route cannot be resolved, users see the `USER OR PAGE`
  not-found screen.
- If the drop feed request fails, users can still see `No Drops to show`;
  refreshing retries the request.
- If loading additional pages fails while scrolling, already loaded drops stay
  visible; refresh and retry.

## Limitations / Notes

- The feed is scoped to the profile in the URL path (`/{user}`); adding a
  separate `user` query parameter does not switch the feed owner.
- The profile feed focuses on reading and opening drops; direct inline
  reply/quote actions are not shown in this tab.

## Related Pages

- [Profiles Index](README.md)
- [Profile Tabs](feature-profile-tabs.md)
- [Profile Tab Content](feature-profile-tab-content.md)
- [Profile Navigation Flow](flow-profile-navigation.md)
- [Profile Troubleshooting](troubleshooting-profile-pages.md)
- [Loading Status Indicators](../shared/feature-loading-status-indicators.md)
