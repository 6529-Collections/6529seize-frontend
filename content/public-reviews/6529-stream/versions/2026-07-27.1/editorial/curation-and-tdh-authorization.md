# Community curation, TDH, and signed authorization

This review covers an incomplete, undeployed candidate; [Current Implementation and Readiness](./security-testing-and-known-limitations) is the authoritative record of what is connected, implemented, proposed, and still required.

Stream converts a social curation decision into a cryptographically bound
action. The community process remains offchain; once its result is signed, the
collection, participants, economics, timing, and sale mode cannot quietly drift
during execution.

**TDH means Total Days Held.** It is 6529's time-weighted measure of how long
eligible assets have been held, not a token or value stored by Stream. The
[TDH guide](/network/tdh) explains the calculation and categories.

The decisive boundary is:

**TDH and curation are calculated outside Solidity. Stream verifies a signed
authorization for the resulting action.**

The contract does not choose an artist, measure TDH, hold an onchain TDH vote,
or decide that a work crossed a community threshold. Its job is to receive an
exact authorized action and enforce the parts of that action that Solidity can
verify.

## From a community decision to a contract call

A typical flow is:

1. an offchain process applies the published curation or TDH rules;
2. a service constructs the exact mint or auction authorization;
3. the configured signer signs the EIP-712 payload;
4. the payer or another caller submits that signed payload to Stream;
5. Stream verifies the signature, signer epoch, deadline, replay state, and
   bound values;
6. Stream executes only the sale mode and parameters contained in the
   authorization.

The first two steps are social and operational. The signature is the bridge.
The remaining steps are cryptographic and contractual.

This division allows community judgment to remain flexible without making the
onchain result vague. It also makes the signer and the authorization-building
service important trust boundaries that must be visible to artists and
collectors.

## The exact authorization

The signed drop path in
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
that appears in only one of those layers can create a gap between what the
community approved, what the signer signed, what a payer saw, and what the
contract executed.

## Why each field exists

### Chain and verifying contract

A chain-and-contract domain prevents a valid payload intended for one Stream
deployment from being accepted on another chain or by another contract.

### Signer epoch

A signer epoch gives rotation a clear boundary. A payload from an earlier
signing era should not become current merely because the old public key still
verifies a signature.

Epochs also make incident response legible. When a signer is replaced,
reviewers can ask whether prior payloads expire immediately, survive for a
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

The structure contains a quantity field, but the current Drop validation
requires `quantity == 1`. One consumed Drop authorization therefore authorizes
one token, not a multi-token batch.

See
[`StreamDrops._validateAuthorization`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L561-L581).

An edition can contain many tokens, but this path needs a separate
authorization for each one. The UI should describe the actual execution path
rather than infer batch behavior from the existence of a field.

### Price and sale mode

A fixed-price authorization must not become an auction registration, and a
free claim must not become a paid sale. The current signed paths are native-ETH
paths; the authorization has no token-address field. Any future
token-denominated path would need to bind the asset as well as the amount.

### Auction terms

The reserve and intended end time connect the curation decision to the initial
auction state. They do not replace the auction contract's later custody, bid,
extension, cancellation, refund, and settlement rules.

### Deadline

A deadline limits how long a signed action can remain useful. A generous
deadline improves operational reliability while increasing the exposure window
if a payload leaks or the community decision changes.

### Replay identity

A successful authorization must not be reusable for an unintended second sale.
The replay identity, cancellation state, signer epoch, and transaction rollback
must continue to agree under failed execution, rotation, and concurrent
submission.

## EOA and contract-wallet signers

The signing system supports ordinary ECDSA accounts and ERC-1271 contract
wallets. ERC-1271 permits a Safe or another smart account to authorize the
payload, which can improve key management and shared control.

It also adds an explicit assumption: a contract wallet's owners, threshold, and
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
transaction reverts rather than leaving a partially consumed authorization and
partially minted token.

A free authorization still needs identity, recipient, replay, deadline, phase,
and supply protection. Removing payment does not remove policy.

## Auction registration

An auction-mode authorization registers the intended auction parameters. The
auction contract then owns custody and governs bidding, extensions,
cancellation, refunds, and settlement.

The signed payload is the bridge between the curation decision and the initial
auction state. It is not itself a bid, and it should not remain replayable as a
second auction.

Once an auction is registered, reviewers should distinguish signer authority
from auction state. Rotating a signer or cancelling an unused authorization
does not automatically answer what should happen to a token already in auction
custody or to bids already placed.

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

Cancellation is part of the public promise. A website hiding a payload is not
equivalent to an onchain cancellation.

## Transaction ordering and MEV

The repository includes MEV-timing and EIP-712 tests. Binding payer, recipient,
collection, price, quantity, mode, deadline, and token data limits what a copied
transaction can change.

That does not remove every ordering effect. A public mempool can still affect:

- who submits first;
- when a transaction is observed;
- whether it lands before a deadline;
- whether another bid arrives first;
- which block timestamp applies.

The authorization should bind every sensitive outcome that must not be changed
by copying or relaying. The product should not promise ordering guarantees that
Ethereum itself does not provide.

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
operational controls, and accountable signers.

This is not a weakness that can be solved by adding a field to Solidity. It is
the boundary between a community decision and the contract that faithfully
executes it.

## The authorization receipt

Every authorized drop should have a public, human-readable receipt containing:

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
decision, signature, contract execution, and public explanation without
trusting a private service database.

## Design position

Keeping curation outside Solidity is reasonable only when the boundary is
explicit. The public experience should never suggest that an onchain vote
selected a work when a configured signer authorized the result of an offchain
process.

The architecture is valuable when it does two things at once:

1. preserves room for human judgment and evolving community rules; and
2. prevents the resulting onchain action from changing after approval.

That is the standard against which the signer, payload, UI, replay storage, and
public receipt should be reviewed.

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
