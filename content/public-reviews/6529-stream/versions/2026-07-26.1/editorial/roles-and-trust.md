# Roles and trust

Smart contracts do not remove trust. They make some powers explicit. This page
lists the important actors, the powers they can exercise, and the assumptions
that remain outside Solidity.

## Current administrative model

### IMPLEMENTED

[`StreamAdmins.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamAdmins.sol)
supports:

- an owner;
- a global administrator;
- administrators scoped to a target contract and function selector;
- a pause guardian;
- an unpause administrator;
- assignment and removal of administrative authority.

Function-scoped authority is safer than giving every operator every power, but
it remains powerful. Reviewers must inspect the exact selector inventory and
confirm that similar functions cannot bypass the intended boundary.

## Actor matrix

| Actor                          | Typical power                                 | Principal trust question                                         |
| ------------------------------ | --------------------------------------------- | ---------------------------------------------------------------- |
| Core owner                     | bootstrap and ownership duties                | When is this power removed or constrained?                       |
| Global admin                   | broad protocol administration                 | Is any global role necessary after launch?                       |
| Target/function admin          | call a specific selector on a specific target | Does the selector grant more power than its name suggests?       |
| Pause guardian                 | stop a configured domain                      | Can it limit damage without becoming a censorship key?           |
| Unpause admin                  | resume a paused domain                        | What evidence is required before restart?                        |
| Signer manager                 | rotate authorization signers and epochs       | Can a stolen or malicious signer be removed quickly and visibly? |
| TDH authorization signer       | authorize a drop action                       | Does the payload bind every sale fact?                           |
| Mint manager/executor          | configure or execute mint policy              | Can policy exceed Core supply or bypass counters?                |
| Randomness controller/provider | configure or fulfill randomness               | What can it bias, delay, retry, or abandon?                      |
| Governance proposer            | publish a proposed action                     | Who can propose value-bearing or permanent actions?              |
| Governance canceller/guardian  | cancel or veto scheduled actions              | Can it stop harm without silently changing policy?               |
| Governance executor            | execute a matured action                      | What call targets, selectors, and ETH value are allowed?         |
| Artist                         | approve a particular collection state         | Which actions still proceed without an artist signature?         |
| Collector                      | mint, bid, withdraw, transfer, burn           | Which states or external services affect the collector's result? |
| Permissionless caller          | settle or trigger public maintenance paths    | Can an arbitrary caller select harmful parameters?               |

## Pause and unpause are different powers

### IMPLEMENTED

The design separates the ability to pause from the ability to unpause. This is a
useful incident-response property. A guardian can stop a domain quickly without
automatically receiving the power to restart it.

### OPEN FOR FEEDBACK

Each pause domain needs an explicit policy:

- what actions stop;
- what reads remain available;
- what happens to pending auctions, mints, withdrawals, and randomness;
- who may pause;
- who may unpause;
- maximum duration, if any;
- required public incident evidence.

A pause that leaves funds or authorizations in an undefined state can be worse
than no pause.

## Signer authority

### IMPLEMENTED

Signed drops depend on a configured signer and signer epoch. Rotation changes
the epoch so that an authorization for an old signer state cannot be treated as
current.

The signer does not move tokens directly. It authorizes a contract call with a
bound payload. That still makes signer custody a central operational trust
assumption.

### FAILURE MODES

- a key is stolen;
- a signer service signs values the community did not approve;
- the wrong chain or verifying contract is used;
- an old authorization remains valid longer than intended;
- rotation is delayed;
- an ERC-1271 wallet changes its validation behavior;
- monitoring fails to notice unexpected authorizations.

## Governance V2

### IMPLEMENTED

The reviewed repository includes a role registry and governance executor. The
executor can publish actions, enforce delays, execute matured calls, handle
cancellation and expiry, support guardian vetoes, and freeze some selectors.
The role registry separates proposer, executor, guardian, and other governance
identities.

Relevant sources:

- [`StreamRoleRegistry.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRoleRegistry.sol)
- [`StreamGovernanceExecutor.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamGovernanceExecutor.sol)

### AUDIT PENDING

This is an implemented governance foundation, not audited production
governance. Bootstrap, role assignment, target catalog, delays, selector
classes, value limits, and cutover evidence all matter as much as the executor
code.

## Native-value execution

### KNOWN LIMITATION

The repository records the governance executor's native-value authority as an
open High risk (`RISK-GOV-003`). A governance call that can send ETH needs
particularly clear target, value, accounting, and emergency rules.

Reviewers should trace:

1. where ETH can enter the executor;
2. who can schedule a value-bearing action;
3. which targets can receive value;
4. whether reserved or credited funds can be touched;
5. how a guardian can stop execution;
6. how residual ETH can be recovered;
7. what event evidence reconstructs the action.

## Record-family authorization

### SOURCE IMPLEMENTED - CANDIDATE UNBOUND

The source now replaces the historical whole-selector writer grants with a
closed record-family registry. A selector-level permission asks whether an actor
may call a function. The new check also asks whether that actor may write this
exact admitted record type for this collection and subject.

There are eight authorization classes:

| Class                | Current source authority                    |
| -------------------- | ------------------------------------------- |
| Artist signer        | Live authority provider                     |
| Owner signer         | Live authority provider                     |
| Curator signer       | Family grant                                |
| Institution signer   | Live authority provider                     |
| Independent attestor | Direct, self-attributed write by any caller |
| Preservation admin   | Family grant                                |
| Metadata admin       | Family grant                                |
| Global admin         | Family grant                                |

There are fourteen closed family groups: artist, owner, independent, curator,
institution, rights, archive, fixity, C2PA, IIIF, media relationship, identity
display, snapshot, and agent. Artist, owner, independent, and institution
families reject admin grants. An exact record type is admitted once and cannot
be remapped.

The implementation is in
[`StreamRecordFamilyRegistry`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRecordFamilyRegistry.sol#L17-L285).
Live providers are code-hash pinned and fail closed on a failed call, malformed
return, or changed runtime code
([`_providerAuthorizes`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRecordFamilyRegistry.sol#L298-L323)).

`RISK-GOV-002` remains open for a different reason: the exact candidate,
production record-type admission set, live providers, grant map, deployed
runtime bindings, non-local rotation/revocation evidence, and independent
review are unavailable. The source catalog names those blockers explicitly
([`remaining_blockers`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/release-artifacts/record-family-authorization-source-catalog.json#L197-L205)).

The catalog published at the reviewed head intentionally declares
`018c8788750980e143c38ace0666684bf641ec4f` as its own semantic
[`source_commit`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/release-artifacts/record-family-authorization-source-catalog.json#L1-L13).
That value binds its unchanged Solidity sources. The later reviewed head changes
artifact and provenance tooling and release artifacts, not those Solidity
blobs.

## Module and successor authority

The long-term architecture uses immutable deployments and explicit successor
records rather than changing proxy implementation storage in place. This moves
the trust question to module governance:

- who registers a module;
- how its code hash and interface are verified;
- who changes its status;
- who declares a successor;
- which delays and vetoes apply;
- whether a frozen or permanent surface can still be affected indirectly.

The accepted revenue-resolver validation adapter is a deliberate
implementation-private exception to the ordinary module inventory. It is a
standalone immutable contract, but it is not a module, Registry V2 row, Core
pointer target, or authority boundary. It has no owner, administrator, or other
role. Only the resolver is registered. Replacing the adapter therefore
requires deploying a new resolver, proving continuity, registering that
resolver, and changing the Core pointer through governance; the old resolver
and adapter remain immutable historical evidence.

## Permissionless callers

Some operations can be safely callable by anyone when all sensitive values are
already fixed by state. Auction settlement after the end time is a common
example.

Permissionless does not mean consequence-free. Reviewers should verify that the
caller cannot select a recipient, value, manifest, or implementation that was
not already committed.

## External trust boundaries

The protocol also depends on systems and people that Solidity cannot fully
govern:

- curation and TDH calculation;
- authorization construction and signer custody;
- randomness providers;
- RPC nodes and chain indexing;
- source and artifact publication;
- content storage and gateways;
- browsers and JavaScript runtimes;
- Safe owners and recovery procedures;
- deployment operators;
- monitoring and incident response;
- marketplaces that choose whether to honor royalty information.

Each dependency should have an owner, failure signal, recovery path, and public
evidence requirement.

## What we think

No role should be described only by a label such as “admin” or “guardian.” The
public review should show exact target/selector/record powers and the conditions
under which they disappear. The final deployment should publish a machine-
readable role and governance catalog that matches the deployed addresses.

## What can still change

Role membership, action delays, selector classifications, pause domains,
guardian design, record-family constraints, value-bearing authority, and the
bootstrap-to-governance cutover are all still reviewable.

## Questions for reviewers

1. Which global roles should be eliminated before deployment?
2. Which actions require a delay, and how long should each delay be?
3. Which actions need both artist approval and protocol governance?
4. Can the pause system preserve bidder, minter, and withdrawal rights during an
   incident?
5. Is record-family authorization enforced for every high-impact mutation?
6. Should the governance executor ever hold or send native value?
7. What public evidence should be mandatory before a successor module becomes
   active?
