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
  `firstgm_burn_tx` in a comment; at every width a long line wraps with a
  hanging indent, so nothing scrolls sideways or is cut at the edge, and on
  phones a trailing comment drops below its line. A long block shows its
  first lines and `Show all N lines`. Step prose is set at 16 px, 68
  characters a line.
- The lede says P26 is a proposal that 6529.io computes from the cutover;
  under it one closed disclosure, `How the examples are computed, and which
  day each uses`, opens to the basis: the examples' arithmetic is a
  TypeScript port checked against the values the Python reference prints;
  the tables are computed on 6529.io's server when it renders the page,
  and only the five interactive examples run in the browser;
  the other figures come from P26, its replay and the daily comparison,
  the examples use the network of the October 11, 2026 cycle and the dates
  the cycle of October 16, 2026, with the step sources and a link to the
  port's tests. No daily build is named there: the dashboard names each
  day's. Step 1 says the daily runs take history from public log servers,
  taken as reported until the daily run checks it in full against 6529's
  own node, and links the dashboard's label. Step 10's link order uses
  numbered badges; its link captions are set in the figure's sans, and a
  second identity is drawn in a second tint, with its own legend entry.

## Interactive Elements

These five are the page's only examples that compute in the browser,
for illustration; the computation of record is
6529.io's backend until the cutover and the validators' Rust core from then
on. Each has a `Reset` button and announces its result politely.

Each explorable is titled under a `Try it` eyebrow.

- Count the whole days of one copy (the day counter): days, hours and minutes before the 2026-10-15 23:59:59
  snapshot (block 26,201,364, cycle 20,742), set with steppers and three presets, echoed as a long-form date
  (no native date input, so no date format can be misread), and the whole
  days.
- Send and receive copies, and watch the stack (the stack simulator): starts with one copy bought 30 days ago; buy, sell, move a
  copy to Wallet B and advance time with four equal buttons (two by two on
  phones), and switch consolidation with `A and B consolidated`, a switch
  in the explorables' pill style (off by default, applied to the whole
  history), with a link to step 10 beside it. Each wallet's copies stack upward from its
  name, the box only as tall as its copies.
- Change an edition and see its rate (the rate explorer): copies minted and
  claim limit to edition and rate. Its chart, labelled on both axes, draws
  the rate used and the minted count alone as two lines with a key under
  it, the 300-copy threshold where floors end as a vertical rule, and the
  floor, so the jump at 300 copies shows; a point off the chart is
  named at its edge. Below 300 minted the floor applies only with a claim
  (its limit, capped at 310), and the edition is the larger of the minted
  count and the floor, as the key and the chart's description say in every
  state; with no claim the key says there is no floor. The minted count
  stops at 3,941, the network's largest eligible edition (H), since no
  edition can exceed it.
- Build a collection and see its boost (the boost builder): full sets and Gradients with steppers; complete seasons as
  toggle chips on a grid whose rows balance (6, 6 and 5 on phones; 9 and 8
  from `sm`; the current season dashed), then Genesis and Nakamoto; the
  boost ladder.
- Change the household and see its TDH (the household walkthrough): one
  identity, two wallets, tomorrow, or after selling Gradient 2; one record
  fills the panel, two sit side by side. Step 12 shows the household's
  holdings once, a compact three-column table on phones (card, days × rate,
  base, one row group per wallet), then this walkthrough.

## Notes

- The worked examples and explorables come from a TypeScript port of the
  TDH-v1 arithmetic, tested against values the Python reference printed;
  the page's other figures are stated from P26, the replay and the daily
  comparison. Step 13 gives the latest compared day's total from the
  daily feed (the page revalidates every 10 minutes).
- Rates, boosts and the full example use the network of the 2026-10-11
  cycle: largest edition 3,941 (FirstGM's, after its adjustment), 559
  eligible Memes in 17 seasons, 101 Gradients, 1,000 NextGen tokens; the
  date examples use the cycle of 16 October 2026 (cycle 20,742). The highest
  boost on 2026-10-11 is 2.04.
- Step 5 gives its example (a table, the transaction figure and what the
  daily comparison found on October 14 and 15) in one neutral card, then an
  amber caution at the weight of the example: netting covers the holdings
  only, and three things still read every step. The mint counts do, so a
  mint and its burn inside one transaction can make a card eligible and
  change other collectors' TDH (the formal model's counterexample I,
  linked); two validity checks do too (no wallet sends a copy it does not
  hold, every log's position is valid), and an input that fails either has
  no result. Example cards have a neutral frame and the reading measure;
  the blue rule marks exact rules only. Step 1's history line follows its
  example, with a link that says what "Not yet fully checked" means. Which rules read the transfers
  before netting (the mint facts, the underflow test and the log-position
  checks) and the vectors that pin the rule are in its `Exact rule and
  sources` disclosure. Its transaction figure is centred, with the result
  inside its frame.
- Step 14 says TDH-v1 removes what made today's result depend on timing,
  database order or editable data, in three items: every input read as of
  the snapshot block on the finalized chain, and complete, with seasons
  from a versioned list; netting within one transaction (D131, which
  6529.io's results already match, D132) and on-chain order across
  transactions of one block (DEV-2), where a sale and a purchase of one
  card can still differ until the cutover; and a consolidation change
  counting from the next cycle. An amber line names the one open question,
  a fourth consolidated wallet, with a link to step 10. It links all 19
  differences in the specification, today's comparison and the dashboard's
  four classes.
- Step 12 says its rates are the October 11, 2026 cycle's, and its result
  line explains the daily rate in words (the boost times the rates of every
  copy held a whole day; specification 8.6).
- Step 6 says the floor in one sentence (below 300 copies minted, the
  claim's mint limit, up to 310, when that is more than the minted count)
  and its table adds a claim limit below 310 (149 minted under 200: edition
  200, rate 19.70). Step 9's table says why every Meme but the newest is a
  full set that day (the newest is in season 17, the current season).
  Step 12's phone table writes a holding of two copies one copy a line
  (`200 d`, `+ 120 d`, `× 1.00`).
- Step 10 states the three-wallet limit of `tdh-v1.0` (every pair
  confirmed, groups formed newest confirmed link first) and, in one line,
  that 6529.io accepts a fourth consolidated wallet since October 15, 2026,
  and that TDH-v1 allows three; whether it allows four is pending an owner
  decision. Step 14 points to it as the open question. Its link
  diagrams number each link in on-chain order and draw links inside an
  identity solid and heavier than links between identities, which are
  dashed; the text alternative says the same.
- Diagrams are drawn phone first: the rate chart, the transaction and the
  link diagrams keep their text at 12 px or more at every width, and no
  drawn line crosses a label (`scripts/tdh-pages-check.mjs` checks both).
  The rate chart anchors each label to its point with a short leader; on
  phones NextGen's 3.94 sits above and left of its point and FirstGM's 1.00
  straight above its own, so they never stack; both drawings keep the
  4,000 tick. Its legend is a two-column grid, and its floor item says that
  a claim limit of 310 or more counts as 310 below 300 minted. The rate and boost tables are
  captioned with their cycle, the October 11, 2026 cycle.

## Related Pages

- [TDH Verification Dashboard](feature-tdh-verification.md)
- [TDH-v1 Specification](feature-tdh-specification.md)
- [Wallet Consolidation](feature-tdh-consolidation.md)
