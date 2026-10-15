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
  owner decision. Step 10 of How it works marks this "Being decided".
- F2: D131 netting is shown as Decided with "Rule text being finalised" until
  P26 carries it.
- F4: the one-sentence wording on Historic boosts ("Boost schedule 1.4 is the
  schedule that TDH-v1 encodes") is for the owner to confirm.
- Set `NEXT_PUBLIC_TDH_VERIFICATION_BASE` in production once the daily job
  publishes; until then production shows "Daily reports start on 16 October
  2026" and non-production shows the labelled sample.
- Switch the cutover block in `index.json` to `done` when 6529.io switches.
- The Playwright spec `tests/pages/network-tdh-explained.spec.ts` is not yet
  registered in a pack; `tests/pages/` specs run with the full E2E suite.
- I18n fallback debt: [network TDH pages](../i18n-fallbacks/tdh-explained-and-verified.md).

Live code, tests and the specification text override this plan.
