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

Each signed permission has a unique ID called **dropId**. The ID is created from the approved signer, the current signing period (**epoch**), and two extra values called **nonce** and **salt** that make the permission unique. After the permission succeeds or is cancelled, the contract will not accept it again. If the transaction fails, the permission stays unused and can be tried again.

## Who can approve mints and auctions

Stream [accepts signatures](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L736-L785) from either a normal wallet or a shared contract wallet, such as a Safe. A Safe can require approval from several people before it signs.

Because this signer can approve mints and auctions, the public should know which wallet is used, how it is controlled, and how it can be replaced in an emergency. Private keys and recovery secrets must always stay private.

## How a fixed-price mint works

Before creating the NFT, the contract checks that [minting is not paused](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L186-L198) and that [the signed permission is still valid](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L561-L601).

For a paid mint, only the wallet named as the payer can submit it, and it must send the exact ETH price. A free mint sends no ETH. Both need a wallet that will receive the NFT.

If every check passes, the contract uses the permission and creates the NFT in one transaction. If any step fails, everything is undone and the permission can be tried again.

## How an auction starts

The signed permission includes the auction's minimum price and planned end time.

Someone must submit this permission to Stream to start the auction. Any wallet can submit it. The wallet sends no ETH, and submitting the permission does not make it the buyer. Buyers place bids later.

Stream then creates the NFT and places it in a separate [auction contract](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L693-L716). This contract holds the NFT, records bids, and completes the sale.

The same auction contract can manage many auctions. It keeps a separate record for each one.

Once the auction starts, the signed permission has been used. Later changes to the signer or unused permissions do not change the active auction.

## How unused permissions can be stopped

An authorized admin can cancel a specific signed permission before anyone uses it.

If a mistake is found before the mint, an admin can cancel the permission using its unique ID, called **dropId**. Stream then rejects it.

An admin can stop all older permissions by starting a new signing period, called an **epoch**. Changing the signer does this automatically.

The contract [records these changes on the blockchain](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L219-L243).

These controls only work before the permission succeeds. Once it creates an NFT or starts an auction, it can no longer be cancelled. If the transaction fails, it stays unused and can be tried again.

## Can someone copy the transaction?

For a free mint or auction, another wallet may copy the transaction and submit it first. It cannot change the signed details or take the NFT.

If the copied transaction succeeds first, the original transaction fails because the permission has already been used.

## What the contract cannot verify

The contract can verify that Stream's approved signer accepted the exact NFT and sale details.

It cannot verify how the artwork was chosen, whether TDH was calculated correctly, whether the signer and services followed the rules, or whether the artist received accurate information.

Those steps happen outside the blockchain. They need clear public records so others can check them.

## A public proof page is still needed

After an NFT is approved and created, people need an easy way to check that nothing changed.

The public page should answer:

- What was approved?
- Who approved it?
- What did Stream create?
- Did the final result match the approval?

This page is not created automatically. Stream and its operators still need to build and publish it.

## What the public record should show

The public record should keep four things together:

1. the community decision and the rule used;
2. the exact permission the signer approved;
3. the transaction and events produced by Stream; and
4. any later cancellation, expiry, auction result, or exception.

This record is not created automatically by the signature alone. The product and operators must publish it and keep it available.

## How to test that Stream fails safely

These checks deliberately use bad, old, or changed permissions. Stream should reject them without creating the wrong NFT or leaving a permission marked as used.

### Contract tests

- Change a signed detail, such as the recipient or price. The contract should reject it.
- Submit an expired or cancelled permission. The contract should reject it.
- Submit the same permission twice. The second attempt should fail.
- Change the approved signer. Permissions from the old signer should stop working.
- Use a signature made for another blockchain or **StreamDrops** contract. It should fail.
- Make a mint or auction fail after the checks begin. The whole transaction should be undone, and the permission should remain unused.
- Copy a free-mint or auction transaction. The copy must not change the signed details or take the NFT.
- Start an auction, then change the signer or cancel an unused permission. The active auction should not change.

### Public record and process checks

- Start with a known TDH and curation decision. Compare it with the prepared data, readable display, signed permission, and final transaction.
- Change one value at each step. The mismatch should be blocked or clearly shown.
- Replace the signer in an emergency test. Permissions from the old signer should stop working.
- Confirm the public proof page shows the decision, signed details, final transaction, and current status.

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
