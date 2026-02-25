# Profile Waves Tab

## Overview

The `Waves` tab lists waves visible in profile context and supports searching by
wave name. It also exposes the same wave card and follow
interactions used elsewhere in the app.

## Location in the Site

- Route: `/{user}/waves`
- Parent profile: `/{user}`

## Entry Points

- Open `/{user}/waves` directly.
- Switch to `Waves` from any profile tab.
- Open a shared profile link that lands on the waves tab.

## User Journey

1. Open the waves tab.
2. Use `By Wave Name` to filter results.
3. Browse cards showing wave author, subscriber count, drop summary, and follow
   state.
4. Follow or stop following a wave (when enabled).
5. Create new wave / direct message when allowed.

## Common Scenarios

- View public wave lists when not authenticated or when a proxy profile is active.
- View authenticated wave lists when connected normally.
- If no query matches, the tab renders an empty card grid.
- Infinite scroll loads additional pages when enough cards are loaded.
- Follow/unfollow control appears on cards for signed-in non-proxy users.

## Edge Cases

- The user can create a wave or DM only when connected to their own profile and
  no proxy profile is active.
- Wave follow actions are gated by authentication and hidden for proxy sessions.
- Card links support click and pointer behavior with embedded interactive controls.

## Failure and Recovery

- If the search result request fails, the tab can recover on refresh.
- If wave follow action fails, toast feedback is shown and the action can be retried.
- Empty queries with no public/private results keep the tab container visible while
  showing no cards.

## Limitations / Notes

- This tab is not present when waves are globally disabled in tab visibility.
- The tab does not keep deep-linked search filters across profile route reloads unless
  query state is updated by navigation.

## Related Pages

- [Profiles Index](../README.md)
- [Profile Tab Content](feature-tab-content.md)
- [Profile Tabs](../navigation/feature-tabs.md)
- [Waves](../../waves/README.md)
- [Profile Navigation Flow](../navigation/flow-navigation.md)
