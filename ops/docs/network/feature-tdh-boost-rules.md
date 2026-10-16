# TDH Boost Rules

Parent: [Network Index](README.md)

## Overview

`/network/tdh` explains how Total Days Held is built from whole holding days,
edition weighting, and the collection boost. It is a user-facing guide and
profile lookup, with links to the current calculation details and historic
boost rules.

## Location in the Site

- Route: `/network/tdh`
- Sidebar path: `Network -> TDH`
- Page sections, in order: `#tdh-minute`, `#tdh-verified`, `#tdh-profile`,
  `#tdh-1-4`, `#tdh-changes`, `#glossary`, `#tdh-deeper`, and `#tdh-explore`.
- Older anchors still land in the right place: `#tdh-exact` and `#tdh-how`
  open [How TDH Is Calculated](feature-tdh-how-it-works.md), `#tdh-example`
  opens its step 12 worked example, and `#tdh-reference` scrolls to
  `#tdh-minute`.
- The TDH tab row links the overview to How it works, Specification, Formal
  model, Implementations and Verification; its `More` menu adds Historic boosts,
  Consolidation and the glossary. A previous/next pager ends every TDH page.

## What Users Can Do

1. Read the header: `TDH`, the one-line promise (Total Days Held: the art
   you hold, and how long you have held it), the formula Days × Rate × Boost
   = TDH worked for one card (100 × 12.71 × 1.02 = 1,296), and a one-line
   strip: the latest day's agreement between 6529.io, the Rust core and the
   Python reference (on the Rust run's input), the track record in bold
   (`Equal on 3 of 3 published days.`) and a `Not yet fully checked` pill,
   linking to the verification dashboard. The `TDH` eyebrow shows from `md`
   up, so on a phone the heading starts high on the screen.
2. Read `TDH in a minute`: hold (whole days), weigh (a Meme's rate is the
   largest edition over its own; a Gradient's divides by the number of
   Gradients, 101, and a NextGen token's by its collection's size) and boost
   (one multiplier), drawn for one copy of a 310-copy Meme held 100 days by a
   collector with one Gradient: 100 days x rate 12.71 = 1,271 base, x boost
   1.02 = 1,296 TDH from this card; the Gradient earns TDH of its own on top.
   The example card is captioned with its cycle (`Worked example · the
October 11, 2026 cycle`, the day the specification was replayed against
   6529.io); the card's rate and boost are the same on the latest day. Its
   days panel draws ten blocks of ten days in one colour, labelled.
   The rate is drawn as two bars on one scale, and the boost as a scale from
   1.00 to 2.04, the highest boost on the October 11, 2026 cycle. Under it,
   what moves the number: without the Gradient 1,271, with one full set
   instead (1.80) 2,288. FirstGM (Meme #8) is introduced there as the
   reference card.
3. Read `Checked daily, in public`: first the latest day from the feed, as
   figures (the total TDH identical in all three, identity records and
   wallet records equal), how they were read (the Python reference on the
   Rust run's input; 6529.io's backend from its own indexer, its files
   fetched from Arweave and accepted only when its upload key's signature,
   size and data root verify; in one closed disclosure), the builds the
   day's file names (`Builds: Rust core validator@…, Python reference
   6529chain@…`), every published day as a dated chip, the `Not yet fully
   checked` label, which links to the latest day's provenance, with its
   meaning beside it (taken as reported until the daily run checks the
   full history against 6529's own node, with no date), and a link to the
   dashboard;
   then three points (written separately, each reproducing every
   conformance vector; specified in Lean as a proposal, with the netting
   theorem's hypotheses: every address's net movement, the burn addresses'
   included, and both versions of the day with a result; compared every
   day, scheduled from October 16); then `Found by the checks, before
launch`, four dated findings (the edition-floor text corrected on
   October 15, the first netting rule, the Lean model's counterexample to a
   draft claim, and five rounds of differential tests, all settled but
   E13), and a link to the Lean proof manifest on the daily feed.
4. Use `Explain my TDH` to enter a profile handle or wallet-like identity.
   Its results use the same words as the other TDH pages (raw days, base
   TDH, boost, final TDH).
   Public lookups can be submitted without wallet authentication. The page
   shows an empty state before submission, loading, not-found, and retryable
   error states, followed by the stored snapshot when available. When the
   snapshot is the latest compared day's and all three computations agreed
   on every record, a line says this record was reproduced by two
   separately written programs from one input, and by 6529.io. Each
   collection's row says how many cards it holds.
5. Expand collection holdings, boost details, and wallet information in a
   profile result. Holdings tables show token, copies, whole days, rate, base,
   and final TDH; collections with more than 20 tokens use Previous/Next
   pagination.
6. Open `Current boosts` for today's values (read on the server, so they
   render with the page; a failed refresh in the browser keeps them): the
   full-set boost and the Gradient bonus, an arrow link to the four boost
   figures these pages quote, drawn on one scale on the Historic boosts
   page (`#boost-figures`), the season bonuses as ranges (for example `Seasons 1–16: +0.05 each`) with Genesis and
   Nakamoto, and how the bonuses combine in a disclosure. Then `When your
holdings change` for common questions about sales, transfers and new
   cards, and `Glossary` for the terms the TDH pages use (including netting,
   the underflow test, conformance vectors, roots, the cutover, classes A to
   D and program A and B).
7. Follow `Go deeper` to How it works (every step, with examples you can
   change), the specification, the formal model, the implementations and the
   verification dashboard.

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
central to this role. `TDH in a minute` introduces FirstGM as the reference
card; the old `#tdh-reference` anchor scrolls there.

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
  `0.144051`, and rounded to millionths it reaches that at 33 full sets, so
  further sets add nothing.
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
