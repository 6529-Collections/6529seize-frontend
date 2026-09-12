# Collecting Tools

## Overview

Collecting tools help you complete profile sets, buy selected NFTs, plan offers
and explore TDH. Browse individual artworks on The Memes, 6529 Gradient and NextGen
Pebbles collection pages, and review trades on the artwork's own page.
Collecting belongs to your profile: holdings across its confirmed consolidated
wallets count together.

## Location in the Site

- `/collect`: opens the set planner, with **Lowest listings** and **TDH** tools.
- `/collect/orders`: inspect trades, potential offers and transaction recovery.
- `/the-memes`, `/6529-gradient` and `/nextgen/collection/pebbles`: browse artwork
  and open individual cards.

## Entry Points

Open **Collecting tools** in the NFT navigation, or choose **Complete my set** on
a collection page. The Memes carries the selected season into the planner, or
opens the full Memes set when no season is selected. Gradients opens the full
Gradients set; Pebbles opens its trait-set planner. Collected and Pebbles Trait
Sets also link to relevant collecting goals.

Supported artwork pages place a priced **Buy** action near the artwork summary,
before the longer description and [**Listings and Offers**](feature-card-market-depth.md).
The lowest supported listing is selected automatically. **Deliver to · Change**
lets you choose the receiving wallet; additional listings remain available under
**Other listings**. Buy checks the selected order again before showing exact
terms for wallet approval. A changed order requires another review.

**Make an offer** is visible beside buying. **List for sale** appears when a
confirmed wallet in the profile holds the NFT. Connect that holding wallet to
list it; profile consolidation does not grant another wallet permission to sign.
The more-actions menu contains **Review offers**.
If ownership is still loading, **List for sale** stays visible but unavailable.
If that check fails, choose **Try again** beside the action.

The **View The Memes**, **View Gradients** or **View Pebbles** link returns to the
current collection page. On narrow screens it appears as an arrow with the same
accessible name. The planner has no separate artwork search or browsing grid. Existing
links for browsing or a specific artwork open the corresponding collection or
card page.

## User Journey

1. Start in **Complete a set**, or choose **Lowest listings** or **TDH**.
   In the set planner, choose **Collection** first. The Memes offers **Full
   set**, **Season** and **Artist** under **Build toward**. Gradients opens its
   full set directly; Pebbles offers its named sets.
2. Connect your profile to inspect its holdings. Wallet controls describe where
   NFTs are held, which wallet pays or signs, and where a purchase is delivered.
3. Choose the season, artist or Pebbles set when applicable. Type a name in
   the selector to filter its options; artist names can be searched directly.
   Set **Copies per NFT** and, optionally, a **Budget cap (ETH, optional)**.
   Copies per NFT is the total you want to hold of each required NFT, including
   copies already in your profile.
   Leave the budget cap blank to estimate the full goal. An entered cap includes
   estimated gas. This is an analysis constraint; buying still requires a fresh
   price review and wallet approval.
   Review missing requirements, checked artworks, unavailable items and the
   proposed purchases. A partial plan leaves its unfilled requirements visible.
4. Select some or all proposed purchases. **Review purchase** brings them into
   one review with quantities, delivery addresses and an estimated total.
   **Review live total** checks every selected order and shows the exact price,
   fees and gas reserve before wallet approval. To propose your own prices,
   choose **Make offers for missing NFTs** and review each NFT's offer separately.
5. Approve the required token permission if needed, then review and authorize
   the purchase transaction or fixed-price order signature in your wallet.
6. Follow the result in Orders. A sent transaction, a mined transaction and a
   confirmed result are separate states.

## Common Scenarios

### Complete a profile set

Season, full-set, artist and Pebbles trait goals use the same profile-wide
scope. Holdings in two different confirmed wallets can satisfy complementary
requirements. Changing a custody filter does not change the collecting subject.
Pebbles supports Palette, Size, Traced and Ultimate; Ultimate can satisfy several
trait requirements with one token. Artist goals let you include collaborations.

### Compare available listings

Choose **Lowest listings**, then The Memes, Gradients or Pebbles. This tool shows
observed listings with prices and quantities, showing each NFT once at its lowest
supported purchase price. An indivisible lot says how many copies its price
includes. Open an artwork for its card page, or select its **+** to add it to
your purchase selection. The control becomes a checkmark; select it again to
remove that NFT. The selection stays available while switching between Lowest
listings and TDH. **Review purchase** lets you buy some or all selected items;
**Plan offers** opens a price plan for those NFTs.
No listing results does not mean that no orders exist elsewhere. If the listing
source cannot be loaded, use **Try again** or return to the collection page.

### Buy for another wallet

**Deliver to** shows the selected destination compactly. Choose **Change** to
open the mint-style picker with your profile's confirmed wallets. Choose one,
or use **Send to a fren** to search a profile or ENS
name, or enter another wallet. Check the full resolved address before
authorization. The paying wallet is separate from the recipient. The NFT
is delivered directly to the chosen recipient in the purchase transaction.
There is no separate onward transfer. A Safe can receive a purchase from a
supported paying wallet.

A gift outside your profile is shown as a gift. It does not increase your
profile's projected completion or TDH. A multiple-item review starts with one
delivery address for the selection. You can change the destination of each NFT
and split an edition purchase across addresses. Each allocation must have a
valid address and the allocated quantities must equal the purchased quantity.

### Buy a selection together

Select NFTs from Lowest listings, TDH or a completion plan, then open
**Review purchase**. Select all or keep only the items you want, and check the
delivery addresses. The first total is an estimate; **Review live total**
requests current executable terms for every selected order.

Supported selections are purchased in one Ethereum transaction. Every selected
purchase and delivery succeeds together, or the transaction reverts. A revert
can still cost gas. The site does not silently replace an unavailable listing,
remove an item or split your purchase into several transactions. If the
selection cannot be bought together, edit it and review again.

The review shows the full purchase price, fees and gas reserve. A quote that
expires requires a refreshed review. Changing the selection, quantity, payer or
delivery addresses also requires another review. Orders retains the purchase
until its receipt confirms all selected deliveries.

### Make or accept an offer

Exact-token offers use WETH and receive NFTs in the signing wallet. A signature
can authorize a later fill while you are away. Required offer fees, listing
creator support, and the exact fees signed into existing orders are shown in
review. There is no additional 6529 platform fee.

Offer review reserves the full potential WETH exposure against other offers
prepared here. This reservation is conservative: it can exist even when the
site has not received a signature or confirmed publication. Other sites and
wallet activity can still change the available balance. Offers are not escrow.
Filling one offer can consume WETH allowance needed by another; review balances
and approval amounts before continuing with remaining offers.

### Plan offers for selected NFTs

Select NFTs in Lowest listings or TDH, then choose **Plan offers**. A completion
plan also offers **Make offers for missing NFTs**, including required NFTs that
have no supported listing. When several artworks could satisfy a trait, the
offer plan uses the chosen artworks rather than making offers on every
alternative.

**Enter each price** is the default. Set **WETH per NFT** for each artwork,
its quantity and a default expiry of 1, 7 or 30 days. Open **Details & expiry**
to change an individual NFT's expiry. For editions, the unit price is
multiplied by the number of copies. A budget constrains an allocation; it does
not replace the individual NFT prices. Search the plan and select all or only
the NFTs you want to offer on.

Other **Price method** choices calculate proposed prices once:

- **Match observed WETH offer** uses an applicable observed offer for that NFT.
- **Above observed WETH offer** adds your chosen percentage to that reference.
- **Below observed ask** subtracts your chosen percentage from the ask reference.
  Native ETH asks are compared with WETH at 1:1 before wrapping costs.
- **Conservative allocation** uses an **Offer budget (WETH)** and available
  reference evidence to propose opening prices. It can leave part of the budget
  unused; it does not predict acceptance or guarantee the best allocation.

An edited price is kept when recalculating. **Use calculated price** releases
that manual choice. Missing or stale references need a manual price or another
calculation; the site does not invent a price. Observed orders are references,
not confirmation that their makers are funded or that a seller will accept.

Choose **Check amounts and WETH** for manual prices, or **Calculate prices** for
the other methods. Funding belongs to the paying wallet; WETH in other profile
wallets is not pooled. The check accounts for that wallet's potential offer
exposure. **Review offer** opens one NFT's exact quantity, price, fees and expiry
for wallet authorization. Quantity is fixed during this review; return to the
offer plan to change the number of copies. Each offer is signed separately and can fill
independently. Calculating prices does not publish offers, open the wallet or
automatically follow future bids.

Pending and published offers remain counted against the allocation budget while
you move back to collecting or change the selected NFTs in the same workspace.
**Awaiting offer status** is still a commitment; **Check offer status** reopens
that offer. Closing its review does not free its amount for another offer.
After a reload, enter a fresh budget and check funding again; the backend's
potential offer exposure still applies. Changing the profile or paying wallet
starts a separate workspace.

### Compare TDH

Choose **TDH** to see listings immediately, starting with The Memes. You do not
need a profile, budget or time horizon to browse. The grid compares each NFT's
best supported indexed ETH ask by **base TDH/day per ETH**. A higher value means
more base TDH accrual for the listed price. Signed listing fees are included;
gas and current availability are checked at purchase.

Holding time starts when you receive an NFT. The seller's accumulated TDH does
not transfer, and this comparison excludes profile and set multipliers. The
rate describes a full held day rather than a promise about tomorrow's snapshot.
For an indivisible lot, the displayed price and rate cover its exact quantity.

Open **How TDH value works** for the source snapshot and coverage. Indexed prices
can change, and a bounded comparison identifies when more indexed asks were
outside its coverage. The site checks a fresh executable quote before purchase.

### Reach target TDH

From **TDH**, choose **Reach target TDH**. Enter the TDH you want to hold and a
timeframe of 1, 30, 90 or 365 days, then choose The Memes, Gradients or Pebbles.
The default is a total future TDH target, 30 days and The Memes.
**Back to TDH listings** returns to the immediate price comparison.

The projection uses your profile's confirmed consolidated holdings and a verified
official snapshot, including changes to bonuses on existing holdings.
**Deliver to** must be one of your profile's wallets: a gift outside the profile
adds no TDH to it. The paying wallet and delivery wallet can differ for a purchase.

Advanced options include **Additional TDH above my baseline**, measured above
the projected no-purchase baseline on the same future date.
**Maximum purchase budget (ETH)** is optional. Leave it blank to estimate the
purchase budget for the target. An entered limit includes signed listing fees
but excludes gas, which is quoted at purchase review. It does not authorize
spending.

Results compare the no-purchase baseline, proposed TDH and target on the shown
UTC date. **No purchases needed** means the baseline already meets the target.
Otherwise, the result shows the best purchase plan found, its exact NFTs and
quantities, and the estimated purchase subtotal. A closest plan keeps the
remaining TDH gap visible. This is a bounded search of indexed asks, not proof
of the global minimum cost or that an unmet target is impossible. Open the
assumptions for coverage and the snapshot used.

**Review purchase** opens those exact acquisitions in the shared purchase review.
Live prices, availability, gas and funding are checked there. Changing the NFTs,
quantities or delivery wallet requires a new projection before relying on its
TDH result. Changing the target, timeframe or profile also clears the old result.

**Plan offers for these artworks** opens individual offer prices for the proposed
NFTs. It requires the projected destination to be the paying wallet, because
offers deliver to their signer. If another profile wallet was selected, choose
the paying wallet and run the projection again first. Offers add TDH only after
they fill; a later fill leaves less holding time. The purchase projection does
not forecast when, or whether, those offers will fill.

### Save a rule for reviewed purchases

Save exact artwork targets from a plan with a fixed paying wallet, recipient,
unit-price ceilings, total review budget, gas reserve, expiry and action limit.
Rules prepare one ETH purchase at a time for your review and wallet approval.
Inspect them in Orders, where you can pause, resume and reconcile the outstanding
purchase. Pause and expiry retain unresolved operations. A page timeout is not
proof that a purchase was never sent.

Confirmed acquisitions count permanently toward the rule. Selling or moving
those NFTs later does not cause the rule to buy replacements. The limits apply
to this preparation workflow, not arbitrary external wallet transactions or an
on-chain autonomous mandate.

## Edge Cases

- Listing discovery is incomplete. No supported exact offer does not mean that
  no collection or trait offers exist elsewhere.
- A plan initially checks one best exact listing per artwork. Finishing that
  scan does not exhaust market depth. Additional copies may need other orders.
- A changed profile membership, catalog or recipient requires a fresh plan.
- The quote review timer measures freshness. It does not expire an already
  signed offer. The order's own expiry and chain state determine its lifetime.
- ERC-721 approvals can be token-specific. ERC-1155 approval is collection-wide.
  The review identifies the actual spender and permission scope. WETH approvals
  use bounded amounts rather than default unlimited allowances.
- Accepting a WETH offer can require a bounded WETH allowance for its signed
  fees even when incoming proceeds fund those fees.

## Failure and Recovery

If the artwork cannot be loaded for trading, choose **Try again** in the dialog.
Loading, retry and review stay in the same dialog. **Close** or **Escape** returns
you to the card. Closing while it loads cancels that attempt; the review will
not open later when loading finishes.

If an order changes, refresh its available terms and review again. The site
does not substitute a different NFT into an exact-item purchase.

If publication is uncertain, the order may still be usable. Keep its potential
exposure until confirmed cancellation, expiry or fill. If broadcast is uncertain,
retain the transaction hash and retry reconciliation of that same transaction.
Do not send another purchase merely because a page timed out.

If the wallet may have submitted a transaction without returning its hash, the
review changes to **Checking the outcome**. That operation cannot send another
transaction, including from another browser, while the attempt is unresolved.
Open your wallet's activity, copy the hash into **Transaction hash from your
wallet**, and select **Check this transaction**. The site verifies the exact
sender, NFT action and transaction details before accepting it. This also works
for an approval and when local browser recovery data is unavailable. A hash
that cannot yet be verified remains available for another check; checking it
does not send a replacement transaction.

Orders created here retain their original terms for direct on-chain cancellation
even when the marketplace provider is unavailable. Cancellation costs gas and
can lose a race to a fill. Pausing new trading or revoking an approval does not
permanently cancel an already signed order; reapproval can make it fillable again.

If a wallet moves to another profile, connect that original signing wallet to
recover its earlier orders and transaction hashes. Historical orders identify
their original profile. Start a fresh review in the current profile before
preparing another purchase or signature.

## Limitations / Notes

Trading uses Ethereum mainnet and supported OpenSea Seaport orders. ETH and WETH
are identified by their chain and contract, and exact amounts are preserved.
Execution from smart contract wallets and inside the native app is unavailable
until those execution paths are supported. Mobile web can use a supported wallet.
Profile consolidation and social proxy access do not authorize another wallet
to trade your assets.

Automatic wallet execution is not available. Programmatic preparation still
requires the owner to review and authorize each purchase or order. Signed limit
orders can be filled by others until effective cancellation or expiry.
Multiple-order purchases require supported exact ETH listings and a successful
simulation of the whole selection. These controls do not create collection-wide
or trait-group offers. A plan of individual offers has separate signatures and
fills; it does not have the all-or-revert guarantee of a supported purchase
selection.

## Related Pages

- [Media](README.md)
- [NFT actions](nft/README.md)
- [NextGen](../nextgen/README.md)
- [Profiles](../profiles/README.md)
- [API tools](../api-tool/README.md)
