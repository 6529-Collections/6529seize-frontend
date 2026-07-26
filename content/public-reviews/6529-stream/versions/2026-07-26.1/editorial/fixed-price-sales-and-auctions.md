# Fixed-price sales and auctions

The reviewed candidate supports signed fixed-price execution and English
auctions. Draft documents discuss additional sale profiles, but those are not
all current contract behavior.

## Signed sale authorization

### IMPLEMENTED

Both sale paths begin with a signed authorization. Its EIP-712 domain binds the
chain and verifying contract. Its payload binds the intended collection,
participant values, currency or token address separately from price, pricing or
auction mode, deadline, signer epoch, and replay identifier. Signature validity
is only one condition. Mint policy, supply, pause state, payment, and
sale-specific checks still apply.

## Fixed-price mint

A fixed-price authorization can describe a free or paid mint.

### PAID PATH

The submitted value must match the authorized economics. The execution should
not trust an unbound frontend price or infer currency from display text. The
resulting proceeds are credited according to the configured revenue path rather
than blindly pushed to arbitrary recipients during mint.

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
[`AuctionContract.sol`](https://github.com/6529-Collections/6529Stream/blob/e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8/smart-contracts/AuctionContract.sol).

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

The minimum increment rule must be deterministic at every value, including
rounding boundaries. The UI can show a suggested next bid, but the Solidity
calculation is authoritative.

Reviewers should test:

- the first bid;
- exact minimum bids;
- one wei below the minimum;
- large values and multiplication bounds;
- rounding direction;
- bidder replacement;
- bids near the end time.

## Time extension

### IMPLEMENTED

Late bids can extend the auction under configured rules. Extension is intended
to reduce simple last-block sniping.

The contract should make clear:

- the extension window;
- extension duration;
- whether extensions can repeat;
- any maximum total extension;
- the event emitted;
- how clients calculate the current end time.

Network congestion can still prevent a transaction from landing. An extension
rule is not a guarantee that every intended bid will be included.

## Settlement with a winner

After the auction ends, a permissionless caller may be able to settle because
the sensitive outcome is already fixed in state.

Settlement must:

1. confirm the auction is eligible to settle;
2. identify the recorded winning bid;
3. execute the authorized mint or delivery exactly once;
4. credit sale proceeds through the correct revenue profile;
5. preserve bidder and seller accounting;
6. emit reconstructable events;
7. prevent later cancellation or second settlement.

If minting fails at settlement, the recovery state must be explicit. Funds and
the winning bidder's rights cannot be left ambiguous.

## No-bid settlement

### IMPLEMENTED

The reviewed auction design includes no-bid handling and a contract-poster
pending claim path. This case needs plain language because there is no winning
bid to fund a normal settlement.

Reviewers should establish:

- who receives or can claim the unsold token;
- whether a token is minted at registration or settlement;
- whether the collection supply changed;
- which party may cancel;
- how the auction becomes terminal.

## Cancellation

Cancellation should be possible only in states that do not violate bidder
rights. The exact rules matter more than the existence of an admin function.

### REVIEW QUESTIONS

- Can an auction be cancelled after a valid bid?
- Can a signer cancellation invalidate a registered auction?
- What happens if the protocol is paused?
- Can a guardian cancel, or only stop settlement?
- Are all refunds immediately withdrawable?
- Does cancellation consume the original signed authorization?

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
- settlement mints incorrectly after funds are committed;
- cancellation violates a bidder's expectation;
- emergency withdrawal treats liabilities as surplus;
- a hostile recipient blocks progress or reenters.

## Questions for reviewers

1. Are payer, recipient, currency, amount, quantity, and mode bound completely?
2. Should auctions allow cancellation after any bid?
3. Are extension rules simple enough to explain and reproduce?
4. Is no-bid behavior fair to the artist and potential collector?
5. Can every liability be reconstructed from events and storage?
6. Which additional sale profiles, if any, must exist at genesis?
