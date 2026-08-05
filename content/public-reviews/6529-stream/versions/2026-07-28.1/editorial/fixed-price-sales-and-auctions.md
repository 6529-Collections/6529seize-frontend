# Fixed-price sales and auctions

Stream's sales contracts turn approved terms into one of two outcomes: a
fixed-price mint or an English auction. They are responsible not only for
receiving ETH, but also for enforcing the exact terms the configured signer
authorized, placing the work in the right custody, accounting for every
liability, and reaching a final state that anyone can inspect.

That is more machinery than a bare payable mint. The extra state exists because
a sale can otherwise change between the screen and the transaction, a copied
signature can do more than intended, a hostile bidder can block refunds, or
ownership and payment can finish in different states.

## The sale flow at a glance

Both sale modes start from the same signed instruction and then take different
paths:

1. An approved signer creates a signed instruction describing the exact sale.
2. The sale contract verifies its signature, deadline, current signing-key
   epoch, used-or-cancelled state, participants, collection, token data,
   quantity, and sale terms.
3. A fixed-price authorization mints one token to its signed recipient and
   records the resulting payment credits.
4. An auction authorization mints the token into auction custody and opens a
   state machine for bids, refunds, extensions, and settlement.
5. Recipients withdraw recorded credits rather than being paid inside the
   mint, bid, or settlement transaction.
6. The terminal record must show whether the work was sold, returned after no
   bids, or cancelled before any bid.

## Why the machinery exists

A marketplace or operator can perform much of this work offchain. That can make
the Solidity shorter, but it leaves another system responsible for:

- proving that the displayed terms match execution;
- preventing a copied approval from changing the payer or recipient;
- holding the work safely while bids are open;
- refunding displaced bidders;
- deciding and disclosing time extensions;
- handling contract-wallet recipients;
- keeping all credits solvent through settlement;
- producing a public terminal record.

That may be a valid trust model for a particular sale. It is not the same
guarantee. Stream's design should be judged by whether each mechanism protects
one of these responsibilities and whether overlapping mechanisms can be
removed.

The contracts cannot establish that the offchain curation decision was fair,
that the configured signer was honest or uncompromised, that a user understood
the terms, or that every recipient will withdraw successfully. They can bind
the signer's exact instruction to execution and keep custody, liabilities, and
terminal states inspectable.

## The signed instruction fixes the sale

Both paths begin with
[`DropAuthorization`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L24-L61).
It uses EIP-712, a standard format for structured typed signatures. Its domain
binds the chain and verifying contract. Its payload binds:

- authorization identity and replay inputs;
- poster;
- token recipient for fixed price, which must be zero for auction;
- payer for paid fixed price, which must be zero for free fixed price and
  auction;
- collection;
- fixed-price or auction mode;
- token-data hash;
- fixed price, which must be zero for auction;
- quantity;
- auction reserve and end time, which must be zero for fixed price;
- deadline;
- signer epoch.

This is the bridge from an offchain curation decision to an onchain action. The
contract does not reproduce Total Days Held (TDH), 6529's time-weighted holding
measure, or the curation process; it verifies that the signed result cannot
quietly become a different sale.

Without the domain binding, the signature could be replayed elsewhere. On a
paid fixed-price mint, separate payer and recipient fields stop a copied
transaction from redirecting the work or charging the wrong account. A free
fixed-price mint requires the payer to be zero. An auction requires both payer
and recipient to be zero because bidders later fund the auction contract and
the winner receives the token only at settlement. Without the mode, amount,
token-data hash, deadline, signer epoch, and one-use identity, one valid
signature could authorize more than its signer intended.

Signature validity is only the first gate. Supply, collection-time, pause state,
payment, freeze, and sale-specific checks still apply.

The current authorization has no currency or token-address field. These Drop
and auction paths use native ETH, so the execution path fixes the currency. A
future token-denominated authorization would also need to bind the asset
address, not just an amount.

## The fixed-price flow

A fixed-price authorization can describe either a paid mint or a free claim:

1. `StreamDrops` verifies the signed instruction and its one-use identity.
2. It checks the collection, quantity, recipient, token data, deadline, mint
   capacity, freeze state, and the other applicable policy conditions.
3. For a paid mint, submitted ETH must match the authorized economics. The
   frontend does not get to supply a different executable price.
4. The legacy `StreamMinter` calls the legacy Core mint entry and delivers the
   token to the signed recipient.
5. The Drop contract selects a proceeds split in token, collection, then
   contract-default order.
6. It records separate poster, protocol, and curator-reserve credits for later
   withdrawal.

The split lookup is visible in
[`proceedsSplitFor`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L542-L558),
and the crediting logic in
[`_creditFixedPriceProceeds`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L635-L680).

A zero price removes payment, not policy. Replay, collection, quantity,
recipient, token data, deadline, mint capacity, and freeze checks still matter.
"Free" must not mean "any caller may mint anything."

The signed Drop requires `quantity == 1`; one authorization mints one token.
Stream can represent editions at the collection level, but this signed path is
not a batch mint.

## Payer and recipient are intentionally different

For a paid fixed-price mint, the account funding the mint and the account
receiving the token can differ. That supports gifts and sponsored actions
without leaving the beneficiary ambiguous. A free mint still names its
recipient but requires its payer to be zero.

Both fields are signed. Someone may copy a public transaction, but the copy
cannot change the recipient or charge another payer. This does not promise
private order flow or first inclusion; it limits what a copied payload can do.

## Current signed sales use the legacy mint lane

The signed Drop and auction paths call the legacy `StreamMinter`, not
`StreamMintManager`. The rehearsal installs the manager in Core separately but
passes the legacy minter to both current sale contracts. See
[`RehearseDeployment.s.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/script/RehearseDeployment.s.sol#L218-L269).

The distinction matters because these sale calls do not consume the manager
lane's durable counters or prepared-mint records. A release candidate must name
one supported end-to-end path and prove its supply, replay, payment, and
Core-entry behavior as one composition.

## The auction flow

An auction authorization opens a longer state machine:

1. The authorization approves the collection and token-data inputs, poster,
   reserve, and end time. It does not name an existing token ID.
2. The legacy minter allocates the Core's next token ID and mints that new token
   into auction custody.
3. `StreamDrops` registers the newly allocated token and approved terms with
   [`AuctionContract.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol),
   which confirms custody before bidding becomes active.
4. A valid first bid meets the reserve. Each later valid bid meets the current
   minimum and becomes the new leader.
5. The displaced bidder receives a withdrawable credit; the new bid is not
   allowed to depend on an immediate refund succeeding.
6. A qualifying late bid extends the end time.
7. After the end, any address may trigger the already-determined settlement.
8. If no one bid, the contract returns or makes the token claimable by the
   poster. A cancellation is possible only before any bid and before the
   auction has ended.

Minting into custody first protects bidders from paying into an auction whose
contract does not hold the work. Minting to an operator and asking for a later
transfer is simpler, but it makes custody and operator failure offchain trust
assumptions.

## Bids create liabilities as well as a leader

Each bid puts ETH under contract control. The auction records the highest
bidder and amount, enforces the next minimum, and keeps displaced bids as
withdrawable credits.

This pull-refund model stops a bidder contract that rejects ETH or attempts
reentrancy from blocking the next valid bid. It also creates a strict solvency
rule: every bidder credit must remain backed and must never be treated as
emergency surplus.

Synchronous refunds need less accounting state, but let an arbitrary recipient
decide whether the auction can continue.

## The minimum next bid is exact

The first bid must meet the reserve. Later bids must equal or exceed:

`current highest bid + floor(current highest bid * 5 / 100)`

The percentage starts at 5%. After a 1 ETH bid, the default next minimum is
1.05 ETH. At very small values, integer rounding can make the percentage
component zero. The authoritative read is
[`minimumNextBid`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L251-L265);
the same calculation is enforced by
[`participateToAuction`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L279-L312).

One global `incPercent` applies when a bid arrives. A function-scoped or global
admin can change it while auctions are active, with no bound, delay, dedicated
change event, or per-auction snapshot. See
[`updatePercentAndExtensionTime`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L549-L558).

Review must cover reserve equality, the exact next minimum, one wei below it,
small-value rounding, large values and multiplication bounds, zero or extreme
percentages, mid-auction changes, bidder replacement, and bids at the time
boundary. Reviewers should decide whether the visible terms must be fixed when
an auction starts.

## Anti-sniping needs a reproducible clock rule

The extension time begins at 300 seconds. When a valid bid arrives with five
minutes or less remaining, the contract adds a full five minutes to the
recorded end time. It adds to the old end time, not the current block time.
Every qualifying late bid can extend again, with no current cap on extension
count or total duration.

`AuctionExtended` records the old and new times. The auction ends only after
`block.timestamp` is greater than the recorded end, so a bid included at the
exact end timestamp can still qualify and extend.

`extensionTime` is also one mutable global value. A function-scoped or global
admin can change it during an active auction without a bound, delay, or
dedicated change event; later bids use the live value.

The rule protects bidders from an auction ending before they can answer a
last-second bid. It cannot guarantee transaction inclusion during congestion.
Removing timing state means choosing a different fairness model, not obtaining
fairness for free.

## Winner settlement is permissionless but not discretionary

After the end time, any address may call
[`claimAuction`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L371-L388).
The caller does not choose the winner, price, or proceeds. Auction state already
fixed them.

Settlement must:

1. confirm that settlement is allowed;
2. use the recorded winning bid and bidder;
3. transfer the escrowed token exactly once;
4. select the token, collection, or default proceeds split;
5. create poster, protocol, and curator credits;
6. preserve bidder and seller accounting;
7. emit a reconstructable record;
8. prevent cancellation or a second settlement.

The contract transfers the token from auction custody and creates
Auction-local credits through
[`_creditAuctionProceeds`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L471-L508).
It does not use the separately deployed revenue resolver or split wallets.

Permissionless settlement is safe only because the trigger carries no
sensitive choice: the consequences were committed earlier.

## No-bid settlement still has a token to resolve

The auction minted its token before bidding, so a no-bid result does not undo
the mint or restore supply. It decides where the existing token goes.

For an ordinary poster address, `claimAuction` returns the token and records
`SettledNoBid`. For a contract poster, it records a pending claimant rather
than attempting an immediate safe transfer. Only that exact contract may call
[`claimNoBidAuctionToken`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L390-L407)
and choose a nonzero recipient. The claim is then cleared, the token
transferred, and the auction made terminal. See
[`_settleNoBidAuction`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L438-L454).

This extra state prevents a contract wallet that rejects or mishandles an
ERC-721 transfer from stranding the token or blocking terminal settlement.
Reviewers should still decide whether a contract poster may name any recipient
and whether returning an already-minted work is the right supply and collector
outcome.

## Cancellation must respect custody and bidder rights

The poster, or an admin authorized for `cancelAuction`, may cancel only while
the auction is active and has no highest bid. Once a bid exists or the auction
has ended, this path is closed.

Cancellation makes the auction terminal and returns the token to the poster.
The function does not check the bidding or settlement pause. See
[`cancelAuction`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L409-L426).

A broader emergency-cancel path would give an operator power over a bidder's
acquired expectation. If cancellation after a bid is ever required, its
refund, consent, timing, and evidence rules must be explicit.

## Liabilities, surplus, and hostile recipients

Auction and Drop contracts hold funds owed to other people. Recoverable surplus
is balance minus liabilities, never raw balance. Liabilities include:

- active highest-bid escrow;
- refundable outbid credits;
- seller proceeds;
- protocol and curator credits;
- every other accounted entitlement.

Both contracts expose liability-aware surplus information. Only
`AuctionContract` exposes `emergencyWithdraw` at this commit, and it caps the
withdrawal at calculated surplus. `StreamDrops` exposes surplus views but no
emergency-withdrawal function. Forced ETH and rounding residuals do not change
the rule.

External transfers must update state first, use reentrancy protection where
needed, preserve credits after failed withdrawals, support alternate recipients
where permitted, and account for every effect. No path should assume that every
wallet is an ordinary address or rely on gas-stipend folklore.

## Additional sale mechanics need their own review

The sales specifications discuss Dutch auctions, private sales, refund windows,
sealed bids, raffles, burn-to-mint, ERC-20 bidding, and other profiles. Those
mechanics are not protections supplied by the sale path described here.

Each could change custody, pricing, ordering, refund, eligibility, replay, and
finality assumptions. The permanent Core should not absorb speculative sale
mechanics. Any added profile should be an explicit reviewed module with bounded
authority over token identity and supply.

## What can still fail

- A signed participant, asset, quantity, price, or sale mode is not completely
  bound.
- A replay registers or settles twice.
- The sale reaches a mint lane with different limits than reviewers expect.
- A global parameter change silently changes an active auction.
- A refund or proceeds credit becomes unbacked.
- Different clients implement extension or rounding rules differently.
- Settlement leaves token custody and funds out of sync.
- No-bid handling strands a token or creates an unfair supply outcome.
- Cancellation violates bidder expectations.
- Emergency withdrawal treats liabilities as surplus.
- A hostile recipient blocks progress or reenters.

## Questions for reviewers

1. Does the authorization bind every participant, economic term, asset, and
   replay input needed by the current sale?
2. Should bid increment and extension rules be fixed per auction?
3. Are the exact boundary-time and rounding rules understandable to bidders?
4. Is direct auction custody the right model for the work before settlement?
5. Should any cancellation path exist after a valid bid?
6. Is no-bid behavior fair to the artist and potential collector?
7. Can every liability and terminal state be reconstructed from public storage
   and events?
8. Which additional sale profiles, if any, are important enough to justify
   genesis audit surface?
