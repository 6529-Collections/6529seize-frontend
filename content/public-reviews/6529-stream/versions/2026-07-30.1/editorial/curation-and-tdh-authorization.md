# Community curation, TDH, and signed authorization

Stream converts a social curation decision into a cryptographically bound
action. The community process remains offchain; once its result is signed, the
collection, participants, economics, timing, and sale mode remain fixed during
execution.

**TDH means Total Days Held.** It is 6529's offchain, time-weighted measure of
how long eligible assets have been held. The [TDH guide](/network/tdh) explains
the calculation and categories.

The decisive boundary is:

**TDH and curation are calculated outside Solidity. Stream verifies a signed
authorization for the resulting action.**

The community process chooses the artist, calculates TDH, and applies the
published threshold. Stream receives the resulting authorized action and
enforces the signed facts that Solidity can verify.

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

A signer epoch gives rotation a clear boundary. Current payloads must carry the
current epoch; earlier payloads remain part of their historical signing era.

Epochs also make incident response legible. When a signer is replaced,
reviewers can ask whether prior payloads expire immediately, survive for a
grace period, or remain valid only after another explicit action.

### Payer and recipient

The account providing funds and the account receiving the token may differ.
Binding both supports sponsored or delegated purchases without letting a copied
transaction redirect the artwork or charge an unintended payer.

### Collection and token data

An authorization binds exactly one collection. The `tokenDataHash` binds the
supplied token data so execution uses the authorized artwork input.

### Quantity

The structure contains a quantity field, but the current Drop validation
requires `quantity == 1`. One consumed Drop authorization therefore authorizes
one token.

See
[`StreamDrops._validateAuthorization`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L561-L581).

An edition can contain many tokens, but this path needs a separate
authorization for each one. The UI should describe that actual execution path.

### Price and sale mode

A fixed-price authorization stays fixed-price, an auction registration stays an
auction, and a free claim stays free. The current signed paths are native-ETH
paths; the authorization has no token-address field. Any future
token-denominated path would need to bind the asset as well as the amount.

### Auction terms

The reserve and intended end time connect the curation decision to the initial
auction state. The auction contract's rules govern later custody, bids,
extensions, cancellation, refunds, and settlement.

### Deadline

A deadline limits how long a signed action can remain useful. A generous
deadline improves operational reliability while increasing the exposure window
if a payload leaks or the community decision changes.

### Replay identity

A successful authorization is consumed once. The replay identity, cancellation
state, signer epoch, and transaction rollback
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

All checks apply alongside signature validity. If execution fails, transaction
rollback preserves the authorization and token state atomically.

A free authorization still needs identity, recipient, replay, deadline, phase,
and supply protection. Its policy remains fully specified.

## Auction registration

An auction-mode authorization registers the intended auction parameters. The
auction contract then owns custody and governs bidding, extensions,
cancellation, refunds, and settlement.

The signed payload bridges the curation decision and the initial auction state.
The first auction consumes it; bids then follow auction state.

Once an auction is registered, reviewers should distinguish signer authority
from auction state. Signer rotation and unused-authorization cancellation govern
future entries; auction rules govern tokens in custody and bids already placed.

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

Cancellation is part of the public promise. An onchain cancellation provides
the durable public record; interface visibility should follow that record.

## Transaction ordering and MEV

The repository includes MEV-timing and EIP-712 tests. Binding payer, recipient,
collection, price, quantity, mode, deadline, and token data limits what a copied
transaction can change.

A public mempool still creates ordering effects around:

- who submits first;
- when a transaction is observed;
- whether it lands before a deadline;
- whether another bid arrives first;
- which block timestamp applies.

The authorization should bind every sensitive outcome exposed to copying or
relaying. Product promises should match the ordering guarantees Ethereum
provides.

## Offchain evidence completes the authorization

Stream can verify that the configured signer authorized the exact typed
payload. Separate public evidence must establish:

- the offchain TDH calculation was correct;
- the curation policy was applied fairly;
- the community intended the payload produced by the service;
- the signer acted accurately, freely, and with an uncompromised key;
- the artist saw an accurate rendering of the terms;
- an operator retained the evidence supporting the decision.

Those claims require transparent offchain records, reproducible calculations,
operational controls, and accountable signers.

This boundary separates a community decision from the contract that faithfully
executes it. Public evidence should document the community side.

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
