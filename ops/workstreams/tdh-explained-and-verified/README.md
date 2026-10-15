# TDH, explained and verified

Status: built on 15 October 2026 on branch `claude/tdh-explained-and-verified`;
not yet reviewed, merged or deployed.

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
| `/network/tdh` (restructured) | `app/network/tdh/page.tsx`, `page.client.tsx`, `TDHInAMinute.tsx`, `TDHVerifiedDaily.tsx`, `TDHCalculationDetails.tsx` |
| `/network/tdh/how-it-works` | `app/network/tdh/how-it-works/` |
| `/network/tdh/specification` | `app/network/tdh/specification/` |
| `/network/tdh/formal` | `app/network/tdh/formal/` |
| `/network/tdh/implementations` | `app/network/tdh/implementations/` |
| `/network/tdh/verification`, `/network/tdh/verification/{cycleDay}` | `app/network/tdh/verification/` |

Shared pieces live in `app/network/tdh/shared/` (section navigation, source
chips, status pills, rule blocks, copy buttons). The arithmetic is in
`lib/tdh/tdhV1Arithmetic.ts`; the verification data contract, loader, sample
data and states are in `lib/tdh/verification/`.

## Open items before the cutover

- F1: four-wallet consolidations against rule version `tdh-v1.0` need an
  owner decision. Step 10 of How it works marks this an open question, and
  the overview says TDH-v1 counts up to three wallets.
- F2 settled: P26 §7.1 carries D131's uniform netting since `0621ed4`; the
  pages show it as in the specification, with 51 vectors.
- The daily job's feed must carry the optional `ruleVersion`,
  `registryHash`, `cutoffBlockHash`, `transactionNetting` and `live.sha256`
  fields for the dashboard's provenance to come from the data; until then it
  shows the specification's values, labelled as such.
- The Formal model page reads its results from
  `app/network/tdh/formal/leanResults.ts` (model at `fbc9f34`); update it with
  each new build of the model.
- Set `NEXT_PUBLIC_TDH_VERIFICATION_BASE` in production once the daily job
  publishes; until then production shows "Daily reports start on 16 October
  2026" and non-production shows the labelled sample.
- Switch the cutover block in `index.json` to `done` when 6529.io switches.
- The Playwright spec `tests/pages/network-tdh-explained.spec.ts` is not yet
  registered in a pack; `tests/pages/` specs run with the full E2E suite.
- I18n fallback debt: [network TDH pages](../i18n-fallbacks/tdh-explained-and-verified.md).

Live code, tests and the specification text override this plan.
