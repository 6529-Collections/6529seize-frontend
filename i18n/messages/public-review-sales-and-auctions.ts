export const PUBLIC_REVIEW_SALES_AND_AUCTIONS_MESSAGES = {
  "publicReview.pages.fixedPriceSalesAndAuctions.currentSummary":
    "This page explains how approved fixed-price sales and auctions work. It shows who pays, who gets the NFT, how bids and refunds work, and what still needs checking.",
  "publicReview.pages.fixedPriceSalesAndAuctions.currentEditorial": `## The sale flow in one minute

The reviewed code has two signed sale paths. Both use native ETH.

- **Fixed price:** Stream’s approved signer — a wallet or contract wallet allowed to approve sales — approves the creation of one NFT. The approval can be used only once. It says who must pay, the exact price, and who gets the NFT. The contract creates the NFT only when those details match. A free claim works the same way, but no payment is needed.
- **Auction:** The approved signer approves the lowest starting bid and the end time. The auction contract holds the NFT while people bid with ETH. When time runs out, the highest bidder gets the NFT. If nobody bids, the account that started the auction gets it back. If a smart contract started it, that contract can choose another address that can receive the NFT.

Sale money and refunds are collected later. This means one failed transfer cannot stop the sale or auction. The account owed money can try again.

This page describes the exact source pinned to this review. A public review page does not prove that Stream is deployed, independently audited, or safe to launch.

## How sale details are approved and checked

### What happens

A sale begins with exact details such as the collection, NFT data, price, payer, recipient, and deadline. The approved signer signs those details. The contract checks that the sale matches them.

The approval says:

- Which account starts the sale.
- Which collection the NFT belongs to.
- Whether it is a fixed-price sale or an auction.
- What NFT data will be used.
- When the approval expires.
- Which one-time approval code is used.

For a fixed-price sale, it also says who pays, the exact price, and who gets the NFT.

For an auction, it also says the lowest starting bid and when bidding ends.

The approval works only on the named blockchain and Stream contract. It can be used only once. The contract marks it as used before creating the NFT or starting the auction.

An authorized admin can cancel an unused approval. Changing the approved signer also stops older approvals from working.

The approval does not choose the artist, calculate TDH, or decide whether the selection process was fair. Those decisions happen outside the contract.

The contract also checks the payment, available supply, sale rules, deadline, and whether the approval was already used.

### What the ADR and code show

[ADR 0001](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0001-drop-authorization.md) is the accepted design for signed approvals that can be used only once.

The pinned code follows its main rules. Each approval has a deadline and works only on one chain and contract. It becomes invalid after use. Both ordinary wallets and compatible smart-contract wallets can sign approvals.

An accepted ADR explains the intended design. The pinned code is the evidence for what the reviewed version actually does.

The current fixed-price and auction paths accept native ETH only. Token payments such as ERC-20 are not part of these current sale paths.

### Technical details

See [\`DropAuthorization\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L45-L61), [\`mintDrop\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L186-L217), [the authorization checks](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L561-L600), and [wallet-signature validation](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L735-L786).

## How paid sales and free claims work

### Paid sale

The approved sale says:

- Who must pay.
- The exact price.
- Who gets the NFT.

The named payer must send the transaction with the exact amount of ETH. If the details match, the contract creates the NFT for the named recipient.

### Where the sale money goes

The contract does not send the sale money out straight away. It records how much is owed to:

- The account that started the sale.
- The 6529 protocol.
- The curator fund.

They collect their money later.

To decide how the money is shared, the contract checks for rules in this order:

1. Rules for this NFT.
2. Rules for its collection.
3. The default rules.

### Free claim

A free claim has a price of zero. There is no named payer because no payment is needed.

Anyone can submit the approved claim. But they cannot change who gets the NFT or the NFT's data.

Only the payment is removed. The contract still checks that the approval is valid, unused, and not expired. It also checks the collection, available supply, and minting rules.

### One approval creates one NFT

Each approval can create only one NFT.

A collection can contain many NFTs, but each NFT needs its own approval through this sale route.

### Technical details

See [fixed-price execution](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L609-L633), [split selection](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L542-L559), and [credit creation](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L635-L669).

## The payer and NFT recipient can be different

The **payer** is the wallet that sends ETH. The **recipient** is the wallet that gets the NFT.

They can be different. For example, Alice can pay for an NFT that is sent to Bob as a gift.

For a paid sale, the approval names both wallets. Only the named payer can make the payment, and the NFT still goes to the named recipient.

For a free claim, there is no payer. Anyone can submit the claim, but they cannot change who gets the NFT.

**Why this matters:** the page and product should show “who pays” and “who gets the NFT” as two separate facts.

## How an auction starts

The approved auction sets the lowest starting bid and the end time. When the NFT is created, the end time must be at least ten minutes away.

Starting the auction does not send ETH. The auction approval also has no fixed-price payer or NFT recipient. The winner is chosen later through bidding.

The NFT is created directly inside the auction contract. Before bidding becomes active, the contract checks that it owns that exact NFT.

The approved signer signs the starting terms. Anyone can bid while the auction is active and bidding is not paused. The auction contract keeps the NFT until the auction is cancelled or finished.

[ADR 0002](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0002-auction-custody.md) is the accepted design for this custody model. The pinned code implements the ownership check and auction states.

**Why this matters:** the account that started the auction cannot remove the NFT while people are bidding.

### Technical details

See [the auction mint and ten-minute check](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMinter.sol#L183-L212), [auction registration](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L693-L716), and [the custody check](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/AuctionContract.sol#L188-L223).

## How bids and refunds work

Each valid bid sends ETH to the auction contract. The contract records the highest bid and the wallet that made it.

When a higher bid arrives, the previous highest bidder is owed a refund. The contract records that refund instead of sending it immediately. The outbid bidder collects it later.

This means a wallet that rejects ETH cannot block the next valid bid.

The current highest bid stays locked in the auction contract until another bid replaces it or the auction is finished. The contract must always hold enough ETH to cover the current winning bid and every refund it owes.

[ADR 0003](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0003-payment-accounting.md) accepts this “record now, collect later” payment design. The pinned code implements bidder refunds and auction payment records inside the auction contract.

### Technical details

See [bid placement and outbid refunds](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/AuctionContract.sol#L279-L327).

## How the next minimum bid is calculated

The first bid must be at least the lowest starting bid.

After that, the next bid must be at least the current highest bid plus a percentage. The default percentage is 5%.

For example, after a 1 ETH bid, the default next minimum is 1.05 ETH.

The contract uses whole-number maths and rounds down. For very small bids, the added amount can round down to zero.

### What can change

This percentage is one shared live setting for every auction. An authorized admin can change it at any time, even while an auction is active.

The code sets no minimum, maximum, or waiting period for a change. It does not create a separate event for the change. The percentage is not fixed when an auction starts. The next bid uses the percentage that is live at that moment.

### What reviewers should test

Reviewers should test:

- A first bid at the exact starting price.
- A bid at the exact next minimum and one wei below it.
- Very small and very large bids.
- Extreme percentage values.
- A percentage change during an active auction.
- A new highest bidder and bids at the exact end time.

### Technical details

See [\`minimumNextBid\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/AuctionContract.sol#L251-L265), [the bid check](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/AuctionContract.sol#L279-L313), and [the admin update function](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/AuctionContract.sol#L549-L559).

## A late bid can extend the auction

The default extension time is five minutes.

If a valid bid arrives with five minutes or less remaining, the contract adds five minutes to the current end time. Another late bid can extend it again.

The current code does not limit how many extensions can happen or how long the auction can become. Each extension records the old and new end times.

The auction ends only after the recorded end time. A bid accepted at exactly the end time is still valid and can extend the auction.

### What can change

The extension time is also one shared live setting for every auction. An authorized admin can change it while an auction is active.

The code sets no minimum, maximum, or waiting period for a change. It does not create a separate event for the change. The extension time is not fixed when an auction starts. A later bid uses the time that is live at that moment.

**Why this matters:** bidders need the page and product to show the exact live end time. A transaction can also reach the blockchain later than the bidder expected.

### Technical details

See [the extension rule](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/AuctionContract.sol#L279-L313) and [the admin update function](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/AuctionContract.sol#L549-L559).

## How an auction with a winner ends

After the end time, anyone can ask the contract to finish the auction, unless settlement is paused.

That caller cannot choose the NFT, winner, or price. The contract uses the result already stored by the auction.

The contract then:

1. Checks that the auction has ended.
2. Uses the recorded highest bidder and bid.
3. Removes the winning bid from the active auction balance.
4. Records how much is owed to the account that started the auction, the protocol, and the curator fund.
5. Sends the NFT to the winner.
6. Marks the auction as finished so it cannot finish or cancel again.

If the NFT transfer fails, the whole transaction is undone. The auction can be tried again later, and it is not left half-finished.

This auction keeps its own payout balances. The separate payout contracts connected in the rehearsal do not settle this auction.

### Technical details

See [\`claimAuction\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/AuctionContract.sol#L371-L388) and [winner settlement and payment records](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/AuctionContract.sol#L456-L497).

## What happens if nobody bids

The NFT already exists and is still held by the auction contract. Ending with no bids does not erase that NFT or remove it from the collection's mint history.

- If an ordinary wallet started the auction, the contract returns the NFT to that wallet and marks the auction as finished.
- If a smart contract started the auction, the NFT is not forced into it. Instead, that smart contract gets the right to make a second call and choose a nonzero receiving address. The auction finishes only after that transfer succeeds.

This second path avoids sending an NFT to a smart contract that may not be able to receive it.

Reviewers still need to decide whether a smart contract should be able to choose any receiving address and whether this no-bid result is fair to artists and collectors.

### Technical details

See [the no-bid claim](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/AuctionContract.sol#L390-L407) and [no-bid settlement](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/AuctionContract.sol#L438-L454).

## When an auction can be cancelled

An auction can be cancelled only while it is active and has no bids.

The account that started the auction can cancel it. An authorized function admin or global admin can also cancel it.

Cancellation returns the NFT to the account that started the auction and marks the auction as finished. After the first valid bid, cancellation is not allowed.

Cancellation is not blocked by the bidding pause or settlement pause. Reviewers should check whether that is the intended emergency behavior.

Reviewers should also test what happens when a smart contract started the auction but cannot receive the returned NFT. If the transfer fails, the whole cancellation transaction is undone.

Any future design that allows cancellation after a bid would need clear rules for refunds, consent, timing, and public records.

### Technical details

See [\`cancelAuction\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/AuctionContract.sol#L409-L426).

## Current sales use the older minting path

The reviewed fixed-price and auction paths call \`StreamMinter\`.

The rehearsal also connects a newer \`StreamMintManager\` to the Core contract. These signed sales do not use that newer manager.

The two minting paths do not share every supply count, record of used approvals, or safety check. Before launch, one exact sale path must be chosen and tested from approval through payment and NFT delivery.

### Technical details

See [the rehearsal deployment and wiring](https://github.com/{sourceRepository}/blob/{sourceCommit}/script/RehearseDeployment.s.sol#L218-L269).

## Money owed to people is not spare money

The sale contracts hold ETH that belongs to other accounts. This includes:

- The current highest bid.
- Refunds owed to outbid bidders.
- Money owed to the account that started a sale.
- Money owed to the protocol.
- Money reserved for curators.

The contracts must not treat this ETH as spare money.

The auction contract calculates spare ETH by taking its full balance and subtracting every recorded amount it owes. Its emergency withdrawal can take only that spare amount.

The fixed-price Drops contract also reports how much it owes and how much is spare. At this pinned commit, it does not have an emergency-withdraw function.

ETH can reach a contract outside the normal sale flow. This may increase its spare balance. It must not create money owed to a user or leave existing balances short.

### Technical details

See [fixed-price owed and spare balances](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L438-L475) and [auction owed and spare balances](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/AuctionContract.sol#L648-L691).

## Some wallets and contracts may reject transfers

Some receiving accounts are smart contracts. They may reject ETH, reject an NFT, stop with an error, or try to call back into the sale contract.

The current code reduces these risks by:

- Recording money owed instead of sending it during the main sale, bid, or settlement.
- Updating its own records before calling another wallet or contract.
- Blocking unsafe repeated calls while value is moving.

If a withdrawal fails, the whole withdrawal transaction is undone and the recorded balance remains available.

If an NFT transfer fails during settlement or cancellation, that whole transaction is undone. The auction is not left half-finished.

The no-bid path gives a smart contract a separate way to choose an address that can receive the NFT.

Reviewers should test ordinary wallets, smart-contract wallets, rejected ETH, rejected NFTs, and attempts to call back into the contract.

## Other sale types are not available yet

The pinned fixed-price and auction contracts do not include Dutch auctions, private sales, refund windows, sealed bids, raffles, burn-to-mint, ERC-20 bidding, or similar sale types.

A future sale type should not be shown as available until it appears in a later pinned version with code and tests. Each new type changes rules for price, custody, access, refunds, ordering, and the final result.

[ADR 0019](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0019-payment-intent-orchestration.md) is only a proposal. It describes a possible ERC-20 payment-adapter and sale-adapter flow. It is not accepted or implemented as a complete current sale path. It does not change the native-ETH paths described on this page.

## What the contracts must make easy to check

The contracts and their public records should make it possible to check:

- That the displayed sale details match the approved details.
- That copying an approval cannot redirect the NFT or money.
- That the auction contract holds the NFT while bidding is active.
- That every outbid bidder keeps a fully backed refund.
- When the auction end time changes and why.
- How ordinary wallets and smart-contract wallets receive NFTs.
- That every recorded payment stays fully backed.
- That public records and events show one final result.

These records let artists, bidders, and reviewers follow a sale from approval to final NFT ownership and payment.

## What reviewers should check for

- An approval fails to lock an important detail such as the price, payer, recipient, sale type, NFT data, quantity, deadline, or one-use code.
- The same approval is used twice.
- A sale uses a different minting path, supply counter, or policy check than expected.
- The bid percentage or extension time changes during an active auction.
- The contract does not hold enough ETH for a refund, winning bid, or sale balance.
- The page or product shows a different rounding rule or end time from the contract.
- NFT ownership and payment records disagree after settlement.
- An NFT becomes stuck after a no-bid result or cancellation.
- Cancellation breaks the rules promised to a bidder.
- An emergency withdrawal takes ETH owed to users.
- A wallet or contract blocks progress or calls back during a transfer.
- A proposed ADR or public review page is mistaken for deployed and audited code.

## Questions for reviewers

1. Does each approval lock every needed detail: people, amounts, NFT data, sale rules, deadline, and one-time approval code?
2. Should the bid percentage and extension time be fixed when each auction starts?
3. Does the page and product show the contract's exact rounding and end-time rules?
4. Does the auction contract always prove that it holds the NFT before bidding starts?
5. Are the cancellation rules safe and clear before and after the first bid?
6. Is the no-bid result fair to the artist and possible collectors?
7. Do public records show all money owed and the final auction result?
8. Which extra sale types, if any, are important enough to include in the first audit?`,
} as const;
