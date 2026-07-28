# Fixed-price sales and auctions

The reviewed candidate supports signed fixed-price execution and English
auctions. Draft documents discuss additional sale profiles, but those are not
all current contract behavior.

## Signed sale authorization

### IMPLEMENTED

Both sale paths begin with a
[`DropAuthorization`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L24-L61).
Its EIP-712 domain binds the chain and verifying contract. Its payload binds the
intended collection, participant values, price, pricing or auction mode,
deadline, signer epoch, and replay identifier.

The current authorization has no currency or token-address field. These paths
are native-ETH paths, so the currency is fixed by the execution path rather than
selected inside the signed payload. A future token-denominated sale path would
need to bind the token address separately from price. Signature validity is only
one condition. Mint policy, supply, pause state, payment, and sale-specific
checks still apply.

### CURRENTLY WIRED BASELINE

The signed paths use the legacy `StreamMinter`, not `StreamMintManager`. The
rehearsal passes that legacy minter to both Drops and Auctions while separately
installing the newer manager in Core. See
[`RehearseDeployment.s.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/script/RehearseDeployment.s.sol#L218-L269).

## Fixed-price mint

A fixed-price authorization can describe a free or paid mint.

### PAID PATH

The submitted native-ETH value must match the authorized economics. The
execution does not trust an unbound frontend price, and the UI must describe the
currency as ETH rather than imply that the authorization selected a token.

The current Drop contract does not call `StreamRevenueResolver` or
`StreamPrimarySaleSettlement`. It selects a Drop-local proceeds split in this
order: token, collection, then contract default. It creates separate poster,
protocol, and curator-reserve credits instead of pushing arbitrary recipients
during mint. See
[`proceedsSplitFor`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L542-L558)
and
[`_creditFixedPriceProceeds`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L635-L680).

### FREE PATH

A zero-price authorization still needs replay, quantity, recipient, deadline,
phase, and supply protection. “Free” removes payment; it does not remove policy.

### PAYER AND RECIPIENT

The payer and token recipient can be different. Both are signed so that a copied
transaction cannot redirect the token or unexpectedly charge another account.

## Auction registration

### IMPLEMENTED

The English auction path registers an auction using the authorized terms. The
auction contract owns its bidding and custody state. Registration should happen
once for the authorized item and cannot be replayed as another auction.

Relevant source:
[`AuctionContract.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol).

## Custody and bids

Bids place value under contract control. The contract tracks the current leader
and amount, enforces a minimum next bid, and credits a displaced bidder for
withdrawal.

### PULL REFUNDS

Crediting refunds avoids making auction progress depend on an arbitrary bidder
contract accepting ETH during the next bid. It also creates a solvency
requirement: total bidder and seller credits must remain backed and excluded
from any emergency-surplus withdrawal.

## Minimum next bid

### IMPLEMENTED

The first bid must meet the auction's reserve price. After that, the contract
requires at least the current highest bid plus a percentage of that bid. The
percentage starts at 5%. Solidity integer division rounds the percentage
component down, so the exact default formula is:

`current highest bid + floor(current highest bid * 5 / 100)`

For example, after a highest bid of 1 ETH, the next bid must be at least 1.05
ETH. For very small values, rounding can produce no increase at all. The
contract exposes the authoritative result through
[`minimumNextBid`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L251-L265),
and enforces the same calculation in
[`participateToAuction`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L279-L312).

This percentage is not fixed per auction. A function-scoped or global admin can
change the one global `incPercent` value at any time, including while auctions
are active. The current code has no bound, delay, change event, or per-auction
snapshot. The next bid on every active auction uses whatever value is current
then. See
[`updatePercentAndExtensionTime`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L549-L558).

The UI can show a suggested next bid, but the Solidity calculation is
authoritative. Reviewers should decide whether active auctions need immutable
terms, and should test:

- the first bid;
- exact minimum bids;
- one wei below the minimum;
- large values and multiplication bounds;
- rounding direction;
- a zero or extreme admin-set percentage;
- a percentage change during an active auction;
- bidder replacement;
- bids near the end time.

## Time extension

### IMPLEMENTED

The extension time starts at 300 seconds, or five minutes. When a valid bid
arrives with five minutes or less remaining, the contract adds another full
five minutes to the recorded end time. The addition is to the old end time, not
to the current block time. Every qualifying late bid can extend again; the
current code sets no maximum number of extensions or maximum total duration.
Each extension emits `AuctionExtended` with the old and new end times. See
[`participateToAuction`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L279-L312).

The status calculation treats the auction as ended only when the block
timestamp is greater than the recorded end time. A bid included at exactly the
end timestamp can therefore still qualify and extend the auction if every
other check passes.

Like the bid percentage, `extensionTime` is a mutable global value rather than
an auction snapshot. A function-scoped or global admin can change it at any
time, including during active auctions. There is no bound, delay, or change
event, and any `_opt` value other than `1` in
[`updatePercentAndExtensionTime`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L549-L558)
changes the extension time. Later bids use the latest value.

Network congestion can still prevent a transaction from landing. An extension
rule is not a guarantee that every intended bid will be included.

## Settlement with a winner

After the block timestamp moves past the recorded end time, any address may
call
[`claimAuction`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L371-L388).
There is no caller-role check. The caller cannot choose the winner, price, or
proceeds: the contract uses the recorded highest bid and bidder. Settlement
reverts while the auction-settlement pause is active.

Settlement must:

1. confirm the auction is eligible to settle;
2. identify the recorded winning bid;
3. execute the authorized mint or delivery exactly once;
4. apply the Auction contract's token, collection, or contract-default proceeds
   split and create poster, protocol, and curator credits;
5. preserve bidder and seller accounting;
6. emit reconstructable events;
7. prevent later cancellation or second settlement.

If crediting or token transfer fails at settlement, the transaction must not
leave funds or the winning bidder's rights ambiguous.

In the current baseline, the auction token is minted into auction custody during
registration. Winner settlement credits the Auction contract's local balances
and transfers the held token. It does not call the revenue resolver or split
wallets. The exact credit path is
[`_creditAuctionProceeds`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L471-L508).

## No-bid settlement

### IMPLEMENTED

The token is already minted and held by the Auction contract when the auction
is registered. Registration confirms that custody before marking the auction
active. A no-bid result therefore does not undo the mint or restore collection
supply; it decides where the already-minted token goes.

After the auction ends with no bid, anyone may call `claimAuction`. If the
poster is an ordinary wallet address, settlement transfers the token directly
back to that poster and marks the auction `SettledNoBid`.

If the poster is itself a contract, the Auction contract does not attempt that
immediate safe transfer. It records the poster contract as the pending claimant
and emits `NoBidSettlementPending`. Only that exact contract may then call
[`claimNoBidAuctionToken`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L390-L407),
but it may direct the token to any nonzero recipient. That second call clears
the pending claimant, transfers the token, and makes the auction terminal. See
the two branches in
[`_settleNoBidAuction`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L438-L454).

## Cancellation

### IMPLEMENTED

The poster or an admin authorized for `cancelAuction` may cancel only while the
auction is still active and its highest bid is zero. Once any valid bid exists,
or once the auction has ended, this cancellation path is unavailable.
Cancellation marks the auction terminal and transfers the token from auction
custody back to the poster. The function does not check the bidding or
settlement pause. See
[`cancelAuction`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/AuctionContract.sol#L409-L426).

### REVIEW QUESTIONS

- Should the bid increment and extension time be bounded, evented, delayed, and
  fixed when each auction starts?
- Should a contract poster's pending claim be able to name any recipient?
- Should cancellation have its own pause rule?
- Should a signer cancellation affect an auction that is already registered?
- Are all refunds immediately withdrawable?
- Is returning the already-minted token the correct no-bid outcome for supply
  and collector expectations?

## Emergency withdrawal

An emergency or surplus withdrawal must not touch:

- active winning bids;
- refundable outbid credits;
- seller or revenue credits;
- provider reserves;
- any other accounted liability.

The correct value is surplus after liabilities, not raw contract balance.

## Reentrancy and hostile recipients

Auction and withdrawal paths interact with arbitrary addresses. Pull payments
reduce some risk, but the contract still needs:

- state changes before external value transfer;
- reentrancy protection where needed;
- a recovery path when a recipient rejects ETH;
- exact accounting for contract wallets;
- no reliance on gas-stipend folklore.

## Draft sale profiles

### PROPOSED OR DEFERRED

The sales design documents discuss Dutch auctions, private sales, refund
windows, sealed bids, raffles, burn-to-mint, ERC-20 bidding, and other profiles.
Unless a profile appears in the reviewed release contracts and tests, this
public review treats it as proposed or deferred.

Adding a sale profile later is not only a UI change. It can alter custody,
ordering, refund, pricing, and replay assumptions.

## What we think

Fixed-price and English auction behavior should be final and fully specified
before launch. More profiles can use successor modules later. The permanent Core
should not absorb speculative sale mechanisms.

## What can fail

- an authorization price or sale mode is incompletely bound;
- a replay registers or settles twice;
- a refund becomes unbacked;
- an extension calculation is inconsistent across clients;
- a global admin change silently alters the terms of an active auction;
- settlement mints incorrectly after funds are committed;
- cancellation violates a bidder's expectation;
- emergency withdrawal treats liabilities as surplus;
- a hostile recipient blocks progress or reenters.

## Questions for reviewers

1. Are payer, recipient, native-ETH amount, quantity, and mode bound completely,
   and would any future alternate asset add an explicit token-address field?
2. Should auctions allow cancellation after any bid?
3. Are extension rules simple enough to explain and reproduce?
4. Is no-bid behavior fair to the artist and potential collector?
5. Can every liability be reconstructed from events and storage?
6. Which additional sale profiles, if any, must exist at genesis?
