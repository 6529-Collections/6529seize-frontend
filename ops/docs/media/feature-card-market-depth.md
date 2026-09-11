# Card Market Depth

Parent: [Media Index](README.md)

The Memes, Meme Lab, Gradients and NextGen card pages show captured OpenSea
market depth. It helps you see how many editions are quoted at different prices,
beyond the lowest listing or highest offer alone.

## Read the market

The panel shows the best quoted ask and bid, the snapshot time and its freshness.
Asks are listed from lowest price upward; bids are listed from highest price
downward. Each level shows a unit price, quantity at that price and cumulative
quoted quantity. Payment currencies are shown separately, including ETH and
WETH.

Inspect individual orders for their maker, remaining quantity, price, expiry
and whether they apply to this card or a wider collection. A partially filled
order contributes only its remaining quantity. Trait offers whose eligibility
has not been verified appear separately from the price levels.

## Understand quoted quantities

Quoted depth is not a guarantee that every displayed order can be executed.
Multiple listings can share the same seller's inventory. Multiple offers can
share a bidder's funds. A collection offer has one shared budget across eligible
cards. Do not add it across every card as independent buying power.

Private, inactive and expired orders are excluded from current public depth.
Some complex orders have no supported fixed unit price and do not contribute
to price levels. Changes recorded after a snapshot can suppress a quote before
the next complete refresh.

## Freshness and recovery

An unavailable panel means there is no completed capture yet. An empty completed
snapshot means no matching public quotes were captured. These are different
states. Older snapshots are marked stale; use the displayed time when judging
the data. A failed request offers a retry control.

Order pagination is tied to a snapshot. If the market changes while browsing
orders, reload the first page to continue from the updated book.

## Related pages

- [NFT Activity Feed](../realtime/feature-nft-activity-feed.md)
- [Media Index](README.md)
- [Docs Home](../README.md)
