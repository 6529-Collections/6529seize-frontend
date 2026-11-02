# TDH, explained and verified

Status: built on 15 October 2026 and revised through round 8 on 16 October 2026 on branch
`claude/tdh-explained-and-verified`; not yet reviewed, merged or deployed.

Pages on 6529.io that explain TDH from a one-minute introduction to the
exact specification, its formal model and its implementations, plus a public
daily verification dashboard comparing the validators' Rust core, the Python
reference and 6529.io's backend. The owner's target is 16 October 2026, at the
latest 17 October 2026; 6529.io switches to the Rust computation around 23
October 2026.

| File | Contents |
| --- | --- |
| [PLAN.md](PLAN.md) | Routes and navigation, full page copy with sources, worked examples, diagrams, interactive elements, the verification data contract, the engineering plan and the delivery sequence |

## What was built

| Route | Source |
| --- | --- |
| `/network/tdh` (restructured) | `app/network/tdh/page.tsx`, `page.client.tsx`, `TDHHero.tsx`, `TDHInAMinute.tsx`, `TDHVerifiedDaily.tsx`, `TDHCalculationDetails.tsx` |
| `/network/tdh/how-it-works` | `app/network/tdh/how-it-works/` |
| `/network/tdh/specification` | `app/network/tdh/specification/` |
| `/network/tdh/formal` | `app/network/tdh/formal/` |
| `/network/tdh/implementations` | `app/network/tdh/implementations/` |
| `/network/tdh/verification`, `/network/tdh/verification/{cycleDay}` | `app/network/tdh/verification/` |
| `/network/tdh/consolidation`, `/network/tdh/historic-boosts` (restyled, linked into the sequence) | `app/network/tdh/consolidation/`, `app/network/tdh/historic-boosts/` |

Shared pieces live in `app/network/tdh/shared/` (section navigation, pager,
source chips, status pills, rule blocks, copy buttons, arrow links, inline
anchor headings, responsive SVG frames, stacked tables, the table style, and
`tdhFacts.ts`, the one place for the counts and commits the pages state). The
arithmetic is the 6529 Explained engine, `components/explained/engine/tdh.ts`
(TDH v1.4, checked against P26's conformance vectors; it replaced
`lib/tdh/tdhV1Arithmetic.ts`); the verification data contract, loader and
states are in `lib/tdh/verification/`.

The pages follow P26 at 6529chain `f840096` (its fifth round, of 16 October
2026): 89 conformance vectors (01 to 88 and 12b). The Lean model's figures
come from its proof manifest, read from the feed at run time; since 16
October 2026 the feed serves round 5 (`6b32f3f`, P26 as of `f840096`, 89 of
89), and the bundled copy is the same file. The daily comparison's builds
are read from each day's file, never fixed in the pages.
`__tests__/app/network/tdh/tdhFacts.test.ts` guards the vector count, the
Lean build, the netting wording, the corrections of the 16 October fact
check, the absence of sample data and the feed's privacy wording.

Layout gate: `6529 run tdh-pages:check -- --base <url>` renders every TDH
route in headless Chromium at 1440, 1280, 768, 390 (phone), 390 and 320
(narrow desktop windows; 320 stands for 400% zoom) and inspects each view
twice, with every `<details>` closed and then open. It fails on page or
element overflow, text that escapes its frame or is clipped, SVG text that
is not 4 px inside the box drawn around it, sideways scrolling outside the
marked scroll regions, text collisions, one word per line, text under 12 px
(SVG included; 9 px in the 320 window), WCAG 2.2 AA failures from axe-core,
SVG text contrast, tables broken by an out-of-flow caption, and controls
too small to hit (a button, switch, select or summary under 24 x 24 px, a
text field or select under 40 px tall, 44 px in the phone view), prose set
wider than 80 characters a line, a heading smaller than the paragraph under
it, a rule-block code line that wraps on a desktop (1280 px and wider) or
does not hang on a phone, SVG text set larger than its section's heading or
than 18.4 px (1.15 times body text, `MAX_SVG_SCALE`), a bordered desktop
card at least 480 px wide whose content stops more than 30% short of its
right edge, a phone H1 that starts more than 200 px down the page, and any
error in the browser console (on the 404 views only the
browser's line for the 404 and the wallet SDK's
Cross-Origin-Opener-Policy check of the page are allowed). A view
whose page or browser crashes, or that does not finish in time, fails at
once instead of stopping the run. `--widths 1024,360d` adds the other
bands.

## Open items before the cutover

- F1: 6529.io accepts a fourth consolidated wallet since 15 October 2026;
  P26 rule version `tdh-v1.0` allows three. Whether TDH-v1 allows four is
  pending an owner decision, and the pages say exactly that wherever
  consolidation is explained (step 10 and step 14 of How it works, the
  overview's FAQ and glossary, both consolidation pages, the
  specification's section 11 and guided setup's note on a fourth wallet),
  and nothing more.
- The Rust core and program B pass all 89 vectors of P26's fifth round on
  the validator's development branch (`30bf8f9`, 16 October 2026). The
  daily comparison runs whatever build each day's file names; the pages
  read it from there (`implementations.rust.commit`,
  `implementations.python.commit`) and know the vector counts of the builds
  listed in `KNOWN_BUILDS` (`shared/tdhFacts.ts`). Add a build there when
  the daily job is redeployed with one the list does not hold; until then
  the page shows the build without a count.
- Five rounds of differential tests (15 and 16 October) raised F1 to F9 and
  E1 to E13; by P26's fifth round (`f840096`) all but E13 were settled, in
  P26 or, for E8, in the vector format and the references; E13 is open for
  the vector format.
- The pages read 6529's public feed, `https://d379duzqnomz3w.cloudfront.net`,
  in every environment; `NEXT_PUBLIC_TDH_VERIFICATION_BASE` only overrides it.
  No sample or bundled verification data ships; Jest serves a verbatim copy
  of the feed's first days
  (`__tests__/lib/tdh/verification/publicFeedFixture.ts`).
- The feed's `cutover` block is optional; the page shows the planned
  cutover, about 23 October 2026 (D132), with no countdown, draws it in the
  day strip as a hatched cell labelled `~23`, and shows "Switched on" only
  when the feed says the cutover is done.
- Since 16 October 2026 the feed states when each file was written
  (`generatedAt`), each day file's SHA-256 in `index.json`, each run's rule
  version, rule id and registry hash, the Rust core binary's SHA-256, and
  the SHA-256 of the canonical input, of each run's identity and wallet
  record files and of 6529.io's two files (`sources`); Provenance shows
  them, and the page checks the stated day hash against the bytes it read.
  It could still state the P26 commit each run computes and the comparison
  tool's commit (the feed's `publish_feed.py` is in the validator
  repository).
- The Formal model page takes its statuses and figures from the proof
  manifest (`formal/manifest.json` on the feed), falling back to the bundled
  copy (`lib/tdh/formal/bundledManifest.json`, round 5 at `6b32f3f`);
  refresh the copy and `leanResults.ts` with each new build of the model.
  The page knows rounds 3 to 5 and switches by the theorems the manifest
  proves.
- Vector 18's description in 6529chain names a real token and cycle
  ("Observed on 2026-10-11 (NextGen #...)"); the pages no longer show it
  (the anatomy uses vector 36) and no longer say the vector files are all
  synthetic, but the vector should be made synthetic before the vectors are
  published (D116).
- A day permalink that names no published day gets the TDH not-found view
  with a real 404 from `proxy.ts` (`lib/proxy/tdhVerificationDay.ts`): one
  that is not a canonical cycle day, is before 20,740 or after the latest
  closed cycle, and one inside that range that the feed's `index.json` does
  not list (the proxy reads the index within 2.5 seconds, again at most once
  a minute for a day it has not seen listed). Only when the proxy cannot
  read the index does such a day fall to the page, which shows the
  not-found page with status 200 (`app/network/loading.tsx` starts
  streaming before the page can call `notFound()`), titled day not found
  and `noindex`. The rewrite passes the day only when it is a number.
- History is labelled not yet fully checked: it is taken as reported by
  public log servers, and stays so, even once 6529's own Ethereum node is
  synced, until the daily run checks the full history against that node.
  The pages give no date for it.
- The Playwright spec `tests/pages/network-tdh-explained.spec.ts` is not yet
  registered in a pack; `tests/pages/` specs run with the full E2E suite.
- How it works links the engine's tests on `main`
  (`__tests__/components/explained/engine/`); the folder reaches `main`
  with the merge. Check that link, and the pages' other `main` links, after
  the merge and before the pages are announced.
- Feed-side, not in this branch: a day file is replaced in place when the
  job recomputes a day (day 20,742's file of 00:40 UTC was rewritten at
  15:59 UTC), so a day's address shows only its current bytes. Keeping
  superseded files by hash (`days/{N}.{sha256}.json`, listed in the index)
  would let Provenance show what a file replaced; signing `index.json`, or
  anchoring each day's SHA-256 on Arweave under 6529's key, would make the
  feed checkable without CloudFront. Both belong to the validator
  repository's `publish_feed.py`.
- The implementations page restates vectors 04, 06 and 23 in full beside
  vector 36 (`implementations/byHandVectors.ts`, generated from their files
  at `f840096`, unchanged at `6b32f3f`); regenerate it if those files
  change.
- I18n fallback debt: [network TDH pages](../i18n-fallbacks/tdh-explained-and-verified.md).

Live code, tests and the specification text override this plan.
