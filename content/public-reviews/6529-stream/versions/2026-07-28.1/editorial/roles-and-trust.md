# Roles and trust

Stream’s authority system answers a practical question: **who can make each
kind of change?** It separates routine administration, emergency stops, signed
sale approval, artist consent, governed change, and permissionless execution.
The aim is not to create impressive-sounding titles. It is to keep one mistaken
or compromised actor from inheriting every protocol power.

Consider an incident during an auction. A pause guardian can stop new bids in
the affected domain. That does not automatically let the guardian restart the
auction, move bidder funds, replace a module, or change the artwork. A separate
unpause authority can resume activity after review, while withdrawals remain a
different path. This is the basic pattern throughout Stream: give each actor
only the capability needed for its job.

Smart contracts do not remove trust. They can make a power visible, narrow it,
delay it, make it revocable, or make it permanent. People and external systems
still calculate Total Days Held (TDH), 6529's time-weighted holding measure,
hold signing keys, operate randomness services, preserve files, monitor
incidents, and decide whether marketplaces honor royalties.

## Why not use one administrator?

One owner or multisig would be easier to describe. It would also combine powers
that fail in different ways:

- stopping harm and restarting service;
- authorizing a sale and approving an artwork;
- editing a description and speaking in the artist’s name;
- proposing a governed change and executing it;
- replacing infrastructure and changing permanent token identity.

Stream keeps these responsibilities separate so a stolen signing key cannot
also rewrite metadata, a pause guardian cannot become a governor, and a
metadata operator cannot make an artist-attributed claim.

The right test for simplification is concrete: which responsibility can be
removed, or which smaller mechanism preserves the same boundary? Deleting a
role name while handing its powers to a broader key is not simplification. It
moves the risk.

## A concrete authority flow

A signed fixed-price mint shows several roles working together:

1. an offchain curation process reaches a decision;
2. the configured authorization signer signs the exact sale payload for its
   current signer epoch;
3. a caller submits the payload;
4. the Drop contract verifies the signature and bound terms;
5. the configured minter checks supply and mint rules;
6. Core records the token’s permanent identity;
7. if an incident occurs, a pause guardian can stop the relevant domain without
   receiving unrelated powers;
8. in the Governance V2 design, a later policy change must use its own visible
   process rather than borrowing the signer or guardian role.

No single role proves that the whole flow is correct. The safety claim comes
from the boundaries between them and from public evidence that the deployed
grants match the reviewed design.

## What this model protects—and what it does not

The model is designed to:

- scope authority to particular contracts, functions, collections, subjects,
  or record families;
- separate rapid defensive action from policy-making;
- make signer rotation and authorization eras visible;
- distinguish artist consent from protocol administration;
- preserve old module history when a successor takes over;
- allow safe actions to be triggered permissionlessly after every sensitive
  value is fixed.

It does not prove that an authorized person is honest, that an external service
is available, that a rights claim is true, or that a future deployment uses the
correct grants. A complete candidate still needs exact addresses, selectors,
code hashes, scopes, delays, revocation rules, and independent readback.

## Authority is a capability, not a title

In Solidity, a function selector is the compact identifier for a contract
function. Stream can scope an administrator to one selector on one target
instead of granting authority over the whole contract.

The useful question is not “is this account an admin?” It is:

- which exact function or record family can the account reach;
- on which contract, collection, token, or subject;
- whether the action is immediate or delayed;
- whether another party can veto it;
- whether the actor can grant itself or someone else more authority;
- how the authority expires, freezes, rotates, or is revoked;
- what public evidence reconstructs its use.

A reassuring role name is not a security boundary. Effective authority comes
from every reachable selector, registry check, executor, fallback, module
relationship, and external service.

## Actor matrix

| Actor                             | Principal capability                                          | Trust question                                                                 |
| --------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Core owner                        | Bootstrap and ownership duties                                | When is this authority removed, transferred, or constrained?                   |
| Global administrator              | Broad protocol administration                                 | Is any global role necessary after launch?                                     |
| Target/function administrator     | Call a specific selector on a specific target                 | Does the selector grant more power than its name suggests?                     |
| Pause guardian                    | Stop a configured domain                                      | Can it limit damage without becoming a censorship key?                         |
| Unpause administrator             | Resume a paused domain                                        | What evidence is required before restart?                                      |
| Signer manager                    | Rotate authorization signers and epochs                       | Can a stolen or mistaken signer be removed quickly and visibly?                |
| TDH authorization signer          | Authorize a specific Drop action                              | Does the signed payload bind every fact that matters?                          |
| Mint manager or executor          | Configure or execute mint policy                              | Can it exceed Core supply, bypass counters, or select an unintended recipient? |
| Randomness controller or provider | Configure, request, or fulfill randomness                     | What can it bias, delay, retry, abandon, or strand?                            |
| Governance proposer               | Publish a delayed action                                      | Who may propose value-bearing or permanent actions?                            |
| Governance canceller or guardian  | Cancel or veto a scheduled action                             | Can it stop harm without authoring a replacement action?                       |
| Governance executor               | Execute an action after its delay                             | Are target, calldata, native value, and timing fixed in advance?               |
| Artist                            | Approve a specific collection state or artistic commitment    | Which actions still proceed without the artist’s current signature?            |
| Collector                         | Mint, bid, withdraw, transfer, and burn                       | Which mutable states or external services affect the result?                   |
| Permissionless caller             | Settle or trigger a maintenance path                          | Can the caller choose any value that was not already committed?                |

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

Function-scoped authority is narrower than giving every operator every power.
It still requires a complete selector inventory. Reviewers must check aliases
and alternate module paths, not only the function named in a grant.

Pause and unpause are intentionally separate. A guardian can stop a configured
domain quickly without automatically receiving the power to restart it. Each
domain still needs a public policy covering what stops, which reads and exits
remain available, who may resume, and what incident evidence is required. A
pause that strands bids, refunds, mints, withdrawals, or randomness can create
a second failure while trying to contain the first.

## Signed authorization

Signed Drops depend on a configured signer and signer epoch. The signer does not
move tokens directly. It authorizes a contract call whose typed payload binds
the intended action. Rotation changes the epoch, so an authorization from an
old signing era cannot be treated as current merely because its signature still
verifies.

Signer custody is therefore an important operational trust boundary. Failure
modes include:

- theft of a signing key;
- a signer service authorizing values the community did not approve;
- use of the wrong chain or verifying contract;
- authorizations with deadlines that are too generous;
- delayed rotation after compromise;
- changed ERC-1271 validation behavior in a contract wallet;
- monitoring that fails to notice unexpected authorizations.

The public record should identify the signer, signer type, epoch, rotation
authority, emergency-revocation process, and exact typed-data software. It must
never contain a private key, seed, or recovery secret.

## Artist authority

Core stores the artist address and can verify an artist signature over a
specific collection state. That approval binds the artist address, current
collection-freeze manifest hash, maximum collection purchases, total supply,
and final-supply delay.

This is not a universal artist veto. In the reviewed source, an administrator
with the relevant authority can call `freezeCollection`; that function does not
itself demand a fresh artist signature. Metadata, preservation, and finality
records can also have their own writers and approval rules.

Reviewers should decide which irreversible actions require the artist’s current
signature, protocol governance, a public delay, a guardian veto window, or more
than one of those protections. Consent is meaningful only when the artist can
inspect the human-readable state behind the hash before signing.

## Record-family authorization

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
admitted once and cannot later be remapped.

Live authority providers are code-hash pinned. They fail closed when a call
fails, returns malformed data, or no longer has the expected runtime code
([`_providerAuthorizes`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRecordFamilyRegistry.sol#L298-L323)).

These checks answer **who may write**. They do not prove that a rights claim,
archive location, credential, or other record is true. An independent record is
self-attributed evidence from its caller, not endorsement by the artist, 6529,
or the protocol. [Metadata, Scripts, and
Dependencies](./metadata-scripts-and-dependencies#collection-metadata-separates-claims-by-purpose-and-authority)
explains each family in ordinary language.

The rules exist in source, but they are not yet a candidate configuration. The
still-missing evidence includes the admitted record types, live providers,
grants, runtime code hashes, rotation and revocation exercises, and independent
review.

## Governance actors

The source includes
[`StreamRoleRegistry.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRoleRegistry.sol)
and
[`StreamGovernanceExecutor.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamGovernanceExecutor.sol).
They separate proposing, cancelling, guardian intervention, and execution. The
executor can publish actions, enforce delays, execute matured calls, expire or
cancel actions, support guardian vetoes, and freeze selected selectors.

These are source implementations, not part of the current rehearsal’s deployed
contract set. Exact candidate roles, target catalog, delays, selector classes,
native-value limits, and bootstrap cutover remain readiness questions. The
[Governance, Pausing, and
Successors](./governance-pausing-and-successors) page explains how those powers
are intended to change over time.

## Module and successor authority

Stream does not use an ordinary proxy to rewrite the permanent Core in place.
Replaceable duties can move to new immutable contracts through explicit module
and successor records. The old contract and its history remain visible.

That makes the authority questions reviewable:

- who can register a module;
- which code hash and interface are required;
- who can change its status;
- who may declare a successor;
- which delay and veto rules apply;
- which liabilities remain with the predecessor;
- whether a successor can affect a supposedly frozen or permanent surface.

The accepted revenue-resolver validation adapter would be a private implementation
dependency, not a registered module or authority boundary. It would own no
state, funds, roles, or events. Replacing it would require a new resolver,
continuity proof, Registry V2 registration, and governed Core-pointer change.
That design would prevent a hidden adapter setter from becoming an undeclared
upgrade path.

## Permissionless callers

Some operations are safer when anyone can trigger them after every sensitive
value is fixed. Auction settlement after the end time is one example.

Permissionless does not mean consequence-free. The caller must not be able to
choose a recipient, amount, manifest, implementation, or other value that was
not already committed. Reviewers should trace every caller-supplied argument
and every mutable storage read used during execution.

## External trust boundaries

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
evidence requirement. Putting a hash onchain can make a result verifiable; it
cannot make the underlying service honest or continuously available.

## Why this authority model exists

A protocol meant to preserve art for decades cannot assume that one operator,
module, provider, or service will remain correct forever. Stream’s authority
model tries to make each power narrow, visible, revocable where appropriate,
and permanent only where permanence serves the artwork.

Removing a boundary usually combines the power into a broader key, hides it in
an operational service, or leaves the failure case undefined. The final system
should publish one machine-readable authority view containing the permanent
Core, current modules, predecessors and successors, code hashes, active roles,
pending actions, pause state, signer epochs, and permanently frozen selectors.

Deliberate separation should not excuse unresolved complexity. Duplicate paths,
unclear grants, or two components owning one invariant should be consolidated.

## What can fail

- a role reaches more functions than its name suggests;
- an alternate module bypasses a selector-scoped restriction;
- a signer authorizes a payload that differs from the community decision;
- an artist signature covers fewer facts than the product implies;
- an authority provider recognizes the wrong wallet or changes code;
- an administrator writes a record family it should not control;
- a guardian can author changes instead of only stopping them;
- a permissionless caller supplies a value that was supposed to be fixed;
- predecessor and successor modules accept the same authorization or liability;
- an external service fails without a visible owner or recovery path.

## Questions for reviewers

1. Which global roles should be eliminated before deployment?
2. Which actions require a delay, and how long should each delay be?
3. Which actions need both artist approval and protocol governance?
4. Can the pause system preserve bidder, minter, and withdrawal rights during an
   incident?
5. Is record-family authorization enforced for every high-impact mutation?
6. Should any governance executor be allowed to hold or send native value?
7. What public evidence should be mandatory before a successor module becomes
   active?
8. Which authority boundary can be simplified without combining powers or
   moving them into an opaque offchain service?
