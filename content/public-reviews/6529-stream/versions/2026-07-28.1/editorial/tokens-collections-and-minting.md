# Tokens, collections, and minting

Stream’s minting system gives each artwork a permanent identity while allowing
different distribution rules around it. The permanent Core token contract
records the token and collection. Minting modules decide whether a particular
mint is allowed. Durable accounting is meant to remember limits and prevent
reuse of old operations even when those modules change.

Consider a five-work edition. The first successful mint receives a global Stream
token ID and serial `1` inside the artist’s collection. Later mints receive new
global IDs and collection serials `2` through `5`. If token `2` is burned, its
ownership ends, but its ID, serial, and mint history are not reused. When the
collection closes, no sale path or replacement minter should be able to create a
sixth work.

That simple story requires several facts to agree: collection identity, minted-
ever supply, live supply, phase limits, wallet or recipient limits, replay
state, burn history, and final closure.

## Why minting has more than one component

A minimal ERC-721 can assign a token ID to an owner. Stream is trying to protect
more:

- which collection the token belongs to;
- its serial within that collection;
- how many works may ever exist;
- which distribution policy admitted the mint;
- which limits the mint consumed;
- what history survives a burn or module replacement.

Putting every allowlist, sale, airdrop, gate, and future distribution rule in
the permanent Core would make Core harder to keep small and stable. Keeping all
of those rules in a website would make supply and eligibility depend on a
private database. Stream instead separates permanent identity, replaceable
policy, and durable accounting.

The key security condition is straightforward: no module may exceed Core
supply, rewrite identity, bypass freeze, discard lifetime limits, or replay an
old operation.

## What this protects—and what remains unresolved

The architecture is intended to preserve:

- one permanent identity for every token and collection;
- distinct minted-ever and live-supply histories;
- explicit phase, wallet, recipient, and authorization limits;
- atomic execution across policy, counters, and Core;
- replay evidence that survives module replacement;
- burn history without token-ID reuse.

The pinned candidate does not yet present one clean launch lane. Signed Drops
and the current auction use the legacy minter, while the separately connected
manager and ledger implement the newer phase-and-counter design. Replay
ownership in the manager lane is also split between the ledger and Core, and
zero-mint finalization has a current defect. These are unresolved complexity,
not benefits to defend.

## One permanent identity surface for many collections

The reviewed Core stores many native collections in one shared ERC-721
contract. Token IDs are globally sequential. Core also records a
collection-local serial, so an artwork can be identified both as a global
Stream token and as an item within its artist collection.

This avoids reconstructing collection membership from a private index and gives
all Stream works one permanent surface for ownership, approvals, transfers,
identity reads, and shared invariants.

The tradeoff is real. A Core defect or governance failure can affect many
collections, and an artist’s collection does not receive its own ERC-721
contract address. Ethereum has no native subcollection identity standard, so
address-only marketplaces may show one Stream contract rather than one contract
per artist.

The accepted design addresses presentation through Core collection reads,
per-collection metadata, and `properties.stream.collection` fields in token
JSON. Marketplace and indexer support still needs external evidence. The launch
Core has no dormant facade that can later turn each collection into a separate
ERC-721 address. See the accepted
[`collection identity decision`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/docs/adr/0015-collection-identity-and-facade-readiness.md#L21-L66)
and
[`Core-native-only decision`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/docs/adr/0016-core-native-only-erc721.md#L27-L50).

## Supply is several facts, not one number

Stream distinguishes:

- configured maximum supply;
- tokens minted over the collection’s lifetime;
- live supply after burns;
- final supply;
- remaining capacity in a phase or authorization.

These answer different questions. Burning changes live supply, but it does not
erase mint history, make a token ID reusable, or necessarily restore a lifetime
mint allowance. A collection cap does not reveal whether a phase, wallet,
recipient, or signed authorization still has capacity.

A design that stores only the current token count is shorter until a burn is
mistaken for permission to mint again, a new minter forgets earlier usage, or
two distribution paths each believe they own the same remaining supply.

## Why mint policy lives outside the Core

Core should enforce rules every mint path must respect: token and collection
identity, supply, freeze state, and non-reuse of permanent operation IDs. It
should not permanently embed every future eligibility mechanism.

The newer manager-and-ledger design separates:

- **Core**, which allocates and records permanent token identity;
- **StreamMintManager**, which applies phase and execution policy;
- **StreamMintLedger**, which retains durable usage and replay accounting;
- **executors**, which drive approved mint paths; and
- **gates**, which evaluate additional eligibility policy.

This lets distribution methods evolve without changing what an existing token
is. It is deliberate modularity, but only if the boundaries remain coherent.

## The two source mint lanes

The pinned source contains two different lanes. They are not one integrated
flow.

The signed Drop and current auction route use the legacy
[`StreamMinter`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMinter.sol).
It applies its own collection time and supply checks before calling the legacy
Core mint entry. It does not consume `StreamMintLedger` counters.

The separately deployed
[`StreamMintManager`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMintManager.sol)
and
[`StreamMintLedger`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMintLedger.sol)
implement phases, gates, policy hashes, durable counters, and prepared Core
execution. The rehearsal installs the manager in Core and authorizes it as a
ledger writer, but still gives the legacy minter to `StreamDrops`.

The difference is visible in
[`StreamDrops._executeFixedPriceDrop`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L609-L632),
[`StreamMinter.mint`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMinter.sol#L130-L175),
[`StreamMintManager.mintPrepared`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMintManager.sol#L241-L299),
and the
[`rehearsal wiring`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/script/RehearseDeployment.s.sol#L218-L269).

Parallel lanes are current candidate state that must be reconciled into one
explicit launch path. The lasting design value is the separation between
permanent identity and replaceable distribution policy—not the duplication.

## Phases make distribution policy inspectable

A manager phase can bind:

- collection and phase identity;
- opening and closing time;
- maximum phase supply;
- per-wallet, per-recipient, or other scoped limits;
- an executor and optional gate;
- a policy hash;
- whether the phase is paused;
- counters consumed by each mint.

“Eligible to mint” is not one universal rule. A one-of-one sale, fixed edition,
free claim, allowlist, and airdrop can need different timing and accounting
without changing ERC-721 Core.

Before a user acts, the public view should show the phase identifier and
collection, time window, maximum supply, scoped limits, executor, optional gate,
burn and transfer effects on counters, edit and pause authority, and what
happens to pending work when the phase closes.

An extension point is not proof that every possible policy is safe. Genesis
still needs an explicit list of supported and tested distribution profiles.

## Gates carry security inputs, not descriptive metadata

An active gate registration binds lifecycle status, interface ID, semantic
version, runtime code hash, metadata hash, and a per-call gas limit. The
registry rechecks active status, interface support, and code identity.

A gate result can include:

- an **authorization ID**, intended as a one-use identifier;
- **nullifiers**, intended as domain-separated replay keys;
- an **authorizer**, whose identity or entitlement was accepted;
- a **maximum quantity**;
- a **gate hash** committing to the result and policy context.

The current ledger scopes an authorization ID to the calling mint manager and
rejects a second consumption by that manager. The current manager and ledger
reject every nonempty nullifier array, so this candidate does not yet support
nullifier-backed gates. A `bytes32[]` interface would not provide privacy by
itself.

The gate hash improves auditability but does not prove that an offchain
eligibility process was correct. Reviewers must still trace external calls,
return values, code-hash checks, reentrancy boundaries, and rollback. Moving
code outside Core does not make it harmless.

See
[`StreamMintModuleRegistry`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMintModuleRegistry.sol#L9-L100)
and
[`IStreamMintGate`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/IStreamMintGate.sol#L6-L29).

## Durable counters survive more than one transaction

`StreamMintLedger` can apply counters to wallets, recipients, tokens, contexts,
or other keys. The distinctions matter:

- A payer limit is not a recipient limit when sponsored mints are possible.
- A live-balance limit is not a minted-ever limit.
- A burn should not automatically restore a lifetime allowance.
- A reverted mint should not permanently consume capacity.
- Replacing the mint manager should not erase historical usage.

Website-only counters require trust that the website applies them consistently.
Counters stored only in one replaceable minter can reset during cutover. A
separate durable ledger makes continuity an explicit protocol responsibility.

## Prepared execution keeps cross-module state atomic

The manager lane crosses policy, counters, identity, and mint state. It uses this
sequence:

1. validate the request and phase policy;
2. consume the required ledger counters;
3. derive a batch operation root and per-token operation IDs;
4. prepare identity in Core;
5. complete the mint in Core;
6. emit execution evidence.

Preparation and completion happen in one transaction. A revert rolls back the
transaction instead of leaving a long-lived half-mint. Core also has a
manager-only abort hook for the most recently prepared allocation, although
current `mintPrepared` relies on atomic rollback rather than calling it.

The invariant is:

> After any revert, every supply reservation, replay identifier, counter,
> payment credit, and pending token state is either fully committed or fully
> restored.

A direct call does not remove this coordination problem when policy, accounting,
and identity live in different modules. It can only make partial execution
harder to see.

## Replay protection needs one durable owner

Core retains lifetime operation-ID replay state so an old prepared operation
cannot be accepted again.

The current manager derives one batch operation root and distinct token
operation IDs, but consumes the ledger before deriving that root. The ledger
does not store the root or token operation ID, while Core retains an unbounded
lifetime mapping of prepared-token operation IDs.

A proposed repair would make the ledger the durable batch-replay owner and
provide an exact join between ledger accounting and prepared-token events. It
is not accepted or implemented. See
[`ADR 0018`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/docs/adr/0018-batch-operation-root-and-token-identity.md#L3-L33).

This is complexity to reduce: one invariant should have one unambiguous owner.

## Editions and signed Drop quantity

Shared Core can represent a one-of-one, fixed edition, or larger collection by
minting distinct ERC-721 tokens into one collection.

That does not make the current signed Drop a batch path. `DropAuthorization`
contains `quantity`, but
[`StreamDrops._validateAuthorization`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L561-L581)
requires `quantity == 1`. The fixed-price path builds one-element arrays and
mints one token through
[`_executeFixedPriceDrop`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L609-L632).

An edition can still have many tokens, but this lane needs one authorization per
token. The manager lane has different quantity and batch rules. Documentation
and interfaces must name the lane instead of implying that the signed field
currently enables a batch.

## Every minted token receives durable identity

On successful allocation, a token receives:

- a global token ID;
- a collection ID;
- a collection-local serial;
- an owner;
- mint history and, where supplied by the selected lane, operation identity;
- metadata and randomness state required by the collection.

Event reconstruction must be checked separately for each mint lane. A third
party should be able to distinguish a legacy mint from a prepared manager mint
and rebuild collection creation, allocation, transfer, burn, and finality from
public state and events.

## Burning ends ownership, not history

Burn removes ERC-721 ownership and ordinary token behavior. Core retains burn
audit reads, and the token ID is never minted again.

“Nonexistent” and “burned” are therefore different historical states. Other
modules still need explicit rules for pending randomness, unsettled sale or
credit state, metadata and preservation evidence, supply finalization, curator
or revenue accounting, artwork finality, and offchain indexes.

The repository includes Core burn, randomness, metadata, and supply-invariant
tests. Cross-module burn composition remains a critical review area.

## Mint closure must close every lane

For a collection with at least one mint, `setFinalSupply` lowers the configured
cap to minted-ever supply. The zero-mint case has a current defect: `0` also
means uninitialized supply to `setCollectionData`, so a function administrator
can later set a nonzero cap while the collection remains unfrozen.

There is no separate final-supply flag or event in the pinned candidate. A
zero-minted, unfrozen collection can therefore reopen after `setFinalSupply`.
See [Freezing, preservation, and artwork
finality](./freezing-preservation-and-artwork-finality#final-supply-is-a-supply-promise).

Any closure repair should prove that:

- finalization is monotonic even when minted-ever supply is zero;
- every phase and executor is closed or exhausted;
- signed Drops and auctions cannot mint later;
- no successor module can bypass the final state;
- any required delay has elapsed;
- an event records the final value;
- authorizations prepared before finalization have defined behavior.

## What a simpler design would externalize

Removing the manager, ledger, gates, operation IDs, or collection-local identity
does not automatically remove the requirements. It can make a website
responsible for deciding eligibility, remembering lifetime limits,
distinguishing payer from recipient, preventing replay, coordinating supply
across sales, retaining burn and replacement history, and explaining which
collection a shared-contract token belongs to.

That tradeoff may be acceptable for a disposable mint page. It is a larger
trust assumption for a protocol intended to carry valuable artworks for
decades.

The right simplification test is precise: identify the requirement that can be
dropped, or show a smaller mechanism that preserves it. Complexity that
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
