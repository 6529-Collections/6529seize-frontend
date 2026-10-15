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
source chips, status pills, rule blocks, copy buttons, arrow links, the table
style). The arithmetic is in `lib/tdh/tdhV1Arithmetic.ts`; the verification
data contract, loader, sample data and states are in `lib/tdh/verification/`.

The pages follow P26 as clarified on 15 October 2026 (6529chain `16d70d0`):
61 conformance vectors (01 to 60 and 12b). `__tests__/app/network/tdh/tdhFacts.test.ts`
guards the vector count, the Lean build and the feed's privacy wording.

## Open items before the cutover

- F1: 6529.io's backend can count a fourth consolidated wallet; P26 rule
  version `tdh-v1.0` counts up to three. The pages state both facts (step 10
  of How it works, the overview, the consolidation page); groups of four
  wallets would differ at the cutover unless the owner amends P26 or the
  backend's fourth wallet is excluded.
- F2 settled: P26 §7.1 carries D131's uniform netting; counterexample H on
  the Formal model page shows the limit of the netting result.
- The Rust core (`0742135`) and program B (`293925d`) were updated to all 61
  vectors on 15 October; those updates are in review. The daily job still
  runs the Rust core at `db72daa` (51 vectors). Update the Implementations
  page's matrix and program cards when they merge.
- The dashboard's sample is a verbatim copy of the daily job's published
  test feed for 14 and 15 October 2026 (`tools/tdh-daily/fixtures/feed` at
  validator `e127676`). The page reads only `differenceSummary` and the
  agreement counts; no per-record difference is published or shown.
- The feed's `cutover` block is optional; the page counts down from the
  first daily run (16 October 2026) to about 23 October 2026 (D132) and shows
  "Switched on" only when the feed says the cutover is done.
- The feed could add SHA-256s of the canonical input and of the Rust and
  Python record files, so anyone can compare files, not just roots.
- The Formal model page reads its results from
  `app/network/tdh/formal/leanResults.ts` (model at `83d0338`); update it with
  each new build of the model.
- Set `NEXT_PUBLIC_TDH_VERIFICATION_BASE` in production once the daily job
  publishes; until then production shows "Daily reports start on 16 October
  2026" and non-production shows the labelled sample.
- The Playwright spec `tests/pages/network-tdh-explained.spec.ts` is not yet
  registered in a pack; `tests/pages/` specs run with the full E2E suite.
- I18n fallback debt: [network TDH pages](../i18n-fallbacks/tdh-explained-and-verified.md).

Live code, tests and the specification text override this plan.
