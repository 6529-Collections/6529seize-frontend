# Listings and Offers

Parent: [Media Index](README.md)

The Memes, Meme Lab, Gradients and NextGen card pages show captured OpenSea
quotes in **Listings & offers**. The section starts collapsed, with the lowest
ETH listing and highest WETH offer visible in its summary. **View listings & offers**
beside the artwork's Collect action opens the section and moves focus to its
heading. Expanding it lets you
inspect the quoted levels and the orders behind those prices.

On Memes, Meme Lab and Gradient cards, artwork details retain mint, edition,
collector and TDH information where applicable. Listing and offer summaries appear
in Listings & offers, without a second set of prices or a market-cap estimate
in the artwork details.

**About this artwork** contains traits, metadata and original files where
available. It starts collapsed on ordinary artwork URLs; existing artwork-focus
links open it. You can expand or collapse it independently of the market section.
Collapsing a section keeps its selection and active review state.

On Memes cards, supply shows **Edition size**, **Ex. research** and
**Ex. museum & research**, alongside **Holding wallets**. Excluded counts remove
burned editions and the named reserve holdings; the combined count removes each
reserve once. These counts do not describe editions listed for sale.
**Supply details & rankings** explains the exclusions and shows their ranks.
Smaller supplies rank first; equal supplies share a rank and the next rank skips
those ties. A card without a recorded ranking shows **Unranked**.

## Read listings and offers

The summaries show the lowest captured listing in ETH and the highest captured
offer in WETH. Each price list starts with up to five levels. Use Show all levels
to reveal the complete list, and Show fewer levels to return to the short view.
Listings are ordered from lowest price upward and
offers from highest price downward. Each level shows its unit price and quantity
at that price. Total shows the cumulative quoted quantity. Expand a price row to
inspect the captured orders behind that quote, including quoted remaining
quantity, expiry, scope and applicability. Open Order information for the wallet,
order reference and currency contract. Each expanded price initially shows up to
five orders; Show all orders reveals the rest.
Payment currencies stay separate, including ETH and WETH; other currencies are
identified with their address. A partially filled order contributes only its
remaining quantity. Non-priceable or unverified orders appear in a separate
contextual disclosure because they do not contribute to the displayed price
levels.

## Collect a listing or accept an offer

On Memes, Gradients and Pebbles cards, **Collect** appears beside each supported
listing price and **Sell** beside offer prices. A level with one loaded order
acts on that exact order directly. When several orders share a price, the action
opens the orders so you can choose one; it does not silently pick a seller or
offer. The price disclosure remains available for inspecting details.
For **Collect**, the site checks that exact listing and adds it to your selection.
Set **Quantity** for supported editions, or choose
**Remove** to take it out. Some listings must be collected as a complete lot.

Select one or more listings, then choose **Review selected listings**. The site
checks each selected order again before opening the purchase review. Choose your
delivery wallet using the same **Deliver to · Change** picker as minting, including
your consolidated wallets or **Send to a fren**. Review the total, fees and gas
before authorizing in your wallet. Supported purchases and deliveries succeed
together in one transaction or all revert; a revert can still cost gas.

Quoted quantities can overlap. Two listings from the same seller can offer the
same copies, so they cannot both be added to this card's selection. A unique NFT
can be selected only once. The site does not replace an unavailable order with a
different listing or silently remove it from your review.

For an eligible offer on this specific card, choose **Sell** at the price level
or **Accept offer** in an expanded order. Connect the
wallet that holds the NFT; holdings in other consolidated wallets cannot be used
by that signer. Supported edition offers allow a quantity within that wallet's
holdings and the offer's remaining amount. Review the WETH you will receive after
fees, token permissions and gas before authorizing. Sale proceeds go to your
signing wallet. Purchase delivery and gifting controls do not apply to accepting
an offer.

Collection-wide offers and verified trait offers can be accepted for the NFT
on the current page. The site binds that exact NFT to the signed criteria;
the displayed row alone is not proof of eligibility. If eligibility cannot be
verified, the offer remains unavailable instead of selling another NFT.
Meme Lab prices are informational. Supported order types, connected wallets and
current market conditions determine which actions can complete. See
[Collecting Tools](collecting.md) for wallet support and transaction recovery.

## About these prices

These are captured OpenSea quotes, not a live promise that an order can be
executed. Multiple listings can share the same seller's inventory, and
multiple offers can share a bidder's funds. A collection offer has one shared
budget across eligible cards, so quoted quantities can overlap. Use the About
these prices details in the panel when interpreting the snapshot.

Private, inactive and expired orders are excluded from current public depth.
Some complex orders have no supported fixed unit price or verified eligibility
and do not contribute to price levels. Changes recorded after a snapshot can
suppress a quote before the next complete refresh.

## Freshness and recovery

The panel uses a plain Updated time to show how old the captured quote is. A
fresh snapshot is current enough for the capture policy; a stale snapshot is
older and should be read as historical context. Loading, unavailable, empty and
error states are separate: unavailable means no completed capture exists. An
update with no matching price levels can still contain individual unpriced or
unverified offers in the contextual disclosure. A failed request can be retried.

Expanded order details load all pages of the captured quote before showing
individual orders. If the market changes during loading, the panel refreshes
prices and retries once automatically. If loading still fails, use Retry details
or Refresh. The panel never combines pages from different updates.

## Related pages

- [NFT Activity Feed](../realtime/feature-nft-activity-feed.md)
- [Media Index](README.md)
- [Docs Home](../README.md)
