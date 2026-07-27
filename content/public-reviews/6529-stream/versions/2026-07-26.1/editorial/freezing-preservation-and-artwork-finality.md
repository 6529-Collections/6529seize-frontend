# Freezing, preservation, and artwork finality

Stream has several ways to say that something is complete. They are not
interchangeable.

- **Final supply** means no more tokens may be minted for a collection.
- **Core freeze** fixes selected collection configuration in the permanent
  token contract.
- **Preservation records** commit evidence about artwork materials.
- **Artwork finality** is a terminal, scheduled ceremony intended to close the
  remaining artwork mutation paths.

The relevant implementations include
[`StreamCore.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol),
[`StreamPreservationRecords.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamPreservationRecords.sol),
and
[`StreamArtworkFinalityRegistry.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamArtworkFinalityRegistry.sol).

The Core and preservation contracts are part of the current rehearsal.
`StreamArtworkFinalityRegistry` is **SOURCE IMPLEMENTED**, but it is not in the
rehearsal's deployed contract set. Its source is not candidate wiring evidence.

## Final supply

### IMPLEMENTED

Finalizing supply closes future minting for the collection. It is about token
count, not about artwork bytes.

A collection can have final supply while its metadata or scripts remain
editable. Conversely, an artwork could be considered complete before every
authorized token has been minted. The UI needs to show those states separately.

Supply finalization should be irreversible and should compose with pending
signed mints, auctions, reservations, and burns. Reviewers should establish
what happens to an authorization created before final supply but submitted
after it.

## Core freeze

### IMPLEMENTED

The Core can freeze collection configuration. Because the Core is intended to
be permanent, its freeze boundary is one of the most consequential parts of the
protocol.

The exact fields matter. A generic “collection frozen” label is misleading if
some of these can still move:

- metadata renderer or URI mode;
- script or dependency configuration;
- randomness provider;
- mint policy;
- revenue profile;
- royalty information;
- successor module pointers;
- collection presentation metadata.

The contract and UI should enumerate the frozen fields and the remaining
writers.

### Exact Core-freeze boundary at this commit

| Blocked after Core freeze                        | Still possible after Core freeze                                                                     |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Legacy and manager mint entries                  | Ordinary ERC-721 transfers and approvals                                                             |
| Burning a live token                             | Append-only preservation records                                                                     |
| Changing the collection randomizer               | Shared contract-level metadata changes                                                               |
| Changing artist approval                         | Post-burn randomness audit evidence for an already burned token                                      |
| Changing token data, images, or attributes       | Collection-metadata snapshot publication if the snapshot locks remain open                           |
| Creating or revising collection-metadata records | Nonreserved record-specific locks                                                                    |
| Reserved collection-metadata lock changes        | Reads, exports, and historical event reconstruction                                                  |
|                                                  | Global module, successor, or governance actions unless a separate terminal-finality rule blocks them |

Core freeze finalizes supply and stores a freeze-manifest hash
([`freezeCollection`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L826-L841)).
Minting, burn, artist approval, and live-token metadata mutation check that
freeze
([`mint entries`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L445-L503),
[`burn`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L628-L640),
[`artist approval`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L734-L761)).
Normal ERC-721 transfer behavior remains open
([`transfer posture`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L1008-L1011)).

Collection-metadata record revisions check Core freeze, but snapshot publication
does not. Reserved lock changes are blocked after freeze; nonreserved
record-specific locks remain available
([`metadata mutation checks`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCollectionMetadata.sol#L363-L397)).

Core freeze is therefore not the same as terminal artwork finality. It closes a
defined collection boundary; it does not automatically freeze every shared or
successor module.

## Preservation records

### IMPLEMENTED

Preservation records let the protocol commit information about materials needed
to understand or reproduce the artwork. Records may include hashes, locations,
manifests, or other typed evidence.

These records are valuable because they can preserve a verifiable history even
when the bytes themselves are stored elsewhere. They should answer:

- what artifact is being described;
- which exact collection or token it applies to;
- who submitted or approved it;
- which bytes were hashed and by which algorithm;
- where those bytes were expected to be found;
- whether the record replaces, supplements, or deprecates another record;
- whether the record can still change.

### Append-only does not mean one final record

Preservation records intentionally remain appendable after Core freeze. An old
record is never overwritten, but a new record can update the
collection/type/subject `latest` pointer. `Latest` means last recorded onchain,
not greatest `effectiveAt`.

The signature fields are hash commitments only. The preservation contract does
not verify a signature. A reader must distinguish:

- the original final package;
- later preservation evidence;
- the current latest pointer;
- a signature hash from a signature that another verifier has actually checked.

These semantics are explicit in
[`IStreamPreservationRecords`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/IStreamPreservationRecords.sol#L106-L126).

### IMPORTANT LIMIT

A hash is a commitment, not a storage system. It proves equality if the bytes
are available. It does not recover missing bytes, pay storage providers, keep a
domain registered, or preserve the software needed to execute the work.

## One-of-one manifests

One-of-one tokens can have token-specific materials that do not fit a
collection-wide manifest. The finality design includes one-of-one manifest
handling so the ceremony can account for those individual commitments.

That does not make Stream a one-of-one-only contract. Editions and other
collection structures remain part of the shared protocol.

Reviewers should verify that:

- every token that requires an individual manifest is covered;
- a manifest cannot be substituted between token IDs;
- the manifest's encoding and hash are unambiguous;
- an edition's shared artifacts are not needlessly duplicated;
- burned and unminted token cases are defined.

## Scheduling artwork finality

### IMPLEMENTED WITH CONSTRAINTS

Artwork finality is scheduled rather than executed immediately. A delay creates
time to discover a bad manifest, missing artifact, incorrect hash, or premature
approval before the action becomes terminal.

This label covers the scheduling and delay mechanism. It does not establish
that every field required for terminal finality is already bound through every
writer and execution path.

### EVIDENCE PENDING — TERMINAL GUARANTEE

For finality to be accepted as terminal, the scheduled record must bind the
complete intended action. Execution must not reread mutable values and finalize
a different package from the one that was reviewed during the delay. That
complete payload-binding and writer-inventory proof is not yet part of the
review evidence.

The evidence must show:

1. who proposed finality;
2. the collection and exact manifest commitments;
3. the scheduled execution time and expiry;
4. any required artist approval;
5. a guardian veto or cancellation;
6. terminal execution or expiry.

## Artist approval

Finality represents an artistic decision as well as a protocol action. The
artist's approval should be bound to the exact finality payload, chain,
contract, collection, nonce, and deadline. A general-purpose signature or an
approval for a prior draft must not be reusable.

Contract-wallet artists need a documented ERC-1271 or equivalent path if they
are supported. Operational recovery also matters: losing an artist key before
finality must not silently transfer artistic authority to a platform
administrator.

## Guardian veto and cancellation

### IMPLEMENTED

A guardian can stop a suspicious scheduled action during its delay. This is a
safety brake, not a power to author new artwork commitments.

The distinction should remain crisp:

- proposal supplies the intended payload;
- artist approval confirms the artistic payload;
- guardian veto prevents execution;
- execution applies the already-bound payload;
- expiry closes an abandoned proposal.

If an action is cancelled or expires, a later attempt should have a new
identifier and fresh approvals. Reusing an old signature can erase the value of
the delay.

## Terminal state

After finality, every artwork-affecting route should either be impossible or be
explicitly outside the finality promise.

Reviewers need a selector-level inventory covering:

- token and collection metadata writes;
- scripts and script data;
- dependency version or pointer changes;
- image and animation locations;
- attributes used by the renderer;
- randomness provider and fulfilled seed;
- preservation records;
- ERC-4906 refresh helpers;
- module successor or renderer changes.

Testing one public “set metadata” function is not enough if another module or
fallback path can reach the same storage effect.

### KNOWN LIMITATION

Record-family authorization is now source implemented. The remaining blocker is
candidate-bound evidence: exact admissions, live providers, grants, deployed
runtime/code-hash bindings, rotation/revocation evidence, and independent
review. Finality cannot rely on an intended writer matrix until those bindings
are published and every effective mutation path is included in the terminal
inventory.

## Proposed append-only finality recovery

### PROPOSED

The repository contains a proposal for a recovery companion if a frozen
renderer, dependency, or serving route later fails. It is not accepted or
implemented.

Under the proposal:

- the original permanent finality registry and record never change;
- Governance V2 is the only scheduler and executor authority;
- a separate companion appends a recovery record and maintains a separate
  lineage;
- the replacement commits the exact scope, predecessor, old route, replacement
  component, manifest, and reason;
- every route replacement is treated as changing artwork bytes unless a future
  accepted equivalence verifier proves otherwise;
- artist and owner evidence is read from separately owned append-only sources;
- the metadata router would serve the recovered route only after exact pointer,
  interface, and route checks.

This proposal can preserve access while changing the bytes that a viewer is
served. Community feedback should address artist consent, owner notice,
guardian veto, objection time, stale competing recoveries, and whether any
byte-changing recovery should exist.

See
[`ADR 0020 status and blockers`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/docs/adr/0020-executor-only-finality-recovery.md#L3-L24)
and its
[`proposed decision`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/docs/adr/0020-executor-only-finality-recovery.md#L75-L138).

## Separate ceremonies

The protocol should avoid a single button that hides several irreversible
decisions. A safer artist workflow presents separate, explicit checkpoints:

1. confirm the intended maximum and final supply;
2. inspect and freeze Core configuration;
3. upload, retrieve, and independently verify preservation materials;
4. inspect every collection and one-of-one manifest;
5. sign the exact artwork-finality payload;
6. wait through the review period;
7. execute and verify the terminal state from a separate reader.

The final UI should make irreversible actions unmistakable and provide a
machine-readable receipt.

## EVIDENCE PENDING

The repository includes code and local artifacts for preservation and finality.
It does not yet provide complete deployed evidence that every artifact can be
retrieved from independent locations and reproduced with non-local tooling.

Before production, the final package should be recovered by someone who did not
prepare it, using only the published instructions and commitments.

## What we think

Finality should be proven by the absence of mutation paths, not declared by a
label. The protocol should publish the exact selector inventory used to support
the claim and rerun it on the release commit.

Artists should get a calm, staged ceremony with readable payloads. Collectors
should get an exact statement of what is final and what external systems remain
necessary.

## What can fail

- final supply leaves a pending path that still mints;
- a broad freeze label hides fields that remain mutable;
- a manifest hash covers the wrong encoding or token;
- required bytes are unavailable despite a valid hash;
- finality execution reads values that changed after scheduling;
- an old artist approval is replayed on a new proposal;
- a guardian can replace rather than only veto a payload;
- a metadata, preservation, or successor selector bypasses terminal state.

## Questions for reviewers

1. Which facts should final supply, Core freeze, and artwork finality each
   guarantee?
2. Is the finality delay long enough for independent recovery of every
   artifact?
3. Should artist approval be mandatory for every collection?
4. Does the terminal-state selector inventory cover every effective writer?
5. Which preservation locations should be required rather than optional?
6. What receipt would let an artist or collector independently verify finality?
