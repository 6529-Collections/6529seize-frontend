# Network Definitions

Parent: [Network Index](README.md)

## Overview

`Definitions` is a static glossary for core network metric labels.
Use it when a metric name needs clarification before comparing stats.

## Location in the Site

- Route: `/network/definitions`
- Sidebar path (web and app): `Network -> Metrics -> Definitions`

## Entry Points

- Open `/network/definitions` directly.
- Open `Network -> Metrics -> Definitions` from the sidebar.
- Open `Definitions` from `/network/tdh` or `/network/tdh/historic-boosts`.
- Use header search (3+ characters) and open `Definitions`.

## Definitions Shown

- `Cards Collected`: total The Memes NFTs owned.
- `Unique Memes`: total unique Meme NFTs owned.
- `Meme Sets`: number of complete sets of The Memes (all SZNs or a specific SZN).
- `Meme Sets -1 / -2`: complete sets missing 1 or 2 cards.
- `Genesis Sets`: complete set of the first three Meme NFTs.
- `Purchases / Sales`: count of bought/sold NFTs (Memes or Gradients).
- `Purchases (ETH) / Sales (ETH)`: ETH spent/received for those NFTs.
- `Transfers In / Out`: NFTs moved into/out of an address.
- `TDH (unweighted)`: "Total Days Held" summed daily at `00:00 UTC`.
- `TDH (unboosted)`: TDH weighted by edition size (`FirstGM 3,941 = 1.0` baseline).
- `TDH`: TDH (unboosted) multiplied by boosters, with an inline link to `/network/tdh`.

## Route Behavior

- Static reference route: no API request, loading state, empty state, or retry action.
- No query params, sorting, filtering, or group-scope controls.
- Same content for signed-in and signed-out users.
- Bottom navigation buttons always link to:
  `/network/tdh`, `/network/tdh/historic-boosts`,
  `/network/health/network-tdh`, and `/network/levels`.

## Failure and Recovery

- If navigation fails, reopen from `Network -> Metrics -> Definitions` or open `/network/definitions` directly.
- If a bottom-link target fails, open the route directly:
  `/network/tdh`, `/network/tdh/historic-boosts`, `/network/health/network-tdh`, or `/network/levels`.

## Related Pages

- [Network Index](README.md)
- [Network Stats](feature-network-stats.md)
- [TDH Boost Rules](feature-tdh-boost-rules.md)
- [TDH Historic Boosts](feature-tdh-historic-boosts.md)
- [Network Levels](feature-network-levels.md)
- [xTDH Rules and Distribution Formula](feature-xtdh-formulas.md)
- [Profile Stats Tab](../profiles/tabs/feature-stats-tab.md)
