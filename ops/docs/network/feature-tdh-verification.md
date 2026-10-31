# The daily check (TDH verification)

Parent: [Network Index](README.md)

## Overview

`/network/tdh/verification` is page 3 of the TDH chapter of 6529 Explained:
the public, daily check of TDH. Every day the Rust core recomputes every
collector's TDH from Ethereum, a separately written Python reference
recomputes it from the same input, and both are compared, record by record,
with what 6529.io published. The page shows the latest result as a verdict
with its limit inside, every result so far, how the check runs, how far a
green day goes, and who can repeat each step today. No individual record is
ever shown: the daily job publishes differences only as counts.

`/network/tdh/verification/{cycleDay}` is one day's receipt: the day's
comparison on one slip, in a fixed order, with every hash needed to check it
and the file's SHA-256 computed in the reader's browser.

Both pages are built on the 6529 Explained kit (`components/explained/`):
every number on them is a fact of the public feed or of the decision record,
read when the page is, with its source (`Every number's source, as JSON`
downloads them).

## Location in the Site

- Routes: `/network/tdh/verification`, `/network/tdh/verification/{cycleDay}`
- Headings: `The daily check`; a receipt, `The result dated {date}`
- Browser titles: `The daily check · 6529 Explained`;
  `{date} · The daily check · 6529 Explained`
- Chapter bar: `3 The daily check`, between `2 Your wallets` and `4 How sure`
- `?locale=` (en-GB, fr-FR, es-ES, de-DE) reads either page in that locale.

## Entry Points

- `Today's receipt` on the daily check, and each result tile in its ribbon.
- The chapter bar on every TDH page.
- The previous and next buttons on a receipt.
- The RSS feed's items, at `/network/tdh/verification.rss`.

## What the Daily Check Shows

1. **Header.** `Chapter 01 · 3 The daily check`, the title, a one-sentence
   lede, and the scope: all identities, the dates the results cover, when
   the next result is due (about 50 minutes after the open day's snapshot),
   and the RSS feed.
2. **The verdict** (`#side`). The latest result's word with its mark
   (`Equal` is Tested; `Known cause`, when every difference from 6529.io is
   a known class A or B; `Differs`, when 6529.io differs with no known cause
   or the two programs disagree; `Not compared`, when 6529.io's upload was
   not read that day), its date and cycle, one sentence for holders (for
   example "6529.io's TDH matches two separately written recomputations, for
   all 10,273 identities."), the wallets, and the limit inside the block
   while the history is not checked: "Not guaranteed: the history before the
   snapshot." Beside it the three totals as an equation (= in green, ≠ in
   rose), the day's file with its SHA-256 and whether it equals the index,
   and a JSON link. Actions: `Today's receipt`, `Check your own record`, and
   `Show a day that fails`.
3. **Show a day that fails.** A Break it: the verdict and the latest ribbon
   tile turn into a constructed failing day, marked Simulated ("a
   constructed day, not a real one"): 6529.io differs from both
   recomputations on 2 identities, 118 TDH lower, class D, with the incident
   steps (Detected, Classed, Investigating, Fixed, Closed) and 6529.io's
   total shown as ≠. The day is the latest real file with the disagreement
   written in, every sum valid against the feed's schema
   (`app/network/tdh/verification/components/simulatedDay.json`). The button
   then reads `Back to today` and keeps the keyboard's focus.
4. **Every result so far** (`#history`). One tile per published day, each a
   link to its receipt, then the open day with its countdown, the days to
   come (not on a phone), and the cutover, "about" (D132), while its planned
   date is still ahead. ↻ marks a file rewritten after its run; the caption
   says which days were rewritten, and when. A cycle the index skips between
   two results (a run that published nothing) is drawn in its place as ◌ "no
   file", with no receipt to open. Ten tiles across on a wide screen; when
   the feed holds more days than fit, the newest are drawn, the caption says
   so, and `All N days, each with its receipt` opens every day since the
   first result below the ribbon.
5. **01 How the check runs** (`#classes`). "One input, two programs, one
   comparison.": the lanes from Ethereum's logs to the canonical input, the
   two programs, their byte-identical record files and the comparison with
   6529.io's signed upload; the agreement bars for the comparisons the run
   makes; the four difference classes (A deliberate, B a known bug of the old
   code, C the programs disagree, D 6529.io differs with no known cause);
   and whether any day so far had a difference of any class.
6. **02 Read it right** (`#diff`). "A green day is a strong check, not a
   proof.": what it shows (three items) and what it does not (four: that
   Ethereum's history was read correctly, who wrote the comparison, the
   independence of operation, a second reading of the logs).
7. **03 Check it yourself** (`#check`, `#provenance`). "Who can repeat each
   step today.": seven steps, each tagged with who can repeat it now; the
   `curl … | sha256sum` command for the day's file with the hash the index
   states; and how to build your own TDH (aim for the cycle root).
8. Back to `Your wallets`, next to `How sure`, and How we know: the feed's
   files and times, 6529.io's upload, and the decisions the page relies on.

## What a Receipt Shows

- The title `The result dated {date}`, the result before as a link and the
  result after, or the open day, not a link, while the next result is not
  out yet.
- The receipt, its rows always in this order: result, snapshot block,
  verdict with its counts, total TDH, differences, history, rule version as
  the file reports it, rule ID, registry hash, cycle root, wallet root,
  history root, input file (published as a hash only), record files (Rust =
  Python, byte for byte), and this file. On a file written under the retired
  rule name the rule version row carries a dashed note naming D136 and
  D137, P26's current rule version and the new rule ID; on a file written
  under TDH v1.4 a note says its rule ID and registry hash are P26's, and the
  registry hash names the vector that pins it.
- This file: the browser hashes the file exactly as the page's server read
  it and says whether it equals the index ("your browser computed it from
  the 3,503 bytes of the file").
- `Copy the receipt as text` (every hash in full) and `The day as JSON`
  (the feed's file).
- Beside it: the day at a glance (total, change since the day before,
  identities, wallets, both run times), the two right totals (with and
  without the burn addresses), and a note for anyone writing their own TDH.
- Below: the builds that computed the day, and How we know.
- If the index lists the day but its file cannot be read, the page says so
  and shows no receipt.

## Not Found

A day permalink that names no published day answers 404 with the receipt
pages' own not-found view, inside the site: the proxy
(`lib/proxy/tdhVerificationDay.ts`) rewrites a path that is not a cycle day
in canonical form, a day before the feed's first, a day after the latest
closed cycle, or a day the feed's index does not list, to
`/network/tdh/verification/day-not-found` with status 404. The address bar
keeps the path asked for; `?day=` carries the day only when it is a cycle
number, and the page never repeats any other text of the address. The view
says `No published day {day}` (or `No published day here`), why (before the
first published day, with where 6529.io's own earlier uploads are listed;
not closed yet, with when it closes and when its result is published; or
not in the feed), and links to the latest result and the daily check.
Marked `noindex`. When the proxy cannot read the index, the page itself
calls `notFound()`.

## Data Source

- 6529's public TDH feed, `https://d379duzqnomz3w.cloudfront.net`
  (`NEXT_PUBLIC_TDH_VERIFICATION_BASE` overrides it): `index.json` and
  `days/{cycleDay}.json`, read through the 6529 Explained facts layer
  (`lib/explained/`). A receipt's numbers are facts of its own day
  (`tdh.day.{cycle}.*`), the daily check's of the latest day
  (`tdh.latest.*`). The index and the latest day are cached 10 minutes, an
  older day an hour. The daily check reads the newest nine day files, a
  receipt its day and the day before.
- The feed's verdicts are `OK`, `OK_NO_LIVE`, `RUST_PYTHON_MISMATCH`,
  `LIVE_UNAVAILABLE` and `LIVE_UNEXPLAINED`; the page never reads the
  feed's `differences` list, which the job always publishes empty.
- The rules' current version, rule ID and registry hash come from the
  decision record's snapshot (`lib/explained/data/record.json`, P26).
- There is no bundled or sample data: Jest tests serve the feed as fetched
  on 2026-10-18 (`lib/explained/fixtures/feedFixture.ts`).

## Failure and Recovery

- Feed unreachable: the verdict block says the public feed could not be
  read just now, and the page prints no number from an older copy.
- A day's file unreadable: its receipt says so.

## Related Pages

- [How TDH Is Calculated](feature-tdh-how-it-works.md)
- [TDH Specification](feature-tdh-specification.md)
- [TDH Implementations](feature-tdh-implementations.md)
- [TDH Boost Rules](feature-tdh-boost-rules.md)
