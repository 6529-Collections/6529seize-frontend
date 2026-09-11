# Collecting Tools

## Overview

Collecting tools help you complete profile sets, compare observed listings and
explore TDH. Browse individual artworks on The Memes, 6529 Gradient and NextGen
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

The [**Listings and Offers**](feature-card-market-depth.md) section on a
supported artwork's page has a **Collect** action that opens purchase review on
the same page. Its more-actions menu contains **Make an offer**, **List for
sale** and **Review offers**.
These actions open a dialog immediately, with a loading message while the
artwork and trading tools load. Current orders and terms are checked before a
purchase can proceed.

**Browse artwork** links in Collecting tools return to the original collection
pages. The planner has no separate artwork search or browsing grid. Existing
links for browsing or a specific artwork open the corresponding collection or
card page.

## User Journey

1. Start in **Complete a set**, or choose **Lowest listings** or **TDH**.
   In the set planner, choose **Collection** first. The Memes offers **Full
   set**, **Season** and **Artist** under **Build toward**. Gradients opens its
   full set directly; Pebbles offers its named sets.
2. Connect your profile to inspect its holdings. Wallet controls describe where
   NFTs are held, which wallet pays or signs, and where a purchase is delivered.
3. Choose the season, artist or Pebbles set when applicable, then
   **Copies per NFT** and budget.
   Copies per NFT is the total you want to hold of each required NFT, including
   copies already in your profile.
   Review missing requirements, checked artworks, unavailable items and the
   proposed purchases. A partial plan leaves its unfilled requirements visible.
4. Select an exact artwork and available order. Review quantity, currency,
   total price, fees, signing wallet and recipient before proceeding.
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
observed listings with prices and quantities. Open an artwork for its card page,
or select **Collect** to check the current order and review a purchase. No listing
results does not mean that no orders exist elsewhere. If the listing source
cannot be loaded, use **Try again** or return to the collection page.

### Buy for another wallet

The recipient picker follows minting and shows your profile's confirmed wallets
automatically. Choose one, or use **Send to a fren** to search a profile or ENS
name, or enter another wallet. Check the full resolved address before
authorization. The paying wallet is separate from the recipient. The NFT
is delivered directly to the chosen recipient in the purchase transaction.
There is no separate onward transfer. A Safe can receive a purchase from a
supported paying wallet.

A gift outside your profile is shown as a gift. It does not increase your
profile's projected completion or TDH. One recipient is selected per purchase;
a completion plan with several orders requires separate reviewed purchases.

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

The separate time-based profile comparison uses a verified official TDH snapshot
and includes bonus changes on existing holdings. Gifts outside the profile add
no TDH to that profile. Its future projection and estimated gas reserve serve a
different purpose from the base-rate listing grid. Open **Project profile TDH**
to choose a budget and time horizon; **Back to TDH listings** returns to browsing.
A direct link with a collection selected keeps that collection.

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
Multiple-order purchases use separate reviewed transactions. These controls do
not create collection-wide or trait-group offers.

## Related Pages

- [Media](README.md)
- [NFT actions](nft/README.md)
- [NextGen](../nextgen/README.md)
- [Profiles](../profiles/README.md)
- [API tools](../api-tool/README.md)
