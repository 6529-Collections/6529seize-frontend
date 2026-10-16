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
  disclosure on phones; once that has scrolled away, a bar at the bottom of
  the screen names the step in view and opens the list).
- Steps: one snapshot a day; whole days; which cards count; every copy has a
  timestamp (last in, first out); ownership read between transactions (D131,
  marked `In the specification`, P26 §7.1); edition sizes and floors;
  rates; base TDH per card; the boost; consolidation; final TDH; a two-wallet
  worked example, with a link to Explain my TDH; network totals, with a link
  to the daily comparison; what changes at the cutover.
- Each step's sources sit on one `Sources` line at its end, before its
  `Exact rule` disclosure, so the prose reads as prose. Rule blocks name
  `SINKS`, `cluster()` and `firstgm_burn_tx` in a comment; on phones a
  trailing comment moves to a line of its own.

## Interactive Elements

All compute in the browser for illustration; the computation of record is
6529.io's backend until the cutover and the validators' Rust core from then
on. Each has a `Reset` button and announces its result politely.

- Day counter: days, hours and minutes before the 2026-10-14 23:59:59
  snapshot, set with steppers and three presets, echoed as a long-form date
  (no native date input, so no date format can be misread), and the whole
  days.
- Stack simulator: starts with one copy bought 30 days ago; buy, sell, move a
  copy to Wallet B, advance time, and switch consolidation (off by default,
  applied to the whole history). Each wallet's copies stack upward from its
  name, the box only as tall as its copies.
- Rate explorer: copies minted and claim limit to edition and rate.
- Boost builder: full sets and Gradients with steppers; complete seasons,
  Genesis and Nakamoto as toggle chips in one wrapping row (the current
  season dashed); the boost ladder.
- Household walkthrough: one identity, two wallets, tomorrow, or after
  selling Gradient 2; one record fills the panel, two sit side by side.
  Step 12 shows the household's holdings once, then this walkthrough.

## Notes

- The page's numbers come from a TypeScript port of the TDH-v1 arithmetic,
  whose worked examples are tested against values the Python reference
  printed.
- Rates, boosts and the full example use the network of the 2026-10-11
  cycle: largest edition 3,941 (FirstGM's, after its adjustment), 559
  eligible Memes in 17 seasons, 101 Gradients, 1,000 NextGen tokens; the
  date examples use the cycle of 15 October 2026 (cycle 20,741). The highest
  boost that day is 2.04.
- Step 5 says which rules still read the transfers before netting: the mint
  facts (each card's first mint and the counts behind its edition) and the
  underflow test; a sink is credited but never debited.
- Step 10 states the three-wallet limit of `tdh-v1.0` and what P26 §6.3
  does with four wallets that all confirm each other (an identity of three,
  from the newest link, and the fourth on its own), so a group of four that
  6529.io's guide allows splits that way at the cutover unless the rule is
  amended; step 14 lists it, and that consolidations count as they stand at
  the snapshot block, among the cutover changes. Its link diagrams number
  each link in on-chain order.
- Diagrams are drawn phone first: the rate chart, the transaction and the
  link diagrams keep their text at 12 px or more at every width
  (`scripts/tdh-pages-check.mjs` checks it).

## Related Pages

- [TDH Verification Dashboard](feature-tdh-verification.md)
- [TDH-v1 Specification](feature-tdh-specification.md)
- [Wallet Consolidation](feature-tdh-consolidation.md)
