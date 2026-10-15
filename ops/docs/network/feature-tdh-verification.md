# TDH Verification Dashboard

Parent: [Network Index](README.md)

## Overview

`/network/tdh/verification` is the public, daily, three-way comparison of TDH:
the validators' Rust core, the Python reference and 6529.io's current backend
compute TDH for the same snapshot, and the page shows the results side by
side with every difference, its class and its cause. Holders are never named;
differences carry labels such as `holder-1`.

`/network/tdh/verification/{cycleDay}` is the permalink for one day. Unknown
days return the standard not-found page.

## Location in the Site

- Routes: `/network/tdh/verification`, `/network/tdh/verification/{cycleDay}`
- Page heading: `TDH verification` (permalink: `TDH verification, cycle {N}`)
- Browser title: `TDH verification | Network`
- About contents menu: `TDH Verification` under Network & Reputation
- TDH section navigation: `Verification`

## Entry Points

- The `Verified daily` strip on `/network/tdh`.
- `Latest daily agreement` on `/network/tdh/implementations`.
- `See today's comparison` at step 14 of `/network/tdh/how-it-works`.
- `Explore Network references` on the Network reference pages.

## What the Page Shows

1. A sample banner when bundled sample data is shown (never in production).
2. A day picker: previous, next, latest, and a list of every published day
   (`Show day` navigates; moving through the list does not).
3. Status: the verdict (`Equal`, `Explained`, `Investigating`, `Mismatch`,
   `Pending`, or `See details` for an unknown value), the history mode
   (`Not yet fully checked` or `History fully checked`, each with a
   `What this means` disclosure), the cycle, the snapshot date and block.
4. The cutover card: `Cutover in N days` before about 23 October 2026,
   `Cutover due` from that UTC day, `Switched on {date}` once the data says
   the cutover is done.
5. Agreement tiles with bars: identities and wallets equal between Rust and
   6529.io, identities equal between Rust and Python, and total TDH (Rust
   minus 6529.io). After the cutover the Rust and Python tile comes first and
   the 6529.io tiles are labelled as a publication check.
6. Side by side: totals, identity and wallet counts, roots, code versions,
   run times and sources for each implementation. Missing values read
   `Not yet published`, `Not published` or `Not run`.
7. Differences: filter chips by class (A to D) with counts; each row expands
   to the cause's explanation and, for DEV-2, the one-transaction diagram.
8. Agreement over time: a chart of identity agreement and total difference
   per day, with a `Show as table` version.
9. Provenance: data source, rule version, registry hash, snapshot block,
   history mode, 6529.io's upload id and JSON download links.
10. How this works: the method, and a diagram of the daily comparison.

## Data Source

- `NEXT_PUBLIC_TDH_VERIFICATION_BASE` names the public base URL of
  `index.json` and `days/{cycleDay}.json`. The page reads them on the server
  and refreshes every 10 minutes (day permalinks hourly).
- Unset in production: the page says daily reports start on 16 October 2026.
- Unset outside production: bundled sample data from the comparison of 14 and
  15 October 2026, under a `Sample data, not a measurement` banner.
- A file that fails validation, or names anything other than `holder-N`, is
  rejected whole.

## Failure and Recovery

- Data source unreachable or invalid: an error notice with `Try again`.
- Day file missing but the index loaded: the status and history still show,
  with a notice and `Try again`.

## Related Pages

- [How TDH Is Calculated](feature-tdh-how-it-works.md)
- [TDH-v1 Specification](feature-tdh-specification.md)
- [TDH Implementations](feature-tdh-implementations.md)
- [TDH Boost Rules](feature-tdh-boost-rules.md)
