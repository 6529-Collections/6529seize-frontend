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

## Collection supply

The collection record tracks supply-related state. Reviewers must distinguish:

- maximum or configured supply;
- minted-ever supply;
- live supply after burns;
- final supply;
- remaining phase or authorization capacity.

A burn does not reduce minted-ever history and does not make the token ID
available again.

## Mint phases

### IMPLEMENTED

[`StreamMintManager.sol`](https://github.com/6529-Collections/6529Stream/blob/e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8/smart-contracts/StreamMintManager.sol)
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
eligibility depend on additional policy.

These extensions should not be assumed safe because they are “outside the
Core.” Reviewers should trace every external call, return value, reentrancy
boundary, and rollback rule.

## Durable counters

### IMPLEMENTED

[`StreamMintLedger.sol`](https://github.com/6529-Collections/6529Stream/blob/e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8/smart-contracts/StreamMintLedger.sol)
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

### IMPLEMENTED

Minting crosses several modules, so the protocol uses a preparation sequence.
The manager validates policy and reserves the intended operation. The Core then
prepares token state, the execution performs required work, and the operation is
completed or aborted.

The Core exposes distinct prepare, complete, and abort functions. The review
should establish an invariant:

> After any revert, every supply reservation, replay identifier, counter,
> payment credit, and pending token state is either fully committed or fully
> restored.

### TESTED

The repository includes mint-manager, ledger, accounting, Core-hook,
state-machine, and supply-replay tests. Generated test references will show
which test files touch each function.

## Replay and operation identifiers

The Core retains lifetime operation-ID replay state. This prevents an old
operation from being accepted again.

### KNOWN LIMITATION

The repository discusses a proposed operation-root architecture that is not
accepted or implemented in the current candidate. The present ledger does not
carry the proposed manager batch root, while the Core retains lifetime
operation-ID storage.

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

When a mint completes, the token receives:

- its global token ID;
- collection identity;
- collection serial;
- owner;
- mint and operation history;
- the metadata/randomness state required by the collection.

Reviewers should verify event reconstructability. A third party should be able
to rebuild the sequence of collection creation, mint preparation, completion,
transfer, burn, and finality without private databases.

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
- a prepared mint is not fully aborted;
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

