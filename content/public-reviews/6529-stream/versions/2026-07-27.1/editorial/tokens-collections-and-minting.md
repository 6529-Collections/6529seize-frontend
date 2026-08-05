# Tokens, collections, and minting

This review covers an incomplete, undeployed candidate; [Current Implementation and Readiness](./security-testing-and-known-limitations) is the authoritative record of what is connected, implemented, proposed, and still required.

A minimal ERC-721 can assign a token ID to an owner. Stream is trying to
protect a larger set of facts: which collection the token belongs to, its
serial within that collection, how many works may ever exist, which
distribution policy admitted the mint, which limits were consumed, and what
history remains after a burn or module replacement.

Those protections explain why minting is more than one public function. The
important review question is not whether Stream could use fewer contracts. It
is whether a smaller design would preserve the same identity, supply, replay,
and accounting guarantees—or quietly move them into a website or private
database.

## One permanent identity surface for many collections

The reviewed Core stores a collection record and associates every token with a
collection. Token IDs are globally sequential across the shared ERC-721
contract. The Core also records a collection-local serial, so the same work can
be identified both as a global Stream token and as an item within its own
collection.

This is a deliberate alternative to deploying a separate ERC-721 contract for
every artist or project. It gives all Stream works a common permanent surface
for ownership, approvals, transfers, identity reads, and shared invariants.
Collection identity does not have to be reconstructed from a private index.

The tradeoff is real. A defect or governance failure in the shared Core can
affect many collections, and an artist's collection does not receive its own
ERC-721 contract address. Ethereum has no native subcollection identity
standard, so address-only marketplaces may present one Stream contract rather
than one contract per artist.

The accepted design addresses that presentation problem with Core collection
reads, per-collection metadata, and `properties.stream.collection` fields in
token JSON. Marketplace and indexer support still requires external evidence.
The launch Core contains no dormant facade that can later turn each collection
into a separate ERC-721 address. See the accepted
[`collection identity decision`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/docs/adr/0015-collection-identity-and-facade-readiness.md#L21-L66)
and
[`Core-native-only decision`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/docs/adr/0016-core-native-only-erc721.md#L27-L50).

## Supply is several facts, not one number

Stream distinguishes:

- the configured maximum supply;
- the number of tokens minted over the collection's lifetime;
- the live supply after burns;
- the final supply;
- the remaining capacity of a phase or authorization.

These values answer different questions. Burning a token changes live supply
but does not erase mint history, make its token ID reusable, or necessarily
restore someone's lifetime mint allowance. A collection-level cap does not say
whether an individual phase, wallet, recipient, or signed authorization still
has capacity.

A superficially simpler design can keep only the current token count. That
works until a burn is mistaken for permission to mint again, a replaced minter
forgets prior usage, or two distribution paths each believe they own the same
remaining supply.

## Why mint policy lives outside the Core

The Core should enforce the invariants that every mint path must respect:
token identity, collection identity, supply, freeze state, and non-reuse of
permanent operation identifiers. It should not permanently embed every future
allowlist, claim, sale, airdrop, or eligibility mechanism.

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

The pinned source contains two distinct lanes, and they should not be described
as one integrated flow.

The signed Drop and current auction route call the legacy
[`StreamMinter`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMinter.sol).
That minter applies its own collection time and supply checks before calling
the legacy Core mint entry. It does not consume `StreamMintLedger` counters.

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

Parallel lanes are not themselves a virtue. They are current candidate state
that must be reconciled into one explicit launch path. The lasting design value
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

That structure exists because "eligible to mint" is not one universal rule. A
one-of-one sale, fixed edition, free claim, allowlist, and airdrop can need
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

An extension point is not proof that every imaginable policy is safe. The
genesis release still needs an explicit list of supported and tested profiles.

## Gates carry security inputs, not descriptive metadata

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
rejects a second consumption by that manager. The current manager and ledger
reject every nonempty nullifier array, so this candidate does not yet support
nullifier-backed gates. A `bytes32[]` interface would not provide privacy by
itself in any case.

The gate hash improves auditability, but it does not prove that an offchain
eligibility process was correct. Reviewers still need to trace every external
call, return value, code-hash check, reentrancy boundary, and rollback rule.
Moving code outside the Core does not make it harmless.

See
[`StreamMintModuleRegistry`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMintModuleRegistry.sol#L9-L100)
and
[`IStreamMintGate`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/IStreamMintGate.sol#L6-L29).

## Durable counters survive more than one transaction

`StreamMintLedger` can apply counters to wallets, recipients, tokens, contexts,
or other keys. That flexibility is needed because several apparently similar
limits have different meanings:

- A payer limit is not a recipient limit when sponsored mints are possible.
- A live-balance limit is not a minted-ever limit.
- A burn should not automatically restore a lifetime allowance.
- A reverted mint should not permanently consume capacity.
- Replacing the mint manager should not erase historical usage.

If these counters exist only in a website, users must trust the website to
apply them consistently. If they live only inside one replaceable minter, a
module cutover can reset the policy's memory. A separate durable ledger makes
continuity an explicit protocol responsibility.

## Editions and signed Drop quantity

The shared Core can represent a one-of-one, a fixed edition, or a larger
collection by minting distinct ERC-721 tokens into one collection.

That collection capability must not be confused with the current signed Drop
payload. `DropAuthorization` contains `quantity`, but
[`StreamDrops._validateAuthorization`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L561-L581)
requires `quantity == 1`. The fixed-price path constructs one-element arrays
and mints one token through
[`_executeFixedPriceDrop`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamDrops.sol#L609-L632).

An edition can still contain many tokens, but the current signed Drop lane
needs a separate authorization for each one. The manager lane has different
quantity and batch rules. Documentation and interfaces must name the lane
rather than imply that the signed field currently enables a batch.

## Prepared execution keeps cross-module state atomic

The manager lane crosses policy, counter, identity, and mint state. It therefore
uses a preparation sequence:

1. validate the request and phase policy;
2. consume the required ledger counters;
3. derive a batch operation root and per-token operation IDs;
4. prepare identity in Core;
5. complete the mint in Core;
6. emit execution evidence.

Preparation and completion occur within one transaction. A revert restores the
transaction rather than leaving a long-lived half-mint for a user to complete
later. Core also contains a manager-only abort hook for the most recently
prepared allocation, although the current `mintPrepared` path relies on atomic
transaction rollback rather than calling it.

The required invariant is:

> After any revert, every supply reservation, replay identifier, counter,
> payment credit, and pending token state is either fully committed or fully
> restored.

A direct call may look simpler, but it does not remove this problem when policy,
accounting, and identity live in different modules. It merely makes partial
execution harder to see.

## Replay protection needs one durable owner

Core retains lifetime operation-ID replay state so an old prepared operation
cannot be accepted again.

The current manager derives one batch operation root and distinct token
operation IDs, but it consumes the ledger before deriving that root. The ledger
does not store the root or token operation ID, while Core retains an unbounded
lifetime mapping of prepared-token operation IDs.

The proposed repair would make the ledger the durable batch-replay owner and
provide an exact join between ledger accounting and prepared-token events. It
is not accepted or implemented. See
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

## Burning ends ownership, not history

Burn removes ERC-721 ownership and ordinary token behavior. Core retains burn
audit reads, and the token ID is not minted again.

That permanence matters because "nonexistent" and "burned" are not the same
historical state. Other modules still need explicit rules for:

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
- signed Drops and auctions cannot mint later;
- no successor module can bypass the final state;
- any required delay has elapsed;
- an event records the final value;
- authorizations prepared before finalization have defined behavior.

## What a simpler design would externalize

Removing the manager, ledger, gates, operation identities, or collection-local
identity does not automatically remove the requirements they serve. It can
instead make a website responsible for:

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
