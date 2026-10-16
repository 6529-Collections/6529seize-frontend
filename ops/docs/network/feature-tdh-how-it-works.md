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

- On tablets, a rail of the fourteen steps at the top, under their section
  titles, links to each section: the calculation runs from step 1 to step 13
  (network totals, drawn as the result); step 12 (the worked example) and
  step 14 (what changes) are drawn apart. From `lg` the sticky list of
  steps beside them takes its place, so the steps never show twice.
- A `Steps` list highlights the step in view (a sticky rail on desktop, a
  disclosure on phones; once that has scrolled away, a bar at the bottom of
  the screen names the step in view and opens the list).
- Steps: one snapshot a day; whole days; which cards count; every copy has a
  timestamp (last in, first out); ownership read between transactions (D131,
  P26 §7.1); edition sizes and floors;
  rates; base TDH per card; the boost; consolidation; final TDH; a two-wallet
  worked example, with a link to Explain my TDH; network totals, with a link
  to the daily comparison; what changes at the cutover.
- Each step's sources and its exact rule share one disclosure at its end
  (`Exact rule and sources`, or `Sources` for a step without a rule), so
  the prose reads as prose. Rule blocks name `SINKS`, `cluster()` and
  `firstgm_burn_tx` in a comment; on phones code keeps its lines and
  indentation and scrolls sideways inside its frame, with a shadow at a cut
  edge, and a long block shows its first lines and `Show all N lines`.
- The lede says P26 is a proposal that 6529.io computes from the cutover;
  under it one line, `Every worked example here is computed in your
browser`, opens to the basis: the P26 commit the in-browser arithmetic was
  rechecked at (`f840096`), that the daily runs follow `0621ed4` with the
  same rule version and registry hash, that the other figures are stated
  from P26, its replay and the daily comparison, and a link to the port's
  tests pinned to the commit that last changed them. Step 1 says the daily
  runs take history from public log servers until 6529's own node is
  synced, and links the dashboard's label. Step 10's link order uses
  numbered badges; its link captions are set in the figure's sans, and a
  second identity is drawn in a second tint, with its own legend entry.

## Interactive Elements

All compute in the browser for illustration; the computation of record is
6529.io's backend until the cutover and the validators' Rust core from then
on. Each has a `Reset` button and announces its result politely.

- Day counter: days, hours and minutes before the 2026-10-15 23:59:59
  snapshot (block 26,201,364, cycle 20,742), set with steppers and three presets, echoed as a long-form date
  (no native date input, so no date format can be misread), and the whole
  days.
- Stack simulator: starts with one copy bought 30 days ago; buy, sell, move a
  copy to Wallet B and advance time with four equal buttons (two by two on
  phones), and switch consolidation with `A and B consolidated`, a switch
  in the explorables' pill style (off by default, applied to the whole
  history), with a link to step 10 beside it. Each wallet's copies stack upward from its
  name, the box only as tall as its copies.
- Rate explorer: copies minted and claim limit to edition and rate.
- Boost builder: full sets and Gradients with steppers; complete seasons as
  toggle chips on a grid whose rows balance (6, 6 and 5 on phones; 9 and 8
  from `sm`; the current season dashed), then Genesis and Nakamoto; the
  boost ladder.
- Household walkthrough: one identity, two wallets, tomorrow, or after
  selling Gradient 2; one record fills the panel, two sit side by side.
  Step 12 shows the household's holdings once, then this walkthrough.

## Notes

- The worked examples and explorables come from a TypeScript port of the
  TDH-v1 arithmetic, tested against values the Python reference printed;
  the page's other figures are stated from P26, the replay and the daily
  comparison. Step 14 counts the days compared from the daily feed (the
  page revalidates every 10 minutes).
- Rates, boosts and the full example use the network of the 2026-10-11
  cycle: largest edition 3,941 (FirstGM's, after its adjustment), 559
  eligible Memes in 17 seasons, 101 Gradients, 1,000 NextGen tokens; the
  date examples use the cycle of 16 October 2026 (cycle 20,742). The highest
  boost on 2026-10-11 is 2.04.
- Step 5 says which rules still read the transfers before netting: the mint
  facts (each card's first mint and the counts behind its edition), the
  underflow test and the log-position checks; a sink is credited but never
  debited. It says that this is why a mint and its burn inside one
  transaction can still change editions (the formal model's counterexample
  I), with a link to the formal page.
- Step 14 says what a collector sees of a sale and a purchase of one card in
  different transactions of one block: a difference in the daily comparison
  until the cutover, the one D132 expects, and TDH-v1's value on 6529.io
  from then.
- Step 10 states the three-wallet limit of `tdh-v1.0` and what P26 §6.3
  does with four wallets that all confirm each other (an identity of three,
  from the newest link, and the fourth on its own), so a group of four that
  6529.io's guide allows splits that way at the cutover unless the rule is
  amended; step 14 lists it, and that consolidations count as they stand at
  the snapshot block, among the cutover changes. Its link diagrams number
  each link in on-chain order.
- Diagrams are drawn phone first: the rate chart, the transaction and the
  link diagrams keep their text at 12 px or more at every width, and no
  drawn line crosses a label (`scripts/tdh-pages-check.mjs` checks both).
  The rate chart sets FirstGM's 1.00 above and left of its point, clear of
  the curve, and drops the 4,000 tick on phones.

## Related Pages

- [TDH Verification Dashboard](feature-tdh-verification.md)
- [TDH-v1 Specification](feature-tdh-specification.md)
- [Wallet Consolidation](feature-tdh-consolidation.md)
