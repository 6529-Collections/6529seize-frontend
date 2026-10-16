# TDH Verification Dashboard

Parent: [Network Index](README.md)

## Overview

`/network/tdh/verification` is the public, daily, three-way comparison of TDH:
the validators' Rust core, the Python reference and 6529.io's current backend
compute TDH for the same snapshot, and the page shows how many collectors and
wallets are equal, the three totals side by side, and every difference
counted and classed by cause. No individual record is ever shown: the daily
job publishes differences only as counts, because one differing token can
single its holder out.

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

- The `Checked daily in public` strip under the overview's introduction, and
  `Checked daily, in public` further down `/network/tdh`.
- `Latest daily agreement` on `/network/tdh/implementations`.
- Step 13 (`Network totals`) and step 14 of `/network/tdh/how-it-works`.

## What the Page Shows

1. The headline: the verdict, the day and cycle, the day's result in one
   sentence (for example that the Rust core, the Python reference and
   6529.io agreed on all collectors and wallets), the verdict in words,
   previous and next day arrows, the snapshot block, and the history mode
   (`Not yet fully checked` or `History fully checked`, with a
   `What this label means` disclosure). On a day that is not the latest, a
   link back to the latest.
2. The day at a glance: collectors equal between the Rust core and 6529.io
   and between the Rust core and Python, each with a meter that keeps a
   visible sliver for any difference and a line for the wallets; the total
   TDH, with whether it is the same in all three; and the cutover: a
   countdown with the week from the start of the daily runs (October 16,
   2026) to about October 23, 2026 on the latest day, the planned date on
   older days, and `Switched on {date}` only when a published file says the
   cutover is done.
3. Every day: one cell per day coloured and shaped by its verdict and
   linking to it (a missing 6529.io file is an outline, an unexplained
   difference carries `!`, a mismatch `×`), a bar under each for the total's
   difference, dashed cells for days with no report and, while the cutover is
   ahead, the days still to come up to it. On phones the row scrolls inside
   itself with edge fades, starting at the shown day. It also says which
   report is the latest, warns when reports are late, and counts days with no
   report.
4. Side by side: totals, collector and wallet counts, the roots (Python
   computes none and is compared record by record), code versions as
   `validator@…` and `6529chain@…` with copy buttons, run times and sources.
5. Differences: when there are none, a plain statement that every collector
   and wallet is equal; otherwise the number of differing collector and
   wallet records, the counts by class (A to D) and by cause (DEV and BUG
   items link to the specification), and the totals' differences. The four
   classes are explained beside it, with a note that no record is published,
   and a short history of the DEV-2 cases that D131's netting settled.
6. Day by day: a table of the days from `xl` (one card per day below), with
   days that have no report; from the seventh day wider screens show a chart
   drawn for the column width, with the table one click away.
7. Provenance: data source, snapshot block with an Etherscan link, history
   mode, rule version and registry hash (from the day's file, or the
   specification's, labelled as such), code versions, and 6529.io's files on
   Arweave with links to each transaction and file, and JSON download links.
8. Check it yourself: what anyone can check today from public sources, what
   that does not reach, the three commands that reproduce the day once the
   source is published, and the roots and files to compare.
9. How this works: the daily comparison as one graph (our computation and
   the object under test converging on the comparison, which publishes the
   files this page reads), drawn as a column on phones and as two lanes from
   `md`, then the method. Every section heading carries a link to its anchor.

## Data Source

- The page reads 6529's public TDH feed, `https://d379duzqnomz3w.cloudfront.net`:
  `index.json` and `days/{cycleDay}.json`, as the daily job's
  `publish_feed.py` writes them. `NEXT_PUBLIC_TDH_VERIFICATION_BASE`
  overrides the base (HTTPS, or http://localhost outside production). The feed is
  served by CloudFront from a private bucket, which answers 403 (not 404)
  for a file that does not exist yet: the page reads 403 and 404 alike as
  "not yet published" (no index yet: reports start soon; a missing day: not
  found). The job publishes once a day after its
  00:40 UTC run and fetches a late 6529.io file again at 06:00 and 12:00 UTC;
  the page rechecks the files every 10 minutes (day permalinks hourly).
- The feed's verdicts are `OK`, `RUST_PYTHON_MISMATCH`, `LIVE_UNAVAILABLE`
  and `LIVE_UNEXPLAINED`. A day's differences come from `differenceSummary`
  (counts by class and cause, and the totals' differences) and from the
  agreement counts; the page never reads the feed's `differences` list, which
  the job always publishes empty. Optional fields (`ruleVersion`,
  `registryHash`, `cutoffBlockHash`, `cutoffTimestamp`, `live.sha256`,
  `rootsNote`) are shown when present.
- No index published yet (403, 404 or no days): the page says no daily
  report is published yet. There is no bundled or sample data in any
  environment; Jest tests serve a verbatim copy of the feed's first days
  (`__tests__/lib/tdh/verification/publicFeedFixture.ts`).
- A file that fails validation is rejected whole: among other checks, a
  cause must be what the job writes (`DEV-n`, `BUG-n`, `SD-n`, `MS-n`,
  `CN-n` or `RP-n`, several joined by commas, `rust-python` or
  `unexplained`), the class and cause counts must add up to the differing
  records, and a code version must be a commit, a commit with `+wip`, or
  `unknown`.

## Failure and Recovery

- Data source unreachable or invalid: an error notice with `Try again`.
- Day file missing but the index loaded: the index's counts and the calendar
  still show, with a notice and `Try again`.

## Related Pages

- [How TDH Is Calculated](feature-tdh-how-it-works.md)
- [TDH-v1 Specification](feature-tdh-specification.md)
- [TDH Implementations](feature-tdh-implementations.md)
- [TDH Boost Rules](feature-tdh-boost-rules.md)
