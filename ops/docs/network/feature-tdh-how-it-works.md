# How TDH Is Calculated

Parent: [Network Index](README.md)

## Overview

`/network/tdh/how-it-works` is page 1 of the TDH chapter of 6529 Explained.
It explains every step of TDH v1.4 (P26) as four ideas, time, rarity,
collections and you, then the network's total, and closes with every step
in P26's own order. Each step has a model the reader can move, the exact
rule beside it and a Break it, and every model computes with the TDH v1.4
engine in the browser
(`components/explained/engine/tdh.ts`), on the real Meme editions read from
6529.io's API. Every number on the page comes from the 6529 Explained facts
layer (`lib/explained`) or from the engine; none is typed into the copy.

## Location in the Site

- Route: `/network/tdh/how-it-works` (`?locale=` renders it in en-GB, fr-FR,
  es-ES or de-DE)
- Page heading: `How TDH is calculated`
- Chapter bar: `1 How it works`, under `Read`, in the 6529 Explained shell
  (breadcrumb `6529 Explained / 01 TDH / How it works`, the feed-time pill
  and the chapter switcher)

## Structure

- Header: the chapter eyebrow, the heading, a one-sentence lede, four
  part cards (A Time, B Rarity, C Collections, D You), each a link to its
  part with a small drawing of its idea, and a link to every step in P26's
  order.
- A Time: "A day counts only when it is whole." The model `A card ages`
  (with Guess first) draws four daily snapshots, the copy's arrival and the
  span it is held; the reader picks the arrival (19:05, one minute before
  midnight, one minute after) and the readout names the first result that
  counts a whole day. Break it sells the copy 17 hours after it arrives.
  Then the model `Which cards count` (step 3): the newest cards' real first
  mints on the same timeline, the first result that counts each, and Break
  it replaying the Lean model's counterexample I (a mint and its burn
  inserted ten days early make a card count). The model `Sales and moves`
  (step 4): two linked wallets' stacks of copies; a sale takes the copy
  received last, a move inside an identity keeps its age, and Break it moves
  the old copy in and sells one, so the old copy leaves. The model `Inside
  one transaction` (step 5): the net movement keeps a round trip's days,
  each step would restart them, and Break it shows counterexample H (a mint
  and its burn in one transaction). Every value is the engine's.
- B Rarity: the model `The rate and the edition floor` draws rate against
  edition (the hyperbola, the floor zone, the locked 300, FirstGM and #2 as
  references, a rug of every card); the exact rule beside it substitutes the
  values used. Break it picks the newest card, still minting below 300.
  Then `Base TDH` (step 8) with a worked example, its rounding and P26
  §8.2's exact rule with the example's values.
- C Collections: the model `The boost ladder` (steppers for complete
  seasons, full sets and Gradients, switches for Genesis and Nakamoto) draws
  the boost as parts against today's highest and the rule's ceiling, with
  P26 §8.3 beside it, the line in use lit. Break it adds a sixth Gradient,
  which adds nothing.
- D You: four wallets count as one collector; the model `An identity`
  draws two wallets' cards under one boost band when linked, none apart,
  with the rule for pairs, records and final TDH beside it. Break it links
  one way only, which is no link.
- Then the network: the latest day's total, identities, wallets and change,
  from the daily comparison, with links to the daily check and the day's
  receipt. The cutover to the Rust core is stated as about its planned date.
  The model `Adding it up` shows the example identity's records: the total
  adds the identity's final; Break it adds the wallets' finals instead and
  shows the difference.
- All of it (`#steps`): every step in P26's order, each with its rule in
  P26's notation, its sections and a link to the model that moves it.
- Back to the overview, on to 2 Your wallets, and How we know (sources,
  copy as Markdown, cite, report an error, the corrections log, every
  number's source as JSON).

## Anchors

`#step-1` to `#step-14`, `#tdh-exact` and `#tdh-1-4` still land: steps 1 to
5 in part A, 6 to 8 in part B, 9 in part C, 10 to 12 in part D, 13 and 14
in the network section. Parts are `#part-a` to `#part-d` and `#part-n`;
every step in P26's order is `#steps`.

## Notes

- When a source cannot be read, its numbers say `not available` and a model
  that needs the Meme editions says so instead of drawing.
- The models' states (Break it included) are listed in
  `lib/explained/pages.json` and rendered by `6529 run explained:gates`.

## Related Pages

- [TDH Verification Dashboard](feature-tdh-verification.md)
- [TDH-v1 Specification](feature-tdh-specification.md)
- [Wallet Consolidation](feature-tdh-consolidation.md)
