export const PUBLIC_REVIEW_FREEZING_FINALITY_MESSAGES = {
  "publicReview.pages.freezingPreservationAndArtworkFinality.currentSummary":
    "How Stream stops minting, freezes specific Core data, records proof about artwork files, and schedules a final artwork lock.",
  "publicReview.pages.freezingPreservationAndArtworkFinality.currentEditorial": `# Freezing, preservation, and artwork finality

## The answer in one minute

Stream does not have one button that makes an artwork "finished." It has four separate promises:

1. **Final supply:** minting should stop.
2. **Core freeze:** An account with freeze permission can permanently lock a specific group of collection and token data stored in the Core contract. This also finalizes supply.
3. **Preservation records:** Approved artists, archives, or preservation services can add permanent records showing where artwork files are stored and how to check them.
4. **Artwork finality:** An authorised finality admin can schedule the final artwork lock. A safety delay lets a guardian stop a mistake.

Each step protects something different. Stopping minting only stops new tokens. Core freeze locks only specific data in the Core contract. It does not lock outside files, every metadata record, or helper contracts. A file fingerprint is a short code made from a file. It can show that a downloaded file matches the earlier record, but it cannot make a missing file available. Stream has code for the final lock, but reviewers still need proof that no other path can change the displayed artwork.

This page describes the code at [the pinned source commit](https://github.com/{sourceRepository}/tree/{sourceCommit}). Public review is not proof of launch, deployment, audit, or safety.

## Four completion promises

### 1. Final supply

**Final supply is meant to end minting.** Stream sets the collection’s maximum supply to the number of tokens already created. Burned tokens still count, so burning one does not make room for a replacement. This step only controls token supply. It does not lock the artwork or its files.

### 2. Core freeze

**Core freeze locks specific Core data.** It finalizes supply and permanently freezes a defined group of collection and token data in the Core contract. It does not freeze the whole artwork, outside files, every metadata record, or every helper contract.

### 3. Preservation records

**Preservation records are a permanent logbook for the artwork.** Each record can show where a file is stored and how to check it. New records can be added, but old records are never deleted.

### 4. Artwork finality

**Artwork finality is the last planned lock.** It targets a scope—the exact collection, token, release, season, or view being locked. It checks the expected record and the parts needed to display the work. A safety delay lets a guardian stop a mistake.

**Still to prove:** Reviewers must confirm that the final lock covers the correct artwork data and blocks every other way the displayed artwork could change.

Technical sources: [StreamCore.sol](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol), [StreamPreservationRecords.sol](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamPreservationRecords.sol), and [StreamArtworkFinalityRegistry.sol](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamArtworkFinalityRegistry.sol).

## How to read the technical sections

This page keeps three kinds of evidence separate:

- **Current code** means behavior found in the pinned contracts.
- **Accepted design** means a rule the project has agreed to in an ADR. It may still need implementation and launch proof.
- **Proposed design** means an idea that has not been accepted.

The main accepted design records are [ADR 0004 for admin powers](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0004-admin-governance.md), [ADR 0006 for metadata and freezing](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0006-metadata-freeze.md), [ADR 0009 for finality scopes](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0009-protocol-v1-open-question-resolutions.md), and [ADR 0011 for preservation and finality evidence](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0011-world-class-pass-round-2.md).

## 1. Final supply stops new minting

### What the current code does

After minting ends and the required extra wait has passed, an account with permission for setFinalSupply can close the supply.

The Core sets the collection's maximum supply to the number of token identities already created. Burning a token does not lower this minted-ever count or make room for a replacement mint.

This step controls minting only. It does not lock metadata, scripts, artwork files, or other contracts.

### The zero-token problem

If no token has been minted, the code writes zero as the final supply. But setCollectionData also treats zero as "supply has not been set."

Before Core freeze, an account with permission for setCollectionData can set a new nonzero supply and reopen minting. Core freeze closes this route. Finalizing supply by itself does not freeze the Core.

See [setFinalSupply](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L888-L907), [_finalizeCollectionSupply](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L1497-L1501), and [setCollectionData](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L377-L408).

### What reviewers still need to prove

- Zero can mean "closed forever" without also meaning "not set yet."
- Every current and future mint route respects the final supply.
- Signed Drops, auctions, reservations, and unfinished mint actions have clear rules.
- The final value has a clear event or receipt.
- A replacement contract cannot bypass the closed supply.

**Why this matters:** "No tokens will ever be minted" must be a clear final state.

## 2. Core freeze locks a specific group of data

### What the current code does

An account with permission for freezeCollection can freeze a collection in the Core. This action cannot be undone.

The function first finalizes supply. It then saves a fingerprint of the frozen Core state and marks the collection as frozen.

At the pinned commit, Core freeze blocks:

- every Core mint entry;
- burning live tokens;
- changing the collection's randomizer;
- changing the artist approval;
- changing covered token data, images, and attributes;
- adding or changing collection-metadata records; and
- changing reserved collection-metadata locks.

See [freezeCollection](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L826-L841), [mint entries](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L445-L503), [burn](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L628-L640), and [artist approval](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L734-L761).

### What Core freeze does not stop

The pinned code still allows:

- normal token transfers and approvals;
- new preservation records;
- late randomness evidence for a token that was already burned;
- some metadata snapshots and nonreserved record locks;
- changes to shared contract-level metadata; and
- module, successor, or governance actions unless another final rule blocks them.

See the [transfer behavior](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCore.sol#L1008-L1011) and [metadata checks](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamCollectionMetadata.sol#L363-L397).

**Why this matters:** "Core frozen" does not mean "the whole artwork is final."

### What the freeze fingerprint proves

The Core saves a hash of its frozen state. A hash is a short digital fingerprint. Someone can rebuild the same package and check whether its fingerprint matches.

Reviewers still need a clear recipe that says:

- which fields and versions are included;
- how each value is written before hashing;
- how live, burned, and unminted tokens are handled;
- which randomness and software dependencies are included; and
- which changeable parts remain outside the fingerprint.

**Why this matters:** a fingerprint is useful only when people know exactly what it covers.

## 3. Preservation records keep a permanent history

### Who can add a record

The record-family rules decide who can write each type of record. Depending on the record type, an approved writer may be an artist, owner, curator, institution, independent checker, preservation service, or admin.

A general contract admin does not automatically become an approved preservation writer.

### What a record contains

A record can identify:

- what kind of evidence it is;
- which collection or subject it belongs to;
- a fingerprint of the file or evidence;
- where the material can be found;
- which data format it uses;
- when it applies;
- who wrote it; and
- which permission allowed the writer to add it.

The code supports common fingerprint and storage references such as Keccak-256, SHA-256, BLAKE3, multihash, IPFS CID, and Arweave transaction IDs.

See [StreamPreservationRecords](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamPreservationRecords.sol), its [record interface](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/IStreamPreservationRecords.sol#L106-L126), and the [writer rules](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamRecordFamilyRegistry.sol#L264-L285).

### Old records are not erased

Every record stays readable. Adding a new record changes only the "latest" pointer for the same collection, record type, and subject.

"Latest" means the last record written to the blockchain. It does not mean the record with the newest date inside it.

Readers should check:

- which record was included in the final artwork lock;
- which records were added later;
- who wrote each record and with what permission; and
- whether a signature was actually checked or only its fingerprint was stored.

**Why this matters:** future conservators can add better evidence without rewriting history.

### A correct fingerprint does not keep a file online

A matching fingerprint proves one thing: **the downloaded file matches the earlier record.**

It does not store the file or keep it available. Long-term access may also need:

- independent copies of the files;
- paid and working storage;
- working gateways, domains, and blockchain access;
- the correct browser, font, codec, graphics support, or JavaScript runtime; and
- public instructions for recovering and replaying the artwork.

**Why this matters:** proving that a file is correct is different from making sure people can still get and run it.

### One-of-one works may need their own records

A one-of-one artwork may have files or evidence that belong only to that token. The accepted finality design supports a token scope, so this material can be tied to the correct token ID.

Reviewers still need to confirm that:

- every token that needs its own package has one;
- the hashing rules are clear;
- shared files are not copied without need;
- burned and unminted cases are defined; and
- the package includes the renderer, software dependencies, archive copies, replay steps, output fingerprints, browser proof, and storage assumptions.

These records do not prove ownership, marketplace support, or royalty payment.

## 4. Artwork finality is the last planned lock

### How the current process starts

An authorized finality admin schedules a lock for one exact scope and one expected final-record fingerprint.

The code requires at least a 72-hour waiting period. After that wait, there must be an execution window of at least seven days.

During the waiting period:

- the current veto guardian can stop the action;
- a finality admin can cancel it; and
- anyone can later mark an overdue action as expired.

### What happens when the lock is executed

Only an authorized finality admin can execute the scheduled action.

The code checks:

- the exact scheduled scope and expected fingerprint;
- the finality manifest—a structured record that says what the lock covers;
- the frozen Core facts;
- the required artwork components;
- the live state reported by those components;
- the required artist approval or platform declaration; and
- the discovery route used to find the components.

If the checks pass, the registry stores the final record for that collection or smaller scope.

See the [registry limits and roles](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamArtworkFinalityRegistry.sol#L39-L81) and [schedule and execution code](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamArtworkFinalityRegistry.sol#L297-L589).

### Who does what

- **Finality admin:** schedules, cancels, or executes the action.
- **Artist:** should approve the exact artwork facts that are being made final.
- **Veto guardian:** can stop the action during the waiting period. The guardian cannot replace the artwork data.
- **Independent reviewer:** checks the files, fingerprints, permissions, and final result.

The artist should be able to read the collection or token, manifest, artwork parts, deadline, and final action before signing.

The Core also stores an artist approval for its own collection-freeze state. Reviewers still need clear evidence showing how that approval and the finality approval fit together. If contract wallets are supported, their signature path must also be clear. Losing an artist key must not silently make a platform admin the artist.

### What reviewers still need to prove

The contract checks that execution matches the expected fingerprint. Reviewers still must show that the fingerprint covers the right and complete artwork information.

Reviewers must prove that:

- people review the same data that later executes;
- every required artwork component and writer is included; and
- no direct, indirect, governance, or successor path can change the displayed artwork after finality.

Here, a **writer** means any account, function, or contract that can change the artwork result. This includes metadata, scripts, dependencies, images, animation, renderer inputs, randomness, preservation helpers, refresh helpers, and successor modules.

At launch, Stream must publish who has each writing permission, which records they may write, and how those permissions can change or end.

**Why this matters:** blocking one change function is not enough if another contract can make the same change.

## Recovery after finality is only a proposal

ADR 0020 proposes a separate recovery record for a broken renderer, software dependency, or file-serving route. **It is proposed, not accepted or implemented in the pinned candidate.**

Under the proposal:

- the original finality record would never change;
- Governance V2 would schedule and execute a separate recovery action; and
- the new record would identify the old route, replacement route, reason, manifest, and previous recovery.

The proposal treats a route replacement as a change to the served artwork bytes unless a future accepted checker proves the bytes are equivalent. Recovery might keep the artwork available while changing what a viewer receives.

Reviewers still need to decide whether any byte-changing recovery should exist. They must also decide what artist consent, owner notice, veto period, waiting time, and conflict rules it would require.

See [ADR 0020 status and blockers](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0020-executor-only-finality-recovery.md#L3-L24) and its [proposed decision](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0020-executor-only-finality-recovery.md#L75-L138).

## A safer order for making artwork final

Each permanent step should be separate and visible:

1. Confirm the maximum number of tokens.
2. Close every mint route.
3. Inspect and freeze the Core data.
4. Download and check the preservation files.
5. Inspect the collection-wide and token-specific manifests.
6. Show the artist the exact facts and collect the correct approval.
7. Wait through the public review and guardian-veto period.
8. Execute the final artwork lock.
9. Use an independent reader to check the result.

Each step should create a machine-readable receipt. Before launch, an independent person should be able to recover and replay the artwork by following published instructions.

## Main ways this can fail

- One mint route stays open.
- A broad "frozen" label hides data or modules that can still change.
- A manifest points to the wrong collection, token, data, or hashing rule.
- A fingerprint is correct, but the file is missing or cannot run.
- The executed action differs from the action that people reviewed.
- An old artist approval is reused for a different action.
- A guardian can edit the action instead of only stopping it.
- An indirect metadata, governance, preservation, refresh, or successor route bypasses the lock.
- A later recovery changes the served artwork but is described as the same work.

## Final reviewer checklist

1. Are final supply, Core freeze, preservation, and artwork finality clearly separate?
2. Is every current and future mint route closed, including the zero-token case?
3. Which exact Core fields, modules, and files are included in each manifest?
4. Can an independent person download and run every required file?
5. Are all hashing and encoding rules clear and repeatable?
6. Does the artist approve the exact final artwork facts?
7. Is the waiting period long enough, and can the guardian only stop the action?
8. Does the writer list cover every direct and indirect change route?
9. Which receipt lets an artist or collector check the final state?
10. Should any recovery that changes served artwork bytes be allowed after finality?`,
} as const;
