export const PUBLIC_REVIEW_FREEZING_FINALITY_MESSAGES = {
  "publicReview.pages.freezingPreservationAndArtworkFinality.currentSummary":
    "How Stream separately closes minting, freezes Core state, records preservation evidence, and handles delayed artwork finality.",
  "publicReview.pages.freezingPreservationAndArtworkFinality.currentEditorial": `# Freezing, preservation, and artwork finality

## The answer in one minute

Stream does not have one button that makes an artwork "finished." It has four separate promises:

1. **Final supply:** minting should stop.
2. **Core freeze:** a defined set of permanent token and collection data stops changing.
3. **Preservation records:** approved writers can keep adding evidence about artwork files and how to find them.
4. **Artwork finality:** a delayed action can make a defined artwork record final.

These promises are not interchangeable. Final supply does not freeze metadata. Core freeze does not keep files online. A preservation hash proves that retrieved bytes match; it does not make those bytes available. The finality registry contains scheduling and execution code, but this review does not yet prove that every artwork-changing path is covered.

This page describes the code at [the pinned source commit](https://github.com/{sourceRepository}/tree/{sourceCommit}). Public review is not proof of launch, deployment, audit, or safety.

## Four completion promises

### 1. Final supply

Final supply closes the collection's supply cap at its minted-ever count: the token identities allocated for the collection. Burned tokens still count. It is only a promise about minting.

### 2. Core freeze

Core freeze permanently locks a defined group of fields in the shared token contract. It also finalizes supply as part of the freeze transaction. Finalizing supply by itself does not freeze the Core.

### 3. Preservation records

Preservation records keep an append-only history of file hashes, locations, formats, and other evidence. New records do not erase old records.

### 4. Artwork finality

Artwork finality is a separate delayed process. It is meant to bind a precise collection or token scope, the expected record, and the components used to display the work.

**Main open point:** the contracts contain these mechanisms, but the release candidate still needs proof that the exact finality payload is bound and every effective writer is covered.

Technical sources: [StreamCore.sol](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol), [StreamPreservationRecords.sol](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamPreservationRecords.sol), and [StreamArtworkFinalityRegistry.sol](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamArtworkFinalityRegistry.sol).

## Final supply is a supply promise

### What happens

After minting ends and the required wait has passed, an account with permission for setFinalSupply can close supply. The Core changes the collection cap to the number of token identities allocated for that collection. Burning a token does not lower this minted-ever count or make room for a replacement mint.

This does not freeze scripts, metadata, artwork files, or other modules.

### Current code and known defect

For a collection with at least one mint, later mints fail at the new cap.

The zero-mint case is different. The current code writes zero as the final supply. The same zero also means "supply not initialized" to setCollectionData. Until Core freeze, a function admin can set a new nonzero cap and reopen minting.

Core freeze closes that route, but it is a separate operation.

See [setFinalSupply](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L888-L907), [_finalizeCollectionSupply](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L1497-L1501), and [setCollectionData](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L377-L408).

### What must be proven before launch

- Zero supply has a clear one-way final state.
- Every mint lane and executor respects closure.
- Existing signed Drops, auctions, and reservations have defined behavior.
- An event records the final value.
- No successor path can bypass the final state.

**Why this matters:** "No works will ever be minted" must not mean the same stored value as "supply has not been set yet."

## Core freeze fixes a defined boundary

### What happens

An account with permission for freezeCollection can permanently freeze a collection in the Core. The function first finalizes supply, then stores a freeze-manifest hash and marks the collection frozen.

At the pinned commit, freeze blocks:

- old and manager mint entries;
- burning live tokens;
- changes to the collection randomizer;
- changes to artist approval;
- covered token data, images, and attributes;
- new or revised collection-metadata records; and
- changes to reserved collection-metadata locks.

See [freezeCollection](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L826-L841), [mint entries](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L445-L503), [burn](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L628-L640), and [artist approval](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L734-L761).

### What can still happen

Core freeze does not stop everything. The pinned code still allows:

- normal token transfers and approvals;
- new append-only preservation records;
- post-burn randomness evidence for a token already burned;
- some metadata snapshot and record-lock actions;
- shared contract-level metadata changes;
- reads and history exports; and
- module, successor, or governance actions unless another terminal rule blocks them.

See the [transfer behavior](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L1008-L1011) and [metadata mutation checks](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCollectionMetadata.sol#L363-L397).

**Why this matters:** "Core frozen" must not be shown as "the whole artwork is final."

## A freeze manifest gives the boundary one identity

The Core stores a hash of the frozen state. A hash is a short digital fingerprint. It lets someone compare a separately rebuilt package with the state that was frozen.

For that comparison to work, reviewers need a clear recipe for:

- which fields and versions are included;
- how each value is encoded;
- how live, burned, and unminted tokens are handled;
- which randomness and dependency facts are included; and
- which mutable parts remain outside the hash.

**Why this matters:** artists and collectors need to know what the fingerprint covers, not only that a fingerprint exists.

## Preservation records keep history append-only

### What current code does

An approved record writer can add a preservation record for a known collection. The record includes its type, subject, content hash, location, schema, time, writer, and authorization class.

The contract accepts several hash and reference formats, including Keccak-256, SHA-256, BLAKE3, multihash, IPFS CID, and Arweave transaction references.

Every record remains readable. A newer record only updates a separate latest pointer for the same collection, record type, and subject. "Latest" means most recently written onchain; it does not mean the record with the newest effective date.

See [StreamPreservationRecords](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamPreservationRecords.sol) and its [record interface](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/IStreamPreservationRecords.sol#L106-L126).

### What readers must keep separate

- the package tied to finality;
- later preservation evidence;
- the current latest pointer;
- who wrote the record and under which authority; and
- a stored signature hash versus a signature another system actually verified.

**Why this matters:** future conservators can add new evidence without rewriting the original record.

## Integrity and availability require separate evidence

A valid hash answers one question: **Do these retrieved bytes match the earlier commitment?**

It does not keep those bytes online. Long-term access may also require:

- independent copies of the files;
- paid and working storage;
- a usable gateway, domain, and RPC service;
- the right browser, font, codec, GPU, or JavaScript runtime; and
- public recovery and replay instructions.

**Why this matters:** proof that a file is correct is different from proof that people can still get and run it.

## One-of-one materials need token-specific commitments

A one-of-one work may have source files, media, or authenticity evidence that belongs only to that token. The finality design supports token-specific manifests so those commitments can stay bound to the right token ID.

Reviewers still need to verify:

- every token that needs its own manifest is covered;
- encoding and hashing are unambiguous;
- shared edition files are not needlessly copied;
- burned and unminted cases are defined; and
- the permanence package includes the renderer, dependencies, archives, replay steps, output hashes, browser proof, and storage assumptions.

These records do not prove ownership, marketplace support, or royalty enforcement.

## Terminal finality is delayed for a reason

### What current code does

An authorized finality admin can schedule a terminal freeze for a precise scope and expected record hash. The schedule must include a waiting period and an execution window.

Before the waiting period ends, the current veto guardian can stop it. A finality admin can cancel it before execution or expiry. Anyone can record that an overdue proposal expired.

Only an authorized finality admin can execute the scheduled action. Execution checks the scheduled record, scope, manifest, Core facts, required components, and live component responses. The code then stores a collection or scoped finality record.

See the [registry limits and roles](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamArtworkFinalityRegistry.sol#L39-L81) and [schedule and execution code](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamArtworkFinalityRegistry.sol#L297-L589).

### What remains unproven

The review still needs complete evidence that:

- execution uses the exact payload reviewed during the delay;
- every required component and writer is covered; and
- no indirect route can change the promised final state.

**Why this matters:** a delay only helps when reviewers see the exact irreversible action that will later execute.

## Artist approval must be approval of readable facts

An artist should be able to read the package before signing it. A complete approval should clearly bind the chain, contract, collection or token scope, manifests, component commitments, nonce, deadline, and finality action.

The current Core artist approval binds a defined collection-state hash. How that approval should connect to Core freeze, preservation, and terminal finality remains an important design decision.

Contract-wallet artists also need a clear ERC-1271 signing path if supported. Key-loss recovery must not silently turn a platform administrator into the artist.

## A guardian can stop finality

The current registry gives the veto guardian one narrow job: stop a scheduled finality action before the waiting period ends.

The intended separation is:

- the proposer supplies the payload;
- the artist approves the artistic commitment;
- the guardian may veto;
- execution applies the already-bound payload; and
- expiry closes an abandoned proposal.

A replacement manifest or changed payload needs a new identity and fresh approval where required. An old signature must not be reused for a different action.

## Terminal means every effective writer is accounted for

Finality is only terminal if every artwork-changing route is blocked or clearly excluded from the promise.

The proof must cover effects, not just function names. It should include:

- token and collection metadata;
- scripts, dependencies, images, animations, and attributes;
- renderer inputs;
- randomness providers and final seeds;
- preservation and refresh helpers;
- successor modules; and
- any global or indirect path that can make the same change.

The source contains record-family authorization. The exact launch setup still needs evidence for admitted record types, provider addresses, grants, code hashes, rotation, revocation, and independent review.

**Why this matters:** blocking one function is not enough when another contract can create the same change.

## Recovery after finality would change the promise

ADR 0020 proposes a separate recovery companion for a failed renderer, dependency, or serving route. **It is proposed, not accepted or implemented in the pinned candidate.**

Under the proposal, the original finality record would stay unchanged. Governance V2 would schedule and execute a separate recovery record. That record would identify the old route, replacement, manifest, reason, and prior recovery.

The proposal treats a route change as a change to the served artwork bytes unless a later accepted verifier proves equivalence. It could preserve access while changing what a viewer receives.

Reviewers should decide whether any byte-changing recovery should exist and what artist consent, owner notice, veto, waiting period, and competing-recovery rules it would need.

See [ADR 0020 status and blockers](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0020-executor-only-finality-recovery.md#L3-L24) and its [proposed decision](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0020-executor-only-finality-recovery.md#L75-L138).

## Irreversible actions deserve separate ceremonies

A safer flow keeps each irreversible promise visible:

1. Confirm maximum supply.
2. Close every mint path and make supply final.
3. Inspect and freeze the Core boundary.
4. Retrieve and verify preservation materials independently.
5. Inspect collection-wide and token-specific manifests.
6. Compare readable facts with the exact signed payload.
7. Wait through the review and veto period.
8. Execute terminal finality.
9. Check the resulting state with an independent reader.

Each step should produce a machine-readable receipt. Before production, an independent person should be able to recover and replay the package from published instructions and commitments.

## What the finality process must establish

Artists, collectors, and independent reviewers should be able to prove:

- every mint path is closed;
- every mutable artwork field is known;
- each hash uses a clear, repeatable encoding;
- token-specific files are included;
- required bytes can be retrieved and run;
- the artist approved the exact final state; and
- every administrative change path has ended or is outside the promise.

## What can fail

- Final supply leaves another mint lane open.
- A broad freeze label hides fields or modules that can still change.
- A manifest binds the wrong data, token, or encoding.
- The hash is valid but the files are missing or unusable.
- Finality executes different data from the scheduled proposal.
- An old artist approval is reused for a new action.
- A guardian can change the payload instead of only stopping it.
- An indirect metadata, governance, preservation, refresh, or successor route bypasses finality.
- A later recovery changes served bytes but is described as the same artwork.

## Questions for reviewers

1. Are final supply, Core freeze, preservation, and finality each narrow enough to verify?
2. Does mint closure cover every current and successor lane, including the zero-mint case?
3. Which exact Core and module fields enter each manifest?
4. Is the finality delay long enough for independent retrieval and replay?
5. What exact facts must the artist approve?
6. Can the guardian only veto?
7. Does the writer inventory cover every indirect change route?
8. Which independent storage locations and runtime files are required?
9. Which receipt lets an artist or collector verify the final state?
10. Should any byte-changing recovery exist after finality?`,
} as const;
