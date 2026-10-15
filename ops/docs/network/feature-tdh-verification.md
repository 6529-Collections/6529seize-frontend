# TDH Verification Dashboard

Parent: [Network Index](README.md)

## Overview

`/network/tdh/verification` is the public, daily, three-way comparison of TDH:
the validators' Rust core, the Python reference and 6529.io's current backend
compute TDH for the same snapshot, and the page shows the results side by
side with every difference, its class and its cause. Holders are never named;
differences carry labels such as `holder-1` (identity) and `holder-1/w1`
(one of its wallets). Each value is also in 6529.io's public upload of that
day, and the page says so.

`/network/tdh/verification/{cycleDay}` is the permalink for one day. Unknown
days return the standard not-found page.

## Location in the Site

- Routes: `/network/tdh/verification`, `/network/tdh/verification/{cycleDay}`
- Page heading: `TDH verification` (permalink: `TDH verification, {date}`,
  with a `Cycle {N}` chip)
- Browser title: `TDH verification | Network`
- About contents menu: `TDH verification` under Network & Reputation
- TDH section navigation: `Verification`

## Entry Points

- `Checked daily, in public` on `/network/tdh`.
- `Latest daily agreement` on `/network/tdh/implementations`.
- `See today's comparison` at step 14 of `/network/tdh/how-it-works`.

## What the Page Shows

1. A sample banner when bundled sample data is shown (never in production).
2. A day picker: previous, next, latest, and a list of every published day
   (`Show day` navigates; moving through the list does not).
3. Status: the verdict (`Equal`, `Explained`, `Investigating`, `Mismatch`,
   `6529.io file missing`, or `See details` for an unknown value), the
   history mode (`Not yet fully checked` or `History fully checked`, each
   with a `What this means` disclosure), the cycle, the day boundary and the
   snapshot block. With published data it also says which report is the
   latest, warns when reports are late, and counts days with no report.
4. The cutover card: `Cutover in N days` with the week from D132's decision
   to about 23 October 2026, `Cutover due` from that UTC day, `Switched on
   {date}` once the data says the cutover is done. On an older day it is
   marked `As of today`.
5. Agreement tiles: for identities and wallets equal between Rust and
   6529.io, and identities equal between Rust and Python, how many differ
   (or `All equal`) with the equal count and share; and the total TDH, Rust
   minus 6529.io, in numbers and words.
6. Side by side: totals, identity and wallet counts, the roots (Python
   computes none and is compared record by record), whether each run netted
   within a transaction, code versions, run times and sources.
7. Differences, one case per holder (an identity and its wallets): class,
   cause, the total difference, and the differing fields under 6529.io's
   upload names with Rust, Python, 6529.io and Rust minus 6529.io. A wallet
   with the identity's values is noted in one line. Each cause opens to its
   explanation and, for DEV-2, the one-transaction diagram.
8. Agreement over time: a table of the days (one card per day on phones),
   with days that have no report; from the seventh day wider screens show a
   chart, with the table one click away.
9. Provenance: data source, rule version and registry hash (from the day's
   file, or the specification's, labelled as such), snapshot block with an
   Etherscan link, history mode, netting, code versions, 6529.io's upload
   ids and JSON download links.
10. Check it yourself: what anyone can check today from public sources, and
    the two commands that reproduce the day once the source is published.
11. How this works: the method, and a diagram of the two flows that meet in
    the comparison.

## Data Source

- `NEXT_PUBLIC_TDH_VERIFICATION_BASE` names the public base URL of
  `index.json` and `days/{cycleDay}.json`, as the daily job's
  `publish_feed.py` writes them. The page reads them on the server and
  refreshes every 10 minutes (day permalinks hourly).
- The feed's verdicts are `OK`, `RUST_PYTHON_MISMATCH`, `LIVE_UNAVAILABLE`
  and `LIVE_UNEXPLAINED`; field names are the upload's (`boosted_tdh`,
  `memes#208.tdh`). Optional fields (`ruleVersion`, `registryHash`,
  `cutoffBlockHash`, `cutoffTimestamp`, `transactionNetting`, `live.sha256`)
  are shown when present.
- Unset in production: the page says daily reports start on 16 October 2026,
  and from 17 October that they are not yet connected.
- Unset outside production: the daily job's own files for 14 and 15 October
  2026, run before the Rust core netted within a transaction, under a
  `Sample` banner that says so.
- A file that fails validation, or carries a label other than `holder-N` or
  `holder-N/wM`, is rejected whole.

## Failure and Recovery

- Data source unreachable or invalid: an error notice with `Try again`.
- Day file missing but the index loaded: the status and history still show,
  with a notice and `Try again`.

## Related Pages

- [How TDH Is Calculated](feature-tdh-how-it-works.md)
- [TDH-v1 Specification](feature-tdh-specification.md)
- [TDH Implementations](feature-tdh-implementations.md)
- [TDH Boost Rules](feature-tdh-boost-rules.md)
