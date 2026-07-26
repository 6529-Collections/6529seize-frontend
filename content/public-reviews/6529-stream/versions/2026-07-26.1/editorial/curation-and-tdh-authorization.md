# Curation and TDH authorization

The decisive boundary on this page is simple:

**TDH and curation are calculated outside Solidity. Stream verifies a signed
authorization for the resulting action.**

The contract does not choose an artist, measure TDH, hold an onchain TDH vote,
or decide that a work crossed a community hurdle.

## From community decision to contract call

A typical flow is:

1. an offchain process evaluates the relevant curation or TDH rules;
2. a service constructs the exact mint or auction authorization;
3. the configured signer signs the EIP-712 payload;
4. a payer or other caller submits the signed payload to Stream;
5. Stream verifies the signature, epoch, time, replay state, and bound values;
6. Stream executes only the sale mode and parameters contained in the
   authorization.

The first two steps are social and operational. The remaining steps are
cryptographic and contractual.

## What the authorization binds

### IMPLEMENTED

The signed drop path in
[`StreamDrops.sol`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/StreamDrops.sol#L24-L60)
uses EIP-712 typed data. Its domain binds the chain ID and verifying contract.
The signed `DropAuthorization` has exactly these fields:

| Field                 | What it fixes                                                     |
| --------------------- | ----------------------------------------------------------------- |
| `dropId`              | The authorization identity consumed or cancelled by the contract. |
| `poster`              | The sale poster and current native-sale proceeds recipient.       |
| `recipient`           | The account that receives the token.                              |
| `payer`               | The account allowed to fund the execution.                        |
| `collectionId`        | The collection that may be minted or auctioned.                   |
| `saleMode`            | Fixed price or auction.                                           |
| `tokenDataHash`       | The hash of the token data supplied at execution.                 |
| `price`               | Fixed-price amount.                                               |
| `quantity`            | Authorized quantity.                                              |
| `auctionReservePrice` | Minimum auction price.                                            |
| `auctionEndTime`      | Intended auction end.                                             |
| `salt`                | Additional signed uniqueness.                                     |
| `nonce`               | Signer-scoped sequence input used to derive the drop identity.    |
| `deadline`            | Last valid execution time.                                        |
| `signerEpoch`         | Signing-key era that must still be current.                       |

The exact generated function and struct inventory is available in the Technical
Reference. Reviewers should compare the typed-data definition, Solidity
encoding, offchain construction code, and published signing documentation byte
for byte.

## Why each field matters

### Chain and verifying contract

Without these bindings, a valid signature could be replayed on another chain or
against another contract.

### Signer epoch

Rotation creates a new authorization era. A payload from an earlier epoch
should not become current merely because the old public key still verifies it.

### Payer and recipient

The account providing funds and the account receiving the token may be
different. Binding both prevents a relayer or copied signature from quietly
changing the intended beneficiary.

### Collection and quantity

An authorization for one collection or quantity must not mint another.

### Price and sale mode

A fixed-price authorization must not become an auction registration, and a free
claim must not become a paid sale. Currency and payment semantics must be
explicit.

### Deadline

An authorization should have a bounded useful life. A generous deadline
improves reliability but increases the incident window if a payload leaks.

### Replay identifier

A successful authorization must not be reusable for an unintended second sale.
Cancellation and consumed-state behavior must remain correct through reverts,
signer changes, and batching.

## EOA and Safe signers

### IMPLEMENTED

The design supports ordinary ECDSA signers and ERC-1271 contract-wallet
validation. ERC-1271 makes a Safe or another smart account possible, but it adds
an important assumption: the contract wallet's validation logic and owners can
change.

The public evidence should therefore identify:

- the current signing address;
- whether it is an EOA or contract wallet;
- the Safe threshold and owner policy when applicable;
- the signer epoch;
- rotation and emergency-revocation procedures;
- monitoring for unexpected authorizations;
- the exact software version constructing typed data.

No private key, seed, or recovery secret belongs in public review feedback.

## Fixed-price execution

### CURRENTLY WIRED BASELINE

A valid fixed-price authorization can execute a free or paid mint. The current
signed path checks Drop pause and replay state, token-data hash, deadline, payer,
recipient, sale mode, native payment, legacy minter pause/time/supply, and Core
freeze state. Signature validity does not override those checks.

This baseline does not call `StreamMintManager`, consume
`StreamMintLedger` counters, or use the manager's prepared-mint entries. If a
later step fails, the transaction reverts atomically. The manager lane is a
separate source-implemented foundation.

## Auction registration

### IMPLEMENTED

An auction-mode authorization can register the intended auction parameters.
The auction contract then governs bidding, custody, extension, cancellation,
and settlement. The signed payload is the bridge between the curation decision
and the auction state; it is not a bid.

## Cancellation and rotation

### IMPLEMENTED

The protocol includes cancellation and signer-lifecycle behavior. Reviewers
should establish exactly:

- who can cancel;
- whether cancellation is per authorization, per drop, or broader;
- when consumed state is written;
- whether a failed transaction consumes anything;
- how signer rotation affects already issued payloads;
- whether old-epoch payloads remain valid for any grace period;
- which events reconstruct cancellation and rotation.

## MEV and transaction timing

### TESTED

The repository contains MEV-timing and EIP-712 tests. The important properties
are that copying a transaction cannot redirect its token or change its price,
and that deadline and auction timing rules are unambiguous.

Tests cannot prevent all ordering effects. A public mempool can still affect who
submits first, when a bid is observed, or whether a transaction lands before a
deadline. The payload should bind sensitive outcomes and the product should not
promise ordering guarantees Ethereum does not provide.

## What the contract cannot verify

Stream cannot establish that:

- the offchain TDH calculation was correct;
- the curation policy was applied fairly;
- the signer was not coerced or compromised;
- a service showed the artist the correct terms;
- the community intended the exact payload signed;
- an operator retained the evidence used to authorize the drop.

Those claims require transparent offchain records and operational controls.

## Evidence that should accompany a drop

Before launch, a curation authorization receipt should publish:

- the reviewable curation rule and version;
- the relevant offchain decision identifier;
- collection and artist identity;
- typed payload in human-readable and canonical machine form;
- signer and epoch;
- chain and verifying contract;
- price, quantity, recipient rules, deadline, and sale mode;
- hash of the exact payload;
- transaction and emitted event after execution;
- cancellation or exception record when applicable.

## What we think

The contract/offchain boundary is acceptable only if it is explicit. The public
site should never imply that an onchain vote selected a work when a signer
authorized the result of an offchain process. The signed payload should be
inspectable before execution and reconstructable afterward.

## What can fail

- TDH or curation input is wrong;
- the signing service builds a different payload from the approved terms;
- a signer key or Safe is compromised;
- the domain separator or field encoding differs across implementations;
- a replay or cancellation state is written at the wrong point;
- a copied transaction changes an unbound field;
- a deadline or chain value is misunderstood;
- the contract executes a sale mode that reviewers did not intend.

## Questions for reviewers

1. Does the typed payload bind every value that could harm an artist, payer, or
   collector if changed?
2. What public evidence should prove the offchain curation result?
3. Who may rotate or revoke a signer, and how quickly?
4. Should issued authorizations survive signer rotation?
5. Are cancellation and replay rules clear under every revert path?
6. Which parts of the curation process should be independently reproducible?
