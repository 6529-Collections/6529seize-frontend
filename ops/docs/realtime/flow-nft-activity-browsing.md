# NFT Activity Browsing Flow

Parent: [Realtime Index](README.md)

1. Open `Network -> NFT Activity` or `/nft-activity`.
2. Choose a collection and activity type. Use listings or offers to explore
   quoted market activity, or sales to inspect completed transactions.
3. Read the artwork, wallet, quantity, payment and time in each row. Collection
   offers may have no individual token ID.
4. Open an artwork link for its card page, or an available transaction link for
   on-chain details. Off-chain market actions do not require a transaction.
5. Use **Load more** for older results. Changing either filter starts again
   with the newest matching activity.
6. Use **Retry** if a request fails. An empty result means no matching recorded
   activity was returned.

The NFT feed is separate from `/network/activity`, which covers profile and
network actions. Market history is based on captured events; it is not a
complete historical order ledger.

See [NFT Activity Feed](feature-nft-activity-feed.md) for supported actions,
history limitations and recovery, or [Card Market Depth](../media/feature-card-market-depth.md)
to inspect current quoted asks and offers.
