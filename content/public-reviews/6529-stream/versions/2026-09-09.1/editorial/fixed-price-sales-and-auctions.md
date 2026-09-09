## What is built, and what is still a launch requirement

The retained older code implements fixed-price ETH sales and English auctions. Its rehearsal uses a test-only legacy Core. **It is not a complete sale integration with the new permanent Core.** The accepted sale design covers a wider range of adapters and requires the mint, artist, and payment systems to work together.

See [rehearsal configuration](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/script/RehearseDeployment.s.sol#L5-L18) and [sale specification](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/stream-sales-and-auctions.md).

## Fixed-price sales in the older code

A configured signer approves one token's exact sale terms. The contract checks the permission, deadline, replay state, token data, payer, recipient, and ETH amount before execution. For a paid fixed-price sale, the payer is bound to the sender. A zero-price authorization follows its separate payer rules.

Money is recorded as credit for the named poster, protocol, and curator reserve. Those recipients withdraw later. This path does not distribute proceeds through the separate split-wallet system.

See [Drop checks](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/domains/mint/StreamDrops.sol#L561) and [payment details](./revenue-splits-and-royalties).

## Auctions in the older code

An approved permission identifies the poster, reserve price, and end time. The NFT is held by the auction contract. Bidders submit ETH, and the highest eligible bid wins after the auction ends. Outbid amounts become withdrawable credits instead of forcing an immediate refund into the losing bidder's wallet.

**The poster is the seller account named in the permission. It can differ from the wallet submitting the transaction.** Poster proceeds, cancellation rights, and unsold-token return rights follow that named account.

If there are no bids, the token returns to an ordinary poster wallet. A contract poster receives a claim right so it can choose a receiving address. Cancellation is limited to the pre-bid case and the permitted poster/admin callers. A failed safe transfer rolls back that cancellation.

See [poster binding](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/domains/mint/StreamDrops.sol#L693), [no-bid handling](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/domains/auctions/AuctionContract.sol#L438), and [cancellation](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/domains/auctions/AuctionContract.sol#L409).

## Before a collector signs

The sale screen should show the work and collection, total cost, recipient, sale deadline, refund or cancellation rules, reveal status, and anything that can still change. A pending wallet transaction is not a completed purchase. A contract permission is not proof of artist consent.

**Agreed but unfinished:** complete launch adapters and typed payment settlement must connect these checks to the permanent Core. Dutch auctions, private sales, offers, and other specified modes should not be advertised as available merely because a spec or interface exists.

## Questions for reviewers

Can a collector understand the price, deadline, refund, and no-bid paths without reading code? Can a contract wallet receive its NFT or withdraw its balance? Is the named seller clear, including when another account submits the transaction?
