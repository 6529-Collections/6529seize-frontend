# Who Can Do What

Stream separates routine operations, emergency stops, signed sale approvals,
artist approvals, delayed changes, and actions that anyone may trigger. This
page shows who can perform each action, what they can change, how long that
power lasts, and where its use is recorded.

## List every power

For each person, wallet, contract, or external service, reviewers should ask:

- Which actions can it perform?
- Which contracts, collections, tokens, or records can it affect?
- Does the action happen immediately or after public notice?
- Who can stop it?
- Can it give power to another account?
- When does its power expire or end?
- Which public record shows what it did?

The complete map follows every callable function, registry check, executor,
module relationship, and external service to show what each role can actually
do.

## Actor matrix

| Actor                             | Principal capability                                         | Trust question                                                                 |
| --------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Core owner                        | Bootstrap and ownership duties                               | When is this authority removed, transferred, or constrained?                   |
| Global administrator              | Broad protocol administration                                | Is any global role necessary after launch?                                     |
| Target/function administrator     | Call a specific selector on a specific target                | Does the selector grant more power than its name suggests?                     |
| Pause guardian                    | Stop a configured domain                                     | Is its scope narrow enough for emergency use?                                  |
| Unpause administrator             | Resume a paused domain                                       | What evidence is required before restart?                                      |
| Signer manager                    | Rotate authorization signers and epochs                      | Can a stolen or mistaken signer be removed quickly and visibly?                |
| TDH authorization signer          | Authorize a specific Drop action                             | Does the signed payload bind every fact that matters?                          |
| Mint manager or executor          | Configure or execute mint policy                             | Can it exceed Core supply, bypass counters, or select an unintended recipient? |
| Randomness controller or provider | Configure, request, or fulfill randomness                    | What can it bias, delay, retry, abandon, or strand?                            |
| Governance proposer               | Publish a delayed action                                     | Who may propose value-bearing or permanent actions?                            |
| Governance canceller or guardian  | Cancel or veto a scheduled action                            | Is cancellation kept separate from proposing a replacement?                    |
| Governance executor               | Execute an action after its delay                            | Are target, calldata, native value, and timing fixed in advance?               |
| Artist                            | Approve a particular collection state or artistic commitment | Which actions require the artist's current signature?                          |
| Collector                         | Mint, bid, withdraw, transfer, and burn                      | Which mutable states or external services affect the result?                   |
| Permissionless caller             | Settle or trigger a maintenance path                         | Which sensitive values are committed before the call?                          |

This separation limits the authority available to any compromised or mistaken
actor.

## Current administrative layer

The current rehearsal includes
[`StreamAdmins.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamAdmins.sol).
It supports:

- an owner;
- a global administrator;
- administrators scoped to a target contract and function selector;
- a pause guardian;
- an unpause administrator;
- assignment and removal of administrative authority.

Function-scoped authority is materially narrower than giving every operator
every power. It still requires a complete selector inventory. Reviewers must
check the named function, its aliases, and alternate module paths.

Pause and unpause are intentionally different capabilities. A guardian can stop
a configured domain quickly. Restart power remains assigned separately. Each
domain still needs a public policy covering what stops, which
reads and exits remain available, who may resume, and what incident evidence is
required. A pause that strands bids, refunds, mints, withdrawals, or randomness
can create a second failure while trying to contain the first.

## Signed authorization

Signed Drops depend on a configured signer and signer epoch. The signer
authorizes a contract call whose typed payload binds the intended action; the
contract moves the token. Rotation changes the epoch, and current
authorizations must carry the current epoch.

That makes signer custody an important operational trust boundary. Failure modes
include:

- theft of a signing key;
- a signer service authorizing values outside the recorded community decision;
- use of the wrong chain or verifying contract;
- authorizations with deadlines that are too generous;
- delayed rotation after compromise;
- changed ERC-1271 validation behavior in a contract wallet;
- monitoring that fails to notice unexpected authorizations.

The public record should identify the signer, signer type, epoch, rotation
authority, emergency-revocation process, and the exact typed-data software used
to construct authorizations. No private key, seed, or recovery secret belongs in
that record.

## Who can schedule and make changes

The source includes
[`StreamRoleRegistry.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRoleRegistry.sol)
and
[`StreamGovernanceExecutor.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamGovernanceExecutor.sol).
They separate proposing, cancelling, guardian intervention, and execution. The
executor can publish actions, enforce delays, execute matured calls, expire or
cancel actions, support guardian vetoes, and freeze selected selectors.

Those contracts are source implementations awaiting inclusion in the current
rehearsal's deployed contract set. Their exact candidate roles, target catalog, delays,
selector classes, native-value limits, and bootstrap cutover remain readiness
questions. [Changes, Emergencies, and Future
Contracts](./governance-pausing-and-successors) explains how those powers are
intended to change over time.

## Which actions require the artist

The Core stores the artist address and can verify an artist signature over a
specific collection state. That approval binds the artist address, current
collection-freeze manifest hash, maximum collection purchases, total supply,
and final-supply delay.

Its current scope covers a defined collection state. In the reviewed source, an
administrator with the relevant authority can call `freezeCollection` under
that administrator's own authority. Other metadata, preservation, and finality
records can have their own writers and approval rules.

That separation needs an explicit policy. Reviewers should decide which of these
actions require:

- the artist's current signature;
- approval from the people responsible for operating Stream;
- a public delay;
- a guardian veto window;
- a combination of those protections.

Artist consent is only meaningful when the artist can inspect the human-readable
state behind a hash before signing it.

## Who may add each kind of record

The source replaces broad whole-selector writer grants with
[`StreamRecordFamilyRegistry`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRecordFamilyRegistry.sol#L17-L285).
A selector-level permission asks whether an actor may call a function. The
record-family check also asks whether that actor may write this exact admitted
record type for this collection and subject.

The source defines eight authorization classes:

| Class                      | Source authority                            |
| -------------------------- | ------------------------------------------- |
| Artist signer              | Live authority provider                     |
| Owner signer               | Live authority provider                     |
| Curator signer             | Family grant                                |
| Institution signer         | Live authority provider                     |
| Independent attestor       | Direct, self-attributed write by any caller |
| Preservation administrator | Family grant                                |
| Metadata administrator     | Family grant                                |
| Global administrator       | Family grant                                |

Fourteen closed family groups cover artist, owner, independent, curator,
institution, rights, archive, fixity, C2PA, IIIF, media relationship, identity
display, snapshot, and agent records. Artist, owner, independent, and
institution families reject administrator grants. An exact record type is
admitted once and remains permanently mapped.

Live authority providers are code-hash pinned and fail closed when a call fails,
returns malformed data, or has a runtime code-hash mismatch
([`_providerAuthorizes`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRecordFamilyRegistry.sol#L298-L323)).

These classes answer **who may write**. Separate evidence establishes the truth
of a rights claim, archive location, credential, or other record. An independent
record is self-attributed evidence from its caller. Artist, 6529, or protocol
endorsement requires its own attributed record. [Metadata, Scripts, and
Dependencies](./metadata-scripts-and-dependencies#collection-metadata-separates-claims-by-purpose-and-authority) explains
each family in ordinary language.

The source check is meaningful. A candidate configuration still needs an
admission set, live
providers, grants, runtime code hashes, rotation and revocation exercises, and
independent review.

## Who may replace a service contract

The permanent Core keeps its implementation and history. Replaceable duties can
move to new immutable contracts
through explicit module and successor records. The old contract and its history
remain visible.

That turns an opaque upgrade question into a set of reviewable authority
questions:

- who can register a module;
- which code hash and interface are required;
- who can change its status;
- who may declare a successor;
- which delay and veto rules apply;
- which liabilities remain with the predecessor;
- whether a successor can affect a supposedly frozen or permanent surface.

The accepted revenue-resolver validation adapter is a deliberate private
implementation dependency outside the registered module and authority system.
It would remain stateless and hold no funds, roles, or events. Replacing it would require a new
resolver, continuity proof, Registry V2 registration, and governed Core-pointer
change. This prevents a hidden adapter setter from becoming an undeclared
upgrade path.

## Permissionless callers

Some operations are safer when anyone can trigger them after every sensitive
value is already fixed. Auction settlement after the end time is an example.

Permissionless maintenance paths should use recipients, amounts, manifests,
implementations, and other sensitive values that were already committed.
Reviewers should trace every caller-supplied argument and
every mutable storage read used during execution.

## Responsibilities outside the contracts

Important powers remain outside Solidity:

- community curation and TDH calculation;
- authorization construction and signer custody;
- randomness coordinators, controllers, accounts, and funding;
- RPC nodes and chain indexing;
- source and artifact publication;
- content storage and gateways;
- browsers and JavaScript runtimes;
- Safe owners and recovery procedures;
- deployment operators;
- monitoring and incident response;
- marketplaces deciding whether to honor royalty information.

Each dependency needs an owner, failure signal, recovery path, and public
evidence requirement. Putting a hash onchain can make a result verifiable;
service honesty and continuous availability require separate evidence.

## How powers stay limited and visible

Each power should be narrow, public, revocable when appropriate, and permanent
where permanence protects the artwork. Stream should publish one
machine-readable view containing:

- the permanent Core;
- current and earlier service contracts;
- code identities;
- active roles and the actions available to each;
- scheduled changes;
- paused operations;
- current signing eras;
- powers that have ended permanently.

## What can fail

- a role reaches more functions than its name suggests;
- an alternate module bypasses a selector-scoped restriction;
- a signer authorizes a payload that differs from the community decision;
- an artist signature covers fewer facts than the product implies;
- an authority provider recognizes the wrong wallet or changes code;
- an administrator writes a record family outside its authority;
- a guardian authors changes beyond its stopping authority;
- a permissionless caller supplies a value that was supposed to be fixed;
- predecessor and successor modules accept the same authorization or liability;
- an external service has unclear ownership or recovery.

## Questions for reviewers

1. Which global roles should be eliminated before deployment?
2. Which actions require a delay, and how long should each delay be?
3. Which actions need approval from both the artist and the people responsible
   for operating Stream?
4. Can the pause system preserve bidder, minter, and withdrawal rights during an
   incident?
5. Is record-family authorization enforced for every high-impact mutation?
6. Should the contract that applies scheduled changes ever hold or send native
   value?
7. What public evidence should be mandatory before a successor module becomes
   active?
8. Which powers duplicate responsibility or can be narrowed safely?
