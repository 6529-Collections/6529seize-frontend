# How TDH Is Calculated

Parent: [Network Index](README.md)

## Overview

`/network/tdh/how-it-works` follows one day's TDH calculation in the order
the computer does it, in fourteen steps. Each step has plain words, a worked
example, source chips into the specification and, where it has one, a
collapsible `Exact rule` block quoting TDH-v1 (rule version `tdh-v1.0`).

## Location in the Site

- Route: `/network/tdh/how-it-works`
- Page heading: `How TDH is calculated`
- Browser title: `How TDH is calculated, step by step | Network`
- About contents menu: `How TDH Is Calculated`
- TDH section navigation: `How it works`

## Structure

- A pipeline at the top links each stage to its step.
- A `Steps` list highlights the step in view (a sticky rail on desktop, a
  disclosure on phones).
- Steps: one snapshot a day; whole days; which cards count; every copy has a
  timestamp (last in, first out); ownership read between transactions (D131,
  marked Decided and Rule text being finalised); edition sizes and floors;
  rates; base TDH per card; the boost; consolidation; final TDH; a two-wallet
  worked example; network totals; what changes at the cutover.

## Interactive Elements

All compute in the browser for illustration; the computation of record is the
Rust core. Each has a `Reset` button and announces its result politely.

- Day counter: acquisition date and time in UTC, whole days to the 2026-10-14
  23:59:59 snapshot.
- Stack simulator: buy, sell, move a copy to Wallet B, advance time, and
  switch consolidation (applied to the whole history).
- Rate explorer: copies minted and claim limit to edition and rate.
- Boost builder: full sets, Gradients, complete seasons, Genesis and
  Nakamoto, with the boost ladder.
- Household walkthrough: one identity, two wallets, tomorrow, or after
  selling Gradient 2.

## Notes

- Examples use the network of the 2026-10-11 cycle: largest edition 3,941,
  559 eligible Memes in 17 seasons, 101 Gradients, 1,000 NextGen tokens.
- Step 10 states the three-wallet limit of `tdh-v1.0` and notes that a fourth
  wallet is being decided before the cutover.

## Related Pages

- [TDH Verification Dashboard](feature-tdh-verification.md)
- [TDH-v1 Specification](feature-tdh-specification.md)
- [Wallet Consolidation](feature-tdh-consolidation.md)
