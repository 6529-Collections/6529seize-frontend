# Health Dashboard

Parent: [Network Index](README.md)

## Overview

`/network/health` shows network activity and mint health in one view.

- `Mint Stats` for the latest mint and recent mint/subscription volume.
- Event cards with `Last 24h` and `Last 7 Days` comparisons.
- Cumulative cards with `Total`, `24h` change, and `7d` change.

## Location in the Site

- Route: `/network/health`
- Sidebar path: `Network -> Metrics -> Health`

## Entry Points

- Open `Network -> Metrics -> Health` in the sidebar.
- On `/` (home), use the red heart button in the header area.
- Open `/network/health` directly.

## User Journey

1. Open the Health dashboard.
2. Wait for the skeleton cards to clear.
3. Check `Mint Stats`:
   - `Latest Mint` shows card number, mint count, and subscription count.
   - `Last N Mints` chart shows up to `50` mints, oldest to newest.
4. Compare event cards: `Posters`, `Posts`, `Submissions`, `Voters`,
   `Vote Volume`, `Active Identities`, and `Consolidations Formed`.
5. Compare cumulative cards: `Active Votes`, `Network TDH`,
   `TDH Utilization %`, `xTDH Granted`, and `Identities`.
6. Hover key values for full comma-formatted numbers.
7. Hover trend bars for compact values and date labels when available.
8. Open the `Network TDH` card to go to [Network Stats](feature-network-stats.md).

## Common Scenarios

- Check if activity is up or down across the last day and week.
- Compare `Posters` vs `Posts` to estimate unique participation.
- Verify the latest mint card and recent mint/subscription split.
- Use `Network TDH` and `xTDH Granted` to gauge TDH movement.
- Open `Network TDH` when you need deeper TDH history charts.

## Edge Cases

- If the previous window is `0` and the current window has value, the change
  badge shows `+100%`.
- If both current and previous windows are `0`, the change badge shows `N/A`.
- Invalid, negative, or non-numeric values from the daily/weekly metrics payload
  are normalized to `0` before cards render.
- Trend bars use a separate 31-day series call. If that call is unavailable or
  still loading, cards render without trend bars.
- Large values are compacted (`K`, `M`, `B`) in card text. Numeric tooltips show
  full counts for stat values; sparkline tooltips stay compact.
- If no mint data is returned, the Mint Stats card shows `No mint data available`.
- When 10 or fewer mints are returned, card IDs appear under the bars;
  otherwise rely on hover tooltips.

## Route-State Behavior

- `/network/health` has no query params for filters, sort state, or pagination.
- The dashboard URL is queryless, so shared links open the same metric surface.
- The `Network TDH` card always links directly to
  `/network/health/network-tdh` with no attached route state.

## Failure and Recovery

- Daily, weekly, and mint calls retry automatically (up to 3 attempts with
  backoff).
- If any of those required calls still fails, the route shows:
  `Failed to load metrics. Please try again later.`
- If only the sparkline series call fails, cards still render without trend bars.
- Refreshing the route starts a new fetch cycle for all queries.

## Limitations / Notes

- Time windows are fixed to `Last 24h` and `Last 7 Days`; there is no period
  selector.
- Mint Stats always requests the latest `50` mints (or fewer if unavailable).
- Sparkline charts show recent trend data when available and do not replace the
  primary totals.
- The route has no inline retry button, filter controls, or sort controls.

## Related Pages

- [Network Index](README.md)
- [Network Stats](feature-network-stats.md)
- [Network Definitions](feature-network-definitions.md)
- [TDH Boost Rules](feature-tdh-boost-rules.md)
- [Network Routes and Health Troubleshooting](troubleshooting-network-routes-and-health.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
