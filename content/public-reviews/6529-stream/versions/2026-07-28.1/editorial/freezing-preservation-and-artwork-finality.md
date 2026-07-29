# Freezing, preservation, and artwork finality

The reviewed Solidity separates "finished" into four mechanisms: final supply,
a selected configuration freeze in `StreamCore`—called Core here—the permanent
token and collection identity contract, append-only preservation records, and a
delayed artwork-finality registry. Each protects a different boundary; complete
terminal closure is not yet proven for a candidate.

Those are different promises. Combining them into one `frozen = true` flag
would be shorter, but could hide a live mint route, mutable dependency,
replaceable renderer, missing file, or administrative writer. The layers exist
so an artist and collector can tell exactly what became irreversible.

## The closing flow at a glance

A careful close proceeds in this order:

1. Confirm the number of works that may exist and close every mint lane.
2. Build a reproducible manifest—a machine-readable inventory—of the collection
   state, then freeze the defined Core boundary.
3. Publish append-only preservation records for the artwork materials, their
   hashes, locations, and context.
4. Build collection-wide and, where needed, token-specific finality manifests.
5. Bind artist approval to the exact human-readable payload.
6. Schedule terminal finality, wait through the review and veto period, and
   cancel or let the action expire if the package is wrong.
7. Execute only the payload that was reviewed.
8. Have an independent reader verify the terminal state and recover the
   preservation package from published instructions.

## Four completion promises

Stream distinguishes:

1. **Final supply** — no more tokens should be mintable for the collection.
2. **Core freeze** — selected collection configuration in the permanent token
   contract can no longer change.
3. **Preservation records** — append-only evidence identifies artwork
   materials, hashes, locations, and context.
4. **Artwork finality** — a delayed terminal action is intended to close the
   remaining artwork-affecting paths for a defined scope.

The relevant source contracts include
[`StreamCore.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol),
[`StreamPreservationRecords.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamPreservationRecords.sol),
and
[`StreamArtworkFinalityRegistry.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamArtworkFinalityRegistry.sol).

The promises complement rather than replace one another. Minting can stop while
metadata remains editable. Core can freeze while preservation evidence
continues to grow. Exact file hashes can exist while the software or service
needed to retrieve and run those files disappears.

## Why the layers exist

A single flag and content hash would leave external actors to answer:

- Did every mint path actually close?
- Which metadata and module fields remained mutable?
- Which exact encoding did the hash cover?
- Was every token-specific artifact included?
- Are the committed bytes still available?
- Can a current browser execute them?
- Did a replacement renderer change the work?
- Did the artist approve this exact terminal state?
- Can another administrative path still mutate it?

A deliberately narrow token may accept those external assumptions. Stream's
source is attempting a stronger, independently verifiable artwork promise. The
added machinery is justified only when each layer has one precise meaning and
no unbound path can bypass it.

## Final supply is a supply promise

When a collection has minted at least one token, `setFinalSupply` lowers its cap
to the number already minted. Future minting then fails at that cap. This action
says nothing about artwork bytes, scripts, or metadata.

There is a defect in the zero-mint case. With no minted token,
`setFinalSupply` stores `0`. `setCollectionData` also interprets `0` as
uninitialized supply. While the collection remains unfrozen, a function admin
can set a new nonzero cap and reopen minting. See
[`setFinalSupply`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L888-L907),
[`_finalizeCollectionSupply`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L1497-L1501),
and
[`setCollectionData`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L377-L408).

There is no separate final-supply flag or event in the pinned candidate.
Calling `setFinalSupply` alone is therefore not irreversible for a zero-minted,
unfrozen collection. Core freeze closes that route, but Core freeze is a
different promise.

A durable supply close must prove:

- one monotonic finalized state, including zero supply;
- closure or exhaustion of every mint phase and executor;
- defined handling of authorizations, auctions, and reservations created
  before finalization;
- an event carrying the final value;
- no successor route that bypasses the final state.

Using one sentinel saves storage but makes "zero authorized works"
indistinguishable from "supply not initialized." A permanent promise should not
depend on that ambiguity.

## Core freeze fixes a defined boundary

Core freeze is consequential because Core is intended to preserve token and
collection identity. At the pinned commit, it:

- finalizes supply;
- stores a freeze-manifest hash;
- blocks legacy and manager mint entries;
- blocks burning live tokens;
- blocks changing the collection randomizer;
- blocks artist-approval changes;
- blocks token-data, image, and attribute changes;
- blocks new or revised collection-metadata records;
- blocks reserved collection-metadata lock changes.

See
[`freezeCollection`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L826-L841),
the
[`mint entries`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L445-L503),
[`burn`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L628-L640),
and
[`artist approval`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L734-L761).

Core freeze deliberately does not stop everything. It leaves:

- ordinary ERC-721 transfers and approvals;
- append-only preservation records;
- post-burn randomness audit evidence for an already burned token;
- collection-metadata snapshot publication if snapshot locks remain open;
- nonreserved record-specific locks;
- shared contract-level metadata changes;
- reads, exports, and historical event reconstruction;
- global module, successor, or governance actions unless another terminal rule
  blocks them.

The ordinary transfer posture is visible
[`in Core`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L1008-L1011).
Collection-record revisions check Core freeze, while snapshot publication does
not and nonreserved record locks remain available. See the
[`metadata mutation checks`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCollectionMetadata.sol#L363-L397).

The product must enumerate this boundary. "Collection frozen" is misleading if
readers infer that presentation, preservation history, and every successor
module are immutable too.

## A freeze manifest gives the boundary one identity

Core stores a hash of the relevant freeze state. Another party can compare an
independently reconstructed package with the state that was actually frozen.

That hash is useful only when its preimage is canonical and inspectable.
Reviewers need to know which fields and versions enter it, how values are
serialized, how live, burned, and unminted tokens are handled, which dependency
and randomness facts are covered, how a readable package maps to the hash, and
which mutable surfaces remain outside it.

A generic hash with no reproducible preimage does not tell an artist what was
approved or a collector what became fixed.

## Preservation records keep history append-only

[`StreamPreservationRecords`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamPreservationRecords.sol)
records typed evidence about materials needed to understand or reproduce a
work. A useful record identifies:

- collection or token scope;
- record type and subject;
- the authorized submitter;
- digest algorithm and bytes;
- URI or location context;
- effective time;
- relationship to earlier evidence;
- exact record hash.

The contract supports Keccak-256, SHA-256, BLAKE3, multihash, IPFS CID, and
Arweave transaction references. It bounds URI and digest sizes and stores
complete records behind their hashes.

Records remain appendable after Core freeze. An old record is never overwritten,
but a later record can move the collection/type/subject `latest` pointer.
`Latest` means most recently recorded onchain, not greatest `effectiveAt`.

This lets conservators add a storage location, fixity check, or format note
without claiming that the original final package changed. It also means
"append-only" does not mean "one final preservation record." Readers must
distinguish:

- the package associated with finality;
- later preservation evidence;
- the current latest pointer;
- each record's author and authority class;
- a signature hash from a signature independently verified elsewhere.

The preservation contract stores signature-related commitments but does not
verify a signature itself. See
[`IStreamPreservationRecords`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/IStreamPreservationRecords.sol#L106-L126).

## Integrity is not availability

A valid hash proves that retrieved bytes match a commitment. It does not:

- recover missing bytes;
- pay storage providers;
- keep a domain or gateway online;
- preserve an RPC service;
- preserve a browser, font, codec, GPU, or JavaScript runtime;
- prove that an external location is independently controlled.

The preservation promise should state both the onchain integrity commitment and
the operational availability guarantee. A hash is not "permanent storage."

## One-of-one materials need token-specific commitments

A one-of-one work may have source, media, or authenticity evidence that does
not fit a collection-wide package. The finality design therefore includes
token-specific manifest handling.

Reviewers should prove that every token needing an individual manifest is
covered, one token's manifest cannot substitute for another's, encoding and
hashing are unambiguous, shared edition materials are not duplicated without
need, and burned and unminted cases are defined.

This does not make Stream one-of-one-only; editions remain part of the shared
protocol.

The release artifacts also distinguish a 1/1 provenance manifest from a
collector-verifiable permanence package. Provenance carries artist, story, and
authenticity context. A permanence package binds renderer, dependencies, source
archives, replay instructions, output hashes, browser proof, and storage
assumptions. Neither proves ownership, marketplace acceptance, or royalty
enforcement.

## Terminal finality is delayed for a reason

Artwork finality is scheduled rather than immediate. The delay gives artists,
guardians, reviewers, and independent retrievers time to find:

- a wrong file, digest, manifest, collection, or token;
- missing dependencies;
- premature artist approval;
- an unaccounted writer;
- a route that cannot be reproduced.

The source registry supports scheduling, a veto floor, execution window,
cancellation, expiry, staged manifest bytes, component expectations, and
collection or scoped finality records. See
[`StreamArtworkFinalityRegistry.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamArtworkFinalityRegistry.sol#L39-L81)
and its
[`schedule and finalization entries`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamArtworkFinalityRegistry.sol#L297-L589).

A delay protects only the payload that reviewers can see. The scheduled record
must bind the complete action, and execution must not reread a mutable value and
finalize something different.

Without complete payload binding and writer coverage across every terminal
path, scheduling and veto code alone are not proof of a terminal guarantee.

## Artist approval must cover readable facts

Finality is an artistic decision and a protocol transition. The artist's
approval should bind:

- chain and verifying contract;
- collection or token scope;
- exact manifests and component commitments;
- nonce and deadline;
- finality action identity.

A signature over an unexplained hash is not meaningful consent. The artist
needs a readable package whose fields deterministically produce the signed
commitment.

If contract-wallet artists are supported, they need a documented ERC-1271 path.
Key-loss recovery also needs an explicit rule; losing an artist key should not
quietly make the platform administrator the artist.

Core's current artist approval binds a narrower collection state and is not a
universal veto. The relationship among artist approval, Core freeze,
preservation, and terminal finality remains a critical design decision.

## A guardian may stop finality, not author it

The guardian veto is a safety brake:

- the proposal supplies the payload;
- artist approval confirms the artistic commitment;
- the guardian may stop execution;
- execution applies the already-bound payload;
- expiry closes an abandoned proposal.

A guardian should not replace manifests, substitute components, or choose a new
work. A cancelled or expired action should require a new identifier and fresh
approvals; reusing an old signature would defeat the review period.

## Terminal means every effective writer is accounted for

After terminal artwork finality, each artwork-affecting path must be impossible
or explicitly outside the promise. The selector- and effect-level inventory
must cover:

- token and collection metadata writes;
- scripts, token data, images, animation, and attributes;
- dependency versions and pointers;
- renderer inputs;
- randomizer provider and final seed;
- preservation records and refresh helpers;
- module or renderer successors;
- global routes that reach the same mutation through another contract.

Testing a function named `setMetadata` is not enough if a module, registry,
executor, or fallback path can produce the same effect.

Record-family authorization exists in source, but it identifies the real writer
set only when admitted types, provider addresses, grants, runtime code hashes,
rotation, and revocation are bound and independently reviewed. A terminal
writer-inventory proof must use those candidate bindings, not an intended role
diagram.

## Recovery after finality would change the promise

The repository contains a proposal for an append-only recovery companion when a
frozen renderer, dependency, or serving route later fails. It is neither
accepted nor implemented.

The proposal would keep the original finality record unchanged, make Governance
V2 the sole scheduler and executor, append a separate recovery lineage, and
bind scope, predecessor, old route, replacement, manifest, and reason. A route
change would count as changing artwork bytes unless a later accepted
equivalence verifier proved otherwise. Artist and owner evidence would come
from independently owned append-only sources, and a metadata router would serve
the recovery only after exact pointer, interface, and route checks.

That may restore access while changing what viewers receive. It is not routine
maintenance. Review must address artist consent, owner notice, guardian veto,
objection time, competing recoveries, and whether any byte-changing recovery
should exist.

See
[`ADR 0020 status and blockers`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/docs/adr/0020-executor-only-finality-recovery.md#L3-L24)
and its
[`proposed decision`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/docs/adr/0020-executor-only-finality-recovery.md#L75-L138).

## Irreversible actions deserve separate ceremonies

An artist-facing workflow should make each irreversible choice explicit:

1. confirm maximum and final supply;
2. close every mint path;
3. inspect and freeze Core configuration;
4. retrieve and independently verify preservation materials;
5. inspect collection-wide and one-of-one manifests;
6. compare the readable package with the signed payload;
7. wait through the review and veto period;
8. execute terminal finality;
9. verify the result through an independent reader.

Each step should produce a machine-readable receipt. An artist should not need
to decode calldata or trust a block explorer to understand the consequence.
The ceremony is not complete until someone who did not prepare the package
recovers and replays it using only published instructions and commitments.

## What can still fail

- Final supply leaves another mint lane open.
- A broad freeze label hides mutable fields or modules.
- A freeze or finality manifest binds the wrong encoding, scope, or token.
- Required bytes disappear despite a valid hash.
- Finality execution rereads values changed after scheduling.
- An old artist approval is replayed for another action.
- A guardian can shape the payload instead of only vetoing it.
- A metadata, preservation, refresh, governance, or successor route bypasses
  terminal state.
- A later recovery changes the bytes but is presented as preserving them.

## Questions for reviewers

1. Are final supply, Core freeze, preservation, and artwork finality each
   defined narrowly enough to verify?
2. Does mint closure cover every current and successor lane, including the
   zero-mint case?
3. Which exact Core and satellite fields enter each manifest?
4. Is the finality delay long enough for independent retrieval and replay?
5. Should current artist approval be expanded, or should terminal finality use
   a separate exact artist signature?
6. Can a guardian only veto, or can any path let it shape the final payload?
7. Does the terminal writer inventory include every indirect mutation route?
8. Which independent storage locations and runtime artifacts are mandatory?
9. What receipt lets an artist and collector verify the terminal state without
   trusting the current website?
10. Should any byte-changing recovery exist after finality, and what evidence
    would distinguish recovery from replacement?
