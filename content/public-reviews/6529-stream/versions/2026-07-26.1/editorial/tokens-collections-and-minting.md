# Tokens, collections, and minting

Stream uses one shared ERC-721 Core for many native collections. This page
describes token identity, supply, mint phases, counters, prepared execution, and
burn behavior.

## One Core, many collections

### IMPLEMENTED

The Core stores a collection record and associates each token with a collection.
Token IDs are globally sequential across the Core. The protocol also records a
collection-local serial so a work can be discussed both as a global token and
as an item within its collection.

This differs from deploying a new ERC-721 contract for every artist or project.
The advantages are a shared identity and common permanent surface. The tradeoff
is that Core correctness and governance affect many collections.

### NONLOCAL EVIDENCE PENDING

An artist's Stream collection does not have its own ERC-721 contract address.
Marketplaces and indexers commonly group NFTs by contract address, and Ethereum
has no native subcollection identity standard. Address-only venues therefore
see one shared Stream contract rather than one address per artist.

The accepted design exposes Core collection reads, per-collection metadata, and
`properties.stream.collection` fields in token JSON. Marketplace and indexer
support remains an external launch gate. This launch Core has no dormant facade
that can later turn each collection into a separate ERC-721 address.

See the accepted
[`collection identity decision`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/docs/adr/0015-collection-identity-and-facade-readiness.md#L21-L66)
and
[`Core-native-only decision`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/docs/adr/0016-core-native-only-erc721.md#L27-L50).

## Collection supply

The collection record tracks supply-related state. Reviewers must distinguish:

- maximum or configured supply;
- minted-ever supply;
- live supply after burns;
- final supply;
- remaining phase or authorization capacity.

A burn does not reduce minted-ever history and does not make the token ID
available again.

## Two source-implemented mint paths

### CURRENTLY WIRED BASELINE

The signed Drop and current auction path use the legacy `StreamMinter`. That
contract has its own collection start/end window and supply checks and calls the
legacy `StreamCore.mint` or `mintAndAuction` route. It does not consume
`StreamMintLedger` counters.

### SEPARATELY DEPLOYED FOUNDATION

The newer `StreamMintManager` path has phases, executors, gates, policy hashes,
durable counters, and prepared Core execution. The rehearsal installs both the
legacy minter and the manager in Core, but gives the legacy minter to
`StreamDrops`.

The exact distinction is visible in
[`StreamDrops._executeFixedPriceDrop`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/StreamDrops.sol#L609-L632),
[`StreamMinter.mint`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/StreamMinter.sol#L130-L175),
[`StreamMintManager.mintPrepared`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/StreamMintManager.sol#L241-L299),
and the
[`rehearsal wiring`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/script/RehearseDeployment.s.sol#L218-L269).

## Mint phases

### SOURCE IMPLEMENTED

[`StreamMintManager.sol`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/StreamMintManager.sol)
supports collection mint phases. A phase can bind timing, executor, gate, and
counter behavior.

Separating phase policy from the Core allows a collection to use a suitable
distribution rule without placing every future sale mechanism into the
permanent token contract.

### REVIEW REQUIREMENT

Every phase must make these facts visible:

- phase identifier and collection;
- opening and closing time;
- maximum phase supply;
- per-wallet or per-recipient limits;
- executor and optional gate;
- whether transfers or burns affect counters;
- which role can edit or freeze the phase;
- what happens to pending or prepared mints at closure.

## Executors and gates

An executor is allowed to drive a configured mint path. A gate can make
eligibility depend on additional policy. These terms describe the manager lane,
not the current signed Drop lane.

An active gate registration binds:

- lifecycle status;
- interface ID;
- semantic version;
- runtime code hash;
- metadata hash;
- per-call gas limit.

The registry rechecks active status, interface support, and code hash. A gate
returns an authorization ID, nullifiers, authorizer, maximum quantity, and gate
hash. Those values are security inputs, not descriptive metadata.

See
[`StreamMintModuleRegistry`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/StreamMintModuleRegistry.sol#L9-L100)
and
[`IStreamMintGate`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/IStreamMintGate.sol#L6-L29).

These extensions should not be assumed safe because they are “outside the
Core.” Reviewers should trace every external call, return value, reentrancy
boundary, and rollback rule.

## Durable counters

### SOURCE IMPLEMENTED

[`StreamMintLedger.sol`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/StreamMintLedger.sol)
stores durable usage counters. Depending on policy, counters can apply to
wallets, recipients, tokens, contexts, or other keys.

Counter semantics matter:

- A wallet limit and recipient limit are not the same when sponsored mints are
  possible.
- A live-balance check is not the same as a minted-ever limit.
- Burning a token should not automatically restore a lifetime mint allowance.
- A reverted mint should not permanently consume a counter.
- A manager replacement should not erase historical usage.

## Prepared mint execution

### SOURCE IMPLEMENTED

The manager lane crosses several modules, so it uses a preparation sequence.
The manager validates policy, consumes the ledger counters, derives an operation
root and per-token operation ID, and calls Core's prepare and complete entries
inside one transaction. A revert restores the whole transaction.

Core also has a manager-only abort hook that can roll back the last prepared
allocation. The current `StreamMintManager.mintPrepared` implementation does not
call it; it calls prepare and complete in the same transaction and relies on
transaction rollback on failure. The source does not expose a user-callable,
long-lived prepared state that survives for later completion. The review should
establish an invariant:

> After any revert, every supply reservation, replay identifier, counter,
> payment credit, and pending token state is either fully committed or fully
> restored.

### TESTED

The repository includes mint-manager, ledger, accounting, Core-hook,
state-machine, and supply-replay tests. Those tests do not prove that the
current signed Drop calls the manager lane.

## Replay and operation identifiers

The Core retains lifetime operation-ID replay state. This prevents an old
operation from being accepted again.

### KNOWN LIMITATION

The current manager derives one batch operation root and distinct per-token
operation IDs, but it consumes the ledger before deriving the root. The ledger
does not receive or store that root or a token operation ID, while Core retains
an unbounded lifetime mapping of prepared token operation IDs.

The proposed repair is not accepted or implemented. It would make the ledger
the durable batch replay owner and provide an exact join between ledger
accounting and prepared-token events. See
[`ADR 0018`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/docs/adr/0018-batch-operation-root-and-token-identity.md#L3-L33).

Typed primary-settlement and repeated-sale replay work is also still recorded as
future design work. The review should not describe those draft protections as
current behavior.

## Free claims, paid mints, editions, and airdrops

The same permanent Core can support different policies through configured
executors and phases. A one-of-one sale, fixed edition, free claim, and airdrop
do not require the same counters or payment steps.

### OPEN FOR FEEDBACK

The final genesis release should state exactly which profiles are supported and
tested. A generic extension point is not evidence that every imaginable mint
profile is safe.

## Token allocation

Every successful mint receives:

- its global token ID;
- collection identity;
- collection serial;
- owner;
- mint history, plus operation IDs only when the selected lane supplies them;
- the metadata/randomness state required by the collection.

Reviewers should verify event reconstructability separately for each lane. A
third party should be able to distinguish a legacy mint from a manager prepared
mint and rebuild collection creation, mint, transfer, burn, and finality without
inventing a preparation event that never occurred.

## Burning

### IMPLEMENTED

Burn removes ERC-721 ownership and prevents ordinary token behavior. The Core
retains burn audit reads. The ID is not reminted.

The protocol must define how burn interacts with:

- pending randomness;
- unsettled sale or credit state;
- metadata and preservation;
- supply finalization;
- curator or revenue accounting;
- artwork finality;
- offchain indexes.

### TESTED

The repository includes Core burn, randomness, metadata, and supply invariant
tests. Cross-module burn behavior remains an important audit focus because a
module can accidentally treat “nonexistent” and “burned” as the same state.

## Final supply and mint closure

Final supply is a separate recorded state. It should be impossible to declare
final supply while a legitimate mint path can still create tokens.

Reviewers should verify:

- all phases and executors are closed or exhausted;
- auction and signed-drop paths cannot mint later;
- no successor module can bypass the final state;
- the required delay has elapsed;
- events and manifests record the final value.

## What we think

The shared Core is a consequential architectural choice. It should keep only
the state and invariants that genuinely need a common permanent identity.
Complex distribution policy belongs in replaceable modules, but those modules
must not be able to violate Core supply, replay, or token-identity rules.

## What can fail

- overlapping phases exceed intended supply;
- payer and recipient counters are confused;
- a gate reenters or returns ambiguous data;
- a manager transaction leaves supply, counters, or token state inconsistent;
- a replay identifier is consumed too early or too late;
- burn restores an allowance unintentionally;
- manager replacement loses durable limits;
- final supply is recorded while a mint path remains open.

## Questions for reviewers

1. Which mint invariants must live in the permanent Core?
2. Are global token IDs and collection-local serials the right identity model?
3. Do counters cover sponsored mints, transfers, and burns correctly?
4. Can every partial execution return to a clean state?
5. Which mint profiles belong in the genesis release?
6. Is the long-term cost of lifetime replay storage acceptable?
