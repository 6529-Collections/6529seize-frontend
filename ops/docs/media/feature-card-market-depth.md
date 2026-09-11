# Listings and Offers

Parent: [Media Index](README.md)

The Memes, Meme Lab, Gradients and NextGen card pages show captured OpenSea
quotes in a Listings and Offers section. Where a card has Additional details,
that content appears as a compact disclosure above Listings and Offers and
starts collapsed unless a link opens those details directly. Listings and
Offers gives you a quick Lowest listing and Highest offer view, then lets you
inspect the quoted levels and the orders behind those prices.

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
