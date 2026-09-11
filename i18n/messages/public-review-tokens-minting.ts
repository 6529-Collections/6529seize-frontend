export const PUBLIC_REVIEW_TOKENS_MINTING_MESSAGES = {
  "publicReview.pages.tokensCollectionsAndMinting.currentSummary":
    "How Stream uses one contract for all its NFT collections, controls how tokens are created, and handles limits and risks.",
  "publicReview.pages.tokensCollectionsAndMinting.currentIntro": `## Minting in one minute

All Stream collections and tokens live in one shared ERC-721 NFT contract called the Core.

First, a collection gets an ID. When a mint succeeds, the token gets a global Stream token ID and a serial number inside its collection. Before an NFT is created, the system checks the sale rules and makes sure the collection still has room. The Core then creates the NFT and records its permanent ID.

The reviewed code has two separate minting paths. Signed Drops and auctions use the older \`StreamMinter\` path. A newer path uses \`StreamMintManager\` and \`StreamMintLedger\` to control when minting is open, check who is allowed to mint, and track how much of each limit has been used. The two paths are both present, but they are not one combined launch path.

**Main point:** token identity belongs in the Core. Minting rules live outside the Core. New gate contracts can be added, and the Core can move to a new mint manager. Any replacement must preserve the limits already used. Every path must still obey the same supply and identity rules.

This is code under public review. Its availability here does not prove deployment, audit, or safety.`,
  "publicReview.pages.tokensCollectionsAndMinting.currentIdentitySection": `## One shared contract records every Stream NFT

### What happens

All Stream NFT collections use one main contract called the Core.

When an approved admin adds a collection, the Core gives it a collection ID.

When an NFT is created, the Core records which collection it belongs to. The NFT gets two numbers:

- A token ID that is unique across all Stream NFTs.
- A serial number showing its place inside the collection.

For example, an NFT could be token \`1,250\` in Stream and number \`20\` in its collection.

### Accepted decisions

[ADR 0016](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0016-core-native-only-erc721.md#L23-L49) says the launch will use one Core contract. Every NFT in it must follow the same ERC-721 rules for ownership, approvals, transfers, minting, and burning. The launch Core does not include a separate NFT contract for each collection.

[ADR 0015 decisions W1 and W2](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0015-collection-identity-and-facade-readiness.md#L41-L71) remain accepted. Core reads and token data must show which collection an NFT belongs to. Before the first public sale, at least two major marketplaces or indexers must give recorded written commitments to use this information.

### Why this matters

Using one Core keeps ownership rules the same for every collection. It also means a bug in the Core could affect every collection.

Some marketplaces group NFTs only by contract address. They may show all Stream NFTs as one collection unless they also read Stream's collection data.

### Code links

[\`StreamCore.createCollection\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L312-L352) creates a collection record. [\`tokenCollectionIdentity\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L544-L559) returns a token's collection ID, serial number, and burn status.`,
  "publicReview.pages.tokensCollectionsAndMinting.currentSupplySection": `## How Stream counts NFT supply

Stream keeps several numbers because each one answers a different question:

- **Collection limit:** how many NFT identities the collection is currently allowed to create in total.
- **Minted count:** how many NFT identities the collection has created, including NFTs later burned.
- **Live count:** how many of those NFTs still exist and have not been burned.
- **Minting-rule limit:** how many NFTs one sale, claim, wallet, or other rule still allows.
- **Final supply:** the collection limit after minting is closed.

### What the current code does

The Core increases the minted count when it gives an NFT its serial number. Burning an NFT lowers the live count. It does not lower the minted count or free the old token ID.

The newer manager path also tracks separate limits. It can count activity for the payer, recipient, executor, authorizer, or a shared group.

### Why this matters

These numbers must not be mixed up. For example, burning an NFT must not create a new mint allowance if the original rule was a lifetime limit.

Both minting paths must also obey the same collection limit.

### Code links

[\`_allocateTokenIdentity\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L1270-L1303) gives each NFT its token ID and collection serial. [\`totalSupplyOfCollection\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L1545-L1552) returns the live count: minted NFTs minus burned NFTs.`,
  "publicReview.pages.tokensCollectionsAndMinting.currentPolicySection": `## The Core and minting rules have different jobs

### The Core keeps the permanent rules

The Core controls:

- token and collection identity;
- the collection supply limit;
- collection freeze; and
- which contracts may call its minting functions.

### The manager handles changeable minting rules

In the newer path:

- the manager owner sets up each phase, which is the rule set for one minting period;
- an approved executor starts the mint;
- an optional gate answers an extra question, such as whether a wallet may mint;
- the ledger, a separate record-keeping contract, stores how much of each limit has been used; and
- the Core creates the NFT and its permanent identity.

An executor is an approved contract or account that sends the mint request.

### Why this matters

Sale, claim, allowlist, and airdrop rules can change without replacing the Core.

No outside contract may bypass the Core's supply, identity, or freeze rules. A replacement must also keep the limits that were already used.

### Code links

[\`StreamMintManager\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMintManager.sol#L13-L56) connects the Core, ledger, and gate registry. [\`StreamMintLedger\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMintLedger.sol#L7-L40) stores minting limits and used authorization IDs.`,
  "publicReview.pages.tokensCollectionsAndMinting.currentLanesSection": `## The code has two separate ways to mint

### 1. Signed Drops and auctions

\`StreamDrops\` checks a signed permission for a fixed-price Drop. It then calls the older \`StreamMinter\`.

The older minter checks its own time window and supply rules before asking the Core to create the NFT. The current auction also uses this older minter.

### 2. Manager and ledger

\`StreamMintManager\` checks the saved rules for the minting period, who sent the request, any extra eligibility check, and the limits.

It updates the used limits in \`StreamMintLedger\`, then asks the Core to create the NFT.

### Current status

The rehearsal deployment sets up both paths. Signed Drops and the current auction do not use the manager's phases or ledger limits.

The pinned code does not combine both paths under one set of minting rules. Before launch, the team needs to state which path or paths will be used and prove that they enforce the same Core limits.

Review code is not proof that either path has been deployed or audited.

### Code links

See [the signed Drop call](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L560-L584), [the older minter](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMinter.sol#L122-L167), [the manager mint](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMintManager.sol#L222-L318), and [the rehearsal setup](https://github.com/{sourceRepository}/blob/{sourceCommit}/script/RehearseDeployment.s.sol#L201-L250).`,
  "publicReview.pages.tokensCollectionsAndMinting.currentPhasesSection": `## A phase sets the rules for one minting period

A phase is a saved set of rules for one minting period. For example, one public sale or allowlist claim can have its own phase.

The manager owner—the account allowed to configure the manager—can create each phase only once. The phase stores:

- the collection and phase IDs;
- when minting starts and ends;
- the largest number of NFTs allowed in one request;
- whether the phase is paused;
- which executors may start a mint;
- an optional gate;
- counters that track used limits; and
- fingerprints for the phase rules and metadata.

A fingerprint is a short code made from the current rules. Each mint request names the fingerprint it expects. The request works only if it matches the current one.

Pausing the phase or changing its approved executors changes the fingerprint. A request prepared for the old rules then fails instead of running under different rules.

### One important detail

The current phase data has no separate field for the total number of NFTs the phase may mint. To enforce that total, the phase must use a ledger counter shared by the whole phase.

### Why this matters

Collectors should be able to see the exact rules that apply before they mint. Reviewers also need to know which types of phases the first release will support.

### Code links

See [the phase data](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/IStreamMintManager.sol#L19-L46) and [phase setup](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMintManager.sol#L131-L220).`,
  "publicReview.pages.tokensCollectionsAndMinting.currentGatesSection": `## A gate can add an extra eligibility check

A gate is an optional contract that gives an extra yes-or-no answer before a mint. For example: “Is this wallet on the allowlist?”

A nullifier is a one-use receipt for a proof. Once it is recorded, the same proof should not work again.

**Practical result:** the pinned code rejects any gate result that contains a nullifier. A gate that needs this kind of one-use receipt cannot be used yet.

### How a gate is chosen

First, the account that controls the gate registry approves the exact gate contract. The registry saves technical facts about it: its interface, version, code fingerprint, metadata, and gas limit.

Next, the account that controls the mint manager connects that gate to a phase. An approved executor then sends the mint request and any data the gate needs.

### What the current code supports

A gate result can include:

- an authorization ID, used to stop the same permission from working twice;
- the address that approved the mint;
- the largest quantity allowed;
- a fingerprint of the gate result; and
- nullifiers, although the current code does not accept them.

Only a gate result with no nullifiers can pass this part of the current checks. Both the manager and the ledger reject a non-empty list.

### Why this matters

The registry proves which gate code was approved. It cannot prove that an outside allowlist or other data source was correct.

Gate data written onchain is public. Putting data in a \`bytes32\` value does not make it private.

### Code links

See [\`StreamMintModuleRegistry\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMintModuleRegistry.sol#L18-L100), [\`IStreamMintGate\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/IStreamMintGate.sol#L5-L28), and [the manager's gate checks](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMintManager.sol#L512-L600).`,
  "publicReview.pages.tokensCollectionsAndMinting.currentCountersSection": `## How the system remembers used limits

A counter is a running total. The ledger is the contract that stores these totals.

Each total is saved under a counter key. Think of the key as a unique label made from:

- the mint manager;
- the collection;
- the phase;
- the type of limit; and
- the person or group being counted.

The person or group can be the payer, recipient, executor, authorizer, a fixed group, or a shared context such as one campaign.

For example, one person may pay while another receives the NFT. Separate keys let the system track their limits separately.

### What the current code does

The manager updates the counters before it asks the Core to mint. If any later step fails, the whole blockchain transaction is undone, including those updates.

Burning an NFT does not reduce these used limits.

The pinned ledger can add a fixed amount to a counter and enforce a fixed maximum. It also remembers which authorization IDs each manager has already used.

### Replacing the manager is not safe by itself

**Cause:** the manager's contract address is part of every counter key.

**Effect:** a replacement manager has a new address, so it creates different keys. The old totals remain in the ledger, but the new manager does not use them automatically.

Without a safe move of the old totals, a limit that was already used could appear unused to the replacement manager.

Accepted [ADR 0010 decision D5.8](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0010-world-class-spec-pass.md#L198-L200) requires an approved process that moves the old totals into a new ledger. A Merkle-proved snapshot must prove the old values.

The pinned ledger has no function that performs this move. A safe replacement process is still missing from this code.

### Code links

See [ledger storage and limit use](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMintLedger.sol#L5-L150) and [how a counter key is created](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMintLedger.sol#L142-L150).`,
  "publicReview.pages.tokensCollectionsAndMinting.currentEditionsSection": `## Editions work differently in the two paths

A Stream collection may contain one unique NFT or many NFTs in an edition. Each NFT in an edition is still its own ERC-721 token.

### Signed Drop path

The signed Drop permission includes a \`quantity\` field, but the current contract requires that value to be one.

The fixed-price Drop therefore creates one NFT at a time. An edition needs a separate signed Drop permission for each NFT on this path.

### Manager path

The manager can create several NFTs in one request. A phase sets the request limit, but the code never allows more than ten NFTs in one batch.

### Why this matters

Saying “editions are supported” is not enough. The interface must also say which minting path it uses and how many NFTs that path can create at once.

### Code links

See [the signed permission fields](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L41-L57), [the one-token check](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L515-L554), and [the manager's batch limit](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMintManager.sol#L37-L38).`,
  "publicReview.pages.tokensCollectionsAndMinting.currentAtomicSection": `## A manager mint should fully succeed or fully fail

The manager path does all of its work in one blockchain transaction.

### What happens

1. An approved executor sends a mint request.
2. The manager checks the current rules, any extra eligibility check, and the number of NFTs requested.
3. The ledger updates the used limits and records the authorization ID.
4. The manager creates one operation root for the whole batch and one operation ID for each token.
5. The Core prepares and creates each NFT.
6. The contracts write public events for the batch and tokens.

An operation root is the fingerprint for the whole batch. An operation ID identifies one token operation inside that batch.

If any step fails, the whole transaction is undone. The used limits, the manager's next operation number, token identities, and ownership return to their earlier values.

The Core also has a function that can cancel the latest prepared token. The current manager path does not call it. Normal manager mints rely on full transaction rollback instead.

### Why this matters

A collector must not receive only part of a batch while the system still counts the full limit as used.

Reviewers need to test failure at every step and on every token in a batch.

### Code links

See [\`mintPrepared\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMintManager.sol#L222-L318) and [the Core prepare, complete, and cancel functions](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L464-L539).`,
  "publicReview.pages.tokensCollectionsAndMinting.currentReplaySection": `## The same mint permission must not work twice

Each mint permission and prepared token operation has an ID. The contracts remember used IDs so the same action cannot run twice. This is called replay protection.

### What the current code remembers

- Signed Drops remember used Drop IDs inside \`StreamDrops\`.
- The ledger remembers used authorization IDs separately for each manager.
- The Core remembers every prepared-token operation ID for the life of the contract.
- The manager creates an operation root for the whole batch, but the ledger does not store it.

The result is split across contracts. No single lasting record links the batch, its used limits, and all NFTs created by it.

### A proposed change

[ADR 0018](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0018-batch-operation-root-and-token-identity.md#L3-L33) proposes making the ledger remember each used operation root. After a proven move to that design, the Core would no longer keep every token operation ID forever.

This ADR is only a proposal. It is not accepted or implemented in the pinned code.

### Why this matters

One contract should own the lasting batch record. Otherwise a replacement may lose the link between used limits and created NFTs.

The current Core record also grows every time the manager prepares a token. Its long-term storage cost still needs review.`,
  "publicReview.pages.tokensCollectionsAndMinting.currentIdentityResultSection": `## Each minted NFT gets a lasting identity

After a successful mint, the Core stores:

- the NFT's global token ID;
- its collection ID;
- its serial number inside that collection;
- its current owner; and
- its token data and randomness state.

The IDs stay with the NFT. The owner may change later when the NFT is transferred.

The Core also writes public log events. \`TokenCollectionRegistered\` records the collection and serial. The normal ERC-721 \`Transfer\` event records the first owner. A manager mint adds its own batch and token events.

### Why this matters

Another service should be able to rebuild an NFT's identity and ownership history from public contract state and events.

The two minting paths need separate tests because they write different extra events.

### Code links

See [identity creation](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L1270-L1303) and [the manager's token event](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMintManager.sol#L281-L318).`,
  "publicReview.pages.tokensCollectionsAndMinting.currentBurnSection": `## Burning removes the NFT but keeps its history

Before a collection is frozen, the NFT owner or an approved account can burn the NFT.

Burning:

- removes the current owner;
- lowers the number of live NFTs;
- keeps the token ID, collection ID, and collection serial;
- keeps the token data and burn audit record;
- does not lower the number ever minted; and
- does not restore a used limit in the mint ledger.

After the collection is frozen, the Core no longer allows burning.

### Why this matters

The public record can tell the difference between an NFT that never existed and one that existed but was burned.

Sales, preservation tools, royalty tools, and indexes still need clear rules for how they treat burned NFTs.

### Code links

See [\`StreamCore.burn\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L591-L626) and [the identity kept after a burn](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L544-L559).`,
  "publicReview.pages.tokensCollectionsAndMinting.currentClosureSection": `## Closing minting must stop every path

### What the current Core does

After the older minter's end time and a waiting period, an approved function admin can call \`setFinalSupply\`.

The Core then sets the collection limit to the number of NFTs ever minted. Both minting paths need the Core to allocate the next collection serial, so this limit blocks both paths.

### The zero-mint problem

If no NFT has been minted, \`setFinalSupply\` sets the collection limit to zero.

The Core also uses zero to mean that the supply has not been set yet. While the collection is still unfrozen, an approved function admin can call \`setCollectionData\` and set a new limit.

This means \`setFinalSupply\` alone does not close an empty collection forever.

\`freezeCollection\` sets the final supply and freezes the collection in one transaction. That prevents the zero limit from being reopened.

\`setFinalSupply\` also writes no dedicated event saying that supply was closed.

### What still needs a clear launch rule

The launch rule should:

- close minting permanently even when no NFT exists;
- close or pause every phase and executor;
- say what happens to unused permissions;
- stay closed after a manager or ledger replacement; and
- write the exact final supply in an event.

### Code links

See [\`setFinalSupply\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L838-L858), [\`setCollectionData\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L353-L385), and [\`freezeCollection\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L779-L795).`,
  "publicReview.pages.tokensCollectionsAndMinting.currentResponsibilitiesSection": `## Which contract is responsible for what

The current code splits minting work across several contracts:

- **Core:** stores permanent identity, the collection supply, freeze state, ownership, transfers, and burns.
- **StreamDrops and StreamMinter:** handle signed Drops and the current auction minting path.
- **StreamMintManager:** handles phases, approved executors, gates, batch setup, and operation IDs.
- **StreamMintLedger:** stores limits and used authorization IDs separately for each manager.
- **Gate contracts:** make extra eligibility checks for manager phases.
- **Outside systems:** decide how marketplaces show collections and provide any offchain allowlist or curation data.

### Why this matters

Each promise needs one clear owner.

Before launch, the design must show how these contracts work together and how used limits and history survive when a contract is replaced.`,
  "publicReview.pages.tokensCollectionsAndMinting.currentFailuresSection": `## What reviewers should try to break

- The older and newer minting paths apply different limits.
- Two phases together mint more NFTs than their intended shared allowance.
- A sponsored mint counts the payer when it should count the recipient, or the other way around.
- A gate uses wrong outside data, different code, too much gas, or unclear results.
- Part of a batch remains changed after a later step fails.
- The same authorization or operation ID works twice.
- Burning an NFT wrongly creates a new mint allowance.
- A new manager starts with empty limit history.
- Supply is called final but an admin or another path can reopen minting.
- A marketplace shows all Stream NFTs as one collection because they share one Core address.

These are things to test. This list does not say that every problem exists or that the code is safe.`,
  "publicReview.pages.tokensCollectionsAndMinting.currentQuestionsSection": `## Questions for reviewers

1. Which minting path or paths will the first release use?
2. Which identity and supply rules must always stay in the Core?
3. Can major marketplaces and indexers show each Stream collection separately?
4. Which phases, gates, and limit types does the first release need?
5. Do payer, recipient, transfer, burn, and contract-replacement cases keep the right limits?
6. Does every failed batch undo all limit, operation, and token changes?
7. Which contract should keep the permanent record that stops batch replay?
8. Can minting close once and stay closed, even when no NFT has been minted?`,
} as const;
