# Network Activity Feed

Parent: [Network Index](README.md)

## Overview

`/network/activity` shows network profile activity as cards.
It covers profile edits, proxy updates, and REP/NIC rating updates.

## Location in the Site

- Route: `/network/activity`
- Sidebar path: `Network -> Activity`

## Entry Points

- Open `Network -> Activity` from the sidebar.
- Open `/network/activity` directly.
- Open a deep link with scope preset: `/network/activity?group={groupId}`.

## User Journey

1. Open `/network/activity`.
2. Review cards with profile links, event text, and relative timestamps.
3. Use `Next` and `Previous` to move through older pages.
4. Open linked profiles from cards when needed.

## Common Scenarios

- Audit recent profile edits and REP/NIC rating changes.
- Confirm proxy creation/action updates across the network.
- Continue paging to review older activity history.

## Scope and Controls

- This route has no inline sort, filter, or group controls.
- Requests include `group_id` only when active network group scope is already set.
- On first load, `group={groupId}` in URL is copied into active group state by
  the network layout on the client.
- The first server-rendered fetch is unscoped, then the feed refetches with
  `group_id` after client scope is applied.
- Scope can persist from earlier `/network` usage in the same app session.

## Edge Cases

- If the current page has no events, the page shows `No Activity Log`.
- The URL can look unscoped while data is still scoped by active group state.
- Changing `group` in the URL after first mount does not reapply scope
  automatically.
- Drop-focused log types are not rendered as detailed activity entries here.

## Failure and Recovery

- If profile-log fetch fails, the route falls back to `No Activity Log`.
- The route has no inline retry button or fetch error banner.
- Refresh `/network/activity` to retry loading.
- If results look unexpectedly scoped, clear group scope on `/network`, then
  reopen `/network/activity`.

## Limitations / Notes

- Page size is fixed to `50`.
- This route is read-only.
- Pagination is not persisted in the URL.

## Related Pages

- [Network Index](README.md)
- [Network Group Scope Flow](flow-network-group-scope.md)
- [Network Identities Leaderboard](feature-network-identities-leaderboard.md)
- [Network Routes and Health Troubleshooting](troubleshooting-network-routes-and-health.md)
- [Profiles Activity and Tabs](../profiles/tabs/feature-tab-content.md)
