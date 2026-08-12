export const PUBLIC_REVIEW_TOKENS_MINTING_MESSAGES = {
  "publicReview.pages.tokensCollectionsAndMinting.currentSummary":
    "How one shared NFT contract creates Stream collections and tokens, controls minting, keeps limits, and records open risks.",
  "publicReview.pages.tokensCollectionsAndMinting.currentIntro": `## Minting in one minute

All Stream collections and tokens live in one shared ERC-721 NFT contract called the Core.

First, a collection gets an ID. When a mint succeeds, the token gets a global Stream token ID and a serial number inside its collection. Minting tools check the sale or eligibility rules. The Core then enforces the collection supply and records the token's permanent identity.

The reviewed code has two separate minting paths. Signed Drops and auctions use the older \`StreamMinter\` path. A newer \`StreamMintManager\` and \`StreamMintLedger\` path supports phases, gates, and detailed counters. The two paths are both present, but they are not one combined launch path.

**Main point:** token identity belongs in the Core. Minting rules can live in replaceable modules. Every path must still obey the same supply and identity rules.

This is code under public review. Its availability here does not prove deployment, audit, or safety.`,
  "publicReview.pages.tokensCollectionsAndMinting.currentIdentitySection": `## One permanent identity surface for many collections

### What happens

All Stream collections share the same Core contract. A function admin creates each collection record. The Core records every token under that collection.

Each token has:

- one global Stream token ID; and
- one serial number inside its collection.

### Accepted design

[ADR 0016](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0016-core-native-only-erc721.md#L27-L50) accepts one Core-native ERC-721 for the launch line. It rejects hidden per-collection NFT contracts inside this Core.

[ADR 0015 decisions W1 and W2](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0015-collection-identity-and-facade-readiness.md#L21-L66) still apply. Collection reads and token JSON identify the collection. Required marketplace or indexer commitments remain an outside release gate.

### Why this matters

One Core gives every collection the same ownership rules, but a Core defect can affect them all. Address-only marketplaces may also group all Stream collections together.

### Technical details

[\`StreamCore.createCollection\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L336-L375) creates the collection record. [\`tokenCollectionIdentity\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L576-L590) returns the stored collection ID, collection serial, and burn status for a token.`,
  "publicReview.pages.tokensCollectionsAndMinting.currentSupplySection": `## Supply combines several counters

Stream uses several supply numbers because they answer different questions:

- **Maximum supply:** the current collection cap.
- **Minted-ever supply:** every token identity allocated to the collection, including burned tokens.
- **Live supply:** minted-ever supply minus burned tokens.
- **Phase or authorization capacity:** how much one minting rule still allows.
- **Final supply:** the intended cap after minting closes.

### What the current Core does

The Core increases minted-ever supply when it allocates a collection serial. Burning lowers live supply. It does not lower minted-ever supply or free the old token ID.

The manager and ledger path can also consume separate counters for a payer, recipient, executor, authorizer, or shared context.

### Why this matters

Mixing these numbers could let a burn or second path break a supply promise.

### Technical details

[\`_allocateTokenIdentity\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L1356-L1389) assigns the next global ID and collection serial. [\`totalSupplyOfCollection\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L1652-L1660) returns minted-ever minus burns.`,
  "publicReview.pages.tokensCollectionsAndMinting.currentPolicySection": `## Why mint policy lives outside the Core

### The split of duties

The Core owns the rules every minting path must obey:

- permanent token and collection identity;
- the collection supply cap;
- collection freeze; and
- access to the Core mint entries.

The newer manager path puts changeable distribution rules outside the Core:

- the manager owner configures phases and approved executors;
- an approved executor asks to mint;
- an optional gate checks extra eligibility rules;
- the ledger records limits and used authorizations; and
- the Core creates the token identity.

### Why this matters

Sales, claims, allowlists, and airdrops can change without replacing the Core. No outside module may bypass its supply, identity, or freeze rules, or lose limits already used.

### Technical details

[\`StreamMintManager\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMintManager.sol#L13-L56) names the manager's dependencies and limits. [\`StreamMintLedger\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMintLedger.sol#L7-L40) stores its authorized writers and durable accounting.`,
  "publicReview.pages.tokensCollectionsAndMinting.currentLanesSection": `## The two source mint lanes

The pinned code has two separate paths.

### 1. Signed Drops and auctions

\`StreamDrops\` checks a signed authorization. It then calls the older \`StreamMinter\`. That minter checks its own time window and supply rules before asking the Core to mint.

### 2. Manager and ledger

\`StreamMintManager\` checks a configured phase, executor, optional gate, and counters. It consumes ledger state and uses the Core's prepared-mint functions.

### Current status

The rehearsal deploys and wires both paths. Signed Drops and the current auction still use \`StreamMinter\`. They do not use the manager's phases or ledger counters.

The code does not yet show one clear launch path for all minting. This must be resolved before launch. Review code is not proof of deployment or audit.

### Technical details

See [the signed Drop call](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L609-L632), [the legacy minter](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMinter.sol#L130-L175), [the manager mint](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMintManager.sol#L241-L302), and [the rehearsal wiring](https://github.com/{sourceRepository}/blob/{sourceCommit}/script/RehearseDeployment.s.sol#L218-L269).`,
  "publicReview.pages.tokensCollectionsAndMinting.currentPhasesSection": `## Phases make distribution policy inspectable

### What a phase records

The manager owner can configure a phase once. The current phase data includes:

- the collection and phase IDs;
- start and end times;
- the largest allowed batch;
- configuration and metadata hashes;
- a paused state;
- approved executors;
- an optional gate; and
- one or more counters.

The manager hashes these rules. A mint request must provide the current hash. Pausing the phase or changing executors updates it.

The current phase struct does not have a separate \`maxPhaseSupply\` field. A phase-wide cap must be expressed through a configured ledger counter.

### Why this matters

Collectors should see the exact rules before acting. Reviewers need the list of phase types the first release will support and test.

### Technical details

See [the phase types](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/IStreamMintManager.sol#L21-L50) and [phase configuration](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMintManager.sol#L143-L239).`,
  "publicReview.pages.tokensCollectionsAndMinting.currentGatesSection": `## Gates carry security inputs

A gate is an optional read-only contract that checks extra eligibility rules for a manager phase.

### Who acts

The module-registry owner registers a gate and pins its interface, version, code, metadata, and gas limit. The manager owner connects it to a phase. An approved executor submits the request.

### What the current code accepts

A gate can return an authorization ID, an authorizer, a maximum quantity, a gate hash, and nullifiers. A nullifier is meant to be a one-use replay key.

The current manager and ledger reject nonempty nullifier arrays. Nullifier-backed gates still need implementation.

### Why this matters

The registry identifies the gate code. It cannot prove that an outside allowlist was correct. Onchain gate data is public; a \`bytes32\` value is not private.

### Technical details

See [\`StreamMintModuleRegistry\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMintModuleRegistry.sol#L21-L100), [\`IStreamMintGate\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/IStreamMintGate.sol#L6-L29), and [manager gate validation](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMintManager.sol#L551-L609).`,
  "publicReview.pages.tokensCollectionsAndMinting.currentCountersSection": `## Durable counters cover activity across transactions

The ledger stores how much of a limit has been used. A counter key includes the manager, collection, phase, counter, and subject.

The subject can be a payer, recipient, executor, authorizer, constant group, or shared context. A sponsored mint can therefore count payer and recipient limits separately.

### What the current code does

The manager consumes counters before asking the Core to mint. If the transaction fails, the EVM reverts those changes too. Burns do not reduce consumed ledger counters.

The current ledger supports static increments and static caps. It also stores used authorization IDs in the calling manager's scope.

### Successor risk

Old values remain stored after manager replacement. But the manager address is part of each key, so a new manager does not automatically inherit them. A successor plan must preserve earlier limits.

### Technical details

See [ledger storage and consumption](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMintLedger.sol#L7-L108) and [counter-key derivation](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMintLedger.sol#L155-L164).`,
  "publicReview.pages.tokensCollectionsAndMinting.currentEditionsSection": `## Editions and signed Drop quantity

The Core can hold a one-of-one work or an edition with many distinct ERC-721 tokens in one collection.

That collection ability is different from the current signed Drop format.

### Current signed Drop path

The signed authorization has a \`quantity\` field, but the contract requires it to equal one. The fixed-price call builds one-item arrays and mints one token. An edition therefore needs one signed Drop authorization per token on this path.

### Manager path

The manager can mint a batch. A phase sets the limit, up to a hard maximum of ten tokens.

### Why this matters

Interfaces must name the path. “Supports editions” can hide the signed Drop path's one-token rule.

### Technical details

See [the signed authorization fields](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L44-L61), [the quantity check](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L561-L581), and [the manager batch cap](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMintManager.sol#L38-L45).`,
  "publicReview.pages.tokensCollectionsAndMinting.currentAtomicSection": `## Prepared execution keeps cross-module state atomic

The manager path changes policy, counters, and Core token state in one transaction.

### What happens

1. An approved executor sends a mint request.
2. The manager checks the phase, policy hash, gate, and batch.
3. The ledger consumes the required counters and authorization ID.
4. The manager derives a batch root and a separate operation ID for each token.
5. The Core prepares and completes each token.
6. The manager emits batch and token events.

If any step reverts, the EVM restores counters, nonces, token identities, and mint state.

The Core also has an abort function for the latest prepared token. The current \`mintPrepared\` path does not call it; it relies on transaction rollback.

### Why this matters

A collector must not receive half a mint while a limit remains consumed. Reviewers must prove rollback across every call and token.

### Technical details

See [\`mintPrepared\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMintManager.sol#L241-L302) and [the Core prepare, complete, and abort functions](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L492-L569).`,
  "publicReview.pages.tokensCollectionsAndMinting.currentReplaySection": `## Replay protection needs one durable owner

Replay protection stops the same permission or operation from being used twice.

### What the current code stores

- Signed Drops store used drop IDs in \`StreamDrops\`.
- The ledger stores used authorization IDs inside each manager's scope.
- The Core stores every used prepared-token operation ID for the life of the contract.
- The manager derives and emits a batch operation root, but the ledger does not store that root.

The batch root, ledger counters, and Core operation IDs lack one durable joined record.

### Still proposed

[ADR 0018](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0018-batch-operation-root-and-token-identity.md#L3-L33) proposes making the ledger the permanent owner of batch replay, then removing the Core's lifetime operation-ID mapping after a proven cutover.

That ADR is not accepted or implemented in the pinned source. The current code still uses the older ownership split.

### Why this matters

One replay rule should have one owner. Otherwise a replacement can lose the link between consumed limits and created tokens. The current Core mapping also grows with every prepared token, so its long-term storage cost needs review.`,
  "publicReview.pages.tokensCollectionsAndMinting.currentIdentityResultSection": `## Every minted token receives durable identity

When a mint succeeds, the Core records:

- the global token ID;
- the collection ID;
- the collection serial;
- the owner; and
- the token data and randomness state used by that collection.

The Core emits \`TokenCollectionRegistered\` when it allocates identity. The normal ERC-721 mint also emits \`Transfer\` from the zero address. A manager mint adds manager batch and token events.

### Why this matters

A third party should be able to rebuild identity and ownership history from public state and events. The two mint paths need separate tests because they emit different extra evidence.

### Technical details

See [identity allocation](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L1356-L1389) and [the manager's token event](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMintManager.sol#L304-L343).`,
  "publicReview.pages.tokensCollectionsAndMinting.currentBurnSection": `## Burning preserves history

Before a collection is frozen, a token owner or approved account can burn the token.

Burning removes the current owner and lowers live supply. It does not erase the token's collection ID, collection serial, token ID, token data, or burn audit record. It also does not lower minted-ever supply.

After collection freeze, the Core rejects burning because the collection is no longer mutable.

### Why this matters

The chain can distinguish “never minted” from “burned.” Other modules must define what a burn means for randomness, sales, preservation, royalties, and indexes.

### Technical details

See [\`StreamCore.burn\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L628-L663) and [the retained identity read](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L576-L590).`,
  "publicReview.pages.tokensCollectionsAndMinting.currentClosureSection": `## Mint closure must close every lane

### What the current Core does

After the wait, a function admin can call \`setFinalSupply\`. The Core sets the cap to minted-ever supply. Both mint paths need the Core's next collection serial, so this cap blocks both.

### Current zero-mint gap

With no mints, \`setFinalSupply\` sets the cap to zero. Zero also lets \`setCollectionData\` initialize supply, so a function admin can set a new cap while the collection remains unfrozen.

\`freezeCollection\` closes supply and freezes in one transaction, which blocks reopening. But \`setFinalSupply\` alone is not a one-way zero-mint closure.

The current \`setFinalSupply\` function also emits no dedicated supply-closed event.

### What still needs a clear launch rule

Closure should be one-way at zero, close every phase and executor, define pending authorizations, preserve the rule through successors, and emit an exact final value.

### Technical details

See [\`setFinalSupply\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L888-L908), [\`setCollectionData\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L379-L408), and [\`freezeCollection\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L826-L842).`,
  "publicReview.pages.tokensCollectionsAndMinting.currentResponsibilitiesSection": `## Responsibilities carried by the minting system

The current source spreads minting duties across several contracts:

- **Core:** permanent identity, collection supply, freeze, ownership, transfer, and burn.
- **StreamDrops and StreamMinter:** signed Drop and auction minting rules.
- **StreamMintManager:** phase policy, approved executors, gates, batch preparation, and operation identities.
- **StreamMintLedger:** manager-scoped counters and used authorization IDs.
- **Gate modules:** extra eligibility decisions for manager phases.
- **Outside systems:** marketplace collection display and any offchain allowlist or curation process.

### Why this matters

Each promise needs one owner. The launch design must explain how those owners work together and preserve history when a contract changes.`,
  "publicReview.pages.tokensCollectionsAndMinting.currentFailuresSection": `## What can fail

- The legacy and manager paths enforce different limits.
- Two phases exceed an intended allocation even while the Core cap holds.
- Payer and recipient limits are mixed up during a sponsored mint.
- A gate uses wrong outside data, fails its pinned code check, runs out of gas, or returns unclear results.
- A batch fails after one module changes state and rollback is not proven.
- An authorization or operation ID can be used again.
- A burn wrongly restores mint capacity.
- A replacement manager starts with empty counter history.
- Supply is called final while another path can still mint or reopen it.
- Marketplaces show every Stream collection as one collection under the shared Core address.

These are review targets. Listing them does not mean the code is safe or that every failure has been tested.`,
  "publicReview.pages.tokensCollectionsAndMinting.currentQuestionsSection": `## Questions for reviewers

1. Which identity and supply rules must stay in the permanent Core?
2. Can marketplaces and indexers reliably show separate collections under one Core address?
3. Which minting path will the first release actually use?
4. Which phase, gate, and counter types are required for that release?
5. Do payer, recipient, transfer, burn, and successor cases keep the right limits?
6. Does every failure restore counters, operation state, and token state for the whole batch?
7. Which contract should own the permanent batch replay record?
8. Can supply close once, including when no token has been minted, and stay closed across every path?`,
} as const;
