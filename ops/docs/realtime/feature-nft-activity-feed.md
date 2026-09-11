# NFT Activity Feed

Parent: [Realtime Index](README.md)

`/nft-activity` brings on-chain transactions and recorded OpenSea market actions
into one timeline for The Memes, Meme Lab, Gradients and NextGen. Wallet
authentication is not required. Open it from `Network -> NFT Activity`.

## Browse activity

Choose a collection and an activity type to narrow the feed. Alongside sales,
mints, airdrops, transfers and burns, the feed includes recorded listings,
offers, cancellations, expirations and order validity changes. Changing filters
starts a fresh result list. Use **Load more** to fetch older activity.

Rows identify the action, artwork or collection, participating wallets, quoted
payment and time. An offer can apply to a collection rather than one card.
On-chain rows can link to their Ethereum transaction; off-chain market actions
can exist without a transaction hash.

Individual supported card pages also show activity relevant to that card.
Collection-wide offers may appear on eligible cards, but represent one shared
order rather than separate bids for every card.

## Loading and recovery

The feed shows loading, empty and error states. Retry a failed request using
the retry control. Artwork metadata can fall back to a collection name and
token ID when its title or thumbnail is unavailable.

Filters are not saved in the URL. There is no date-range picker or configurable
sort order. Activity is shown newest first.

## What the history means

Sales, mints, transfers and burns come from indexed Ethereum transactions.
Marketplace actions come from captured OpenSea events and observed order
statuses. A status observation can arrive later than the action itself.
OpenSea event delivery is best effort, and earlier off-chain history may be
unavailable. The feed does not guarantee a complete record of every market
action before capture began or during an outage.

An order disappearing from the market is not, by itself, a confirmed
cancellation. A fulfilled-order status is an order update; its associated sale
is recorded separately as an on-chain transaction.

## Related pages

- [NFT Activity Browsing Flow](flow-nft-activity-browsing.md)
- [Card Market Depth](../media/feature-card-market-depth.md)
- [Network Activity Feed](../network/feature-network-activity-feed.md)
- [Docs Home](../README.md)
