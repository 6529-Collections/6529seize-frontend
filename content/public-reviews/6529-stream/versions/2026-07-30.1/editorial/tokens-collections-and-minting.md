# Tokens, collections, and minting

A Stream token carries a larger set of facts: its collection, its serial within
that collection, the collection's maximum supply, the distribution policy that
admitted the mint, the limits consumed, and the history preserved through a
burn or module replacement.

Minting therefore spans identity, supply, replay protection, eligibility, and
accounting. The review follows each guarantee through the contracts and the
external systems that support them.

## One permanent identity surface for many collections

The reviewed Core stores a collection record and associates every token with a
collection. Token IDs are globally sequential across the shared ERC-721
contract. The Core also records a collection-local serial, so the same work can
be identified both as a global Stream token and as an item within its own
collection.

This is a deliberate alternative to deploying a separate ERC-721 contract for
every artist or project. It gives all Stream works a common permanent surface
for ownership, approvals, transfers, identity reads, and shared invariants.
Public Core records expose collection identity onchain.

The tradeoff is real. A defect or governance failure in the shared Core can
affect many collections. Each artist's collection uses a Core record within the
shared ERC-721 contract. Ethereum has no native subcollection identity
standard, so address-only marketplaces may group every Stream artist and
collection under one contract.

The accepted design addresses that presentation problem with Core collection
reads, per-collection metadata, and `properties.stream.collection` fields in
token JSON. Marketplace and indexer support still requires external evidence.
The launch Core contains no dormant facade that can later turn each collection
into a separate ERC-721 address. See the accepted
[`collection identity decision`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/docs/adr/0015-collection-identity-and-facade-readiness.md#L21-L66)
and
[`Core-native-only decision`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/docs/adr/0016-core-native-only-erc721.md#L27-L50).

## Supply combines several counters

Stream distinguishes:

- the configured maximum supply;
- the number of tokens minted over the collection's lifetime;
- the live supply after burns;
- the final supply;
- the remaining capacity of a phase or authorization.

These values answer different questions. Burning a token changes live supply
while preserving mint history, permanent token-ID allocation, and lifetime mint
allowance already used. Individual phase, wallet, recipient, and
signed-authorization capacity remains separately tracked.

A superficially simpler design can keep only the current token count. That
works until a burn is mistaken for permission to mint again, a replaced minter
forgets prior usage, or two distribution paths each believe they own the same
remaining supply.

## Why mint policy lives outside the Core

The Core should enforce the invariants that every mint path must respect:
token identity, collection identity, supply, freeze state, and non-reuse of
permanent operation identifiers. Future allowlists, claims, sales, airdrops, and
eligibility mechanisms belong in bounded modules.

The newer manager-and-ledger design therefore separates:

- **Core**, which allocates and records permanent token identity;
- **StreamMintManager**, which applies phase and execution policy;
- **StreamMintLedger**, which retains durable usage and replay accounting;
- **executors**, which drive an approved mint path; and
- **gates**, which can evaluate additional eligibility policy.

This is purposeful modularity. Different distributions can evolve without
changing what an existing token is. The security condition is that no module
may exceed Core supply, rewrite identity, bypass freeze, or discard durable
limits.

## The two source mint lanes

The pinned source contains two distinct mint lanes with separate call and
accounting flows.

The signed Drop and current auction route call the legacy
[`StreamMinter`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMinter.sol).
That minter applies its own collection time and supply checks before calling
the legacy Core mint entry, using its own accounting outside
`StreamMintLedger`.

The separately deployed
[`StreamMintManager`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMintManager.sol)
and
[`StreamMintLedger`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMintLedger.sol)
implement phases, gates, policy hashes, durable counters, and prepared Core
execution. The rehearsal installs the manager in Core, but gives the legacy
minter to `StreamDrops`.

The distinction is visible in
[`StreamDrops._executeFixedPriceDrop`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L609-L632),
[`StreamMinter.mint`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMinter.sol#L130-L175),
[`StreamMintManager.mintPrepared`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMintManager.sol#L241-L299),
and the
[`rehearsal wiring`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/script/RehearseDeployment.s.sol#L218-L269).

The current candidate's parallel lanes must be reconciled into one explicit
launch path. The lasting design value
is the separation between permanent identity and replaceable distribution
policy.

## Phases make distribution policy inspectable

A manager phase can bind:

- collection and phase identity;
- opening and closing time;
- maximum phase supply;
- per-wallet, per-recipient, or other scoped limits;
- an executor and optional gate;
- a policy hash;
- whether the phase is paused;
- the counters consumed by each mint.

That structure exists because a one-of-one sale, fixed edition, free claim,
allowlist, and airdrop can each need
different timing and accounting without changing the ERC-721 Core.

Every supported phase should make these facts visible before a user acts:

- phase identifier and collection;
- opening and closing time;
- maximum phase supply;
- per-wallet or per-recipient limits;
- executor and optional gate;
- whether transfers or burns affect counters;
- which role can edit, pause, or freeze the phase;
- what happens to pending or prepared work at closure.

The genesis release needs an explicit list of profiles supported and tested
through this extension point.

## Gates carry security inputs

An active gate registration binds lifecycle status, interface ID, semantic
version, runtime code hash, metadata hash, and a per-call gas limit. The
registry rechecks active status, interface support, and code identity.

A gate result can include:

- an **authorization ID**, intended as a one-use identifier;
- **nullifiers**, intended as domain-separated replay keys;
- an **authorizer**, whose identity or entitlement was accepted;
- a **maximum quantity**;
- a **gate hash** committing to the validation result and policy context.

The current ledger scopes an authorization ID to the calling mint manager and
rejects a second consumption by that manager. The current candidate supports
gates with empty nullifier arrays; nullifier-backed gates await implementation.
A `bytes32[]` interface alone would still expose its values onchain.

The gate hash improves auditability. Public evidence must also establish the
correctness of the offchain eligibility process. Reviewers still need to trace
every external call, return value, code-hash check, reentrancy boundary, and
rollback rule in code inside or outside the Core.

See
[`StreamMintModuleRegistry`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMintModuleRegistry.sol#L9-L100)
and
[`IStreamMintGate`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/IStreamMintGate.sol#L6-L29).

## Durable counters survive more than one transaction

`StreamMintLedger` can apply counters to wallets, recipients, tokens, contexts,
or other keys. That flexibility is needed because several apparently similar
limits have different meanings:

- Payer and recipient limits remain separate when sponsored mints are possible.
- Live-balance and minted-ever limits answer separate questions.
- Burns preserve lifetime allowance already used.
- Reverted mints restore capacity.
- Manager replacements preserve historical usage.

If these counters exist only in a website, users must trust the website to
apply them consistently. If they live only inside one replaceable minter, a
module cutover can reset the policy's memory. A separate durable ledger makes
continuity an explicit protocol responsibility.

## Editions and signed Drop quantity

The shared Core can represent a one-of-one, a fixed edition, or a larger
collection by minting distinct ERC-721 tokens into one collection.

That collection capability is distinct from the current signed Drop payload.
`DropAuthorization` contains `quantity`, but
[`StreamDrops._validateAuthorization`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L561-L581)
requires `quantity == 1`. The fixed-price path constructs one-element arrays
and mints one token through
[`_executeFixedPriceDrop`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L609-L632).

An edition can still contain many tokens, but the current signed Drop lane
needs a separate authorization for each one. The manager lane has different
quantity and batch rules. Documentation and interfaces must name the lane and
its actual single-token execution.

## Prepared execution keeps cross-module state atomic

The manager lane crosses policy, counter, identity, and mint state. It therefore
uses a preparation sequence:

1. validate the request and phase policy;
2. consume the required ledger counters;
3. derive a batch operation root and per-token operation IDs;
4. prepare identity in Core;
5. complete the mint in Core;
6. emit execution evidence.

Preparation and completion occur within one transaction. A revert restores all
state atomically. Core also contains a manager-only abort hook for the most
recently prepared allocation; the current `mintPrepared` path uses transaction
rollback.

The required invariant is:

> After any revert, every supply reservation, replay identifier, counter,
> payment credit, and pending token state is either fully committed or fully
> restored.

When policy, accounting, and identity live in different modules, direct calls
still need an explicit atomicity proof across the composition.

## Replay protection needs one durable owner

Core retains lifetime operation-ID replay state and accepts each prepared
operation once.

The current manager derives one batch operation root and distinct token
operation IDs after consuming the ledger. The ledger stores its counters, while
Core retains an unbounded lifetime mapping of prepared-token operation IDs; the
batch root and token operation IDs currently lack one durable joined record.

The proposed repair would make the ledger the durable batch-replay owner and
provide an exact join between ledger accounting and prepared-token events. The
proposal awaits acceptance and implementation. See
[`ADR 0018`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/docs/adr/0018-batch-operation-root-and-token-identity.md#L3-L33).

This is a good example of complexity that should be reduced: one invariant
should have one unambiguous owner.

## Every minted token receives durable identity

On successful allocation, a token receives:

- a global token ID;
- a collection ID;
- a collection-local serial;
- an owner;
- mint history and, where supplied by the selected lane, operation identity;
- the metadata and randomness state required by the collection.

Reviewers should verify event reconstructability separately for each mint lane.
A third party should be able to distinguish a legacy mint from a prepared
manager mint and rebuild collection creation, allocation, transfer, burn, and
finality from public state and events.

## Burning preserves history

Burn removes ERC-721 ownership and ordinary token behavior. Core retains burn
audit reads, and the token ID remains permanently allocated.

That permanence preserves distinct "never minted" and "burned" historical
states. Other modules still need explicit rules for:

- pending randomness;
- unsettled sale or credit state;
- metadata and preservation evidence;
- supply finalization;
- curator or revenue accounting;
- artwork finality;
- offchain indexes.

The repository includes Core burn, randomness, metadata, and supply-invariant
tests. Cross-module burn composition remains a critical review area.

## Mint closure must close every lane

For a collection with at least one mint, `setFinalSupply` lowers the configured
cap to minted-ever supply. The zero-mint case contains a current exception:
`0` also means uninitialized supply to `setCollectionData`, so a function admin
can later set a nonzero cap while the collection remains unfrozen.

There is no separate final-supply flag or final-supply event in the pinned
candidate. A zero-minted, unfrozen collection can therefore be reopened after
`setFinalSupply`. See the line-by-line explanation in
[Freezing, preservation, and artwork finality](./freezing-preservation-and-artwork-finality#final-supply-is-a-supply-promise).

An accepted mint-closure design should prove that:

- finalization is monotonic even when minted-ever supply is zero;
- every phase and executor is closed or exhausted;
- signed Drops and auctions are closed;
- every successor module preserves the final state;
- any required delay has elapsed;
- an event records the final value;
- authorizations prepared before finalization have defined behavior.

## What a simpler design would externalize

Removing the manager, ledger, gates, operation identities, or collection-local
identity moves their requirements into another system, often making a website
responsible for:

- deciding eligibility;
- remembering lifetime limits;
- distinguishing payer from recipient;
- preventing replay;
- coordinating supply across sale paths;
- retaining history through burns and replacements;
- explaining which collection a shared-contract token belongs to.

That may be an acceptable tradeoff for a disposable mint page. It is a much
larger trust assumption for a protocol intended to carry valuable artworks
over decades.

The right simplification test is precise: identify the requirement that can be
dropped, or show a smaller mechanism that preserves it. Complexity that only
duplicates ownership of one invariant should be removed. Complexity that makes
a lasting promise explicit should be judged against the risk it replaces.

## What can fail

- Two mint lanes enforce different supply or replay assumptions.
- Overlapping phases exceed intended supply.
- Payer and recipient counters are confused.
- A gate reenters or returns ambiguous data.
- A manager transaction leaves counters and token state inconsistent.
- A replay identifier is consumed too early or too late.
- Burning restores an allowance unintentionally.
- Manager replacement loses durable limits.
- Final supply is recorded while another mint path remains open.

## Questions for reviewers

1. Which identity and mint invariants must remain in the permanent Core?
2. Are global token IDs plus collection-local serials the right shared identity
   model?
3. Which genesis distribution profiles actually require onchain phases, gates,
   and counters?
4. Do counters handle sponsored mints, transfers, burns, and manager succession
   correctly?
5. Can every partial execution return all affected modules to a clean state?
6. Which single component should own lifetime replay evidence?
7. Is the long-term storage cost of durable counters and operation IDs justified
   by the guarantees they preserve?
8. Does the final launch path remove ambiguity between the legacy and manager
   mint lanes?
