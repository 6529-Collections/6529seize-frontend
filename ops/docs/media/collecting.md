# Collect

## Overview

Collect brings artwork discovery, profile set completion, TDH comparisons and
marketplace actions together. The supported collections are The Memes,
6529 Gradient and NextGen Pebbles. Collecting belongs to your profile: holdings
across its confirmed consolidated wallets count together.

## Location in the Site

- `/collect`: browse artwork, compare available listings and plan acquisitions.
- `/collect/orders`: inspect trades, potential offers and transaction recovery.

## Entry Points

Open **Collect** in the Collections navigation, or use an artwork's Collect
action. Collected and Pebbles Trait Sets also link to relevant collecting goals.

## User Journey

1. Choose a collection and an intent: browse, find low prices, complete a season
   or set, collect an artist, or compare additional TDH.
2. Connect your profile to inspect its holdings. Wallet controls describe where
   NFTs are held, which wallet pays or signs, and where a purchase is delivered.
3. For a completion goal, choose its definition, number of copies and budget.
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

### Buy for another wallet

The recipient picker follows minting: choose a wallet in your profile or enter
a third-party wallet. Check the resolved address before authorization. The NFT
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

Choose a time horizon and compare additional TDH for the current profile.
Comparisons use a verified official snapshot and include changes to bonuses on
existing holdings. Gift allocations outside the profile contribute no TDH to
that profile. Cost comparisons include an estimated gas reserve and identify
the observed candidate pool; they are not a guarantee of the lowest price
across every marketplace or of future TDH rules.

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

## Related Pages

- [Media](README.md)
- [NFT actions](nft/README.md)
- [NextGen](../nextgen/README.md)
- [Profiles](../profiles/README.md)
- [API tools](../api-tool/README.md)
