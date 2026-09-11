# Listings and Offers

Parent: [Media Index](README.md)

The Memes, Meme Lab, Gradients and NextGen card pages show captured OpenSea
quotes in a Listings and Offers section. It gives you a quick Lowest listing
and Highest offer view, then lets you inspect the quoted levels and orders
behind those prices.

## Read listings and offers

The summaries show the lowest captured listing in ETH and the highest captured
offer in WETH. Each price list starts with up to five levels. Use Show all levels
to reveal the complete list, and Show fewer levels to return to the short view.
Listings are ordered from lowest price upward and
offers from highest price downward. Each level shows its unit price and quantity
at that price. Total shows the cumulative quoted quantity. Payment currencies stay separate,
including ETH and WETH; other currencies are identified with their address.

Open Individual listings and offers to inspect each captured order's side,
scope, applicability, currency, price, remaining quantity and expiry. A
partially filled order contributes only its remaining quantity. Trait offers
whose eligibility has not been verified appear separately from the price
levels.

## About these prices

These are captured OpenSea quotes, not a live promise that an order can be
executed. Multiple listings can share the same seller's inventory, and
multiple offers can share a bidder's funds. A collection offer has one shared
budget across eligible cards, so quoted quantities can overlap. Use the About
these prices details in the panel when interpreting the snapshot.

Private, inactive and expired orders are excluded from current public depth.
Some complex orders have no supported fixed unit price and do not contribute to
price levels. Changes recorded after a snapshot can suppress a quote before the
next complete refresh.

## Freshness and recovery

The panel uses a plain Updated time to show how old the captured quote is. A
fresh snapshot is current enough for the capture policy; a stale snapshot is
older and should be read as historical context. Loading, unavailable, empty and
error states are separate: unavailable means no completed capture exists. An
update with no matching price levels can still contain individual unpriced or
unverified offers, which remain available in Individual listings and offers.
A failed request can be retried.

Individual order pagination is tied to a snapshot. If the market changes while
browsing orders, reload the first page to continue from the updated book.

## Related pages

- [NFT Activity Feed](../realtime/feature-nft-activity-feed.md)
- [Media Index](README.md)
- [Docs Home](../README.md)
