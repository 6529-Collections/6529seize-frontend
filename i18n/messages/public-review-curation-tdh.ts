export const PUBLIC_REVIEW_CURATION_TDH_MESSAGES = {
  "publicReview.pages.curationAndTdhAuthorization.currentTitle":
    "From Artwork Decision to Signed Permission",
  "publicReview.pages.curationAndTdhAuthorization.currentSummary":
    "How a community decision becomes permission to create an NFT or start an auction. It also explains what the contract can and cannot check.",
  "publicReview.pages.curationAndTdhAuthorization.currentEditorial": `# Community curation, TDH, and signed authorization

**The answer in one minute**

The artwork decision happens before Stream is involved. It may use community curation and TDH, but Stream does not choose the artwork or check how the decision was made.

Stream receives signed artwork and sale details for creating an NFT or starting an auction. The signature confirms that Stream’s approved signer has authorized those exact details.

Nothing happens automatically. Someone submits the signed details to the Stream contract. For a paid mint, the signed payer must submit them and pay the exact price. For a free mint or auction, any account may submit them.

The contract then confirms who signed the details, whether the deadline has passed, and whether the permission was cancelled or used before. It also checks that the submitted artwork, recipient, payment, and sale type match the signed details. If every check passes, it creates the NFT or starts the auction.

**What proves this?**

[ADR 0001](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0001-drop-authorization.md) explains the agreed design. The exact **StreamDrops.sol** code shows what the contract actually does.

Need to understand TDH? See the [TDH guide](/network/tdh).

## From a community decision to a contract call

The flow has six steps:

1. The artwork is chosen outside the Stream contract.
2. The artwork and sale details are prepared for signing.
3. Stream’s approved signer signs those details.
4. Someone submits the signed details to the Stream contract.
5. Stream checks the signer, signer epoch, deadline, replay and cancellation state, token data, sale mode, and the other signed terms.
6. If every check passes, Stream marks the permission as used and completes the mint or auction registration in the same transaction.

The signature is the bridge between the offchain decision and the contract. It fixes what the contract may execute. It does not prove that the offchain decision was correct.

**Why this matters:** A reader should be able to compare the community decision, the signed permission, and the final transaction.

## What the signed details contain

Before the contract creates an NFT or starts an auction, it receives a fixed set of signed details. In the code, this set is called [**DropAuthorization**](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L24-L60). It includes the collection, recipient, sale type, price, deadline, and other safety values. The table below explains each one.

Stream uses EIP-712, a standard way to sign structured data. The signature is tied to one blockchain and one **StreamDrops** contract. This stops the same signed details from being accepted by another contract or on another blockchain.

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

Every part of Stream must use the same signed details. Otherwise, someone could approve one action while the contract carries out something different.

## Why each field exists

### Chain and verifying contract

The [EIP-712 domain](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L477-L486) binds the signature to one chain and one **StreamDrops** contract.

### Signer epoch

An epoch is the current signing period. When an admin starts a new epoch or changes the approved signer, all permissions from earlier epochs stop working immediately.

### Payer and recipient

The payer funds a paid fixed-price mint. The recipient receives the token. Keeping them separate allows one wallet to pay for another wallet, but both roles are fixed by the signature.

### Collection and token data

The signed permission fixes which collection receives the new NFT and the exact NFT information used when it is created. If someone changes that information after signing, the contract rejects it.

### Quantity

Each signed permission can create only one NFT in this minting flow. For example, creating 10 NFTs requires 10 separate signed permissions.

### Price and sale mode

The signature fixes fixed price or auction. A paid fixed-price mint must send the signed native-ETH amount. A free mint sends no ETH.

### Auction terms

When Stream starts an auction, the signed details set its minimum price and planned end time. After that, the auction contract holds the NFT and manages bids, extra time, cancellations, refunds, and the final sale.

### Deadline

Each signed permission includes an expiry time. After that time, the contract rejects it. A later expiry gives people more time to submit it, but also leaves more time for someone to misuse it if it is stolen or no longer correct.

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
