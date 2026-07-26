# 6529 Stream: public review

This is a review of code that is still being designed. Stream has not been
deployed. There is no live Stream contract and there are no funds in it. That is
why possible vulnerabilities belong in this public review: the useful time to
find them is before the design is fixed.

The source under review is
[`e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8`](https://github.com/6529-Collections/6529Stream/tree/e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8).
Every code link in this review points to that commit. When the reviewed commit
changes, the old review will remain available and a new version will show the
diff.

## The short answer

Stream is not an unusually elaborate contract for one-of-one tokens. It is a
shared ERC-721 protocol intended to support many collections and several kinds
of artwork, including one-of-ones and editions. It combines:

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

The system is intentionally modular. The Core holds the token identity and the
smallest set of collection facts that are expected to last. Other contracts
handle mint policy, sales, revenue, metadata rendering, randomness, preservation,
and governance. The proposed long-term model does not upgrade a proxy in place.
Instead, a permanent Core can recognize replacement modules through explicit
registries and governance.

## What the code currently is

### IMPLEMENTED

The pinned repository contains a complete Solidity implementation and a large
local test suite. The generated technical reference for this review compiles all
protocol, test, and deployment-script Solidity files and inventories their
contracts, interfaces, libraries, functions, events, errors, and source ranges.

The current release artifacts describe a multi-contract protocol rather than a
single mint contract. The permanent token surface is centered on
[`StreamCore.sol`](https://github.com/6529-Collections/6529Stream/blob/e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8/smart-contracts/StreamCore.sol).
Minting and durable counters are separated into
[`StreamMintManager.sol`](https://github.com/6529-Collections/6529Stream/blob/e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8/smart-contracts/StreamMintManager.sol)
and
[`StreamMintLedger.sol`](https://github.com/6529-Collections/6529Stream/blob/e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8/smart-contracts/StreamMintLedger.sol).
Signed drop execution is handled by
[`StreamDrops.sol`](https://github.com/6529-Collections/6529Stream/blob/e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8/smart-contracts/StreamDrops.sol).
Other modules cover auctions, revenue resolution, split wallets, metadata,
dependencies, randomness, preservation, and governance.

### TESTED

The repository includes ordinary unit tests, fuzz tests, invariant tests,
state-machine tests, and adversarial composition tests. A test proves that the
tested behavior occurred in the local test environment. It does not prove that
the full protocol is secure or that the same assumptions hold in production.

### AUDIT PENDING

The repository's own
[`status.md`](https://github.com/6529-Collections/6529Stream/blob/e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8/docs/status.md)
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
