## Two payment paths must not be confused

**Built in the older sale contracts:** fixed-price ETH sales and auctions keep their own credits for the poster, protocol, and curator reserve. **Built separately:** revenue rules, fixed-share wallets, and a primary settlement contract. The existence of both systems does not mean the older sales use the newer settlement system.

The retained sale rehearsal uses a test-only legacy Core. A complete paid sale through the permanent Core still needs its exact adapter, mint, artist-consent, and settlement connections proved.

## Who receives the money

In the older code, the poster is named in the signed sale permission. It is not automatically the artist, a collaborator, or the wallet submitting the transaction. The release plan must identify who that account represents.

Fixed-price and auction credits are separate balances in separate contracts. Recipients withdraw what they are owed. A failed withdrawal rolls back that attempt and leaves the credit available; it does not make the payment disappear. Auction bidder refunds are also accounted for separately from seller proceeds.

See [Drop contract](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/domains/mint/StreamDrops.sol), [auction withdrawals](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/domains/auctions/AuctionContract.sol#L334), and [no-bid returns](./fixed-price-sales-and-auctions).

## Split wallets and official settlement

The split factory and wallets represent fixed recipients and shares. The resolver selects revenue policies, and the settlement contract provides a separate payment entry point. These components need to be connected to the actual sale path; merely deploying a wallet does not route sale money into it.

**Agreed but unfinished:** a paid mint must bind the payment to the correct mint operation and enforce the required artist economics. Exact typed settlement and repeated-sale execution identity remain integration requirements. ADR 0018 implements mint replay accounting; it does not complete payment settlement.

**Still proposed:** ADR 0019 describes the payment-intent orchestration change. Its presence is not acceptance or implementation evidence.

See [settlement code](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/domains/revenue/StreamPrimarySaleSettlement.sol), [accepted revenue design](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/adr/0008-revenue-splits-and-royalty-resolver.md), and [ADR 0019](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/adr/0019-payment-intent-orchestration.md).

## Marketplace royalties

**Built in the permanent Core:** `royaltyInfo` asks the configured royalty resolver for a receiver and rate. If the configured pointer is not live, it returns no receiver and zero royalty. Resolver failures are handled by the bounded external-read code. Do not describe this Core as reporting a universal fixed 6.9% royalty; that belongs to the legacy Core.

Royalty information does not force an outside marketplace to pay. Artists and collectors need to see the applicable policy and the marketplace's actual behavior.

Accepted artist requirements include consent for relevant royalty changes and the artist's ability to freeze their own receiver assignment. Completing that authority path remains separate from having a royalty lookup function.

See [Core royalty lookup](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/core/StreamCore.sol#L803), [external read handling](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/core/StreamCoreExternalReads.sol), and [artist requirements](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/adr/0010-world-class-spec-pass.md#L97-L102).

## Questions for reviewers

Can everyone identify the actual recipient, amount, withdrawal contract, and currency? Can sale and mint records be joined without ambiguity? Which marketplace behaviors are verified, and which are only expected?
