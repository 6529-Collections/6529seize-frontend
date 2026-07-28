# Community curation, TDH, and signed authorization

Stream turns a community decision made outside Ethereum into one exact action
that a smart contract can verify.

Imagine the community approves a fixed-price mint for a particular collection,
buyer, recipient, price, and deadline. A service writes those terms into a
standard typed message. The configured signer signs it. When the message is
submitted, Stream checks that the signature is from the current signing era,
that the terms have not changed, that the deadline has not passed, and that the
authorization has not already been used or cancelled. Only then can the mint
proceed.

The contract does **not** choose the artist or decide whether the community
rules were applied fairly. When its other checks also pass, it executes the
signed result.

**TDH means Total Days Held.** It is 6529’s time-weighted measure of how long
eligible assets have been held. TDH is neither a token nor a value stored by
Stream. The [TDH guide](/network/tdh) explains its calculation and categories.
Stream does not measure TDH, hold an onchain TDH vote, or decide that a work
crossed a community threshold.

## From a community decision to a contract call

A typical flow is:

1. an offchain process applies the published curation or TDH rules;
2. a service constructs the exact mint or auction authorization;
3. the configured signer signs the authorization as EIP-712 typed data, a
   standard structured message whose named fields can be inspected before
   signing;
4. the payer or another caller submits that signed payload to Stream;
5. Stream verifies the signature, signer epoch, deadline, whether the
   authorization was already used or cancelled, and the other bound values;
6. Stream executes only the sale mode and parameters in the authorization.

The first two steps are social and operational. The signature is the bridge.
The remaining steps are cryptographic and contractual.

This split lets community judgment evolve without making the resulting onchain
action vague. It also makes the signer and authorization-building service
important trust boundaries. Artists and collectors should be able to inspect
both.

## Why the signed bridge exists

A simpler design could let an operator call a sale contract with whatever
values happen to be current. That would move important decisions into a private
database, admin dashboard, or transaction script. The collection, recipient,
price, deadline, or sale type could drift between community approval and
execution.

Stream instead signs the outcome. The machinery is justified only to the extent
that it prevents this drift:

- a payload for one chain or contract should not work on another;
- a fixed-price decision should not become an auction;
- a copied transaction should not redirect the token or charge another payer;
- token data should not be substituted;
- an old or cancelled authorization should not execute;
- a successful authorization should not be replayed.

The signature does not prove that the earlier social decision was correct. It
protects the handoff from that decision to the contract.

## What the authorization cannot establish

Stream can verify that the configured signer authorized the exact typed
payload. It cannot establish that:

- the offchain TDH calculation was correct;
- the curation policy was applied fairly;
- the community intended the payload produced by the service;
- the signer was not mistaken, coerced, or compromised;
- the artist saw an accurate rendering of the terms;
- an operator retained the evidence supporting the decision.

Those claims require transparent offchain records, reproducible calculations,
operational controls, and accountable signers. This is not a gap that can be
closed by adding one more Solidity field. It is the boundary between community
judgment and contractual execution.

## The exact authorization

The signed Drop path in
[`StreamDrops.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L24-L60)
uses EIP-712 typed data. Its domain binds the chain ID and verifying contract.
The signed `DropAuthorization` contains:

| Field                 | What it fixes                                                    |
| --------------------- | ---------------------------------------------------------------- |
| `dropId`              | The authorization identity consumed or cancelled by the contract |
| `poster`              | The sale poster and current native-sale proceeds recipient       |
| `recipient`           | The account that receives the token                              |
| `payer`               | The account allowed to fund the execution                        |
| `collectionId`        | The collection that may be minted or auctioned                   |
| `saleMode`            | Fixed price or auction                                           |
| `tokenDataHash`       | The hash of the token data supplied at execution                 |
| `price`               | The fixed-price amount                                           |
| `quantity`            | The authorized quantity                                          |
| `auctionReservePrice` | The minimum auction price                                        |
| `auctionEndTime`      | The intended auction end                                         |
| `salt`                | Additional signed uniqueness                                     |
| `nonce`               | Signer-scoped sequence input used to derive the drop identity    |
| `deadline`            | The last valid execution time                                    |
| `signerEpoch`         | The signing-key era that must still be current                   |

Reviewers should compare the typed-data definition, Solidity encoding, offchain
construction code, wallet display, and emitted events byte for byte. A field
present in only one layer can create a gap between what the community approved,
what the signer signed, what the payer saw, and what the contract executed.

## Why each field exists

### Chain and verifying contract

The EIP-712 domain prevents a payload intended for one Stream deployment from
being accepted on another chain or by another contract.

### Signer epoch

A signer epoch gives key rotation a clear boundary. A payload from an earlier
signing era should not become current merely because the old public key still
verifies it.

Epochs also make incident response legible. When a signer is replaced,
reviewers can ask whether older payloads expire immediately, survive for a
grace period, or remain valid only after another explicit action.

### Payer and recipient

The account providing funds and the account receiving the token may differ.
Binding both supports sponsored or delegated purchases without letting a copied
transaction redirect the artwork or charge an unintended payer.

### Collection and token data

An authorization for one collection must not mint into another. The
`tokenDataHash` binds the supplied token data so execution cannot substitute a
different artwork input while retaining the rest of the signed terms.

### Quantity

The structure contains a quantity field, but current Drop validation requires
`quantity == 1`. One consumed Drop authorization therefore authorizes one token,
not a multi-token batch.

See
[`StreamDrops._validateAuthorization`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L561-L581).

An edition can contain many tokens, but this path needs a separate authorization
for each one. The interface should describe the execution path instead of
implying batch support from the mere presence of a field.

### Price and sale mode

A fixed-price authorization must not become an auction registration, and a free
claim must not become a paid sale. The current signed paths use native ETH; the
authorization has no token-address field. A future token-denominated path would
need to bind the asset as well as the amount.

### Auction terms

The reserve and intended end time connect the curation decision to the initial
auction state. They do not replace the auction contract’s later custody, bid,
extension, cancellation, refund, and settlement rules.

### Deadline

A deadline limits how long a signed action remains useful. A generous deadline
improves operational reliability but increases exposure if a payload leaks or
the community decision changes.

### Replay identity

A successful authorization must not be reusable for an unintended second sale.
The replay identity, cancellation state, signer epoch, and transaction rollback
must continue to agree under failed execution, rotation, and concurrent
submission.

## Fixed-price execution

A valid fixed-price authorization can describe a free or paid mint. Before
minting, the current path checks:

- Drop pause state;
- replay and cancellation state;
- token-data hash;
- deadline;
- payer and recipient;
- quantity;
- sale mode;
- native payment;
- mint time and supply rules;
- Core freeze state.

Signature validity does not override those checks. If execution fails, the
transaction reverts rather than leaving a partly consumed authorization and a
partly minted token.

A free authorization still needs identity, recipient, replay, deadline, phase,
and supply protection. Removing payment does not remove policy.

## Auction registration

An auction-mode authorization registers the intended auction parameters. The
auction contract then owns custody and governs bidding, extensions,
cancellation, refunds, and settlement.

The signed payload bridges the curation decision to the initial auction state.
It is not a bid, and it should not remain replayable as a second auction.

Once registered, the auction has its own state. Rotating a signer or cancelling
an unused authorization does not decide what should happen to a token already
in auction custody or to bids already placed.

## Ordinary accounts and contract-wallet signers

The signing system supports ordinary ECDSA accounts and ERC-1271 contract
wallets. ERC-1271 lets a Safe or another smart account authorize the payload,
which can improve key management and shared control.

It also adds an assumption: a contract wallet’s owners, threshold, and
validation behavior can change.

The public signing record should identify:

- signing address;
- whether it is an ordinary account or contract wallet;
- Safe threshold and owner policy where applicable;
- current signer epoch;
- rotation and emergency-revocation procedure;
- monitoring for unexpected authorizations;
- software version that constructed the typed data.

Private keys, seed phrases, and recovery secrets never belong in that record.

## Cancellation, consumption, and rotation

The protocol includes authorization cancellation and signer-epoch rotation.
The complete lifecycle should make the following observable:

- who may cancel;
- whether cancellation applies to one authorization, one drop identity, or a
  broader set;
- when consumed state is written;
- whether a failed transaction consumes anything;
- how rotation affects already issued payloads;
- whether old-epoch payloads have a grace period;
- what happens to an auction registered before rotation;
- which events reconstruct every cancellation and epoch change.

Cancellation is part of the public promise. Hiding a payload on a website is not
equivalent to cancelling it onchain.

## Transaction ordering and maximal extractable value (MEV)

The repository includes MEV-timing and EIP-712 tests. Binding payer, recipient,
collection, price, quantity, mode, deadline, and token data limits what a copied
transaction can change.

It does not remove every ordering effect. A public mempool can still affect:

- who submits first;
- when a transaction is observed;
- whether it lands before a deadline;
- whether another bid arrives first;
- which block timestamp applies.

The payload should bind every sensitive outcome that copying or relaying must
not change. The product should not promise ordering guarantees Ethereum does
not provide.

## The authorization receipt

Every authorized Drop should have a public, human-readable receipt containing:

- curation rule and version;
- relevant offchain decision identifier;
- collection and artist identity;
- typed payload in readable and canonical machine form;
- signer address and epoch;
- chain and verifying contract;
- payer and recipient rules;
- price, asset, quantity, deadline, and sale mode;
- token-data hash and authorization identity;
- transaction and emitted events after execution;
- cancellation, expiry, or exception record where applicable.

The receipt lets an artist, collector, auditor, or community member compare the
decision, signature, execution, and public explanation without trusting a
private service database.

## Design position

Keeping curation outside Solidity is reasonable only when the boundary is
explicit. The public experience should never suggest that an onchain vote
selected a work when a configured signer actually authorized the result of an
offchain process.

The architecture is valuable when it does two things at once:

1. preserves room for human judgment and evolving community rules; and
2. prevents the resulting onchain action from changing after approval.

That is the standard against which the signer, payload, interface, replay
storage, and public receipt should be reviewed. Extra ceremony that does not
improve this binding or its evidence should be challenged.

## Failure modes reviewers should test

- TDH or curation input is wrong;
- the authorization service constructs different terms from the approved
  decision;
- the human-readable display omits or misstates a signed field;
- a signer key or Safe is compromised;
- signer rotation leaves an old payload valid unexpectedly;
- domain separator, type hash, or field encoding differs across implementations;
- a replay or cancellation marker is written too early or too late;
- a copied transaction changes an incompletely bound field;
- a deadline, chain, asset, or sale mode is misunderstood;
- auction registration and later signer cancellation produce inconsistent
  expectations;
- a failed execution consumes an authorization without completing the intended
  action.

## Questions for reviewers

1. Does the typed payload bind every value that could harm an artist, payer,
   recipient, or collector if changed?
2. Can a non-technical reader compare the curation decision with the exact
   action they are asked to sign or submit?
3. What public evidence should prove the offchain curation result?
4. Who may rotate or revoke a signer, and how quickly?
5. Should issued authorizations survive signer rotation?
6. Are cancellation and replay rules clear under every revert path?
7. Which parts of the TDH and curation process should be independently
   reproducible?
8. What should happen to a registered auction when the signer or underlying
   community decision later changes?
