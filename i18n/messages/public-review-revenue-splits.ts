export const PUBLIC_REVIEW_REVENUE_SPLITS_MESSAGES = {
  "publicReview.pages.revenueSplitsAndRoyalties.currentSummary":
    "How current ETH sales record what each person is owed, how the separate payment foundation is meant to work, and why ERC-2981 royalties are only a signal.",
  "publicReview.pages.revenueSplitsAndRoyalties.currentEditorial": `**The short answer:** The reviewed source has two payment systems.

- Current fixed-price ETH sales and English auctions keep their own split rules and payment records.
- A separate resolver, split-wallet, and settlement foundation exists in the source, but the current sale paths do not use it.
- The Core, Stream's shared NFT contract, reports one fixed ERC-2981 royalty. A marketplace can choose whether to pay it.

This page explains what the current code does, what accepted ADRs intend, and what is still only proposed. Source and test evidence do not prove deployment, audit, or safety.

## One wei should have one accountable path

A **wei** is the smallest unit of ETH. Every wei from a sale should be counted once.

For each sale, a reviewer should be able to answer:

- Which sale created the money?
- Which asset and amount were received?
- Which split rule won?
- Who is owed money?
- Who gets any rounding remainder?
- Where is the money held before withdrawal?
- How much can an emergency action safely remove?
- Which reads and events show every later movement?

These are safety rules. If the same wei is counted twice, or money owed to someone is treated as spare money, the contract can pay the wrong people even when the code runs without an error.

## The current native-sale paths keep local accounting

### What the current code does

Signed fixed-price ETH sales run through \`StreamDrops\`. English-auction ETH sales run through \`AuctionContract\`.

Each contract chooses its local split in this order:

1. a rule for the token;
2. a rule for the collection; then
3. the contract default.

The fixed-price path records balances for the poster, protocol, and curator reserve. The auction path records balances for the poster, protocol, and curator. It also records refunds owed to outbid bidders.

The **poster** is the account named in the signed sale approval.

Recipients withdraw later. A sale does not try to send every payment while the mint or auction settlement is running.

### What is not connected

The reviewed source also contains a revenue resolver, split factory, split wallets, and a primary-sale settlement contract. The current fixed-price and auction paths do not call that foundation.

Before launch, the design needs one clear answer: keep and fully define the local sale ledgers, or connect every supported sale to the shared resolver and settlement path.

### Technical details

- [\`StreamDrops.proceedsSplitFor\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L540-L559) applies token, collection, then contract precedence.
- [\`StreamDrops._creditFixedPriceProceeds\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L635-L681) records the fixed-price balances.
- [\`AuctionContract._creditAuctionProceeds\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/AuctionContract.sol#L471-L509) records auction proceeds after a winning settlement.

## Pull credits keep one recipient from blocking everyone

A **credit** is a balance the contract records as owed. That owed balance is also called a **liability**.

The recipient pulls the money out in a later withdrawal. This has three useful effects:

- a recipient that rejects ETH cannot block the sale;
- a failed withdrawal does not erase the credit because the whole withdrawal reverts; and
- the contract can show how much it still owes before anyone withdraws.

The credit owner can withdraw to their own account. The current Drop and Auction contracts also let that owner choose another nonzero recipient address.

### Current limit

There is no single ledger for the whole system. Fixed-price credits stay in \`StreamDrops\`. Auction proceeds and bidder refunds stay in \`AuctionContract\`. Split-wallet balances stay in each wallet after it is funded.

Reviewers therefore need both local solvency checks and a cross-contract view of all money owed.

### Technical details

- [Fixed-price withdrawals](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L389-L438) clear local credits and then send ETH.
- [Auction withdrawals](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/AuctionContract.sol#L315-L369) keep bidder refunds and sale proceeds in separate local balances.
- [Accepted ADR 0003](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0003-payment-accounting.md#L87-L111) requires pull payments and protects money owed from emergency withdrawal.

## The settlement foundation gives a sale one replay-safe identity

### What the source implements

The separate \`StreamPrimarySaleSettlement\` contract can record a primary sale and route its value to a resolved split wallet. Only a caller approved by the settlement contract owner may start this action.

The contract creates one settlement key from the sale ID, revenue class, collection, token, payer, other participants, and amount. It rejects a second use of the same key.

This is replay protection: the same recorded sale cannot be settled twice through that key.

The sale also carries an expected policy hash. In strict mode, settlement fails if the resolved split policy has changed. In allow-current mode, settlement uses the current policy and records whether it drifted from the expected one.

### Known ERC-20 gap

For ERC-20 settlement, the caller supplies the token contract in a separate argument. That asset is not part of the \`PrimarySale\` record or the settlement key.

This means the first successful call with any active asset can consume the shared key. A future sale integration must bind the exact asset in both the signed sale terms and the replay identity.

### Current limit

This contract exists in the reviewed source. That does not mean it is deployed or used by current signed sales. The current fixed-price and auction paths still use their local accounting.

### Technical details

- [Native and ERC-20 settlement entry points](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamPrimarySaleSettlement.sol#L87-L145)
- [The current settlement-key fields](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamPrimarySaleSettlement.sol#L357-L376)
- [Policy matching and drift records](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamPrimarySaleSettlement.sol#L209-L335)

## Resolution separates policy from the sale mechanic

The sale mechanism decides how a sale happens. The revenue resolver decides which approved economic rule applies.

### What the current source does

The reviewed \`StreamRevenueResolver\` stores primary-sale assignments. Its owner can set a fixed profile or a template, clear an assignment while it is still changeable, and freeze an assignment.

When asked for an assignment, it checks token scope first, then collection scope, then the default.

The current \`StreamDrops\` and \`AuctionContract\` sale paths do not call this resolver.

### What accepted ADRs intend

[Accepted ADR 0008](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0008-revenue-splits-and-royalty-resolver.md#L124-L145) chooses one resolver-backed design for primary revenue and Core royalty information.

[Accepted ADR 0021](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0021-immutable-revenue-resolver-validation-adapter.md#L2-L18) adds an immutable, stateless validation adapter. The resolver would remain the only registered module, authority boundary, state owner, and Core royalty target.

ADR 0021 is accepted design, not implemented behavior at this source commit. Its own status says implementation and deployment evidence are separate gates.

### Why this matters

Artists and collectors need to see which rule wins, whether a higher-priority override exists, whether the rule can still change, and when it becomes frozen.

### Technical details

- [Primary assignment writes and freezes](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamRevenueResolver.sol#L170-L257)
- [Token, collection, then default resolution](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamRevenueResolver.sol#L259-L280)

## Immutable split profiles make collaboration inspectable

A split profile names the recipients and each recipient's share.

### What the source implements

\`StreamSplitFactory\` sorts and checks the entries, gives the profile a deterministic ID, and can deploy its \`StreamSplitWallet\` at a predictable address.

The profile does not change after creation. If recipients or shares change, the system creates a new profile and changes the resolver assignment while that assignment is still allowed to change.

After a wallet receives ETH or an approved ERC-20 token, each recipient can pull their calculated share.

### What reviewers should check

- every address is nonzero;
- every share is positive and all shares add to the exact denominator;
- duplicate entries are rejected or combined by one clear rule;
- sorting always creates the same profile ID;
- the deployed wallet has the expected code and stored profile; and
- artists can inspect the exact profile before approving a sale.

### Why this matters

The onchain profile shows exactly which split a sale used. A later change does not rewrite the old profile.

### Technical details

- [Profile creation and deterministic wallet deployment](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamSplitFactory.sol#L76-L128)
- [Immutable wallet setup and share checks](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamSplitWallet.sol#L55-L125)
- [Pull-based release](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamSplitWallet.sol#L172-L231)

## Native ETH accounting must distinguish liabilities from surplus

The ETH held by a contract is not automatically spare money.

- **Liabilities** are amounts owed or reserved for someone.
- **Surplus** is the remaining balance after all liabilities are protected.

The current Drop and Auction contracts expose local owed and reserved totals. Their emergency-withdrawable amount is limited to local surplus.

Reviewers still need to prove that every local credit and reserve is included. A missing liability could let an emergency action remove money that belongs to a seller, bidder, curator, or protocol account.

Direct or forced ETH must not create a new user credit. It may increase surplus, but it must not change the amounts already owed.

### Technical details

- [\`StreamDrops.totalOwed\`, \`surplus\`, and \`emergencyWithdrawable\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L440-L472)
- [\`AuctionContract\` local solvency views](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/AuctionContract.sol#L647-L677)

## Approved ERC-20 transfers require balance checks

An **ERC-20** is a payment token rather than native ETH. This section applies to the separate settlement and split-wallet foundation. Current fixed-price and auction sales use native ETH.

### What the current foundation checks

The asset-policy registry owner marks each ERC-20 asset with a status, evidence hash, and effective time. New settlement accepts only an asset with the active status.

The settlement contract then checks:

- the token contract has code;
- \`balanceOf\` returns one valid value;
- \`transferFrom\` and \`transfer\` return exactly \`true\`; and
- the payer, settlement contract, and wallet balances change by the exact amount.

These checks reject missing or false return values, fee-on-transfer behavior, no-op transfers, failed balance reads, and unexpected balance changes.

### What evidence is still needed

Source and tests show how the candidate handles standard tokens and known bad cases. They do not prove which assets will be active in a deployment.

Reviewers must inspect the real onchain asset-policy registry. A frontend list should mirror that registry, not replace it.

### Technical details

- [Active-asset check and exact transfer accounting](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamPrimarySaleSettlement.sol#L340-L567)
- [Asset-policy records](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamAssetPolicyRegistry.sol#L17-L81)
- [Pinned settlement rejection tests](https://github.com/{sourceRepository}/blob/{sourceCommit}/test/StreamPrimarySaleSettlement.t.sol#L778-L1043)

## Payer-bound token sales remain a proposal

### Current foundation behavior

An approved settlement caller can ask \`StreamPrimarySaleSettlement\` to pull an active ERC-20 token from the payer. The payer must already have given enough allowance.

The settlement contract does not verify a payer-signed \`PaymentIntent\`. It also does not own signer-specific nonce use or revocation.

### Proposed ADR 0019

ADR 0019 is proposed, not accepted. [Read the pinned ADR](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0019-payment-intent-orchestration.md#L1-L89).

Its target gives a separate payment adapter the job of verifying the payer's signed intent and making the only allowed payer pull. The settlement contract would resolve the split, consume the settlement key, route the value, and record the result without using the payer's allowance itself.

The final signed fields, replay rules, revocation, callback flow, escrow cases, and top-level sale integration still require accepted and implemented evidence.

**Why this matters:** A token allowance should not let an approved caller choose a different sale, asset, or amount than the payer approved.

## Rounding is an allocation decision

Whole-number division can leave a small remainder.

### Current native-sale rule

The current Drop and Auction splits use 10,000 basis points. Poster and curator shares round down. The protocol receives the remainder.

That rule makes the three credits add back to the exact payment, even for a one-wei payment.

### Split-wallet rule

The separate split wallets use 1,000,000 parts per million. They calculate each account's cumulative share and expose any amount that is currently left as \`roundingDust\`.

Reviewers should check who can ever receive that dust, whether later deposits change it, and whether many small payments create a meaningful bias.

### Technical details

- [Current native-sale rounding](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L673-L681)
- [Split-wallet releasable amount and rounding dust](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamSplitWallet.sol#L143-L170)

## Curator rewards connect onchain claims to offchain allocation

The current Drop and Auction contracts record a curator reserve or curator credit. An authorized action can release that money to the configured \`StreamCuratorsPool\`.

An authorized account sets a Merkle root for a collection. A **Merkle root** is a short onchain commitment to a longer list of recipients and amounts.

A curator submits a proof for their entry. A valid claim records a pull credit. The recipient withdraws later.

### What the contract proves

The contract can prove that a claim belongs to the current committed list and that the reward address has not already claimed for that collection.

### What the contract does not prove

It does not prove that the offchain inputs or allocation policy were fair. Reviewers still need to know who built the list, which data and policy it used, how a root may change, and how anyone can reproduce or challenge it.

**Main risk:** A valid Merkle root can still commit to the wrong allocation.

### Technical details

- [Root updates and curator claims](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCuratorsPool.sol#L73-L132)
- [Curator credit withdrawals](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCuratorsPool.sol#L134-L151)

## ERC-2981 publishes royalty information

### What the current Core reports

For every token ID, \`StreamCore.royaltyInfo\` returns:

- receiver \`0xC8ed02aFEBD9aCB14c33B5330c803feacAF01377\`;
- 690 basis points, which is 6.9%; and
- royalty amount \`salePrice * 690 / 10,000\`.

There is no runtime setter or token-specific override. The current revenue resolver is not part of this read.

### What ERC-2981 means

ERC-2981 reports a royalty receiver and amount. It does not force a marketplace to pay.

The accurate words are **royalty information** or **royalty signal**, not guaranteed royalty payment.

### Accepted target, not current code

Accepted ADR 0008 requires the Core to use resolver-backed ERC-2981 with split wallets before genesis. The reviewed Core still uses the fixed result above.

### Technical details

- [Current \`StreamCore.royaltyInfo\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L1013-L1027)
- [Accepted resolver-backed ERC-2981 target](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0008-revenue-splits-and-royalty-resolver.md#L1267-L1319)

## Every value movement should be reconstructable

Public reads and events should let an independent reviewer rebuild:

- the sale ID and gross amount;
- the split rule and why it won;
- the profile and every allocation;
- every credit and withdrawal;
- auction refunds and active bid escrow;
- curator reserves, roots, and claims;
- the royalty rule;
- rounding remainders; and
- emergency or surplus movements.

The current design has several local ledgers. Reviewers must show how their events and reads fit together. If a complete answer needs a private database, the public accounting record is incomplete.

## Responsibilities carried by payment accounting

The payment system must:

- apply the split that was approved;
- keep enough money for every person owed;
- let sales finish when one recipient rejects a transfer;
- keep refunds, credits, and reserves separate;
- preserve old profiles and payment history;
- prevent a replacement contract from duplicating or abandoning money owed; and
- describe voluntary marketplace royalties honestly.

Each duty needs one clear owner in the code and enough public evidence for artists, collaborators, collectors, curators, and auditors to verify the result.

## What can fail

- The local sale ledgers and separate settlement foundation remain two unclear paths.
- The wrong token, collection, or default rule wins.
- A sale or settlement key is used twice.
- An ERC-20 asset is not bound to the signed sale and replay identity.
- Shares or rounding pay the wrong amount.
- A contract owes more than it holds.
- An emergency action removes money that is still owed.
- A nonstandard ERC-20 creates a false accounting record.
- A split wallet's code or stored profile does not match its expected identity.
- A curator root is valid but its inputs are wrong.
- A successor duplicates or loses credits.
- A marketplace ignores the ERC-2981 royalty signal.

## Questions for reviewers

1. Should genesis keep the local native-sale ledgers, or connect every sale to the resolver and settlement foundation?
2. Can artists and collectors see which split rule wins before a sale is approved?
3. When should a split or royalty assignment become permanent?
4. How will the exact ERC-20 asset be bound to the signed sale and replay key?
5. Which ERC-20 assets should be active at launch, and what evidence supports each one?
6. Who receives each kind of rounding remainder?
7. Can total liabilities be proven across every contract that holds value?
8. Is the curator-root process reproducible and open to challenge?
9. What proof is required before a successor receives accounting duties?
10. Does every royalty statement say clearly that marketplace payment is voluntary?`,
} as const;
