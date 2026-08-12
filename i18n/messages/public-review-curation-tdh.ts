export const PUBLIC_REVIEW_CURATION_TDH_MESSAGES = {
  "publicReview.pages.curationAndTdhAuthorization.currentSummary":
    "How an offchain curation result becomes one exact signed mint or auction action, what the contract checks, and what still needs public proof.",
  "publicReview.pages.curationAndTdhAuthorization.currentEditorial": `# Community curation, TDH, and signed authorization

**The answer in one minute**

Community curation and TDH happen outside the contracts. A configured signer can turn the result into permission for one exact mint or auction action. Stream then checks the signature and every signed term before it mints the token or starts the auction.

The contract does **not** choose the artist, calculate TDH, or decide whether the community process was fair. Those steps still need clear public rules and evidence.

**TDH means Total Days Held.** It is 6529's offchain, time-weighted measure of how long eligible assets have been held. See the [TDH guide](/network/tdh) for the calculation and categories.

**Accepted design:** [ADR 0001](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0001-drop-authorization.md) is the accepted design record for typed, one-use Drop authorization. The pinned Solidity, not ADR status, proves the current behavior.

**Current status:** This flow exists in the pinned **StreamDrops.sol** code. The reviewed snapshot was not deployed and was still waiting for an independent audit. This page being available for review is not proof of launch, audit, or safety.

## From a community decision to a contract call

The flow has six steps:

1. The community process applies its published curation and TDH rules.
2. A service turns that result into one exact mint or auction permission.
3. The configured signer signs the EIP-712 data. The signer may be a normal wallet or an ERC-1271 contract wallet such as a Safe.
4. Someone submits the signed permission. A paid fixed-price mint must be submitted by its signed payer. A free mint or auction registration may be submitted by any account because its payer is set to zero.
5. Stream checks the signer, signer epoch, deadline, replay and cancellation state, token data, sale mode, and the other signed terms.
6. If every check passes, Stream marks the permission as used and completes the mint or auction registration in the same transaction.

The signature is the bridge between the offchain decision and the contract. It fixes what the contract may execute. It does not prove that the offchain decision was correct.

**Why this matters:** A reader should be able to compare the community decision, the signed permission, and the final transaction.

## The exact authorization

The current [**DropAuthorization** type](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L24-L60) uses EIP-712 typed data. Its domain includes the chain ID and the **StreamDrops** contract address, so a signature for one chain or contract should not work on another.

The signed permission contains:

| Field | What it fixes |
| --- | --- |
| **dropId** | The unique permission that can be used or cancelled |
| **poster** | The sale poster and current proceeds recipient |
| **recipient** | The wallet that receives a fixed-price token |
| **payer** | The wallet allowed to pay for a paid fixed-price mint |
| **collectionId** | The collection that may receive the token |
| **saleMode** | Fixed price or auction |
| **tokenDataHash** | A hash of the token data supplied at execution |
| **price** | The fixed-price amount |
| **quantity** | The number of tokens this permission covers |
| **auctionReservePrice** | The auction's starting reserve |
| **auctionEndTime** | The auction's intended end time |
| **salt** | Extra signed uniqueness, which can also carry a nullifier hash |
| **nonce** | A signer-scoped input used to derive the **dropId** |
| **deadline** | The last time the permission remains valid |
| **signerEpoch** | The current signing-key era |

The typed-data definition, service, wallet display, Solidity encoding, and emitted events must agree. If one layer omits or changes a field, a person may approve different terms from the ones the contract executes.

## Why each field exists

### Chain and verifying contract

The [EIP-712 domain](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L477-L486) binds the signature to one chain and one **StreamDrops** contract.

### Signer epoch

The signer epoch makes key rotation immediate. An authorized admin can change the signer or increment the epoch. The current validation then rejects every permission from an older epoch. There is no grace period in this code.

### Payer and recipient

The payer funds a paid fixed-price mint. The recipient receives the token. Keeping them separate allows one wallet to pay for another wallet, but both roles are fixed by the signature.

### Collection and token data

The permission names one collection. The **tokenDataHash** stops the supplied token data from being changed after signing.

### Quantity

The structure has a quantity field, but the [current validation requires **quantity == 1**](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L561-L581). One used permission therefore covers one token. An edition needs a separate permission for each token on this path.

### Price and sale mode

The signature fixes fixed price or auction. A paid fixed-price mint must send the signed native-ETH amount. A free mint sends no ETH. The current permission has no token-address field, so it cannot name an ERC-20 payment asset.

### Auction terms

For an auction, the signed reserve and end time create the first auction state. The auction contract then controls bids, extensions, custody, cancellation, refunds, and settlement.

### Deadline

The deadline limits how long the permission can be used. A longer deadline is easier to operate but leaves more time for a leaked or outdated permission to be submitted.

### Replay identity

The **dropId** is derived from the signer, epoch, nonce, and salt. The contract rejects a **dropId** that was already used or cancelled. A failed transaction rolls back the used marker with the rest of the transaction.

## EOA and contract-wallet signers

The [current signer check](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L736-L785) supports a normal ECDSA wallet and an ERC-1271 contract wallet.

A contract wallet can support shared control, for example through a Safe. It also moves trust into that wallet's owners, threshold, modules, and signature rules. Those settings can change outside **StreamDrops**.

**Still needed outside the contract:** Publish the signer address, wallet type, Safe policy where relevant, current epoch, rotation and emergency steps, monitoring, and the software version that created the signed data. Never publish private keys, seed phrases, or recovery secrets.

## Fixed-price execution

The current path first checks the [**DROP_EXECUTION** pause in **mintDrop**](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L186-L198). The [authorization validation](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L561-L601) then checks the signer, epoch, deadline, **dropId**, replay state, cancellation state, poster, quantity, token-data hash, recipient, auction fields, price, and payer rules.

For a paid mint, the caller must be the signed payer and must send the exact signed ETH amount. For a free mint, the signed payer and submitted value must both be zero. Both forms require a nonzero recipient.

The contract marks the permission as used before calling the mint path. All of this happens in one transaction. If a later step fails, the whole transaction reverts, including the used marker and token changes.

## Auction registration

For an auction permission, recipient, payer, fixed price, and submitted ETH must all be zero. The contract mints the token into the auction path and registers the signed reserve and end time.

See [the auction execution call](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L693-L716).

After registration, the permission is already used. Signer rotation or cancellation of unused permissions does not rewrite the auction. The auction contract's own rules now control the token and bids.

## Cancellation, consumption, and rotation

The current code gives configured function admins or a global admin three controls:

- cancel one unused **dropId**;
- increment the signer epoch, which invalidates every permission from the old epoch; or
- replace the signer, which also increments the epoch.

The [admin functions emit cancellation, epoch, and signer-change events](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L219-L243). A used permission cannot be cancelled. A failed mint does not stay consumed because the transaction reverts.

**Operational risk:** These controls are only as reliable as the configured admin policy, monitoring, and response speed. Reviewers still need the exact launch roles and incident process.

## Transaction ordering and MEV

Binding the payer, recipient, collection, price, quantity, mode, deadline, and token data limits what someone can change after copying a transaction.

It does not remove public-mempool ordering. Another transaction may land first, a deadline may pass, an auction bid may arrive first, or a different block timestamp may apply.

**Review goal:** Product wording must promise only the ordering guarantees that Ethereum and the auction code actually provide.

## Offchain evidence completes the authorization

The contract can prove that the configured signer approved the exact data. It cannot prove:

- that TDH was calculated correctly;
- that the curation rule was fair or applied correctly;
- that the service copied the community result accurately;
- that the signer acted freely and kept its keys safe;
- that the artist saw an accurate explanation; or
- that supporting evidence was kept.

These claims need public rules, reproducible calculations, retained records, monitoring, and accountable operators.

## The authorization receipt

**Still open as a product and operations requirement:** Each permission should have a public, human-readable receipt showing:

- curation rule and version;
- offchain decision ID;
- collection and artist identity;
- readable and machine-readable signed data;
- signer address, wallet type, and epoch;
- chain and contract address;
- payer, recipient, price, asset, quantity, deadline, and sale mode;
- token-data hash and **dropId**;
- execution transaction and events; and
- cancellation, expiry, or exception status.

The receipt should let an artist, collector, auditor, or community member compare the decision, signature, and contract result.

## What the public record should show

The public record should keep four things together:

1. the community decision and the rule used;
2. the exact permission the signer approved;
3. the transaction and events produced by Stream; and
4. any later cancellation, expiry, auction result, or exception.

This record is not created automatically by the signature alone. The product and operators must publish it and keep it available.

## Failure modes reviewers should test

- TDH or curation input is wrong.
- The authorization service changes a term from the approved decision.
- The readable display hides or misstates a signed field.
- The signer wallet or Safe is compromised.
- Rotation does not invalidate an old permission as expected.
- EIP-712 field order, encoding, chain, or contract differs between layers.
- A used or cancelled permission can be replayed.
- A failed call leaves a permission used or a token partly created.
- A copied transaction can change a sensitive result.
- Users expect signer cancellation to undo an auction that is already registered.
- A long deadline leaves an outdated permission usable.
- The public receipt cannot reproduce the decision-to-transaction path.

## Questions for reviewers

1. Does the signature cover every value that could harm the artist, payer, recipient, or collector if changed?
2. Can a non-technical reader compare the community decision with the exact permission?
3. What public evidence should prove the TDH calculation and curation result?
4. Who will control the signer and admin roles at launch, and how quickly can they respond?
5. Is immediate invalidation of every old-epoch permission the intended rotation policy?
6. Are cancellation, replay, and revert rules clear for both fixed-price and auction paths?
7. What should the public receipt show before and after execution?
8. Which real-service, launch-configuration, and independent-audit checks remain before this flow can be trusted?`,
} as const;
