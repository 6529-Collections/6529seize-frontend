# TDH Verification Dashboard

Parent: [Network Index](README.md)

## Overview

`/network/tdh/verification` is the public, daily, three-way comparison of TDH:
the Rust core that validators will run, the Python reference and 6529.io's
current backend
compute TDH for the same snapshot, and the page shows how many collectors and
wallets are equal, the three totals side by side, and every difference
counted and classed by cause. No individual record is ever shown: the daily
job publishes differences only as counts, because one differing token can
single its holder out.

`/network/tdh/verification/{cycleDay}` is the permalink for one day. It
renders per request (`dynamic = "force-dynamic"`; the feed files are cached
at the fetch level). A path that cannot name a published day (not a cycle
day in canonical form, before the feed's first day, 20,740, or after the
latest closed cycle) is rewritten by the proxy
(`lib/proxy/tdhVerificationDay.ts`) to the TDH pages' own not-found view,
`/network/tdh/verification/day-not-found?day=…`, with a real 404 status and
the site around it, under a `TDH verification` eyebrow at every width:
`No published day 20,739`, or `No published day here` for an address that
is not a cycle number (the page never repeats the text of the address);
for a cycle before the feed's first day, its date and that it is before
October 14, 2026 (cycle 20,740); for a future cycle, when it closes and
that its report appears after its 00:40 UTC run. Below, the latest day as
a primary button and the dashboard as a secondary one; only for a cycle
before the feed's first day, that the days compared start with October 14,
2026 and earlier days have no file here (6529.io's own uploads for them
are listed by its public API), and a link to the October 11, 2026 replay
in the specification's evidence; no day strip. Marked `noindex`. The address
bar keeps the path asked for, and the access gate still runs first. A day
inside that range that the feed does not list shows the standard not-found
page, titled `TDH verification: day not found` and marked `noindex` with
one robots tag; its status stays 200 because `app/network/loading.tsx`
starts streaming before the page can call `notFound()`. A day's own page has
a one-line lede (a lasting address for the day's comparison); its cutover
tile shows the planned date, about October 23,
2026, and that the day came before it; it has no live freshness line, the
headline card drops the date its title already gives, and Provenance shows
the SHA-256 of the day file the page read and the day before it with its
own file's SHA-256 and whether the index states the same, so days can be
checked as a chain. The run that wrote a day's file is read from the file
itself (`generatedAt`): for the first two days, first computed on October
15, 2026, before the scheduled runs began, and recomputed when the file was
written; for a later day whose file was written well after its 00:40 UTC
run, that time and the builds that wrote it. Under the snapshot line a small
amber mark says which it is (`Computed before the schedule`, `Recomputed
later`, `Written after its scheduled run`), with the sentence as its
tooltip and a link to Provenance, whose feed row gives the sentence. Each
code version names the P26 commit it computes. Provenance says that a
day's runs followed the P26 text these pages restate only when the day's
registry hash is that text's (tdh-v1.0 at `f840096`); otherwise it names
the day's hash and says the runs may follow a later text, or that the file
states no hash to compare.

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

1. The headline: the verdict and the day and cycle on a line above the
   card's heading, the short headline itself (for example "Every record
   equal: 10,279 identities and 11,131 wallets"), then one line saying who
   agrees (the Rust core, the Python reference and 6529.io, to the last
   unit of TDH, the burn addresses included); on any other verdict, the
   day's result in one sentence and the verdict in words. Beside it the
   three totals, the SHA-256 of the day's file (one abbreviation length on
   every page), whether the feed's index states the same, and `Download
   JSON`; previous and next day arrows, the snapshot block, the run note,
   and the history mode (`Not yet fully checked` or
   `History fully checked`, with its meaning in one line beside it: the
   history before the snapshot is taken as reported by public log servers,
   and stays so, even once 6529's own Ethereum node is synced, until the
   daily run checks it in full against that node; no date is given. A
   `What this label means` disclosure says the light client starts from
   the first beacon server's checkpoint, with no pinned checkpoint yet.) The two
   stack below `lg`. On a day that is not the latest, a neutral link back
   to the latest. The feed's
   identity counts include the two sink identities (the zero address and
   0x…dead), so the pages say identity records, not collectors.
2. The day at a glance: identity records equal between the Rust core and
   6529.io and between the Rust core and Python (one subtitle: identity
   records equal, burn addresses included), each with a meter that keeps a
   visible sliver for any difference and a line for the wallets; each tile
   reads label, figure, then its caption right under them, so no tile
   opens a gap in its middle; the total
   TDH, with `Rust − 6529.io` and `Rust − Python` as numbers and whether it
   is the same in all three; and the cutover: `About Oct 23`, planned for
   about October 23, 2026, a week after the scheduled daily runs began on
   October 16 (D132); the days compared start with October 14, computed
   before the schedule began; with no countdown (on a day's own page, that the day
   came before it), and `Switched on {date}` only when a published file says
   the cutover is done. Every difference on the dashboard and the day pages has one sign:
   the Rust core minus the other program. The total tile notes
   that the total validators are to sign leaves out the two sinks, which
   the feed does not publish yet. Tile eyebrows keep the case of 6529.io
   (`CaseSafe`). One tile a row on phones, a 2 × 2 grid from a 26rem
   column and one row of four from 56rem.
3. Every day: one cell per day coloured and shaped by its verdict and
   linking to it (a missing 6529.io file is an outline, an unexplained
   difference carries `!`, a mismatch `×`), the total's difference under
   each as a number (0 when equal), dashed cells for days with no report
   and, while the cutover is ahead, the days still to come up to it (each
   with a 1 px border, as is its legend swatch), on every day's page alike.
   The cutover cell is hatched with a dashed border and labelled `~23`, and
   its legend says `Planned cutover, about this day`, so the strip states
   no more than the words (D132). The days share the card's whole width, with the
   rows labelled on the left (`Rust − 6529.io`, the month); its label reads
   `Published Oct 14 to Oct 16 · cutover Oct 23` while the cutover is
   ahead. The legend names only the states on screen, the others under
   `Other states`. The cells keep at least 1.75rem; on phones the strip
   shows seven cells, the published days, the first days to come, a gap
   mark and the cutover pinned at the end; when the days need more room the
   row scrolls inside itself with edge fades. It also says which
   report is the latest, warns when reports are late, and counts days with no
   report.
4. Side by side (one card per measure, in one column below `lg`): totals,
   identity and wallet record counts, the roots (Python
   computes none and is compared record by record), code versions as
   `validator@…` and `6529chain@…` with copy buttons, run times and sources
   (the Rust core read the day from public Ethereum servers, the snapshot
   checked and the history taken as reported; 6529.io's identities and
   wallets files as two short links, their ids in a tooltip). Under the
   table, what each root binds (the cycle root, the wallet tree of non-sink
   wallet records, the history root over every log from the contracts'
   deployment through the snapshot block, which a new validator may take
   from the network, D130) and what each run time includes.
5. Differences: when there are none, a plain statement that every identity
   and wallet record is equal; otherwise the number of differing identity
   and wallet records, the counts by class (A to D) and by cause (DEV and BUG
   items link to the specification), and the totals' differences. The four
   classes are explained below it, with a note that no record is published,
   the difference possible until the cutover (a sale and a purchase of one
   card in different transactions of one block, DEV-2, the one difference
   D132 names, which would show as class D until 6529 matches it to DEV-2;
   from the cutover 6529.io shows the Rust core's value; on a day whose
   identity records are all equal, that there is none that day), in one
   amber note that also says DEV-2's other case, a token sent out and back
   within one transaction, was settled by D131's netting, with a link to
   how netting works.
   How this works names 6529.io's columns once with the pages' words
   (boosted TDH, final TDH; TDH, base TDH; unweighted days, raw days).
   A Rust–Python difference is class C (the new programs disagree), a
   difference from 6529.io class A or B only when the list of known ones
   explains it, else D; C and D both raise an alarm. The classes have an
   anchor, `#classes`, which How it works step 14 links to.
6. Day by day: a table of the days from `xl` (one card per day below), with
   days that have no report, and per day whether Rust and Python agree
   (every record equal when the verdict is OK, records differ on
   `RUST_PYTHON_MISMATCH`, else the totals); from the seventh day wider
   screens show a chart drawn for the column width, with the table one
   click away.
7. Provenance: the data source first (6529's feed, named with its
   CloudFront host; the job's schedule; the page rechecks the index and the
   latest day every 10 minutes and older days hourly; the index states a
   SHA-256 for each day's file, which the page recomputes from the bytes it
   read, neither being a signature), then one column of facts, a label and a line or two of value
   each: snapshot block with an Etherscan link and hash, history mode with
   its meaning, rule version, registry hash (from the day's file, or the
   specification's; the rule version and registry hash the Rust run states
   count as the day's, with the rule id, P28's tdhRuleId, and whether the
   Python reference states the same registry hash), code versions with the
   P26 commit each computes and the Rust binary's SHA-256,
   when the day's file names them the files by SHA-256 (the canonical
   input, the identities and the wallets record files, then one line saying
   whether the Python reference's are identical), 6529.io's files on Arweave
   with links to each transaction and file and each file's SHA-256, the
   day before with its file's SHA-256, and, when the feed writes them, when
   the index and the day file were generated (`generatedAt`) and the day
   file's own `sha256`, checked against the hash of the file as read. What
   each line means (the
   history mode at length, the P26 commit the runs followed, where the
   registry hash comes from, the first days' runs, the upload signature)
   is in one disclosure under them. Then JSON download links, an RSS feed of every published day
   (`/network/tdh/verification.rss`, one item per day with its verdict,
   its agreement with 6529.io and between the Rust core and the Python
   reference, and its totals, dated when the feed wrote the day's file;
   the channel's build date is the index's), and the SHA-256 of the day file as the page read it (only
   the hash breaks on a phone).
8. Check it yourself: what anyone can check today from public sources
   (6529.io's own API lists every day's upload with its Arweave link, and
   the page prints the upload key's Arweave address,
   `aLSndlbQ2FCefmpjQv0LML9rjghrrGlnaoNXUATHig0`; a holder can find their
   own record in the day's identities file and compare it with their
   profile and Explain my TDH), what that does not reach
   (the validator's source is to be published when the owner decides,
   D116; the Python reference is in 6529's private design repository), the
   three commands that reproduce the day with the source code (they never
   wrap: the block scrolls sideways, so a soft wrap is never mistaken for a
   `\` continuation), and the roots and files to compare.
9. How this works: the daily comparison as one graph (our computation and
   the object under test converging on the comparison, which publishes the
   files this page reads), drawn as a column in a narrow column and as two
   lanes from a 34rem column, each box sized from its label in the site
   font, beside the method's five steps from `xl`. Every section heading carries a link to its anchor.

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
  `rootsNote`, the files' own `generatedAt` and `sha256`, each run's
  `ruleVersion`, `ruleId`, `registryHash` and `binarySha256`, and the day's
  `sources`: the SHA-256 of the canonical input and record files of each
  run and of 6529.io's two files) are shown when present.
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
