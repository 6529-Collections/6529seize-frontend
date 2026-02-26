# Health Dashboard

Parent: [Network Index](README.md)

## Overview

`/network/health` is the Network Metrics dashboard for activity and mint
signals. It compares current windows against the previous day/week and surfaces
recent mint volume in a dedicated Mint Stats card.

## Location in the Site

- Route: `/network/health`
- Sidebar path: `Network -> Metrics -> Health`

## Entry Points

- Open `Network -> Metrics -> Health` in the sidebar.
- Open `/network/health` directly.

## User Journey

1. Open the Health dashboard.
2. Wait for the card grid to load.
3. Review Mint Stats. The Latest Mint panel shows the newest card number with
   mint and subscription counts, and the bar chart shows the last 50 mints with
   mints vs subscriptions split.
4. Review activity cards for daily and weekly windows: Posters, Posts,
   Submissions, Voters, Vote Volume, Active Votes, Network TDH, TDH Utilization
   %, xTDH Granted, Identities, Active Identities, and Consolidations Formed.
5. For each card that has trend data, a sparkline strip is shown under the
   card in chronological order (oldest values on the left, newest values on the
   right).
6. Hover values or sparkline bars to see exact values and dates.
7. Select the Network TDH card to open Network Stats for deeper detail.

## Common Scenarios

- Check whether activity increased or decreased over the last 24 hours or
  7 days.
- Compare Posters and Posts to understand how many unique identities are
  creating activity.
- Use Mint Stats to confirm the latest mint card and compare recent mint and
  subscription volume.
- Use Network TDH and xTDH Granted cards to gauge network-wide TDH movement.
- Use sparkline tooltips to read full values and their dates when compact numbers are shown.

## Edge Cases

- If the previous window is `0` and the current window has value, the change
  badge shows `+100%`.
- If both current and previous windows are `0`, the change badge shows `N/A`.
- Invalid or negative metric values are treated as `0` for display and
  comparisons.
- Large values are compacted (`K`, `M`, `B`) while tooltips show full counts.
- Sparkline bars follow the same sequence as the data returned for that card:
  if a metric has dates, each tooltip line matches the corresponding bar and
  date pair.
- Trend bars are fetched as 31-day series data; if those values are unavailable,
  cards render without bars.
- If no mint data is returned, the Mint Stats card shows `No mint data available`.
- When 10 or fewer mints are returned, card IDs appear under the bars;
  otherwise rely on hover tooltips.

## Failure and Recovery

- If the metrics data call fails, the page shows:
  `Failed to load metrics. Please try again later.`
- Refreshing the route retries the data load.

## Limitations / Notes

- Time windows are fixed to `Last 24h` and `Last 7 Days`; there is no period
  selector.
- Mint Stats always shows the latest `50` mints (or fewer if fewer exist); there
  is no page-size control.
- Sparkline charts show recent trend data when available and do not replace the
  primary totals.

## Related Pages

- [Network Index](README.md)
- [Network Stats](feature-network-stats.md)
- [Network Definitions](feature-network-definitions.md)
- [TDH Boost Rules](feature-tdh-boost-rules.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
