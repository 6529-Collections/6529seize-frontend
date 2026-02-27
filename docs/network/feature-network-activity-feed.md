# Network Activity Feed

Parent: [Network Index](README.md)

## Overview

`/network/activity` shows a paginated, network-wide activity feed for profile,
proxy, and REP/NIC rating events.

## Location in the Site

- Route: `/network/activity`
- Sidebar path: `Network -> Activity`

## Entry Points

- Open `Network -> Activity` from the sidebar.
- Open `/network/activity` directly.

## User Journey

1. Open `/network/activity`.
2. Review the latest activity cards in the feed.
3. Use pagination controls to move through older pages.
4. Open linked profiles from feed items when needed.

## Common Scenarios

- Check recent network-wide profile and rating changes.
- Confirm proxy-related actions and profile update events.
- Continue paging to audit older activity history.

## Edge Cases

- Group scope from `/network?group=...` does not apply on this route.
- The route has no user-exposed sort or query-param controls.
- If the current page has no events, the page shows `No Activity Log`.

## Failure and Recovery

- If initial server-side loading fails, the route resolves to not-found behavior.
- If feed loading fails after navigation, refresh `/network/activity` to retry.

## Limitations / Notes

- Page size is fixed to `50`.
- Some drop-related log types are intentionally excluded from this feed.
- This route is read-only.

## Related Pages

- [Network Index](README.md)
- [Network Identities Leaderboard](feature-network-identities-leaderboard.md)
- [Network Group Scope Flow](flow-network-group-scope.md)
- [Profiles Activity and Tabs](../profiles/tabs/feature-tab-content.md)
