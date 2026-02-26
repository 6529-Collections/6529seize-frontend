# Network Routes and Health Troubleshooting

## Overview

Use this page for common issues in the `/network` section, including health
dashboards, TDH routes, and leaderboard surfaces.

## Location in the Site

- Route family: `/network/{section}`  
- Network health routes: `/network/health`, `/network/health/network-tdh`
- Network metrics: `/network/tdh`, `/network/tdh/historic-boosts`
- Network leaderboard routes: `/network`, `/network/levels`, `/network/nerd/{focus}`,
  `/network/definitions`, and `/network/xtdh`

## Entry Points

- Open `/network` for the default network summary.
- Open `/network/health` to confirm live service-state rendering.
- Open `/network/tdh` for current TDH/xTDH displays.
- Open `/network/definitions` for metric terminology.
- Open `/network/nerd/{focus}` and `/network/nerd/interactions` to inspect
  leaderboard variants.

## User Journey

1. If the network section appears to be stale, open `/network`.
2. Confirm backend status from `/network/health`.
3. Revisit `/network/tdh` if xTDH/boost calculations appear inconsistent.
4. Use `/network/nerd/{focus}` to confirm leaderboard sorting/focus for identity
   scoring.

## Common Scenarios

- Health metrics fail to load on first visit: reopen after a short network retry.
- Network group scoring displays cached values: refresh after returning from another
  route.
- `/network/xtdh` and `/network/levels` load slowly in heavy sessions: retry after
  reducing tab activity.
- Identity lists appear empty after a state transition: open `/network/health` and
  return to the relevant network surface.

## Edge Cases

- `/network/nerd` uses the optional `{focus}` segment, but missing segments still
  render a default leaderboard focus.
- Health data can remain stale until the background fetch cycle completes.

## Failure and Recovery

- If a specific route fails to render, go directly to `/network` and relaunch the
  intended route from there.
- If network health widgets fail repeatedly, wait briefly and refresh `/network/health`.
- If leaderboard routes return incomplete totals, refresh and switch focus once in
  `/network/nerd`.

## Limitations / Notes

- Stale network data can temporarily diverge from latest chain state during heavy
  index refresh windows.
- Route recovery is page-local; long-lived stale network sessions generally recover
  on route refresh.

## Related Pages

- [Network Index](README.md)
- [Feature Network Health and Stats](feature-health-dashboard.md)
- [Feature Network Stats](feature-network-stats.md)
- [Feature TDH Boost Rules](feature-tdh-boost-rules.md)
