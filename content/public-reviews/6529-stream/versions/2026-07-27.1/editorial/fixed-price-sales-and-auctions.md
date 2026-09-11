# Fixed-price sales and auctions

This review covers an incomplete, undeployed candidate; [Current Implementation and Readiness](./security-testing-and-known-limitations) is the authoritative record of what is connected, implemented, proposed, and still required.

A sale contract does more than collect ETH. It turns approved terms into
custody, payment, allocation, refunds, and a terminal result. Stream's sales
layer is designed to prevent a copied signature from changing the buyer or
recipient, an arbitrary bidder from blocking an auction, a failed refund from
halting progress, or a settlement from leaving ownership and funds in different
states.

Those protections create visible state and accounting. A smaller sale function
can omit them only by accepting narrower behavior or moving the missing rules
to a trusted marketplace, operator, or database.

## Signed terms are the bridge from decision to execution

Both current sale paths begin with a
[`DropAuthorization`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L24-L61).
Its EIP-712 domain binds the chain and verifying contract. Its payload binds:

- authorization identity and replay inputs;
- poster;
- token recipient;
- payer;
- collection;
- fixed-price or auction mode;
- token-data hash;
- fixed price;
- quantity;
- auction reserve and end time;
- deadline;
- signer epoch.

This is how an offchain curation decision becomes a constrained onchain action.
The contract does not need to reproduce the TDH or curation process. It does
need to ensure that the signed result cannot quietly become a different sale.

Without chain and verifying-contract binding, a signature can be replayed in a
different domain. Without distinct payer and recipient fields, a copied
transaction can redirect the work or charge an unintended account. Without a
mode, amount, token-data hash, deadline, epoch, and one-use identity, a valid
signature can authorize more than the signer and community intended.

Signature validity remains only one condition. Supply, mint policy, pause
state, payment, freeze, and sale-specific checks still apply.

The current authorization has no currency or token-address field. The
implemented Drop and auction paths are native-ETH paths, so currency is fixed
by the execution path. Any future token-denominated authorization would need to
bind the asset address separately from its amount.

## Current signed sales use the legacy mint lane

The signed Drop and auction paths call the legacy `StreamMinter`, not
`StreamMintManager`. The rehearsal separately installs the manager in Core, but
passes the legacy minter to both current sale contracts. See
[`RehearseDeployment.s.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/script/RehearseDeployment.s.sol#L218-L269).

That distinction matters because the current sale path does not consume the
manager lane's durable counters or prepared-mint records. A launch candidate
must identify one exact end-to-end path and demonstrate its supply, replay,
payment, and Core-entry behavior as a composition.

## Fixed-price execution protects both paid and free mints

A fixed-price authorization can describe a paid mint or a zero-price claim.

For a paid mint, submitted ETH must match the authorized economics. Execution
does not trust a price supplied only by the frontend. The product must describe
the currency as ETH rather than imply that the signed authorization selected
from multiple assets.

The current Drop contract selects a local proceeds split in token, collection,
then contract-default order. It creates separate poster, protocol, and
curator-reserve credits rather than pushing ETH to arbitrary recipients during
mint. See
[`proceedsSplitFor`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L542-L558)
and
[`_creditFixedPriceProceeds`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L635-L680).

A zero-price authorization removes payment, not policy. Replay, collection,
quantity, recipient, token data, deadline, mint capacity, and freeze checks
still matter. "Free" must not become shorthand for "any caller may mint
anything."

The current signed Drop requires `quantity == 1`; one authorization mints one
token. Stream can represent editions at the collection level, but the current
signed path is not a batch mint.

## Payer and recipient are intentionally different concepts

The account funding a mint and the account receiving the token can differ. That
supports gifts, sponsored actions, and other delegated payment patterns without
leaving the beneficiary ambiguous.

Both values are signed. A public transaction can be copied, but the copier
cannot change the recipient or use the same payload to charge another payer.
The protocol does not promise private order flow or first-inclusion guarantees;
it constrains what a copied payload can accomplish.

## Auction registration commits the item to one state machine

An auction-mode authorization registers the approved collection, token, poster,
reserve, and end-time context with
[`AuctionContract.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol).
The authorization is the bridge from curation to auction registration; it is
not itself a bid.

The token is minted into auction custody during registration. Registration
confirms that custody before the auction becomes active. That ordering protects
the bidder from paying into an auction whose contract does not hold the work it
is supposed to deliver.

A simpler design can mint to an operator and ask that operator to transfer
later. That reduces contract state, but replaces onchain custody with trust in
the operator and creates ambiguity when settlement, cancellation, or the
operator itself fails.

## Bids create liabilities as well as a leader

Each valid bid places ETH under contract control. The auction records the
highest bidder and amount and enforces a minimum next bid.

When another bidder becomes the leader, the displaced bidder receives a
withdrawable credit. The contract does not synchronously push ETH back during
the new bid.

Pull refunds protect auction progress from an arbitrary bidder contract that
rejects ETH or tries to reenter. They also create a strict solvency obligation:
every bidder credit must remain backed and must be excluded from emergency
surplus.

The simplification tradeoff is direct. Synchronous refunds require less
credit-tracking state, but they let a hostile or incompatible recipient decide
whether another user's valid bid can proceed.

## The minimum next bid is exact

The first bid must meet the reserve. Later bids must be at least the current
highest bid plus a percentage of that bid. The percentage begins at 5%, and
integer division rounds its component down:

`current highest bid + floor(current highest bid * 5 / 100)`

After a 1 ETH bid, the default next minimum is 1.05 ETH. At very small values,
rounding can produce no increase. The authoritative read is
[`minimumNextBid`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L251-L265);
the same calculation is enforced by
[`participateToAuction`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L279-L312).

This rule is easy to explain only if its parameters are stable. In the current
candidate, a function-scoped or global admin can change the one global
`incPercent` value at any time, including while auctions are active. There is
no bound, delay, change event, or per-auction snapshot. Every active auction
uses the value that is live when the next bid arrives. See
[`updatePercentAndExtensionTime`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L549-L558).

Reviewers should decide whether terms visible when an auction starts must remain
fixed for that auction. At minimum, tests should cover:

- first bid and reserve equality;
- the exact next minimum;
- one wei below the minimum;
- small-value rounding;
- large values and multiplication bounds;
- zero or extreme configured percentages;
- changes during an active auction;
- bidder replacement;
- bids at the time boundary.

## Anti-sniping needs a reproducible clock rule

The extension time begins at 300 seconds. When a valid bid arrives with five
minutes or less remaining, the contract adds another full five minutes to the
recorded end time. It adds to the old end time, not to the current block time.
Every qualifying late bid can extend again, and the current code has no cap on
the number of extensions or total duration.

Each extension emits `AuctionExtended` with the old and new end times. The
auction is considered ended only after `block.timestamp` is greater than the
recorded end. A bid included at exactly the end timestamp can still qualify and
extend the auction.

Like the increment, `extensionTime` is one mutable global value. A
function-scoped or global admin can change it during active auctions without a
bound, delay, or dedicated change event, and later bids use the current value.

The extension protects bidders from a last-second auction that ends before they
can respond. It cannot guarantee inclusion during network congestion. A product
that wants no timing state at all must accept a different fairness model, not
pretend that Ethereum supplies one automatically.

## Winner settlement is permissionless but not discretionary

After the recorded end time passes, any address may call
[`claimAuction`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L371-L388).
The caller cannot choose the winner, price, or proceeds. Those values are
already fixed in auction state.

Settlement must:

1. confirm that the auction can settle;
2. use the recorded winning bid and bidder;
3. transfer the escrowed token exactly once;
4. apply the auction's token, collection, or default proceeds split;
5. create poster, protocol, and curator credits;
6. preserve bidder and seller accounting;
7. emit reconstructable events;
8. make cancellation and second settlement impossible.

In the current candidate, settlement transfers the token held in auction
custody and credits Auction-local balances through
[`_creditAuctionProceeds`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L471-L508).
It does not use the separately deployed revenue resolver or split wallets.

Permissionless settlement is safe only because the caller supplies no sensitive
choice. This is a useful complexity boundary: keep the trigger open, but commit
the consequences before the trigger is available.

## No-bid settlement still has a token to resolve

The token already exists in auction custody when bidding begins. A no-bid
result therefore does not undo the mint or restore supply. It decides where the
already-minted token goes.

If the poster is an ordinary address, `claimAuction` transfers the token back
and records `SettledNoBid`. If the poster is a contract, the auction records it
as a pending claimant instead of attempting an immediate safe transfer. Only
that exact contract may call
[`claimNoBidAuctionToken`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L390-L407),
and it may choose a nonzero recipient. The second call clears the claim,
transfers the token, and makes the auction terminal. See
[`_settleNoBidAuction`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L438-L454).

This extra state exists because contract recipients can reject or mishandle an
ERC-721 transfer. The alternative is simpler code that can permanently strand
the token or block the auction's terminal state.

Reviewers should still decide whether a contract poster should be able to name
any recipient and whether returning an already-minted work is the right supply
and collector outcome.

## Cancellation must respect custody and bidder rights

The poster, or an admin authorized for `cancelAuction`, may cancel only while
the auction is active and the highest bid is zero. Once any bid exists, or the
auction has ended, this path is unavailable.

Cancellation makes the auction terminal and returns the token from custody to
the poster. The current function does not check the bidding or settlement pause.
See
[`cancelAuction`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L409-L426).

A broader emergency-cancel button would be shorter to describe but would give
an operator power over a bidder's acquired expectation. If cancellation after
a bid is ever needed, its refund, consent, timing, and evidence rules must be
explicit.

## Recoverable surplus is not contract balance

Auction and Drop contracts hold funds that belong to other people. An
authorized recovery must not treat the following liabilities as surplus:

- active highest-bid escrow;
- refundable outbid credits;
- seller proceeds;
- protocol or curator credits;
- any other accounted liability.

The recoverable amount is balance minus liabilities. Raw contract balance is
not a safe definition of surplus, including when forced ETH or rounding
residuals exist.

Both contracts expose liability-aware surplus information. Only
`AuctionContract` exposes an `emergencyWithdraw` action at this commit, and it
caps that withdrawal at the calculated surplus. `StreamDrops` exposes the
surplus views but no emergency withdrawal function.

## Hostile recipients remain part of the design

Auction, refund, proceeds, and token-transfer paths interact with arbitrary
addresses. Pull credits remove some synchronous calls from critical paths, but
the contracts still need:

- state updates before external transfer;
- reentrancy protection where required;
- credits that survive a failed withdrawal;
- alternate recipient handling for incompatible contract wallets;
- exact accounting for every external effect.

No design should rely on gas-stipend folklore or assume that every wallet is an
ordinary address.

## Additional sale mechanics belong behind reviewed adapters

The sales specifications discuss Dutch auctions, private sales, refund windows,
sealed bids, raffles, burn-to-mint, ERC-20 bidding, and other profiles. They are
proposed or deferred unless they appear in the reviewed release contracts and
tests.

Adding a sale profile is not a UI-only change. It can change custody, pricing,
ordering, refund, eligibility, replay, and finality assumptions. The permanent
Core should not absorb speculative mechanics. New profiles should use explicit,
reviewed modules whose authority over identity and supply remains bounded.

## What a simpler design would externalize

A bare payable mint or marketplace-run auction can remove much of this state.
It also makes another system responsible for:

- proving the displayed terms match execution;
- protecting copied authorizations;
- holding the work during bidding;
- refunding displaced bidders;
- deciding time extensions;
- handling contract-wallet recipients;
- retaining solvency through settlement;
- producing a reconstructable terminal record.

That may be a reasonable trust model for a particular sale. It is not the same
guarantee. Stream's complexity should be judged against those responsibilities,
not against the line count of a contract that delegates them to an operator.

## What can fail

- A signed price, participant, asset, quantity, or sale mode is incompletely
  bound.
- A replay registers or settles twice.
- The signed sale enters a mint lane with different limits than reviewers
  expect.
- A global parameter change silently alters an active auction.
- A refund or proceeds credit becomes unbacked.
- An extension calculation differs across clients.
- Winner settlement leaves token custody and funds out of sync.
- No-bid handling strands a token.
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
