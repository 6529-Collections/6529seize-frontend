# Profile Followers Tab

## Overview

The `Followers` tab lists identity subscription followers for the viewed profile.
Rows are driven by incoming identity subscription data and show profile links for
quick follow-up and inspection.

## Location in the Site

- Route: `/{user}/followers`
- Parent profile: `/{user}`

## Entry Points

- Open `/{user}/followers` directly.
- Switch to `Followers` from any profile tab.
- Open a shared profile link that lands on the followers tab.

## User Journey

1. Open the followers tab.
2. Let the list fetch incoming identity-subscription rows.
3. Review follower list items with profile handle and level.
4. Click a follower row to open that profile.
5. Scroll to trigger page-by-page loading as the list grows.

## Common Scenarios

- Followers for any profile are shown in a simple, compact list.
- Empty follower set renders an empty list state.
- A page size of 100 rows is requested per page; additional pages load as needed.
- Level badges render alongside follower identity links.

## Edge Cases

- No manual filtering/search controls are available in this tab.
- If the viewed profile has no incoming subscriptions, no rows appear.
- Follow actions are not initiated from this tab; navigation is the primary
  interaction.

## Failure and Recovery

- If follower queries fail or are slow, list state can remain empty until a retry
  via refresh.
- On infinite-scroll failures, partial results may stay visible while users retry.

## Limitations / Notes

- The tab intentionally omits additional follower-management actions.

## Related Pages

- [Profiles Index](../README.md)
- [Profile Tab Content](feature-tab-content.md)
- [Profile Tabs](../navigation/feature-tabs.md)
- [Profile Navigation Flow](../navigation/flow-navigation.md)
