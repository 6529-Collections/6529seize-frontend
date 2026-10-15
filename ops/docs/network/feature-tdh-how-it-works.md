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
- About contents menu: `How TDH is calculated`
- TDH section navigation: `How it works`

## Structure

- A rail of the fourteen steps at the top, under their section titles, links
  to each section: the calculation runs from step 1 to step 13 (network
  totals, drawn as the result); step 12 (the worked example) and step 14
  (what changes) are drawn apart.
- A `Steps` list highlights the step in view (a sticky rail on desktop, a
  disclosure on phones).
- Steps: one snapshot a day; whole days; which cards count; every copy has a
  timestamp (last in, first out); ownership read between transactions (D131,
  marked `In the specification`, P26 §7.1); edition sizes and floors;
  rates; base TDH per card; the boost; consolidation; final TDH; a two-wallet
  worked example, with a link to Explain my TDH; network totals, with a link
  to the daily comparison; what changes at the cutover.
- Source chips sit in the right margin beside each paragraph on wide
  screens, and on a row under it on narrower ones.

## Interactive Elements

All compute in the browser for illustration; the computation of record is
6529.io's backend until the cutover and the validators' Rust core from then
on. Each has a `Reset` button and announces its result politely.

- Day counter: acquisition date and a 24-hour UTC time (HH:MM), echoed in
  the page's date format, and the whole days to the 2026-10-14 23:59:59
  snapshot.
- Stack simulator: starts with one copy bought 30 days ago; buy, sell, move a
  copy to Wallet B, advance time, and switch consolidation (off by default,
  applied to the whole history).
- Rate explorer: copies minted and claim limit to edition and rate.
- Boost builder: full sets, Gradients, complete seasons, Genesis and
  Nakamoto, with the boost ladder.
- Household walkthrough: one identity, two wallets, tomorrow, or after
  selling Gradient 2.

## Notes

- The page's numbers come from a TypeScript port of the TDH-v1 arithmetic,
  whose worked examples are tested against values the Python reference
  printed.
- Dates use the cycle of 15 October 2026 (cycle 20,741); rates, boosts and the full
  example use the network of the 2026-10-11 cycle: largest edition 3,941
  (FirstGM's, after its adjustment), 559 eligible Memes in 17 seasons, 101
  Gradients, 1,000 NextGen tokens. The highest boost that day is 2.04.
- Step 10 states the three-wallet limit of `tdh-v1.0` and notes that
  6529.io's backend can count a fourth wallet that the TDH-v1 specification
  does not include yet. Its link diagrams number each link in on-chain order.

## Related Pages

- [TDH Verification Dashboard](feature-tdh-verification.md)
- [TDH-v1 Specification](feature-tdh-specification.md)
- [Wallet Consolidation](feature-tdh-consolidation.md)
