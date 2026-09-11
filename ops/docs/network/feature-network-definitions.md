# Network Definitions

Parent: [Network Index](README.md)

## Overview

`Definitions` is a static glossary for core network metric labels.
It groups terms into collection, activity, and TDH metrics so users can scan
related concepts together before comparing Network data.

## Location in the Site

- Route: `/network/definitions`
- Sidebar path (web and app): `Network -> Metrics -> Definitions`

## Entry Points

- Open `/network/definitions` directly.
- Open `Network -> Metrics -> Definitions` from the sidebar.
- Open `Definitions` from `/network/tdh` or `/network/tdh/historic-boosts`.
- Use header search (3+ characters) and open `Definitions`.

## User Journey

1. Open `Definitions`.
2. Scan the `Collection metrics`, `Activity metrics`, and `TDH metrics`
   sections.
3. Read the term in the left column and its explanation beside or below it,
   depending on screen width.
4. Use `current TDH rules` in the final TDH definition for the active formula.
5. Use `Explore Network references` to continue to TDH, historic boosts,
   Network TDH Stats, or Levels.

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
- Terms use glossary semantics rather than a data table; descriptions move
  below terms on narrow screens.
- The bottom reference links always lead to:
  `/network/tdh`, `/network/tdh/historic-boosts`,
  `/network/health/network-tdh`, and `/network/levels`.

## Common Scenarios

- Clarify a collection count before reading the Network identities table.
- Distinguish purchase and sale counts from their ETH values.
- Compare unweighted, unboosted, and boosted TDH.
- Continue from a glossary term to the current or archived TDH rules.

## Edge Cases

- The page has no user-specific or fetched values, so wallet state and API
  availability do not change the glossary.
- Long terms and descriptions wrap instead of introducing horizontal scrolling.

## Failure and Recovery

- If navigation fails, reopen from `Network -> Metrics -> Definitions` or open `/network/definitions` directly.
- If a reference-link target fails, open the route directly:
  `/network/tdh`, `/network/tdh/historic-boosts`, `/network/health/network-tdh`, or `/network/levels`.

## Limitations / Notes

- Definitions explains metric labels but does not display live Network values.
- The glossary has no search, filtering, or alphabetical sorting.

## Related Pages

- [Network Index](README.md)
- [Network Stats](feature-network-stats.md)
- [TDH Boost Rules](feature-tdh-boost-rules.md)
- [TDH Historic Boosts](feature-tdh-historic-boosts.md)
- [Network Levels](feature-network-levels.md)
- [xTDH Rules and Distribution Formula](feature-xtdh-formulas.md)
- [Collected Tab, Stats Summary, and Transfer Mode](../profiles/tabs/feature-collected-tab.md)
