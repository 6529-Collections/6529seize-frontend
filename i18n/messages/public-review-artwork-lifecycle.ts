export const PUBLIC_REVIEW_ARTWORK_LIFECYCLE_MESSAGES = {
  "publicReview.pages.overviewNarrative.title": "Overview",
  "publicReview.pages.overviewNarrative.summary":
    "An introduction to Stream and its public review for artists, collectors, and the wider community.",
  "publicReview.pages.artworkLifecycle.title": "Artwork Lifecycle",
  "publicReview.pages.artworkLifecycle.summary":
    "How an artwork moves from preparation through minting, preservation, and finality.",
  "publicReview.pages.artworkLifecycle.currentSummary":
    "This page is for artists, collectors, and people reviewing Stream. It explains how a Stream artwork moves from setup to its final state. No contract knowledge is needed.",
  "publicReview.pages.artworkLifecycle.currentIntro":
    "## The lifecycle in one minute\n\nA Stream artwork is built step by step.\n\nFirst, the collection gets a permanent identity in the Core. The Core is the shared home for all Stream tokens. Next, the artwork files, minting rules, payments, and other details are added. The artwork can then be minted or sold.\n\nLater, supply can close, key details can be locked, and preservation records can be added. Only then can the artwork reach its final state.\n\nMinted, sold, frozen, preserved, and final are different stages. This page explains what each stage means and why it matters.",
  "publicReview.pages.artworkLifecycle.currentIdentitySection": `## 1. The collection gets a permanent identity

### What happens

Before anything is minted or sold, Stream gives the collection a permanent ID in the Core.

The ID stays the same even if the collection later uses a different minting or sale tool.

### Who creates it

An account with permission to create collections starts it. Stream then records the artist, supply limit, purchase limit, and the wait before supply can become final.

### What the current contract records

The Core stores the collection ID and its basic information. Each token later receives:

- one ID across all Stream tokens; and
- one serial number inside its collection.

**Why this matters:** The artwork keeps one clear identity even when the tools around it change.

### Technical details

The Core is the shared ERC-721 NFT contract. [\`StreamCore.createCollection\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L336) creates the collection. [\`setCollectionData\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L379) stores its artist and supply settings.`,
  "publicReview.pages.artworkLifecycle.currentArtworkPackageSection": `## 2. The artwork package is prepared

### What happens

A Stream artwork is more than an image. Its package can include:

- artwork files, such as images, animation, and code;
- details, such as its name, traits, and collection;
- supply, minting, and sale rules;
- payment details;
- randomness rules, if the artwork uses them; and
- preservation and final-state records.

### Who controls each part

Different records can have different approved writers. For example, an artist controls an artist statement. An outside museum or archive can add its own record about how it checked or stored the artwork. It cannot change the artwork or speak for the artist.

### What stays permanent

The token’s identity stays in the Core. Other tools, such as a display module or randomness service, may need a replacement years later.

The current contracts keep these parts separate and restrict who may write each kind of record.

**Why this matters:** A tool can be replaced without giving the artwork a new identity.

### Technical details

Display, sale, randomness, and preservation features can live in separate modules. Record-family checks keep artist, owner, institution, observer, rights, and archive records with their approved writers.`,
  "publicReview.pages.artworkLifecycle.currentArtistApprovalSection": `## 3. The artist can sign the current setup

### What happens

The artist can sign one exact snapshot of the collection.

That snapshot includes:

- the artist’s wallet;
- collection information, scripts, and dependencies;
- current live supply and token metadata;
- randomness settings; and
- purchase, supply, and final-supply settings.

A successful mint changes the live supply and token metadata. The old signature then stops matching the current snapshot.

### Who decides

Only the recorded artist can approve the snapshot. The artist can sign directly or provide a signed message that another account submits.

### What the current contract does

The contract stores the approved snapshot and can report whether it still matches the current state.

This signature is evidence only. The minting paths do not check it. A missing or outdated signature does not pause or stop minting.

### How this differs from the ADR design

This snapshot signature is not the mint-policy approval required by the accepted design. That separate approval is explained in the next section.

**Why this matters:** People can see what the artist signed without mistaking the signature for permission to mint.

### Technical details

The current snapshot signature uses EIP-712. It is tied to the chain and Core contract. It supports ordinary wallets and ERC-1271 smart-contract wallets. The snapshot includes the collection-freeze manifest hash, which changes when live supply or live token metadata changes.`,
  "publicReview.pages.artworkLifecycle.currentDistributionSection": `## 4. The minting rules are chosen

### What happens

Before collectors can mint, rules are set for:

- the type of release;
- its opening and closing time;
- who may mint;
- the price; and
- supply and wallet limits.

### Who decides

Accounts with the required Stream roles configure the current contracts.

The accepted design adds an artist check. For an artist-bound collection, the artist must approve the mint policy or give someone limited signed permission to act for them.

An ADR, or Architecture Decision Record, is an accepted design decision. It describes the target design, which may be ahead of the reviewed code.

The artist permission must be checked before every mint. The same permission can cover later mints while the policy stays the same. A new permission is needed when the policy changes.

The reviewed contracts do not yet enforce this artist-permission check.

### What the current contracts check

The reviewed code has two separate minting paths:

- The signed-drop and auction path checks its own sale time and supply rules.
- The manager path checks phases, approved executors, optional access gates, policy details, and usage limits.

The paths do not share every check or counter. Each path must be reviewed on its own.

**Why this matters:** Minting tools can change without changing the token’s permanent identity, but every path must enforce the right limits.

### Technical details

The signed-drop and auction path uses [\`StreamMinter\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMinter.sol). The manager path uses [\`StreamMintManager\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMintManager.sol) and [\`StreamMintLedger\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMintLedger.sol). The Core keeps the token identity while these outside modules apply minting policy.`,
  "publicReview.pages.artworkLifecycle.currentCurationSection": `## 5. The selected drop receives signed approval

### What happens

The community process applies its curation rules outside the blockchain. These rules may use TDH, which means Total Days Held. TDH measures how long eligible assets have been held.

A service then prepares the exact sale details. An approved signer signs them. The signer is a wallet trusted to approve the result.

### Who decides

The community process chooses the artist, calculates TDH, and applies its fairness rules. The signer approves the exact action created from that result.

The contract does not choose the artist, calculate TDH, or decide whether the result is fair.

### What the current contract checks

The signed approval fixes:

- the blockchain and Stream contract;
- the collection and artwork;
- who pays and who receives the token;
- the fixed price or starting auction terms;
- when the approval expires; and
- a unique ID that prevents reuse.

Before the sale starts, the contract checks the signer and every signed detail. Changing the artwork, buyer, price, sale type, or deadline makes the approval invalid.

In this path, one approval covers one token. After a successful use, it cannot be used again.

**Why this matters:** The contract can only start the sale with the terms that were approved.`,
  "publicReview.pages.artworkLifecycle.currentMintExecutionSection": `## 6. The mint completes fully or not at all

### What happens

The chosen minting path checks its rules and asks the Core to create the token.

### What each path checks

**Signed-drop and auction path**

- The drop contract checks the signed approval, sale details, and any required payment.
- The minter checks that minting is not paused, the minting window is open, and enough supply remains.
- The Core applies its own collection and token checks.

**Manager path**

- The manager checks the active phase, approved executor, optional access rules, expected policy, and quantity.
- The ledger records the limits used by that path.
- The manager and Core prepare and complete the token in the same transaction.

These paths do not use the same approval or counters.

### What happens if a check fails

All checks and changes happen in one blockchain transaction. If a check fails, the whole transaction is cancelled:

- no token is created;
- supply does not change;
- the signed-drop approval stays unused, if that path was used;
- manager counters return to their earlier values, if that path was used; and
- no payment credit is recorded, if that path creates one.

If the transaction succeeds, the token and the records for that path update together.

### Missing ADR check

The accepted design also requires valid artist permission for an artist-bound collection. The reviewed contracts do not yet enforce that check.

**Why this matters:** A collector cannot receive a half-finished mint.`,
  "publicReview.pages.artworkLifecycle.currentTokenIdentitySection": `## 7. The minted token gets a permanent ID

### What happens

When a mint succeeds, the Core gives the token two numbers:

- a global ID across all Stream tokens; and
- a serial number inside its collection.

Both numbers stay with the token for its full history.

### What happens if the token is burned

Stream keeps two supply counts:

- **Minted ever:** every token successfully minted, including burned tokens.
- **Live supply:** tokens that have not been burned.

Burning removes the token from current ownership and lowers the live supply.

It does not lower the minted-ever count or make room for a replacement mint.

The token’s ID, collection link, serial number, and burn record remain stored. Its ID is never reused.

**Why this matters:** Burning a token does not erase its history or change the identity of other tokens.

### Technical details

The Core stores the collection ID and collection serial directly for each token. It does not calculate them from the token ID. This matches the accepted ADR design.`,
  "publicReview.pages.artworkLifecycle.currentRemainingSections": `## 8. Randomness is requested and recorded

### What happens

If an artwork uses randomness, minting starts a request. The request is tied to the collection, token, provider, and provider version.

The request can be:

- **Waiting:** the provider has not answered yet.
- **Complete:** the final value was accepted.
- **Stale:** the old provider version can no longer finish it.
- **Processing failed:** the provider answered, but the Core could not save the result.

### What the current contracts record

The contracts keep the request ID, times, final seed, a hash of the provider result, any failure hash, and the retry count.

If saving the result fails, a retry uses the same saved seed. It does not ask for a new random value.

**Why this matters:** A technical retry cannot become a hidden redraw.

### Technical details

The provider version is called an **epoch**. It lets Stream separate requests made before and after a provider change. A hash helps prove that later data matches the original result without storing all of that result onchain.

## 9. Metadata describes the artwork

### What happens

Apps and marketplaces use \`tokenURI\` to read a token's artwork description.

The current renderer can combine:

- collection details;
- scripts and dependencies;
- token data, images, and traits; and
- randomness, when the artwork uses it.

### What can still be incomplete

A \`tokenURI\` does not prove that every part is ready or preserved.

- Randomness may still be waiting.
- An image or other file may be stored elsewhere and become unavailable.
- A script may need a browser or dependency that no longer works.
- A hash can prove that retrieved bytes are correct, but it cannot keep those bytes available.

The accepted ADR design adds clear pending and final metadata states. It also requires the final freeze record to identify every input needed to display the work.

**Why this matters:** A useful artwork record must explain both what the token says and what is needed to display it.

## 10. Sale money becomes balances to withdraw

### What happens

A sale records how much each recipient is owed. Recipients withdraw their money later.

This means one recipient that cannot accept a payment does not block the sale for everyone else.

### What the current contracts record

The current fixed-price path records balances for the account that starts the sale, the protocol, and the curator reserve. The auction path records balances for the same groups and for bidder refunds.

Every recorded balance must be backed by money held by the contract. Emergency withdrawal can use only extra money that is not owed to anyone.

The repository also contains newer revenue modules for clearer split rules and supported assets. The current sale paths do not use those modules everywhere yet.

**Why this matters:** A completed sale cannot lose track of who is owed money, and one failed withdrawal cannot block other people.

### Technical details

The ADRs call money owed by a contract a **liability**. A pull payment means the contract records that liability first and the recipient withdraws it in a separate transaction.

## 11. An auction ends once

### What happens

When an auction starts, the auction contract holds the token. Each new highest bid replaces the previous leader. The previous bidder receives a balance they can withdraw.

After the auction ends, anyone can trigger settlement.

### Possible outcomes

- **A winning bid:** the winner receives the token and the sale balances are recorded.
- **No bids:** the token normally returns to the account that started the auction. If that account is another contract, it can use a separate claim path.
- **Cancellation:** this is allowed only before the first bid and before the auction ends.

Each outcome is terminal. This means the auction cannot settle, transfer, refund, or cancel a second time.

**Why this matters:** The same token or payment cannot be handled twice.

## 12. Burning affects more than ownership

Section 7 explained that burning does not erase a token's ID. It also affects other parts of the artwork record.

### What the current contracts do

- The owner and live token are removed.
- Live supply falls, but minted-ever supply does not.
- The token ID, collection link, serial number, and burn record remain.
- \`tokenURI\` is no longer available for the burned token.
- A later valid randomness answer can be kept for audit, but it cannot bring the token back.
- Existing sale, payment, and preservation history remains separate from ownership.

The accepted burn-to-mint design also requires a burned token ID to be usable only once as proof for a later claim.

**Why this matters:** Future readers can tell the difference between a token that never existed and one that was minted and later burned.

## 13. Supply closes

### What happens

After minting ends and the required wait passes, an authorized Stream account can close supply.

The current Core sets the maximum supply to the number minted so far. Burned tokens still count because supply closure uses minted-ever history. If nothing was minted, supply closes at zero.

### What closes

Every mint path must eventually ask the Core for the next collection serial. After supply closes, the Core has no serial left to give. It rejects any later attempt to create a token, whether the request comes through an old mint phase, signed approval, or auction registration.

Supply closure does not freeze scripts, metadata, or other artwork details. That happens in later stages.

### Difference from the ADR design

The final supply is visible in current contract state. The accepted design also expects a clear closure event. The current \`setFinalSupply\` function does not emit its own supply-closed event.

**Why this matters:** The collection's final edition size cannot grow later.

## 14. The Core is permanently frozen

### What happens

\`freezeCollection\` first makes supply final and saves a hash of the frozen Core state. The Core then rejects changes inside that boundary.

The freeze stops:

- new mints and burns;
- changes to the artist snapshot approval;
- changes to the randomness module; and
- covered collection and live-token metadata changes.

### What can still happen

Collectors can still transfer their tokens. New preservation evidence can also be added in its separate record system.

Core freeze is not the same as full artwork finality. It locks the permanent Core boundary. Section 16 explains the later finality ceremony across the wider artwork record.

**Why this matters:** People can see exactly which permanent data has stopped changing without assuming that every part of the artwork is already final.

## 15. Preservation records can still be added

### What happens

Approved writers can add preservation records for files, storage locations, manifests, signatures, and other evidence.

These records are append-only. A new record does not delete an older one. A separate pointer only makes the newest record easier to find.

Preservation records stay open after the Core is frozen. This lets a future archive add recovery information without rewriting the artist's earlier record.

### What a hash cannot do

A hash can prove that a file matches an earlier commitment. It cannot keep the file online.

The accepted ADR design therefore also expects the actual files in independent storage, plus enough runtime information to open or run the artwork. The current contract records evidence of preservation. It cannot by itself guarantee that an outside storage service stays available.

**Why this matters:** Long-term preservation needs both proof and access to the real artwork materials.

## 16. Artwork finality is the last ceremony

### What happens

A finality proposal records the exact artwork package to be made final. It also sets a waiting period and an expiry time.

Before execution, the current registry checks that:

- the collection status is closed;
- burning is blocked;
- the Core is frozen;
- the exact proposed record still matches; and
- the required content and the correct artist approval or platform record are present.

Before the waiting period ends, a guardian can veto the proposal. An administrator can cancel it any time before it is executed or expires. If the execution window ends, the proposal expires.

A cancelled or expired proposal can be scheduled again. A new artist approval is needed when the artist-signed finality record changes. The same unchanged record does not automatically need a new signature.

After execution, the covered artwork state is final. Append-only preservation evidence can still be added without changing that final artwork package.

**Why this matters:** Everyone gets time to inspect the exact irreversible action before it happens.

## 17. Replaceable modules can have successors

### What happens

Some tools around the artwork may become old or stop working. This can include a renderer, storage route, or randomness provider.

The accepted design replaces such a module with a new version. It does not silently edit the old contract. The old version remains readable, while the successor handles clearly assigned future work.

A successor cannot rewrite the token's Core identity or any frozen artwork commitment.

### What a safe change must explain

- Which future actions move to the successor?
- Which pending jobs and money stay with the old module?
- Can both versions act at the same time?
- How do signatures, counters, and replay protection work across the change?
- Which old commitments remain binding?

The current module system exposes a module type, version, schema hash, and link to the module it replaces. Signatures for an old contract do not automatically become valid in a new one.

**Why this matters:** Stream can replace aging tools without changing the artwork's permanent identity or hiding its history.

## What collectors should be able to see

The product should show:

- whether randomness is still waiting;
- whether metadata is complete;
- whether supply is closed;
- whether the Core is frozen;
- which preservation package applies;
- whether artwork finality has happened; and
- which replaceable module version is current.

These are separate facts. For example, frozen does not also mean preserved or final.

## Technical review checklist

Reviewers should test what happens when:

- a collection starts with the wrong artist, supply, or module;
- signed details are changed, copied, expired, or reused;
- a failed mint leaves a token, counter, approval, or payment changed;
- mint paths together exceed the intended supply;
- randomness is delayed, fails, or is redrawn during recovery;
- metadata has a correct hash but missing or unusable files;
- money owed by a contract is missing or cannot be withdrawn;
- burning erases history or wrongly opens new supply;
- supply closes but one mint path still works;
- Core freeze leaves another change path open;
- finality executes a different record from the reviewed proposal; or
- a successor duplicates authority, pending work, money, or replay state.

## Questions for reviewers

1. Is the purpose of each stage clear?
2. Which changes need artist approval?
3. Which failures should undo the whole transaction, and which need a visible recovery state?
4. Are supply closure, Core freeze, preservation, and artwork finality clearly separate?
5. Which burn and history records must remain readable forever?
6. What evidence must exist before finality can be scheduled?
7. What must be proven before a successor becomes active?`,
  "publicReview.pages.forArtists.title": "For Artists",
  "publicReview.pages.forArtists.summary":
    "For artists considering or preparing to publish their work through Stream.",
  "publicReview.pages.rolesAndTrust.title": "Roles and Trust",
  "publicReview.pages.rolesAndTrust.summary":
    "Every role that can act, what it can change, and where trust remains.",
  "publicReview.pages.whoCanDoWhat.title": "Who Can Do What",
  "publicReview.pages.whoCanDoWhat.summary":
    "Who can act, what each person or contract can change, and how those powers end.",
  "publicReview.pages.curationAndTdhAuthorization.title":
    "Curation and TDH Authorization",
  "publicReview.pages.curationAndTdhAuthorization.summary":
    "How offchain curation and TDH decisions become signed onchain authorization.",
  "publicReview.pages.tokensCollectionsAndMinting.title":
    "Tokens, Collections, and Minting",
  "publicReview.pages.tokensCollectionsAndMinting.summary":
    "The shared ERC-721 system for collections, token issuance, supply, and mint controls.",
  "publicReview.pages.fixedPriceSalesAndAuctions.title":
    "Fixed-Price Sales and Auctions",
  "publicReview.pages.fixedPriceSalesAndAuctions.summary":
    "The sale mechanisms, bidding rules, settlement paths, and edge cases.",
  "publicReview.pages.revenueSplitsAndRoyalties.title":
    "Revenue, Splits, and Royalties",
  "publicReview.pages.revenueSplitsAndRoyalties.summary":
    "Where primary-sale funds and secondary royalties go, and how recipients are configured.",
  "publicReview.pages.randomness.title": "Randomness",
  "publicReview.pages.randomness.summary":
    "How unpredictable values enter the protocol and which outcomes depend on them.",
  "publicReview.pages.metadataScriptsAndDependencies.title":
    "Metadata, Scripts, and Dependencies",
  "publicReview.pages.metadataScriptsAndDependencies.summary":
    "How token presentation, generative scripts, and external dependencies are stored and referenced.",
  "publicReview.pages.freezingPreservationAndArtworkFinality.title":
    "Freezing, Preservation, and Artwork Finality",
  "publicReview.pages.freezingPreservationAndArtworkFinality.summary":
    "The mechanisms that move artwork data from editable to permanently fixed.",
  "publicReview.pages.governancePausingAndSuccessors.title":
    "Governance, Pausing, and Successors",
  "publicReview.pages.governancePausingAndSuccessors.summary":
    "How governance acts, emergencies are handled, and successor contracts are recognized.",
  "publicReview.pages.changesEmergenciesAndFutureContracts.title":
    "Changes, Emergencies, and Future Contracts",
  "publicReview.pages.changesEmergenciesAndFutureContracts.summary":
    "How Stream announces updates, pauses part of the system in an emergency, switches to newer helper contracts, and permanently removes old admin powers.",
  "publicReview.pages.securityTestingAndKnownLimitations.title":
    "Security, Testing, and Known Limitations",
  "publicReview.pages.securityTestingAndKnownLimitations.summary":
    "Current engineering evidence, unresolved findings, constraints, and pre-audit caveats.",
  "publicReview.pages.currentImplementationAndReadiness.title":
    "Current Implementation and Readiness",
  "publicReview.pages.currentImplementationAndReadiness.summary":
    "The authoritative record of what is connected, implemented, proposed, tested, audited, and still required before release.",
  "publicReview.pages.whereDevelopmentStands.title": "Where Development Stands",
  "publicReview.pages.whereDevelopmentStands.summary":
    "What worked in this review snapshot, what was being connected, and the evidence required before launch.",
  "publicReview.pages.communityReview.title": "Community Review",
  "publicReview.pages.communityReview.summary":
    "How to examine the proposal, frame actionable feedback, and follow the review record.",
} as const;
