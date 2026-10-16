# TDH, explained and verified

Status: built on 15 October 2026 and revised on 16 October 2026 on branch
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
arithmetic is in `lib/tdh/tdhV1Arithmetic.ts`; the verification data
contract, loader and states are in `lib/tdh/verification/`.

The pages follow P26 at 6529chain `f840096` (its fifth round, of 16 October
2026): 89 conformance vectors (01 to 88 and 12b). The Lean model's figures
come from its proof manifest (the feed's is the model at `7bf579a`, P26 as of
`1c69528`, 68 vectors); while the feed has not published a newer one, the
Formal model page shows round 5 (`6b32f3f`, 89 of 89) from its committed
manifest in a "not yet published" panel.
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
it, and any error in the browser console (on the 404 views only the
browser's line for the 404 and the wallet SDK's
Cross-Origin-Opener-Policy check of the page are allowed). A view
whose page or browser crashes, or that does not finish in time, fails at
once instead of stopping the run. `--widths 1024,360d` adds the other
bands.

## Open items before the cutover

- F1: 6529.io's consolidation guide allows a fourth consolidated wallet;
  P26 rule version `tdh-v1.0` groups at most three, so P26 §6.3 forms an
  identity of three from four wallets that all confirm each other (from the
  newest link) and the fourth counts on its own. The pages say so (step 10
  and step 14 of How it works, the overview's FAQ, both consolidation
  pages, the specification's section 11 and the dashboard's classes); such
  groups split that way at the cutover unless the owner amends P26. The
  guides recommend three, and guided setup warns once a fourth wallet is
  listed.
- The Rust core and program B pass the 75 vectors of P26's fourth round in
  the validator's development branch (`28a6072`, 15 October 2026; the
  repository's main is not updated), not yet the fifth round's vectors 75
  to 88;
  the daily job still runs the Rust core of validator `e127676` (P26
  `0621ed4`, 51 vectors) and the Python reference at `0621ed4`. Update
  `shared/tdhFacts.ts`, the program cards and the check matrix when the
  daily job is redeployed.
- The fourth round of differential tests (6529chain `f854661`) found F8
  (the Rust core's vector reader refused an amount of `2^128` or more after
  the snapshot block), F9 (the Python reference's vector runner did not type
  header timestamps beside an empty `raw_logs`) and E12 (a `timestamps` map
  with no raw logs). P26's fifth round (`f840096`, 16 October) settled all
  three, and the references and the Lean model's round 5 (`6b32f3f`)
  follow it; the Rust core and program B have yet to.
- The pages read 6529's public feed, `https://d379duzqnomz3w.cloudfront.net`,
  in every environment; `NEXT_PUBLIC_TDH_VERIFICATION_BASE` only overrides it.
  No sample or bundled verification data ships; Jest serves a verbatim copy
  of the feed's first days
  (`__tests__/lib/tdh/verification/publicFeedFixture.ts`).
- The feed's `cutover` block is optional; the page counts down from the
  start of the daily runs (16 October 2026) to about 23 October 2026 (D132)
  and shows "Switched on" only when the feed says the cutover is done.
- The feed could add SHA-256s of the canonical input and of the Rust and
  Python record files, each day file's SHA-256 and the previous day's in
  `index.json`, the rule version, registry hash and P26 commit of each run,
  and the comparison tool's commit, so anyone can compare files, not just
  roots (the feed's `publish_feed.py` is in the validator repository). Day
  pages already show the SHA-256 of the file they read.
- The Formal model page takes its statuses from the proof manifest
  (`formal/manifest.json` on the feed), falling back to the bundled copy
  (`lib/tdh/formal/bundledManifest.ts`, model at `7bf579a`); refresh the copy
  and `leanResults.ts` with each new build of the model. Rounds 4
  (`f854661`) and 5 (`6b32f3f`) are in `leanResults.ts` already: the page
  switches when the published manifest proves `computeCycleFromSource_perm`
  or `canonicalTransfers_oneLog`. Publishing round 5's manifest
  (`design/tdh-lean/proof-manifest.json` at `6b32f3f`, with its source
  fields) to the feed is the next step; it is outside this repository. Until
  then the page labels its body with the published build and gives round 5
  a section of its own.
- Vector 18's description in 6529chain names a real token and cycle
  ("Observed on 2026-10-11 (NextGen #...)"); the pages no longer show it
  (the anatomy uses vector 36) and no longer say the vector files are all
  synthetic, but the vector should be made synthetic before the vectors are
  published (D116).
- A day permalink that cannot name a published day (not a canonical cycle
  day, before 20,740 or after the latest closed cycle) gets a plain 404 from
  `proxy.ts` (`lib/proxy/tdhVerificationDay.ts`). A day inside that range
  that the feed does not list still shows the not-found page with status
  200 (`app/network/loading.tsx` starts streaming before the page can call
  `notFound()`), titled day not found and `noindex`.
- History is labelled not yet fully checked until 6529's own Ethereum node
  (expected about 18 October 2026) is synced and the daily run checks the
  whole history against it.
- The Playwright spec `tests/pages/network-tdh-explained.spec.ts` is not yet
  registered in a pack; `tests/pages/` specs run with the full E2E suite.
- I18n fallback debt: [network TDH pages](../i18n-fallbacks/tdh-explained-and-verified.md).

Live code, tests and the specification text override this plan.
