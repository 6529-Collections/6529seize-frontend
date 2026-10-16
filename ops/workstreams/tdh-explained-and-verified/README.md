# TDH, explained and verified

Status: built and revised on 15 October 2026 on branch
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
come from its proof manifest (model at `7bf579a`, P26 as of `1c69528`, 68
vectors). `__tests__/app/network/tdh/tdhFacts.test.ts` guards the vector
count, the Lean build, the netting wording, the absence of sample data and
the feed's privacy wording.

Layout gate: `6529 run tdh-pages:check -- --base <url>` renders every TDH
route in headless Chromium at 1440, 390 (phone) and 390 (narrow desktop
window) and fails on page or element overflow, text that escapes its frame or
is clipped, sideways scrolling outside the marked scroll rows, text
collisions, one word per line, text under 12 px (SVG included), WCAG 2.2 AA
failures from axe-core, SVG text contrast, and tables broken by an
out-of-flow caption. `--widths 768,1024` checks the tablet band by hand.

## Open items before the cutover

- F1: 6529.io's consolidation guide allows a fourth consolidated wallet;
  P26 rule version `tdh-v1.0` groups at most three, and P26 does not say how
  a fourth counts. The pages state both facts (step 10 and step 14 of How it
  works, the overview's FAQ, both consolidation pages); groups of four
  wallets would differ at the cutover unless the owner amends P26 or the
  backend's fourth wallet is excluded.
- The Rust core and program B pass the 75 vectors of P26's fourth round in
  the validator's current code (merged at `28a6072` on 15 October 2026),
  not yet the fifth round's vectors 75 to 88;
  the daily job still runs the Rust core of validator `e127676` (P26
  `0621ed4`, 51 vectors) and the Python reference at `0621ed4`. Update
  `shared/tdhFacts.ts`, the program cards and the check matrix when the
  daily job is redeployed.
- The fourth round of differential tests (6529chain `f854661`) found F8
  (the Rust core's vector reader refused an amount of `2^128` or more after
  the snapshot block), F9 (the Python reference's vector runner did not type
  header timestamps beside an empty `raw_logs`) and E12 (a `timestamps` map
  with no raw logs). P26's fifth round (`f840096`, 16 October) settled all
  three, and the references follow it; the Rust core, program B and the
  Lean model (round 4, `f854661`) have yet to.
- The pages read 6529's public feed, `https://d379duzqnomz3w.cloudfront.net`,
  in every environment; `NEXT_PUBLIC_TDH_VERIFICATION_BASE` only overrides it.
  No sample or bundled verification data ships; Jest serves a verbatim copy
  of the feed's first days
  (`__tests__/lib/tdh/verification/publicFeedFixture.ts`).
- The feed's `cutover` block is optional; the page counts down from the
  start of the daily runs (16 October 2026) to about 23 October 2026 (D132)
  and shows "Switched on" only when the feed says the cutover is done.
- The feed could add SHA-256s of the canonical input and of the Rust and
  Python record files, and the comparison tool's commit, so anyone can
  compare files, not just roots.
- The Formal model page takes its statuses from the proof manifest
  (`formal/manifest.json` on the feed), falling back to the bundled copy
  (`lib/tdh/formal/bundledManifest.ts`, model at `7bf579a`); refresh the copy
  and `leanResults.ts` with each new build of the model. Round 4 of the model
  (6529chain `f854661`, from raw logs) is in `leanResults.ts` already: the
  page switches to it when the published manifest proves
  `computeCycleFromSource_perm`, and until then says that round 4's manifest
  is not published.
- History is labelled not yet fully checked until 6529's own Ethereum node
  (expected about 18 October 2026) is synced and the daily run checks the
  whole history against it.
- The Playwright spec `tests/pages/network-tdh-explained.spec.ts` is not yet
  registered in a pack; `tests/pages/` specs run with the full E2E suite.
- I18n fallback debt: [network TDH pages](../i18n-fallbacks/tdh-explained-and-verified.md).

Live code, tests and the specification text override this plan.
