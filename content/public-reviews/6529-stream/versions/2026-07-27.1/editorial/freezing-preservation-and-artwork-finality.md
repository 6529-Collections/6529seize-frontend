# Freezing, preservation, and artwork finality

This review covers an incomplete, undeployed candidate; [Current Implementation and Readiness](./security-testing-and-known-limitations) is the authoritative record of what is connected, implemented, proposed, and still required.

Digital art needs more than one meaning of "finished." No more tokens, no more
Core changes, a preserved set of files, and no remaining artwork mutation path
are different promises. Stream separates them so an artist and collector can
see exactly which promise has been made.

A single `frozen = true` flag is simpler. It can also hide a live mint path,
mutable dependency, replaceable renderer, missing file, or administrative
writer. Stream's layered finality exists to make irreversible claims precise
rather than ceremonial.

## Four completion promises

Stream currently distinguishes:

1. **Final supply** — no more tokens should be mintable for the collection.
2. **Core freeze** — selected collection configuration in the permanent token
   contract can no longer change.
3. **Preservation records** — append-only evidence identifies artwork
   materials, hashes, locations, and context.
4. **Artwork finality** — a delayed terminal ceremony is intended to close the
   remaining artwork-affecting paths for a defined scope.

The relevant implementations include
[`StreamCore.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol),
[`StreamPreservationRecords.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamPreservationRecords.sol),
and
[`StreamArtworkFinalityRegistry.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamArtworkFinalityRegistry.sol).

These mechanisms are complementary. A collection can stop minting while
metadata remains editable. It can freeze Core while later preservation evidence
is still appended. It can commit exact files while the software needed to
execute them remains an external dependency.

## Final supply is a supply promise

For a collection that has minted at least one token, `setFinalSupply` lowers the
configured cap to the number minted so far. Future minting then fails at that
cap. This says nothing about artwork bytes, scripts, or metadata.

The zero-mint case contains a current defect. When no token has ever been
minted, the implementation writes `0` as final supply. The same `0` also means
uninitialized supply to `setCollectionData`. While the collection remains
unfrozen, a function admin can set a new nonzero cap and reopen minting. See
[`setFinalSupply`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L888-L907),
[`_finalizeCollectionSupply`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L1497-L1501),
and
[`setCollectionData`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L377-L408).

There is no separate final-supply flag or event in the pinned candidate. Calling
`setFinalSupply` alone is therefore not irreversible for a zero-minted,
unfrozen collection. Core freeze closes this route, but that is a different
action.

Before final supply can support a permanent promise, the release should prove:

- one monotonic finalized state, including when supply is zero;
- closure or exhaustion of every mint phase and executor;
- defined behavior for signed Drops, auctions, and reservations created before
  finalization;
- an event carrying the final value;
- no successor path that bypasses the final state.

A single cap with a sentinel value is less storage. It also makes "zero
authorized works" indistinguishable from "supply not initialized," which is
exactly the kind of ambiguity a permanent system should avoid.

## Core freeze fixes a defined boundary

Core freeze is one of the protocol's most consequential actions because Core is
intended to preserve token and collection identity.

At the pinned commit, Core freeze:

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

Core freeze does not stop every possible action around the work. The following
remain possible under the pinned behavior:

- ordinary ERC-721 transfers and approvals;
- append-only preservation records;
- post-burn randomness audit evidence for an already burned token;
- collection-metadata snapshot publication if snapshot locks remain open;
- nonreserved record-specific locks;
- shared contract-level metadata changes;
- reads, exports, and historical event reconstruction;
- global module, successor, or governance actions unless a separate terminal
  rule blocks them.

Normal transfer behavior remains open by design. See the
[`transfer posture`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L1008-L1011).
Collection-record revisions check Core freeze, but snapshot publication does
not, and nonreserved record locks remain available. See the
[`metadata mutation checks`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCollectionMetadata.sol#L363-L397).

The product should enumerate this boundary. "Collection frozen" is misleading
if readers infer that shared presentation, preservation history, or every
successor module has also become immutable.

## A freeze manifest gives the boundary one identity

Core stores a hash of its relevant freeze state. That commitment lets another
party compare an independently reconstructed package with the state that was
frozen.

The value is useful only when its preimage is canonical and inspectable.
Reviewers need to know:

- which fields and versions enter the manifest;
- how each value is serialized;
- how live, burned, and unminted tokens affect it;
- which dependency and randomness facts are covered;
- how a human-readable package maps to the hash;
- which mutable surfaces remain outside it.

A generic hash with no reproducible preimage would be shorter to store but would
not tell an artist what they approved or a collector what became fixed.

## Preservation records keep history append-only

[`StreamPreservationRecords`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamPreservationRecords.sol)
can record typed evidence about materials needed to understand or reproduce the
artwork.

A useful record identifies:

- the collection or token scope;
- record type and subject;
- who was authorized to submit it;
- digest algorithm and bytes;
- URI or other location context;
- effective time;
- relationship to prior evidence;
- the exact record hash.

The implementation supports several digest reference types, including
Keccak-256, SHA-256, BLAKE3, multihash, IPFS CID, and Arweave transaction
references. It bounds URI and digest sizes and stores complete records behind
their hashes.

Preservation records remain appendable after Core freeze. An old record is
never overwritten, but a later record can update the
collection/type/subject `latest` pointer. `Latest` means most recently recorded
onchain, not greatest `effectiveAt`.

This allows future conservators to add a new storage location, fixity check, or
format note without pretending that the original final package changed.

It also means "append-only" does not mean "there is one final preservation
record." Readers must distinguish:

- the original package associated with finality;
- later preservation evidence;
- the current latest pointer;
- a record's author and authority class;
- a signature hash from a signature that another verifier actually checked.

The preservation contract stores signature-related hash commitments but does
not itself verify a signature. See
[`IStreamPreservationRecords`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/IStreamPreservationRecords.sol#L106-L126).

## Integrity is not availability

A valid hash answers one question:

> Do the retrieved bytes match the commitment?

It does not:

- recover missing bytes;
- pay storage providers;
- keep a domain or gateway available;
- preserve an RPC service;
- preserve a browser, font, codec, GPU, or JavaScript runtime;
- prove that an external location is independently controlled.

Stream's preservation model is strongest when it states both the onchain
commitment and the operational storage guarantee. Calling a hash "permanent
storage" would collapse two different promises.

## One-of-one materials need token-specific commitments

One-of-one works can have source, media, or authenticity evidence that does not
fit a collection-wide package. The finality design includes token-specific
manifest handling so individual commitments can be bound to the intended token.

That does not make Stream one-of-one-only. Collections and editions remain part
of the shared protocol.

Reviewers should verify that:

- every token requiring an individual manifest is covered;
- a manifest cannot be substituted between token IDs;
- encoding and hashing are unambiguous;
- shared edition materials are not duplicated without need;
- burned and unminted cases are defined.

The current release-artifact model also distinguishes a 1/1 provenance manifest
from a collector-verifiable permanence package. Provenance carries artist,
story, and authenticity context. A permanence package binds renderer,
dependencies, source archives, replay instructions, output hashes, browser
proof, and storage assumptions. Neither artifact should be confused with
ownership, marketplace acceptance, or royalty enforcement.

## Terminal finality is delayed for a reason

Artwork finality is scheduled rather than applied immediately. The delay gives
artists, guardians, reviewers, and independent retrievers time to find:

- a wrong file or manifest;
- an incorrect digest;
- missing dependencies;
- a mismatched collection or token;
- premature artist approval;
- an unaccounted writer;
- a route that cannot actually be reproduced.

The implemented registry supports scheduling, a veto floor, an execution
window, cancellation, expiry, staged manifest bytes, component expectations,
and collection or scoped finality records. See
[`StreamArtworkFinalityRegistry.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamArtworkFinalityRegistry.sol#L39-L81)
and its
[`schedule and finalization entries`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamArtworkFinalityRegistry.sol#L297-L589).

A delay is useful only if reviewers see the exact action that will execute.
The scheduled record must bind the complete payload. Execution must not reread
a mutable value and finalize a different package from the one reviewed during
the waiting period.

The current review evidence does not yet establish complete payload binding and
writer coverage across every terminal path. Finality should not be described as
a proven terminal guarantee until that evidence exists.

## Artist approval must be approval of readable facts

Finality is an artistic decision as well as a protocol transition. The artist's
approval should bind:

- chain and verifying contract;
- collection or token scope;
- exact manifests and component commitments;
- nonce;
- deadline;
- finality action identity.

A vague message or signature over an unexplained hash is not meaningful consent.
The artist should receive a human-readable package whose fields deterministically
produce the signed commitment.

Contract-wallet artists need a documented ERC-1271 path if supported.
Operational recovery matters too: loss of an artist key before finality should
not silently turn the platform administrator into the artist.

The current Core artist approval binds a narrower collection state and is not a
universal veto. The broader relationship among artist approval, Core freeze,
preservation, and terminal finality remains a critical design decision.

## A guardian may stop finality, not author it

The finality source includes a guardian veto during the delay. That role is a
safety brake.

The intended separation is:

- proposal supplies the payload;
- artist approval confirms the artistic commitment;
- guardian veto prevents execution;
- execution applies the already-bound payload;
- expiry closes an abandoned proposal.

A guardian should not replace manifests, substitute components, or choose a new
work. If an action is cancelled or expires, a later attempt should use a new
identifier and fresh approvals. Reusing an old signature would erase the
benefit of the review period.

## Terminal means every effective writer is accounted for

After terminal artwork finality, each artwork-affecting route should either be
impossible or explicitly outside the promise.

The proof needs a selector-level and effect-level inventory covering:

- token and collection metadata writes;
- scripts and token data;
- dependency versions and pointers;
- image and animation locations;
- renderer inputs and attributes;
- randomness provider and final seed;
- preservation records;
- refresh helpers;
- module or renderer successors;
- global paths that can reach the same mutation through another contract.

Testing one function named `setMetadata` is insufficient when another module,
registry, executor, or fallback path can produce the same effect.

Record-family authorization exists in source, but complete candidate evidence
for admitted types, provider addresses, grants, runtime code hashes,
rotation/revocation, and independent review is not available. A terminal
writer-inventory proof must use the actual candidate bindings, not the intended
role diagram.

## Recovery after finality would change the promise

The repository contains a proposal for an append-only recovery companion when a
frozen renderer, dependency, or serving route later fails. It is not accepted
or implemented.

Under that proposal:

- the original finality record remains unchanged;
- Governance V2 is the sole scheduler and executor authority;
- a companion contract appends a separate recovery lineage;
- the record binds scope, predecessor, old route, replacement, manifest, and
  reason;
- changing a route is treated as changing artwork bytes unless a later accepted
  equivalence verifier proves otherwise;
- artist and owner evidence comes from separately owned append-only sources;
- the metadata router serves the recovered route only after exact pointer,
  interface, and route checks.

This may preserve access while changing the bytes a viewer receives. It is not
ordinary maintenance. Community review should address artist consent, owner
notice, guardian veto, objection time, competing recoveries, and whether any
byte-changing recovery should exist.

See
[`ADR 0020 status and blockers`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/docs/adr/0020-executor-only-finality-recovery.md#L3-L24)
and its
[`proposed decision`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/docs/adr/0020-executor-only-finality-recovery.md#L75-L138).

## Irreversible actions deserve separate ceremonies

A single "finalize" button can hide several decisions that deserve independent
inspection.

A safer artist workflow is:

1. confirm maximum and final supply;
2. close every mint path;
3. inspect and freeze Core configuration;
4. retrieve and independently verify preservation materials;
5. inspect collection-wide and one-of-one manifests;
6. compare a human-readable package with the exact signed payload;
7. wait through the review and veto period;
8. execute terminal finality;
9. verify the resulting state through an independent reader.

Each step should produce a machine-readable receipt. The UI should make
irreversibility unmistakable without forcing the artist to decode calldata or
trust a block explorer.

Before production, someone who did not prepare the package should be able to
recover and replay it using only published instructions and commitments.

## What a simpler design would externalize

A freeze flag and one content hash can remove most of this machinery. They also
leave external actors to decide:

- whether all mint paths really closed;
- which metadata fields remained mutable;
- whether the hash covered the intended encoding;
- whether every token-specific artifact was included;
- whether the bytes still exist;
- whether the current browser can execute them;
- whether a replacement renderer changed the work;
- whether the artist approved the exact final state;
- whether an admin path can still mutate it.

That may be enough for a token whose permanent promise is deliberately narrow.
Stream is attempting a stronger promise. Its complexity should be judged by
whether each step makes that promise more exact and verifiable.

The design should still remove duplicate concepts and unbound paths. Layered
finality is valuable only when every layer has one precise meaning.

## What can fail

- Final supply leaves another lane able to mint.
- A broad freeze label hides mutable fields or modules.
- The freeze or finality manifest commits the wrong encoding, scope, or token.
- Required bytes are unavailable despite a valid hash.
- Finality execution rereads values changed after scheduling.
- An old artist approval is replayed for a different action.
- A guardian can author changes instead of only stopping them.
- A metadata, preservation, refresh, governance, or successor path bypasses the
  terminal state.
- A later recovery is presented as preserving the same bytes when it changes
  them.

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
