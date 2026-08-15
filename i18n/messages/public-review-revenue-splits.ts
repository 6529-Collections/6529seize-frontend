export const PUBLIC_REVIEW_REVENUE_SPLITS_MESSAGES = {
  "publicReview.pages.revenueSplitsAndRoyalties.currentSummary":
    "How ETH sales record money today, how the separate payment system differs, and why marketplace royalties are optional.",
  "publicReview.pages.revenueSplitsAndRoyalties.currentEditorial": `**The short answer:** The reviewed source has two payment systems.

- Current fixed-price ETH sales and English auctions keep their own split rules and payment records.
- A separate resolver, settlement contract, and split-wallet system exists, but the current sale paths do not use it.
- Stream's Core contract reports one fixed ERC-2981 royalty. A marketplace can choose whether to pay it.

The separate system has three main parts:

- A **resolver** chooses which split rule applies.
- **Settlement** records one sale as paid and moves its money.
- A **split wallet** holds money for one fixed list of recipients and shares.

This page uses three clear states. **Current code** means behavior in the pinned source. **Accepted design** means an approved launch target that is not yet current behavior. **Proposed** means the design is still open.

## One wei should have one accountable path

A **wei** is the smallest unit of ETH. Every wei should be counted once.

For each sale, the public record should show:

- which sale received the money;
- which payment token and amount arrived;
- which split rule was used;
- who can withdraw each share;
- where the money is held; and
- what happened to any rounding remainder.

If one wei is counted twice, someone may be paid too much. If money owed to a user is treated as spare money, an emergency withdrawal may take it.

## The current native-sale paths keep local accounting

### Current sale code

Signed fixed-price ETH sales run through \`StreamDrops\`. English-auction ETH sales run through \`AuctionContract\`.

Each contract keeps its own ledger. A **ledger** is a record of money received and money owed.

Each contract chooses its split in this order:

1. a rule for the token;
2. a rule for the collection;
3. the contract's default rule.

The fixed-price contract records shares for the poster, protocol, and curator pool. The auction contract records the same shares and refunds for outbid bidders. The **poster** is the account named in the signed sale approval.

The contracts record these amounts first. Posters and protocol recipients withdraw later. An authorized action moves curator money to the curator pool.

### Accepted design for launch

The rehearsal also deploys the separate resolver, settlement contract, split factory, and split wallets. It does not connect them to the current fixed-price or auction paths.

[Accepted ADR 0008](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0008-revenue-splits-and-royalty-resolver.md#L187-L228) says launch sales should use resolver-backed pull accounting. That is the accepted target, not the current pinned behavior.

### Evidence

- [\`StreamDrops.proceedsSplitFor\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L540-L559) applies token, collection, then contract precedence.
- [\`StreamDrops._creditFixedPriceProceeds\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L635-L681) records fixed-price balances.
- [\`AuctionContract._creditAuctionProceeds\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/AuctionContract.sol#L471-L509) records auction balances.
- [The rehearsal wiring](https://github.com/{sourceRepository}/blob/{sourceCommit}/script/RehearseDeployment.s.sol#L192-L271) deploys the separate system without adding it to the current sale path.

## Pull credits keep one recipient from blocking everyone

A **credit** is money the contract records as owed. A credit that has not been paid is a **liability**.

Here is a small example. A sale receives 101 wei. Its chosen split is 50% to the poster, 25% to curators, and 25% to the protocol. The code records 50 wei for the poster, 25 wei for curators, and 26 wei for the protocol. The extra one wei goes to the protocol because the other two shares round down.

These amounts are credits. They are not sent during the sale. Their owners withdraw them later.

This keeps the sale safe if one recipient rejects ETH. A failed withdrawal reverts, so it does not erase the credit. The contract can also show how much it still owes.

The ledgers remain separate. Fixed-price credits stay in \`StreamDrops\`. Auction proceeds and bidder refunds stay in \`AuctionContract\`. Split-wallet money stays in each wallet until recipients claim it.

### Evidence

- [Fixed-price withdrawals](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L389-L438) clear a credit and then send ETH. A failed send reverts the whole withdrawal.
- [Auction withdrawals](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/AuctionContract.sol#L315-L369) keep bidder refunds and sale proceeds separate.
- [Accepted ADR 0003](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0003-payment-accounting.md#L87-L111) requires pull payments and protects money owed from emergency withdrawal.

## The settlement foundation gives a sale one replay-safe identity

### What the separate contract does

\`StreamPrimarySaleSettlement\` can send primary-sale money to a split wallet. Only a caller approved by the contract owner can start this action.

It makes one key from the chain, settlement contract, sale details, people, and amount. It marks the key as used.

**Replay** means trying to use the same sale payment again. The used key blocks that second payment. If settlement fails, the whole transaction rolls back, including the used mark.

The contract can also require the current split rule to match the rule expected by the sale. Another mode allows the current rule but records that it changed.

### Missing payment-token link

For an ERC-20 payment, the caller supplies the token contract separately. That token address is not part of the sale record or the settlement key.

The first successful call with any active token can therefore use the shared key. A complete sale path must bind the exact payment token to both the signed sale and its replay protection.

### Evidence

- [Native and ERC-20 settlement entry points](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamPrimarySaleSettlement.sol#L87-L145)
- [The current settlement-key fields](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamPrimarySaleSettlement.sol#L357-L376)
- [Split-rule matching records](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamPrimarySaleSettlement.sol#L209-L335)

## Resolution separates policy from the sale mechanic

The sale contract decides how a sale happens. The resolver decides which payment rule applies.

### Current resolver code

The current resolver stores primary-sale rules. Its owner can set a fixed split or a template. The owner can clear a rule while it is changeable, or freeze it so it cannot change.

The resolver checks for a rule in this order: token, collection, then default.

### Accepted design

[Accepted ADR 0008](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0008-revenue-splits-and-royalty-resolver.md#L138-L185) gives the launch resolver a wider job. It should provide rules for both primary revenue and Core royalty information.

[Accepted ADR 0021](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0021-immutable-revenue-resolver-validation-adapter.md#L2-L18) adds a small adapter that checks data for the resolver. The resolver would still own the rules and all authority.

ADR 0021 is accepted design, not implemented behavior at this source commit. Implementation review and deployment proof are still separate steps.

### Evidence

- [Setting and freezing primary-sale rules](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamRevenueResolver.sol#L170-L257)
- [Token, collection, then default lookup](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamRevenueResolver.sol#L259-L280)

## Immutable split profiles make collaboration inspectable

A **split profile** is a fixed list of recipients and shares. Its split wallet holds money for that list.

### Current split-wallet code

\`StreamSplitFactory\` sorts and checks the list. It gives each valid profile one ID and one predictable wallet address.

The factory rejects a zero address, a zero share, a total other than 1,000,000 parts, or a repeated account-and-label pair. The same account may use different labels. Its shares are added together for payment.

Once created, the profile cannot change. A new split needs a new profile. Future payments may use the new profile, but money already in the old wallet stays there for the old recipients.

Recipients claim their shares after the wallet receives ETH or an approved ERC-20 token.

### Evidence

- [Profile checks and predictable wallet deployment](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamSplitFactory.sol#L71-L141)
- [Exact entry rules](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamSplitFactory.sol#L328-L390)
- [Wallet setup and share checks](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamSplitWallet.sol#L61-L125)
- [Pull-based release](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamSplitWallet.sol#L159-L248)

## Native ETH accounting must distinguish liabilities from surplus

A **liability** is money the contract still owes or must keep reserved. **Surplus** is money left after every liability is protected.

The current Drop and Auction contracts report their local owed totals. They calculate emergency-withdrawable money as contract balance minus money owed.

This is safe only if every credit, refund, and reserve is counted. ETH sent directly or forced into a contract may increase surplus, but it must not change what users are owed.

### Evidence

- [\`StreamDrops.totalOwed\`, \`surplus\`, and \`emergencyWithdrawable\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L438-L475)
- [\`AuctionContract\` local solvency views](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/AuctionContract.sol#L648-L679)

## Approved ERC-20 transfers require balance checks

An **ERC-20** is a payment token, such as a fungible token used instead of ETH. This section applies only to the separate settlement and split-wallet system.

### Current checks

The payment-token registry gives each ERC-20 token a status. Settlement accepts only a token marked active.

The settlement contract also checks that the token address has code, its transfer calls return \`true\`, and every balance changes by the exact amount.

These checks reject many unsafe token behaviors. For example, they reject a token that takes a transfer fee or reports success without moving the full amount.

### Missing deployment proof

The source shows the checks. It does not prove which tokens will be active in a real deployment. Reviewers must inspect the deployed registry. A frontend list should copy that blockchain state, not replace it.

### Evidence

- [Active-token and exact-balance checks](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamPrimarySaleSettlement.sol#L340-L567)
- [Payment-token status records](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamAssetPolicyRegistry.sol#L7-L82)
- [Pinned rejection tests](https://github.com/{sourceRepository}/blob/{sourceCommit}/test/StreamPrimarySaleSettlement.t.sol#L778-L1043)

## Payer-bound token sales remain a proposal

### Current code

An approved settlement caller can pull an active ERC-20 token from the payer. The payer must first give the settlement contract an **allowance**, which is permission to spend that token.

The current contract does not check a payer-signed \`PaymentIntent\`. It also does not track payer-specific use or cancellation of that intent.

### Proposed ADR 0019

ADR 0019 is proposed, not accepted. [Read the pinned ADR](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0019-payment-intent-orchestration.md#L1-L89).

The proposal adds a separate payment adapter. It would check the payer's signed instructions and would be the only protocol contract allowed to pull the payer's token. The settlement contract would keep the accounting job.

The final signed fields, replay rules, cancellation rules, and sale connection are still open.

## Rounding is an allocation decision

Whole-number division can leave a remainder.

### Current sales

In current Drop and Auction splits, poster and curator shares round down. The protocol receives what remains. The 101-wei example above therefore records 50, 25, and 26 wei. Nothing is lost.

### Split wallets

Split wallets calculate each account's share from all money ever received. An amount that cannot yet be divided is shown as \`roundingDust\` and stays in the wallet.

More money can make earlier dust claimable. The current wallet has no normal dust-sweep function.

### Evidence

- [Current native-sale rounding](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L671-L680)
- [Split-wallet release and rounding dust](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamSplitWallet.sol#L159-L191)
- [Accepted cumulative rounding rule](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0008-revenue-splits-and-royalty-resolver.md#L470-L545)

## Curator rewards connect onchain claims to offchain allocation

The current sale contracts record money for the curator pool. An authorized action moves that money into \`StreamCuratorsPool\`.

An authorized account stores a Merkle root for a collection. A **Merkle root** is a short fingerprint of a longer reward list stored outside the blockchain.

A curator proves that their reward is in that list. A valid claim creates a credit, which the curator withdraws later.

### What the contract proves

It proves that the claim is in the current list and that the reward address has not already claimed for that collection.

### What it cannot prove

It cannot prove that the list is fair or that its input data is correct. The public process must show who made the list, which rules they used, and how others can check it.

### Evidence

- [Root updates and curator claims](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCuratorsPool.sol#L73-L132)
- [Curator credit withdrawals](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCuratorsPool.sol#L134-L149)

## ERC-2981 publishes royalty information

### Current code

\`StreamCore.royaltyInfo\` reports the same result for every token:

- receiver \`0xC8ed02aFEBD9aCB14c33B5330c803feacAF01377\`;
- 690 basis points, which is 6.9%;
- amount \`salePrice * 690 / 10,000\`.

The current resolver is not used for this answer.

### What ERC-2981 means

ERC-2981 tells a marketplace which royalty receiver and amount the contract reports. It does not force the marketplace to pay.

The accurate words are **royalty information** or **royalty signal**, not guaranteed royalty payment.

### Accepted design

[Accepted ADR 0008](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0008-revenue-splits-and-royalty-resolver.md#L1365-L1445) requires Core to use resolver-backed ERC-2981 with split wallets before launch. The pinned Core still returns the fixed result above.

### Evidence

- [Current \`StreamCore.royaltyInfo\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L1013-L1027)
- [Current and accepted royalty behavior](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0008-revenue-splits-and-royalty-resolver.md#L187-L228)

## Every value movement should be reconstructable

Public reads and events should show:

- the sale and total amount;
- the split rule and recipients;
- each credit, refund, and withdrawal;
- curator funding and claims;
- rounding remainders; and
- emergency or surplus movements.

The current system has several separate ledgers. If a full answer needs a private database, the public record is incomplete.

## Responsibilities carried by payment accounting

The system must use the approved split, keep enough money for everyone it owes, and keep refunds and reserves separate.

It must also preserve old payment records when contracts or split rules change. Public royalty statements must say that marketplace payment is voluntary.

## What can fail

- Current sales remain outside the accepted resolver-backed launch path.
- The wrong split rule wins.
- The same sale is paid twice.
- The ERC-20 token is missing from the signed sale or replay key.
- A caller pulls tokens without the payer's signed instructions.
- The contract records more money owed than it holds.
- An emergency withdrawal takes money still owed.
- A split wallet or curator list contains the wrong data.
- A marketplace ignores the royalty signal.

## Questions for reviewers

1. Does the launch candidate connect every supported sale to the accepted resolver-backed system?
2. Can artists and collectors see the winning split before a sale?
3. When does each split or royalty rule become permanent?
4. Is the exact ERC-20 token bound to the payer's signed sale and replay key?
5. Which ERC-20 tokens will be active at launch?
6. Can the system prove all money owed across every contract?
7. Can anyone check and challenge the curator reward list?
8. Does every royalty statement say that marketplace payment is voluntary?`,
} as const;
