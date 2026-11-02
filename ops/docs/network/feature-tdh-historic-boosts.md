# TDH Versions and Boosts

Parent: [Network Index](README.md)

## Overview

`/network/tdh/historic-boosts` is shelf page S4 of the TDH chapter of 6529
Explained, "Versions and boosts": every TDH version 6529.io has run, its
boost schedule and its dates, and the two names the specification gave the
rules. `/network/tdh/versions` redirects here.

## Location in the Site

- Route: `/network/tdh/historic-boosts` (and `/network/tdh/versions`, a
  permanent redirect)
- Page heading: `Versions and boosts`
- Browser title: `Versions and boosts: every TDH schedule | 6529 Explained`
- Chapter bar: the Shelf menu, `Versions and boosts`

## Content

- 1 On 6529.io: TDH v1.4 (live since October 10, 2025) and the archived 1.3,
  1.2 and 1.1, each with its dates, full-set boost and the seasons that can
  pay. The current row's values (the full-set boost today and at most, the
  seasons that pay today) are computed by the TDH v1.4 engine on the real
  editions, with the date they were read (`#boost-figures`), never a date
  fixed in code.
- 2 In the specification: `tdh-v1.4` (D137, with D136's four wallets) and the
  retired `tdh-v1.0`, each with its registry hash.

## Data

- Past schedules: `lib/explained/data/reference.json`, with their source.
- Today's values: the engine on the editions read from 6529.io's API; the
  registry from the record snapshot.
- Old anchors (`#tdh-1-1` to `#tdh-1-4`, `#boost-figures`) land on their
  rows.

## Related Pages

- [TDH Boost Rules](feature-tdh-boost-rules.md)
- [TDH v1.4 Specification](feature-tdh-specification.md)
