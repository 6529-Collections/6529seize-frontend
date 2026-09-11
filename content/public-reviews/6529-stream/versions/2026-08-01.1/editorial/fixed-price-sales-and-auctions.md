# Fixed-price sales and auctions

A sale contract turns approved terms into custody, payment, allocation,
refunds, and a terminal result. Stream binds the buyer and recipient, preserves
auction progress around hostile bidders and failed refunds, and settles
ownership and funds together.

Those protections create visible state and accountable value flows. Each rule
stays in the reviewed protocol path where artists, bidders, and reviewers can
inspect it.

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
The contract accepts the signed result of the TDH and curation process and
ensures that execution matches the authorized sale.

Chain and verifying-contract binding confine a signature to one domain. Distinct
payer and recipient fields preserve both roles when a transaction is copied.
Mode, amount, token-data hash, deadline, epoch, and a one-use identity constrain
execution to the action authorized by the signer and community.

Signature validity remains only one condition. Supply, mint policy, pause
state, payment, freeze, and sale-specific checks still apply.

The current authorization supports native ETH only. The
implemented Drop and auction paths are native-ETH paths, so currency is fixed
by the execution path. Any future token-denominated authorization would need to
bind the asset address separately from its amount.

## Current signed sales use the legacy mint lane

The signed Drop and auction paths call the legacy `StreamMinter`. The rehearsal
also installs `StreamMintManager` in Core. Both current sale contracts receive
the legacy minter. See
[`RehearseDeployment.s.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/script/RehearseDeployment.s.sol#L218-L269).

The current sale path uses its own accounting alongside the manager lane's
durable counters and prepared-mint records. A launch candidate
must identify one exact end-to-end path and demonstrate its supply, replay,
payment, and Core-entry behavior as a composition.

## Fixed-price execution protects both paid and free mints

A fixed-price authorization can describe a paid mint or a zero-price claim.

For a paid mint, the caller equals the signed payer and submitted ETH equals
the signed price. The product must describe the currency as ETH, the sole asset
in the current authorization. The recipient is signed separately and must be a
nonzero address.

The current Drop contract selects a local proceeds split in token, collection,
then contract-default order. It creates separate poster, protocol, and
curator-reserve credits for later withdrawal. See
[`proceedsSplitFor`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L542-L558)
and
[`_creditFixedPriceProceeds`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L635-L680).

A zero-price authorization carries the zero address as payer and accepts
submission from any account. The signed nonzero recipient and token-data hash
keep the artwork destination fixed. Replay, collection, quantity, deadline,
mint capacity, and freeze checks still apply.

The current signed Drop requires `quantity == 1`; one authorization mints one
token. Stream can represent editions at the collection level; the current
signed path mints one token per authorization.

## Payer and recipient are intentionally different concepts

The account funding a mint and the account receiving the token can differ. That
supports gifts, sponsored actions, and other delegated payment patterns while
keeping the beneficiary explicit.

Both values are signed. A copied public transaction keeps the authorized
recipient and payer. Public order flow determines inclusion, while the payload
constrains the outcome of copying.

## Auction registration commits the item to one state machine

An auction-mode authorization registers the approved collection, token, poster,
reserve, and end-time context with
[`AuctionContract.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol).
The authorization initializes auction registration from the curation decision.
Bids begin after registration.

Registration carries zero values for payer, recipient, fixed price, and
submitted ETH. The signed reserve and end time define the initial auction
economics.

The token is minted into auction custody during registration. Registration
confirms that custody before the auction becomes active. That ordering protects
the bidder by ensuring that the auction contract holds the work it will deliver.

The auction contract takes custody during registration and holds the exact work
it must deliver. This gives settlement and cancellation a defined owner even if
an operator becomes unavailable.

## Bids create liabilities as well as a leader

Each valid bid places ETH under contract control. The auction records the
highest bidder and amount and enforces a minimum next bid.

When another bidder becomes the leader, the displaced bidder receives a
withdrawable credit. Refunds happen through a separate withdrawal.

Pull refunds protect auction progress from an arbitrary bidder contract that
rejects ETH or tries to reenter. They also create a strict solvency obligation:
every bidder credit must remain backed and must be excluded from emergency
surplus.

Pull refunds keep bidding available when a hostile or incompatible recipient
rejects ETH. This requires the contract to track each refundable credit.

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
recorded end time. Each extension starts from the previously recorded end time.
Every qualifying late bid can extend again, and the current code has no cap on
the number of extensions or total duration.

Each extension emits `AuctionExtended` with the old and new end times. The
auction is considered ended only after `block.timestamp` is greater than the
recorded end. A bid included at exactly the end timestamp can still qualify and
extend the auction.

Like the increment, `extensionTime` is one mutable global value. A
function-scoped or global admin can change it during active auctions. The
change has no bound, delay, or dedicated event, and later bids use the current
value.

The extension gives bidders a response window after a late bid. Transaction
inclusion still depends on network conditions. A product with stateless timing
would use a different, explicitly documented fairness model.

## Winner settlement uses fixed results

After the recorded end time passes, any address may call
[`claimAuction`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L371-L388).
Auction state fixes the winner, price, and proceeds before the call.

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
The separately deployed revenue resolver and split wallets sit outside this
auction settlement path.

Anyone may trigger settlement because every sensitive result is fixed before
settlement becomes available. The caller chooses the time of execution and
cannot change the recipient, token, or payment outcome.

## Zero-bid settlement resolves the auctioned token

The token already exists in auction custody when bidding begins. A zero-bid
result routes that already-minted token while preserving its supply history.

If the poster is an ordinary address, `claimAuction` transfers the token back
and records `SettledNoBid`. If the poster is a contract, the auction records it
as a pending claimant for a later safe transfer. Only
that exact contract may call
[`claimNoBidAuctionToken`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L390-L407),
and it may choose a nonzero recipient. The second call clears the claim,
transfers the token, and makes the auction terminal. See
[`_settleNoBidAuction`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L438-L454).

The pending-claimant state gives a contract recipient a second transfer attempt
and lets the auction reach a terminal state when the first transfer fails.

Reviewers should still decide whether a contract poster should be able to name
any recipient and whether returning an already-minted work is the right supply
and collector outcome.

## Cancellation must respect custody and bidder rights

The poster, or an admin authorized for `cancelAuction`, may cancel only while
the auction is active and the highest bid is zero. Once any bid exists, or the
auction has ended, this path is unavailable.

Cancellation makes the auction terminal and returns the token from custody to
the poster. The current function proceeds independently of the bidding and
settlement pause.
See
[`cancelAuction`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L409-L426).

Cancellation ends once a valid bid exists, protecting the bidder's acquired
expectation. Any future post-bid cancellation design would need explicit refund,
consent, timing, and evidence rules.

## Recoverable surplus excludes liabilities

Auction and Drop contracts hold funds that belong to other people. An
authorized recovery must preserve the following liabilities:

- active highest-bid escrow;
- refundable outbid credits;
- seller proceeds;
- protocol or curator credits;
- any other accounted liability.

The recoverable amount is balance minus liabilities, including forced ETH and
rounding residuals.

Both contracts expose liability-aware surplus information. Only
`AuctionContract` exposes an `emergencyWithdraw` action at this commit, and it
caps that withdrawal at the calculated surplus. `StreamDrops` exposes the
surplus views. Emergency withdrawal is unavailable there.

## Hostile recipients remain part of the design

Auction, refund, proceeds, and token-transfer paths interact with arbitrary
addresses. Pull credits remove some synchronous calls from critical paths. The
contracts still need:

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

Adding a sale profile changes custody, pricing, ordering, refund, eligibility,
replay, and finality assumptions across the protocol. New profiles should use
explicit, reviewed modules whose authority over identity and supply remains
bounded, keeping speculative mechanics outside the permanent Core.

## Responsibilities carried by the sale contracts

The sale contracts keep the following responsibilities public:

- proving the displayed terms match execution;
- protecting copied authorizations;
- holding the work during bidding;
- refunding displaced bidders;
- deciding time extensions;
- handling contract-wallet recipients;
- retaining solvency through settlement;
- producing a reconstructable terminal record.

These records let artists, bidders, and reviewers verify the complete sale from
authorization through custody, payment, and final ownership.

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
