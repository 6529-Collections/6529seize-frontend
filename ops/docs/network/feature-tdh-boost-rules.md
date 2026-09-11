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
- Page navigation anchors: `#tdh-reference`, `#tdh-example`, `#tdh-profile`,
  `#tdh-1-4`, and `#tdh-exact`
- Related sections also use `#tdh-how`, `#tdh-changes`, and `#tdh-explore`.

## What Users Can Do

1. Read the three-step explanation: count whole days, apply edition rates, and
   apply the collection boost.
2. Open `Try an example` and switch between `Today` and `+30 days`, or sell
   Nakamoto #4 before the snapshot. The fixed illustration uses FirstGM #8
   (2 copies, 100 days, rate 1), Nakamoto #4 (1 copy, 60 days, rate 13.14),
   and one Gradient (30 days, rate 39.02). Its totals are 2,224 today,
   3,897 in 30 days, 1,398 after the sale today, and 2,653 after the sale in
   30 days. The rates and rules stay fixed in this illustration.
3. Use `Explain my TDH` to enter a profile handle or wallet-like identity.
   Public lookups can be submitted without wallet authentication. The page
   shows an empty state before submission, loading, not-found, and retryable
   error states, followed by the stored snapshot when available.
4. Expand collection holdings, boost details, and wallet information in a
   profile result. Holdings tables show token, copies, whole days, rate, base,
   and final TDH; collections with more than 20 tokens use Previous/Next
   pagination.
5. Open `Current boosts` for the active rule summary, or `Exact calculation`
   for rounding, transfer, eligibility, and boost precision details.

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
central to this role. The page introduces FirstGM before the three calculation
steps and provides a `Why FirstGM matters` link to `#tdh-reference`.

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
- A full collection means at least one copy of every Meme ID eligible for that
  snapshot, including cards in the current partial season. Missing one ID
  makes the full-collection count zero.
- With a complete collection, the first collection receives the eligible season
  bonus sum. Each additional complete set adds `0.05 * 0.6529^(n-1)`.
  There is no hard set-count cap; the additional-set series approaches
  `0.144051` before final rounding.
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

## Failure and Recovery

If a profile lookup cannot find the identity, check the spelling and submit
again. A temporary lookup failure has a `Try again` action. If the route itself
does not load, reopen it from `Network -> TDH` or use the direct route. Related
destinations are `/network/definitions`, `/network/health/network-tdh`, and
`/network/levels`.

## Language Support

The explainer, example, profile breakdown, and current-rules copy currently use
the English fallback in all supported locales. Numbers and dates follow the
browser locale. Page metadata uses English. Translation of these four sections
is the remaining localization work.

## Related Pages

- [Network Index](README.md)
- [TDH Historic Boosts](feature-tdh-historic-boosts.md)
- [Network Definitions](feature-network-definitions.md)
- [Network Stats](feature-network-stats.md)
- [Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [Collected Tab, Stats Summary, and Transfer Mode](../profiles/tabs/feature-collected-tab.md)
