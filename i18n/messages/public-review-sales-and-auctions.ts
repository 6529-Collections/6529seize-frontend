export const PUBLIC_REVIEW_SALES_AND_AUCTIONS_MESSAGES = {
  "publicReview.pages.fixedPriceSalesAndAuctions.currentSummary":
    "A plain guide to signed fixed-price sales and auctions: who pays, who receives the token, how bids and refunds work, and what reviewers still need to test.",
  "publicReview.pages.fixedPriceSalesAndAuctions.currentEditorial": `## The sale flow in one minute

The reviewed code has two signed sale paths. Both use native ETH.

- **Fixed price:** a Stream signer approves one exact mint. The payer submits the exact price. The token goes to the signed recipient. A free claim uses the same path without payment.
- **Auction:** a Stream signer approves the reserve price and end time. The token is minted into the auction contract before bidding starts. Bidders pay ETH. After the auction ends, the winner receives the token or, if there are no bids, the poster recovers it. A contract poster can choose a separate recipient for that recovery.

The contracts record money owed as balances. The accounts owed money collect those balances later. This keeps a failed payment from blocking the main sale or bid.

This page describes the exact source pinned to this review. A public review page does not prove that Stream is deployed, independently audited, or safe to launch.

## Signed terms are the bridge from decision to execution

### What happens

An offchain process prepares permission for one fixed-price mint or auction. The configured Stream signer signs it. The signer can be an ordinary wallet or a compatible smart-contract wallet. The contract then checks that the transaction matches the signed permission.

The permission binds the poster, collection, sale type, artwork-data hash, deadline, signer version, and one-use ID. A fixed-price permission also binds the payer, recipient, and price. An auction permission binds the reserve price and end time.

The signature is tied to one chain and one Drops contract. Copying it to another chain or contract does not make it valid there. After a successful use, the contract marks its ID as consumed before minting or starting the auction.

The signer approves the terms. An authorized admin can cancel a permission before it is used. Changing the signer or signer version also makes older permissions invalid.

The contract does not choose the artist, calculate TDH, or decide whether the offchain process was fair.

Signature checks are only one gate. The current code also checks payment, pause state, supply, mint rules, sale type, deadline, and one-use status.

### Current code and accepted design

[ADR 0001](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0001-drop-authorization.md) is the accepted design record for typed, one-use Drop permission. The pinned code separately shows that its main EIP-712 and replay rules are present. The code, not the ADR status, is the evidence for current behavior.

The current signed paths accept native ETH only. A future token payment path would also need to bind the token contract, not only an amount.

### Technical details

See [\`DropAuthorization\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L45-L61), [\`mintDrop\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L186-L217), [the authorization checks](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L561-L600), and [wallet-signature validation](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L735-L786).

## Fixed-price execution protects both paid and free mints

### Paid mint

The account sending the transaction must be the signed payer. It must send exactly the signed ETH price. The token goes to the separately signed, nonzero recipient.

The contract records balances for the poster, protocol, and curator reserve. It does not send those balances during the mint. The configured split is selected in this order: token, collection, then contract default.

### Free claim

The signed price is zero and the signed payer is the zero address. Any account may submit the permission, but it cannot change the signed recipient or artwork data.

Payment is the only part removed. The same deadline, replay, collection, quantity, mint, pause, and freeze checks still apply.

### Current limit

The signed Drop path requires \`quantity == 1\`. One permission mints one token. A collection may still contain several tokens, but each needs its own permission on this path.

### Technical details

See [fixed-price execution](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L609-L633), [split selection](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L542-L559), and [credit creation](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L635-L669).

## Payer and recipient are intentionally different concepts

The payer funds a paid mint. The recipient receives the token. They can be different accounts, which allows a gift or sponsored mint.

Both addresses are signed. If someone copies the public transaction, the contract still enforces the same payer and recipient. Copying can affect which transaction is included first, but it cannot redirect the token.

For a free claim, there is no payer. The signed recipient still cannot change.

**Why this matters:** the product should show who pays and who receives the work as two separate facts.

## Auction registration commits the item to one state machine

### What happens

An auction permission has a reserve price and an end time. The current minting contract requires the end time to be at least ten minutes in the future. The permission's payer, recipient, fixed price, and submitted ETH are all zero.

The Drops contract mints the token directly into the auction contract. Registration then checks that the auction contract owns that exact token before bidding becomes active.

### Who acts

The Stream signer approves the starting terms. Any bidder may bid while the auction is active and bidding is not paused. The auction contract holds the token until cancellation or settlement.

[ADR 0002](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0002-auction-custody.md) is the accepted design record for this custody and state-machine model. The pinned contracts separately implement the custody check and auction states described here.

**Why this matters:** bidders do not have to trust the poster to keep the token available or approve a later transfer.

### Technical details

See [the auction mint and ten-minute check](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMinter.sol#L183-L212), [auction registration](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L693-L716), and [the custody check](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/AuctionContract.sol#L188-L223).

## Bids create liabilities as well as a leader

Each valid bid sends ETH to the auction contract. The contract records the highest bidder and highest bid.

When a new bidder takes the lead, the old highest bid becomes a balance owed to the old bidder. The old bidder withdraws it in a separate transaction.

This is called a pull payment: the contract records what it owes, and the recipient asks for it later. A bidder contract that rejects ETH cannot block the next valid bid.

The winning bid stays in active escrow until settlement. Outbid balances and the winning escrow must remain fully backed.

[ADR 0003](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0003-payment-accounting.md) accepts this pull-payment design. The pinned code separately records bidder credits and auction-local sale credits.

### Technical details

See [bid placement and outbid credits](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/AuctionContract.sol#L279-L327).

## The minimum next bid is exact

The first bid must be at least the reserve price. A later bid must be at least:

\`current highest bid + floor(current highest bid * percentage / 100)\`

The default percentage is 5%. After a 1 ETH bid, the default next minimum is 1.05 ETH. At very small values, rounding can make the added amount zero.

### Current risk

A function admin or global admin can change the one global percentage at any time. The current function has no bound, delay, dedicated change event, or per-auction copy. Active auctions use whatever value is live when the next bid arrives.

Reviewers should test the reserve boundary, exact minimum, one wei below it, small-value rounding, large values, extreme settings, changes during an active auction, bidder replacement, and bids at the end-time boundary.

### Technical details

See [\`minimumNextBid\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/AuctionContract.sol#L251-L265), [the enforced bid calculation](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/AuctionContract.sol#L279-L313), and [the admin update function](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/AuctionContract.sol#L549-L559).

## Anti-sniping needs a reproducible clock rule

The default extension is 300 seconds. If a valid bid arrives with 300 seconds or less left, the contract adds 300 seconds to the recorded end time.

Each later qualifying bid can extend the auction again. The current code has no limit on the number of extensions or the total auction length. It emits the old and new end times each time.

The auction ends only when the block time is greater than the recorded end time. A bid included at exactly the end time is still allowed and can extend the auction.

### Current risk

The extension time is also one mutable global value. A function admin or global admin can change it during an active auction. The update has no bound, delay, or dedicated change event. Later bids use the new live value.

**Why this matters:** bidders need one clear rule for when bidding ends. Network inclusion can still delay a transaction even when the contract rule is clear.

## Winner settlement uses fixed results

After the recorded end time has passed, any account may call \`claimAuction\` while settlement is not paused. The caller does not choose the winner, token, or price. Those facts come from auction state.

For an auction with a bid, settlement:

1. confirms the auction has ended;
2. uses the recorded highest bidder and bid;
3. removes the winning amount from active escrow;
4. records poster, protocol, and curator balances;
5. transfers the token to the winner; and
6. makes the result terminal, so it cannot settle or cancel again.

If the token transfer fails, the whole transaction reverts. The terminal state and payment balances do not remain half-finished.

The current auction records its own payment balances. The separate revenue resolver and split wallets created in the rehearsal are not part of this settlement path.

### Technical details

See [\`claimAuction\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/AuctionContract.sol#L371-L388) and [with-bid settlement and credit creation](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/AuctionContract.sol#L456-L497).

## Zero-bid settlement resolves the auctioned token

The token already exists in auction custody. A no-bid result routes that token; it does not undo the mint or its supply history.

- If the poster is an ordinary account, settlement returns the token to that account and makes the auction terminal.
- If the poster is a contract, the auction records that exact contract as the pending claimant. The contract must make a second call and may choose a nonzero recipient. Only after a successful transfer does the auction become terminal.

The second path avoids forcing a token transfer to a contract that may not be able to receive it.

Reviewers still need to decide whether a contract poster should be able to name any recipient and whether this no-bid result is fair to artists and collectors.

### Technical details

See [the no-bid claim](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/AuctionContract.sol#L390-L407) and [no-bid settlement](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/AuctionContract.sol#L438-L454).

## Cancellation must respect custody and bidder rights

The poster, a function admin for cancellation, or a global admin may cancel an active auction only when it has no bid.

Cancellation makes the auction terminal and returns the token to the poster. After the first valid bid, cancellation is not allowed. This protects the bidder's expectation that the auction will settle under its published rules.

The current cancellation function does not check the bid or settlement pause. Reviewers should test whether that is the intended emergency behavior and what happens when a contract poster cannot receive the returned token.

Any future post-bid cancellation design would need clear refund, consent, timing, and public-record rules.

See [\`cancelAuction\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/AuctionContract.sol#L409-L426).

## Current signed sales use the legacy mint lane

The reviewed fixed-price and auction contracts call \`StreamMinter\`. The rehearsal also installs a newer \`StreamMintManager\` in the Core, but the signed sales do not use that manager.

This means the two mint lanes do not share every supply counter, replay record, or policy check. Before launch, one exact end-to-end sale path must be chosen and tested as a whole.

The rehearsal is useful integration evidence. It is not proof of deployment, an independent audit, or launch safety.

See [the rehearsal deployment and wiring](https://github.com/{sourceRepository}/blob/{sourceCommit}/script/RehearseDeployment.s.sol#L218-L269).

## Recoverable surplus excludes liabilities

The sale contracts hold ETH that belongs to other accounts. That includes:

- the current winning bid;
- outbid bidder balances;
- poster balances;
- protocol balances; and
- curator or curator-reserve balances.

These amounts are liabilities. They must not be treated as spare money.

The auction contract calculates surplus as its ETH balance minus all recorded liabilities. Its emergency withdrawal can take only that surplus. At this pinned commit, the Drops contract exposes liability and surplus views but no emergency-withdraw action.

Direct or forced ETH can increase surplus. It must not create a user balance or make existing balances unbacked.

See [auction liability and surplus accounting](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/AuctionContract.sol#L648-L691).

## Hostile recipients remain part of the design

The contracts interact with wallets and other contracts that may reject ETH, reject an NFT, revert, or try to call back into the sale.

The current design reduces that risk by recording payment balances instead of sending them during bids or settlement, updating state before external calls, and using reentrancy guards on value-moving paths.

Failed withdrawals must leave the balance available. Failed token transfers must not leave settlement half-complete. Contract-wallet no-bid claims need a safe second transfer path.

Reviewers should not assume that every recipient is an ordinary wallet or that a fixed gas allowance makes an external call safe.

## Additional sale mechanics belong behind reviewed adapters

Dutch auctions, private sales, refund windows, sealed bids, raffles, burn-to-mint, ERC-20 bidding, and similar sale types are not features of the pinned fixed-price and auction contracts.

They remain proposed or deferred unless they appear in a later pinned release with code and tests. Each new sale type changes pricing, custody, eligibility, replay, refunds, ordering, and final-state rules. It should stay outside the permanent Core and enter through a small, reviewed module.

[ADR 0019](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0019-payment-intent-orchestration.md) proposes an ERC-20 payment and sale-adapter design. Its end-to-end path is not accepted or implemented at this pinned commit. It does not change the current native-ETH sale paths.

## Responsibilities carried by the sale contracts

The current sale contracts must make it possible to check:

- that displayed terms match the signed terms and execution;
- that copying a permission cannot redirect the result;
- that the auction holds the token during bidding;
- that outbid bidders keep a backed refund balance;
- when and why an auction end time changes;
- how ordinary wallets and contract wallets receive tokens;
- that all payment balances stay backed through settlement; and
- that public state and events reconstruct one final result.

These records let artists, bidders, and reviewers follow a sale from permission through final ownership and payment.

## What can fail

- A price, payer, recipient, sale type, artwork-data hash, quantity, deadline, or replay input is not fully bound.
- One permission is used twice.
- The signed sale enters a mint lane with different supply or policy checks than reviewers expect.
- A global bid or extension setting silently changes an active auction.
- A refund, winning bid, or sale balance becomes unbacked.
- The interface and contract disagree about rounding or the exact end-time boundary.
- Settlement leaves token custody and payment state out of sync.
- A no-bid or cancellation transfer strands the token.
- Cancellation breaks a bidder's published expectations.
- Emergency withdrawal treats money owed to users as surplus.
- A hostile recipient blocks progress or reenters.
- A proposed ADR or review page is mistaken for deployed, audited code.

## Questions for reviewers

1. Does the signed permission bind every person, amount, asset, sale term, and one-use input needed by the current path?
2. Should the bid percentage and extension time be fixed when each auction starts?
3. Are the exact rounding and end-time rules clear to bidders?
4. Should the auction contract hold the token before bidding starts?
5. Should any cancellation be possible after a valid bid?
6. Is the no-bid result fair to the artist and possible collectors?
7. Can public storage and events reconstruct every liability and final state?
8. Which extra sale types, if any, are important enough to add to the first audit surface?`,
} as const;
