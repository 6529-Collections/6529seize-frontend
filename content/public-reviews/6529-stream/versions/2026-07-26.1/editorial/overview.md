# 6529 Stream: public review

This is a review of code that is still being designed. Stream has not been
deployed. There is no live Stream contract and there are no funds in it. That is
why possible vulnerabilities belong in this public review: the useful time to
find them is before the design is fixed.

The source under review is
[`018c8788750980e143c38ace0666684bf641ec4f`](https://github.com/6529-Collections/6529Stream/tree/018c8788750980e143c38ace0666684bf641ec4f).
Every code link in this review points to that commit. When the reviewed commit
changes, the old review will remain available and a new version will show the
diff.

## The short answer

Stream is not an unusually elaborate contract for one-of-one tokens. It is a
shared ERC-721 protocol intended to support many collections and several kinds
of artwork, including one-of-ones and editions. The reviewed repository
contains source for:

- a permanent token and collection identity layer;
- configurable mint policy and signed sale authorization;
- fixed-price sales and English auctions;
- primary-sale accounting, split wallets, curator rewards, and ERC-2981 royalty
  information;
- multiple randomness providers with a request and recovery lifecycle;
- onchain and offchain metadata modes, scripts, and pinned dependencies;
- collection freezing, preservation records, and terminal artwork finality;
- administrative roles, pauses, scheduled governance actions, and successor
  modules.

These source surfaces are not all connected into one current sale or mint
route. The system is intentionally modular, and the repository contains current
baseline contracts, separately deployed foundations, accepted target
architecture, and proposals at the same time. The Core holds token identity and
the smallest set of collection facts expected to last. The proposed long-term
model does not upgrade a proxy in place. Instead, a permanent Core can recognize
replacement modules through explicit registries and governance.

## What the code currently is

### IMPLEMENTED

The pinned repository contains a substantial Solidity implementation and a
large local test suite, but it is not complete against every accepted
architecture. In particular, the accepted revenue-resolver validation-adapter
target is not implemented. Its source work remains blocked until the complete
normative interface appendix and freeze commit are independently approved. The
generated technical reference for this review compiles all protocol, test, and
deployment-script Solidity files and inventories their contracts, interfaces,
libraries, functions, events, errors, and source ranges.

The current release artifacts describe a multi-contract protocol rather than a
single mint contract. The permanent token surface is centered on
[`StreamCore.sol`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/StreamCore.sol).
The repository also contains
[`StreamMintManager.sol`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/StreamMintManager.sol)
and
[`StreamMintLedger.sol`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/StreamMintLedger.sol).
They form a manager-and-ledger mint lane. Signed drop execution is handled by
[`StreamDrops.sol`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/smart-contracts/StreamDrops.sol).
The current rehearsal connects that contract to the separate legacy
`StreamMinter`, not to `StreamMintManager`. Other source modules cover auctions,
revenue resolution, split wallets, metadata, dependencies, randomness,
preservation, and governance. Their presence in source does not by itself prove
that a sale, deployment candidate, or production configuration uses them.

## Current baseline, genesis target, and open decisions

One source tree currently contains several evidence states. The distinction is
essential: a contract can compile and have tests without being part of the
current signed-sale path.

| Area                                                                          | Evidence status                            | What that means at this commit                                                                                                                                    |
| ----------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Signed fixed-price Drop                                                       | **CURRENTLY WIRED BASELINE**               | `StreamDrops` calls the legacy `StreamMinter`, which calls the legacy Core mint entry.                                                                            |
| Signed English auction                                                        | **CURRENTLY WIRED BASELINE**               | The rehearsal connects Drops, legacy minter, and the current auction contract.                                                                                    |
| Mint manager and durable ledger                                               | **SEPARATELY DEPLOYED FOUNDATION**         | The rehearsal connects the manager to Core and makes it a ledger writer, but `StreamDrops` does not call it.                                                      |
| Revenue resolver, split wallets, and primary settlement                       | **SEPARATELY DEPLOYED FOUNDATION**         | The rehearsal deploys these contracts, but the native Drop and Auction paths keep their own proceeds accounting.                                                  |
| Record-family authorization                                                   | **SOURCE IMPLEMENTED - CANDIDATE UNBOUND** | The classifier and writer checks exist, but the production admission set, provider addresses, grants, runtime code hashes, and rotation evidence are unavailable. |
| Governance V2 and artwork finality                                            | **SOURCE IMPLEMENTED**                     | Source exists, but these contracts are not part of the current rehearsal's deployed contract set.                                                                 |
| Thirty-seven-role genesis inventory                                           | **GENESIS TARGET**                         | The target profile is an architecture requirement, not a concrete deployment manifest.                                                                            |
| Raise-only parameter governance                                               | **SOURCE IMPLEMENTED - CANDIDATE UNBOUND** | The source enforces the one-way policy, but the complete candidate parameter binding is unavailable.                                                              |
| Resolver validation adapter                                                   | **ACCEPTED TARGET - NOT IMPLEMENTED**      | The architecture is accepted, but complete conforming source and candidate evidence are not present.                                                              |
| Batch operation-root, payer-bound ERC-20 orchestration, and finality recovery | **PROPOSED**                               | These documents are community-review material, not accepted or implemented behavior.                                                                              |
| Provider, marketplace, public-RPC, retrieval, deployment, and audit proof     | **NONLOCAL EVIDENCE PENDING**              | Local source and tests cannot supply this evidence.                                                                                                               |

The current wiring is visible in the pinned
[`RehearseDeployment.s.sol`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/script/RehearseDeployment.s.sol#L169-L270).
The wider target is visible in the
[`genesis deployment profile`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/release-artifacts/genesis-deployment-profile.json)
and is explicitly described as incomplete in
[`release-readiness.md`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/docs/release-readiness.md#L8-L20).

### TESTED

The repository includes ordinary unit tests, fuzz tests, invariant tests,
state-machine tests, and adversarial composition tests. A test proves that the
tested behavior occurred in the local test environment. It does not prove that
the full protocol is secure or that the same assumptions hold in production.

### AUDIT PENDING

The repository's own
[`status.md`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/docs/status.md)
describes the protocol as pre-audit and not production-ready. There is no
completed external audit or audit-remediation record for this candidate.

### KNOWN LIMITATION

The release evidence is not complete. The repository records open security and
governance blockers, incomplete production catalog reconciliation, missing
non-local provider evidence, and a Core bytecode margin below its stated
production target. The Security page lists these items without turning them into
marketing language.

## Permanent, replaceable, and operational

The repository uses three useful categories.

- **Permanent** components hold identity or commitments that should not be
  rewritten. The Core is the clearest example.
- **Replaceable** components can have successors. A replacement does not erase
  the old contract; governance records which module is current and why.
- **Operational** components and processes include signers, provider accounts,
  deployment ceremonies, monitoring, storage, browsers, RPC services, and other
  systems that cannot be made permanent merely by putting a hash onchain.

These words are design classifications, not guarantees. “Permanent” still
depends on the exact deployment, the chain, and the correctness of the code that
was deployed. “Replaceable” still depends on who can authorize a successor.
“Operational” means people and systems must continue to act correctly.

## What Stream knows, and what it does not know

Stream can verify an authorization signed by a configured signer. It does not
calculate TDH, choose artists, or run community curation inside Solidity. Those
decisions happen outside the contract. The authorization binds the resulting
mint or auction action to specific values so that the onchain execution cannot
quietly become a different sale.

Stream can store content, content hashes, dependency versions, and preservation
records. A hash proves that retrieved bytes match a commitment. A hash alone
does not keep those bytes available, make a browser execute them forever, or
remove the need for RPC and rendering software.

Stream can signal royalties through ERC-2981. It cannot force every secondary
marketplace to pay them.

## How to read this review

The fourteen editorial pages explain intent, consequences, powers, failure
modes, and open decisions. The generated Technical Reference is a separate
truth layer. It is produced from the compiler and the exact Git commit; it does
not ask a language model to remember every function.

Claims use the following labels:

- **IMPLEMENTED** — present in Solidity at the reviewed commit.
- **TESTED** — directly exercised by a named local test.
- **PROPOSED** — described by a draft or design document but not established by
  the current implementation.
- **OPEN FOR FEEDBACK** — an explicit design question.
- **AUDIT PENDING** — implemented, but not externally audited.
- **DEFERRED** — outside the current candidate.
- **KNOWN LIMITATION** — an acknowledged gap, risk, or incomplete piece of
  evidence.
- **EVIDENCE PENDING** — a mechanism or claim whose named proof is not yet in
  the accepted review evidence.

Architecture and wiring claims use additional evidence-status phrases:

- **CURRENTLY WIRED BASELINE** - constructed and connected by the rehearsal.
- **SOURCE IMPLEMENTED** - present in Solidity, without implying candidate
  wiring.
- **SOURCE IMPLEMENTED - CANDIDATE UNBOUND** - source exists, but candidate
  addresses, grants, code hashes, or configuration are unavailable.
- **SEPARATELY DEPLOYED FOUNDATION** - constructed by the rehearsal but not
  called by the user-facing path being discussed.
- **GENESIS TARGET** - required by the target profile, whether or not source
  exists.
- **ACCEPTED TARGET - NOT IMPLEMENTED** - an accepted design that does not yet
  have complete conforming source and integration evidence.
- **NONLOCAL EVIDENCE PENDING** - proof that requires a deployment, external
  service, marketplace, provider, independent retriever, or auditor.

Composite headings are explicit modifiers, not extra certainty tiers.
**IMPLEMENTED WITH CONSTRAINTS** means the mechanism exists, but the stated
constraint is part of the claim. **IMPLEMENTED FOR THE REVIEW PLATFORM**
describes this website and feedback system, not Solidity. **PROPOSED OR
DEFERRED** groups design material that is either not implemented or outside the
current candidate; the surrounding text must say which.

## What we think

A permanent art protocol should be reviewed as public infrastructure, not as a
product announcement. Artists should be able to see exactly which approvals
they give. Collectors should be able to see which facts can still change.
Technical reviewers should be able to move from a plain-language claim to an
exact function and line. Auditors should be able to export the public feedback
and reproduce the source inventory.

## What can still change

Everything in this candidate can still change before deployment: module
boundaries, role assignments, finality ceremonies, signer operations, sale
profiles, accounting rules, and the precise permanent surface. A proposed
change is not accepted merely because it appears in a discussion. Accepted
changes will be linked to a source commit and the review will show what moved.

## Questions for reviewers

1. Is a shared, multi-collection permanent Core the right long-term identity
   model?
2. Is the boundary between permanent and replaceable components clear enough?
3. Which powers should require an artist signature, a delay, a guardian veto,
   or more than one of those?
4. Which external dependencies are acceptable for artwork intended to remain
   usable for decades?
5. Which current limitations must block deployment rather than become explicit
   follow-up work?
