# TDH Boost Rules

Parent: [Network Index](README.md)

## Overview

`/network/tdh` is chapter 01 of 6529 Explained ([the hub](../explained/feature-explained-hub.md)):
what Total Days Held is, what it is for, and how it is checked every day. It
explains TDH as an area (whole days held × the card's rate × one boost),
runs the TDH v1.4 rules in the browser, looks up a reader's own record, and
shows how far the evidence reaches today. Every number on the page comes from
the 6529 Explained facts layer: the daily comparison feed, the Lean manifest,
6529.io's editions and the decision record.

## Location in the Site

- Route: `/network/tdh`; `/explained/tdh` redirects here.
- Sidebar path: `About -> Network & Reputation -> TDH`; the hub is
  `About -> 6529 Explained`.
- The chapter bar under the crumbs links Overview, 1 How it works, 2 Your
  wallets, 3 The daily check and 4 How sure, with the shelf (Specification,
  Implementations and vectors, Consolidation design, Versions and boosts,
  Glossary) in a menu; on a phone it scrolls sideways.
- Sections, in order: the hero (`#tdh-minute`), 01 The picture
  (`#tdh-example`, figure `#tdh-reference`), 02 What it is for
  (`#tdh-weight`), 03 Your number (`#your-number`, `#tdh-profile`,
  `#explain`), 04 How we know (`#tdh-verified`), 05 In this chapter
  (`#tdh-deeper`, `#tdh-explore`), and How we know (the sources).
- Older anchors that moved still land: `#tdh-changes` opens Your wallets'
  `#why`, `#tdh-1-4` How it works part C, `#tdh-exact` and `#tdh-how` How it
  works, and `#glossary` or `#glossary-<term>` the TDH glossary.
- The page renders in the reader's language (en-US, en-GB, fr-FR, es-ES,
  de-DE); `?locale=` picks one.

## What Users Can Do

1. Read the first screen: the title `Total Days Held`, one sentence (every
   card you hold adds its rate for each whole day held, one boost multiplies
   the total, and the result weighs your votes on the next Meme card), two
   marks (`Live on 6529.io` TDH v1.4; `Recomputed daily`, equal on so many of
   the published results), `Explain my TDH` and `How it is calculated`, and
   `Today on the network`: the latest total TDH, the identities, `Rust core =
Python reference = 6529.io`, and the last five results with today open.
2. Use the machine beside it: pick a card (Meme #2, #4, #3, and the newest card
   while it is still minting, counted at its claim floor; Meme #562 when the
   newest card has finished minting or its floor is not on record), move the whole days
   held, and choose no boost, one Gradient or a full set. The rows show the
   rate (3,941 ÷ the edition) and the boost, the copy's TDH, and its area
   (width days, height rate, the boost a hatched band); `Tomorrow's result
adds n.` `Break it: sell it` takes the days with the copy; pressing it again
   restores them.
3. Read 01 `A copy's TDH is an area.` and its figure: four real editions
   drawn to scale on one baseline (a rare card, a 310-copy card, Meme #2 and
   FirstGM), each about 3,941 TDH a day before boosts. Under it, `Everyone's
   TDH` draws the whole network as one area split by rank (the top 10, the
   next 90, the next 900 and everyone else), against each group's share of
   the identities, with a table of the same shares and the time 6529.io's API
   was read. It streams in after the page; if the API does not answer, one
   line says so. `?distribution=off` hides it for a review.
4. Read 02 `Your TDH is your weight here.`: TDH is not money; it weighs votes
   on the next card, the Rep and NIC (Network Identity Check) ratings you
   can give, your Level, and later validators (decided, D112; the software,
   0.1.0, is built and being tested; so far only 6529's own validators sign, in testing). The art itself is CC0, with a link to the hub's one-minute
   answer.
5. Use 03 `Explain my TDH`: enter a profile, ENS name or address. 6529.io's
   stored calculation is shown card by card (copies × whole days × rate =
   base TDH), then base × boost = total. When the record's snapshot block is
   the latest compared day's and every identity agreed, the page says the
   record was included and links to that day; otherwise it says the record is
   not in a comparison yet. Public lookups need no wallet authentication; a
   name that is not found and a failed request each have their own answer,
   with `Try again`. Before a lookup, three labelled example records show a
   record found, a card bought this week (it counts from the result after
   next, with the snapshots drawn) and a name not found. `Why did my TDH
change? Pick what happened` opens Your wallets' first section.
6. Read 04 `Checked every day, and published with the files to check it.`:
   seven rungs from written down to signed by validators, each with its
   marks, and a blue line after the third where today's evidence stops. The
   daily rung counts the published results since the first, and names any day
   inside that range with no result yet. Rung 5 shows the zero-knowledge
   proofs in full: program A (the Rust core) in SP1, with the day it proved
   and mainnet's read-only acceptance, and program B in RISC Zero, not yet;
   rung 6 the D128 contract, built and not deployed; rung 7 the validator
   software, built and being tested. Then `This number would be wrong if`
   with what would close each gap, and the candour line with links to the
   daily check and How sure.
7. Use 05 `In this chapter` to open the four spine pages or the shelf (side
   by side on a desktop), and How we know to copy the page as Markdown, cite
   it, report an error, open the corrections log, or download every number's
   source as JSON.

## Calculation Timing and Eligibility

The daily snapshot uses the Ethereum block at or immediately before 00:00 UTC.
The scheduled processing runs afterward, but holding age is calculated from
that block's timestamp. A displayed API date can therefore reflect processing
time rather than the exact snapshot block time; the profile result shows both
the UTC date and block number.

Base TDH includes The Memes, Gradients, and NextGen. Meme Lab and received xTDH
are separate. Memes and Gradients must be at least 24 hours past minting at the
snapshot block. Every surviving copy contributes only positive whole days:

`floor((snapshot block time - acquisition time) / 86,400 seconds)`

An eligible copy with zero whole days can still help complete a collection or
set before it contributes holding days. Internal transfers within the current
confirmed consolidation group preserve the original acquisition time. A sale
or transfer outside that group removes the outgoing contribution; a later
external purchase starts a new holding period. Delegation alone does not
consolidate wallets.

## Edition Weight and Burns

FirstGM (Meme #8) was designed to establish the one-TDH reference: one copy held
for one complete day earns one base TDH before boosts. Its open-mint design is
central to this role. The overview's `Every edition has the same area` figure
draws FirstGM as the unit; the old `#tdh-reference` anchor scrolls there.

The implementation derives edition rates from the largest eligible effective
Meme edition. FirstGM's intended reference role and this implementation rule are
explained separately from its special burn adjustment.

TDH normally uses copies minted through the snapshot, rather than the copies
remaining after burns, to determine edition weight. Burning copies does not
automatically increase the remaining copies' rate. FirstGM (Meme #8) has a fixed
exception: subtract 2,588 from its 6,529 minted copies, giving 3,941. The effective
edition is the greater of the resulting count and the stored edition-size floor.
This adjustment does not apply to other burns.

An edition-size floor is a minimum count used for TDH. If only 200 copies were
minted and the floor is 310, TDH treats the edition as 310 copies. For new Memes,
the floor is the mint limit or 310, whichever is lower. If that limit is
unavailable, the existing floor or supply is used. Older Memes can have different
floors. Gradients and NextGen use their recorded HODL rates. Every card's rate is
rounded to two decimal places before calculating TDH.

## Current Boost Model

The boost is deterministic for a particular snapshot once the eligible cards,
ownership history, edition rates, and active season configuration are known.
It is recalculated from the holdings that still exist; past daily multipliers
are not banked.

The rules panel evaluates current rule and season definitions against the latest
completed snapshot's eligible card range. It does not archive the rule definitions
used by earlier calculations. The profile panel shows stored calculation results.

- The current highest eligible season is excluded from season bonuses. Seasons
  1 through 20 are configured for `+0.05`; later indexed seasons currently have
  no automatic `+0.05` extrapolation.
- A full set means at least one copy of every Meme ID eligible for that
  snapshot, including cards in the current partial season. Missing one ID
  makes the full-set count zero. The pages call it a full set everywhere.
- With a complete collection, the first collection receives the eligible season
  bonus sum. Each additional complete set adds `0.05 * 0.6529^(n-1)`.
  There is no hard set-count cap; the additional-set series approaches
  0.05 / (1 − 0.6529), about `0.14405` (`0.1440507…`), and rounded to
  millionths it reaches `0.144051` at 33 full sets, so further sets add
  nothing.
- Without a complete collection, each complete eligible season contributes its
  configured bonus once. Season 1 can instead expose the Genesis and Nakamoto
  partial bonuses when its full set is incomplete.
- Gradients add `0.02` per distinct Gradient up to five, for a maximum Gradient
  bonus of `0.10`.

These increments are additive. The final multiplier is rounded to two decimal
places after the Meme and Gradient bonuses are combined. A conditional eventual
ceiling is `2.24`: if seasons 1 through 20 are all boostable, a full eligible
collection reaches a base of `2.00`, the additional-set limit reaches
`2.144051`, and five Gradients bring the unrounded result to `2.244051`, which
rounds to `2.24`. This is a ceiling under those conditions, not a promise that
every current holder has that boost. Future cards must first become eligible
for the snapshot. An eligible zero-day copy can complete a set; a full holding
day is required only to contribute holding days. Newly eligible cards can also
make a previously complete collection incomplete.

## Rounding and Display

Rates are rounded to two decimals. Within each wallet and token ID, positive
copy-days are summed, multiplied by the rounded rate, rounded to three decimals,
then rounded to a whole-number base. Consolidated wallets merge those stored
base values and recompute set membership and the boost. Each token's stored base
is multiplied by the current boost and rounded to a whole number; the displayed
TDH is the sum of those per-token results. Multiplying one grand total can
therefore differ from the profile result.

Selling before a snapshot removes the sold card's holding contribution and can
also remove a set or Gradient component from the boost applied to the remaining
cards. Historic versions are available at
[`/network/tdh/historic-boosts`](feature-tdh-historic-boosts.md).

## Ranks and Tied Scores

TDH ranks are consecutive positions starting at 1. Equal displayed TDH does
not give wallets or consolidations a shared rank: the remaining criteria are
compared before resolving a complete tie.

| Ranking                         | Criteria, highest first                                                           |
| ------------------------------- | --------------------------------------------------------------------------------- |
| Overall wallet or consolidation | Boosted TDH, unboosted TDH, Gradients TDH, NextGen TDH                            |
| Memes, Gradients or NextGen     | That collection's boosted TDH, unboosted TDH, NFT balance, then total NFT balance |
| Owners of one Meme card         | TDH for that card, then total boosted TDH                                         |

If all those criteria tie, the lowercase wallet address sorts in ascending
order. For a consolidation, the same comparison uses its consolidation key:
its lowercase wallet addresses sorted in ascending order and joined with
hyphens. Backend and native 6529 Desktop use the same ordering. A tie-break
changes rank positions, not holdings, TDH scores or boosts.

Individual Gradient and NextGen token rankings compare token TDH highest first,
then numeric token ID lowest first. A collection rank of `-1` means there is no
positive boosted TDH for that collection. Empty singleton wallets are omitted
from TDH rankings; wallets with eligible NFTs or membership in a multi-wallet
consolidation remain included even when their TDH is zero.

## Failure and Recovery

If a profile lookup cannot find the identity, check the spelling and submit
again. A temporary lookup failure has a `Try again` action. If the route itself
does not load, reopen it from `Network -> TDH` or use the direct route. Related
destinations are `/network/definitions`, `/network/health/network-tdh`, and
`/network/levels`.

## Language Support

The explainer, profile breakdown, and current-rules copy currently use the
English fallback in all supported locales. Numbers and dates follow the
browser locale. Page metadata uses English. Translation of these sections is
the remaining localization work.

## Related Pages

- [Network Index](README.md)
- [TDH Historic Boosts](feature-tdh-historic-boosts.md)
- [Network Definitions](feature-network-definitions.md)
- [Network Stats](feature-network-stats.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Collected Tab, Stats Summary, and Transfer Mode](../profiles/tabs/feature-collected-tab.md)
