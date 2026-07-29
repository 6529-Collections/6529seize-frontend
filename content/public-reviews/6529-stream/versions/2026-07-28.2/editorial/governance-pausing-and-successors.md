# Governance, pausing, and successors

`StreamCore`—called Core here—is the permanent token and collection identity
contract. It is not a conventional upgradeable proxy, so governance cannot
silently replace its bytecode while keeping the same address. The reviewed
source instead separates powers that can be paused, scheduled, permanently
surrendered, or moved to a separately visible successor contract.

Under the Governance V2 source design, consider a randomness module that must
eventually be replaced. The new contract can be published with its code and
interface visible. Governance can schedule a successor declaration, giving
reviewers time to compare old and new behavior. A guardian can veto the pending
action, but cannot substitute a different module. After the delay, anyone can
trigger the already fixed action. The old contract, its bytecode, and its
history remain onchain.

That is the intended source model. The current rehearsal uses `StreamAdmins` for
its administrative and pause layer. It does not deploy Governance V2, its role
registry, delayed executor, selector freezes, or successor machinery.

## One deployment or several is a separate decision

The governance machinery can describe authority and successor relationships
inside one Stream deployment. It does not decide whether the main 6529 Stream,
6529 Network Museum accession collections, or another community's 1/1 program
should share a Core.

Separate deployments would remain separate security and governance domains
even if an onchain registry later made them discoverable together. Such a
registry could publish claimed relationships, code versions, and operators; it
would not by itself make another deployment canonical, audited, or governed by
6529 Network.

## Why governance is explicit

Artwork identity may need to last longer than any provider, operator, or piece
of infrastructure. Pretending nothing will ever change would push future change
into abandoned interfaces, emergency keys, or unrecorded social coordination.
Using a proxy would make change easy but could replace behavior beneath the same
address.

The source design instead separates:

- permanent identity that should not be rewritten;
- duties that may move to a visible successor;
- rapid intervention that can stop harm without creating policy;
- delayed actions whose complete effects can be inspected;
- powers that can be surrendered permanently.

This does not eliminate governance risk. It makes the actor, action, delay, and
new code easier to inspect.

The simplification test is the effective authority surface, not the number of
contracts. A smaller design is better if it preserves the same artistic,
operational, and security guarantees. A hidden upgrade, unbounded emergency
multisig, or private coordination process is not less governance; it is less
visible governance.

## What the source model protects—and what remains unresolved

The source mechanisms are designed to:

- keep bootstrap authority from becoming a permanent alternate governor;
- bind the complete meaning of delayed actions before the waiting period;
- separate proposing, vetoing, cancelling, and executing;
- pause only the affected domain while preserving safe exits;
- make selected powers permanently unavailable;
- preserve predecessor history during successor cutover.

The current evidence does not yet prove a complete candidate configuration.
Open work includes exact role and contract-function inventories, native-value
constraints, per-function parameter binding, module and code-hash catalogs,
guardian monitoring, pause semantics across both mint lanes, and independently
rehearsed bootstrap and successor ceremonies. The exact source sections below
use Solidity’s term *selector* for a contract function’s compact identifier.

[Roles and Trust](./roles-and-trust) explains who holds each capability. This
page explains how those capabilities change over time.

## From bootstrap to governed operation

A new system needs temporary authority to deploy contracts, bind dependencies,
assign roles, and prove that the intended graph exists. That bootstrap power
should not remain as another governor.

The intended transition is:

1. deploy the immutable contracts;
2. bind the expected role registry, Governance Root, Core, system-manifest
   satellite, code hashes, guardian set, trigger set, manifest, and inventory
   root;
3. independently verify that configuration;
4. seal the system manifest;
5. transfer executor ownership to the Governance Root;
6. leave no hidden route back to the bootstrap authority.

The source implements this one-way lifecycle in
[`StreamGovernanceManifest`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamGovernanceManifest.sol#L12-L54)
and
[`bindSystemManifestBootstrap` / `sealSystemManifestBootstrap`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamGovernanceExecutor.sol#L807-L893).

A wrong address, code hash, guardian set, or inventory root can become
authoritative when sealing succeeds. Exact bindings should therefore be read
back independently during a non-local sealing ceremony.

## Module registration

The module registry records recognized contracts and lifecycle status. A
registration can bind runtime code hash and interface expectations, so directing
clients to an unrelated address leaves evidence.

Reviewers should verify:

- when the code hash is measured;
- whether a target can be a proxy or metamorphic contract;
- which interface check is required;
- whether an inactive or deprecated module remains reachable another way;
- whether status changes are delayed;
- whether historical module records remain queryable;
- how clients discover the current module without a private index.

A matching code hash proves which runtime bytecode occupied an address at the
measured time. It does not prove that the code is safe, correctly initialized,
or connected to the intended dependencies.

## Scheduled actions

The Governance V2 executor source can publish a proposed call, enforce its
delay, permit cancellation or guardian intervention, and allow execution after
the delay. Execution is safe only if the reviewed action and the applied action
are the same.

For every governed selector, the scheduled record must commit to:

- target;
- native value;
- calldata, including selector and every argument;
- predecessor or ordering requirements;
- scope;
- old-state and new-state commitments where required;
- earliest execution time;
- expiry;
- governing epoch or configuration;
- reason and manifest;
- a unique salt or nonce.

Execution must use that exact record. It must not accept a fresh recipient,
value, address, or calldata fragment that was invisible during review.

The current source binds target, native value, selector, calldata hash, scope,
old-state hash, new-state hash, earliest execution, expiry, reason, and manifest.
It publishes the calldata preimage onchain. Authorized actors schedule or
cancel; execution is permissionless inside the committed window. See the
[`scheduled-call binding`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamGovernanceExecutor.sol#L305-L403).

The schedule path takes the executor's current nonce, includes it in the action
ID, and then increments it. The action ID also binds the chain, executor
address, and action class. See
[`nonce consumption`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamGovernanceExecutor.sol#L938-L977)
and
[`action-identity hashing`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamGovernanceBootstrap.sol#L73-L108).
The current generic record has no separate predecessor field or governing
configuration epoch. Any ordering or configuration dependency must therefore
be encoded in the call, scope, old-state, new-state, or manifest commitments for
that selector. Complete selector-by-selector evidence for those dependencies
remains a release requirement.

Without complete binding for every governed selector, the reviewed action can
differ from the executed one.

## Action classes and minimum delays

Governance V2 classifies actions by consequence:

| Class                 |  ID | Minimum delay |
| --------------------- | --: | ------------: |
| Immediate tightening  |   0 |             0 |
| Delayed loosening     |   1 |      48 hours |
| Terminal freeze       |   2 |      72 hours |
| Pointer replacement   |   3 |      48 hours |
| Funds recovery        |   4 |       14 days |
| Successor declaration |   5 |       30 days |

Numeric IDs are append-only. Former class `6` is retired and cannot be reused.
Delayed classes also require an open execution window. The constants and delay
rules are visible in the
[`action-class interface`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/IStreamGovernanceExecutor.sol#L69-L79)
and
[`delay function`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamGovernanceBootstrap.sol#L299-L311).

The categories express different risks:

- removing authority may be safe immediately;
- expanding authority should be visible before it takes effect;
- terminal freeze needs time to inspect the exact boundary;
- pointer replacement must expose old and new contracts;
- funds recovery needs proof that liabilities are not withdrawn;
- successor declaration changes the protocol’s long-term interpretation and
  receives the longest default review.

## Native-value authority

The source risk register identifies governance-executor native-value authority
as open High risk `RISK-GOV-003`. A generic executor that can send ETH controls
more than configuration. It can fund payable calls, move unaccounted balances,
or interact with targets in ways a selector label does not reveal.

The final design needs a precise answer for:

- which balances the executor may receive or control;
- whether native value is included in the action commitment;
- whether value is capped, class-limited, or target-restricted;
- how bidder, seller, curator, randomness, and other liabilities are excluded;
- what event proves the transfer;
- whether an emergency path has the same power;
- how residual ETH is recovered without a general withdrawal key.

This is a code and accounting boundary, not merely an operational policy.

## Governed parameter binding

For each governed selector, reviewers should compare:

1. values visible when the action is scheduled;
2. values included in the action identifier;
3. values checked at execution;
4. mutable storage read again at execution;
5. values emitted in events.

If a mutable registry, global default, or caller argument fills a gap during
execution, the delayed action can mean something different from what reviewers
saw.

The accepted policy for launch gas and time parameters is deliberately one-way:

- only a Governance V2 `DELAYED_LOOSENING` action may change a value;
- the minimum delay is 48 hours;
- the new value must be strictly higher;
- one action may raise it by no more than 2x;
- there is no lowering, emergency raise, probe repair, or permissionless
  mutation path;
- zero governance authority makes the host immutable;
- permanent governance loss leaves values readable but unchangeable;
- tightening later requires a reviewed successor host or deployment line.

This trades recovery flexibility for a smaller, more auditable authority
surface. The source hosts implement the rule, but without a complete parameter
catalog and proposal-to-execution proof, that rule does not establish the
candidate’s effective authority surface. See
[`ADR 0017`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/docs/adr/0017-raise-only-parameter-governance.md#L48-L71)
and its
[`governance-loss consequence`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/docs/adr/0017-raise-only-parameter-governance.md#L140-L153).

## Guardian intervention

The guardian is a rapid defensive role. It can stop or veto a defined
operation, especially during a timelock. It should not become a second governor.

Where practical, guardian actions should only move toward safety:

- pause a domain;
- veto a pending action;
- prevent a suspicious successor cutover.

Resuming operations, replacing modules, moving funds, or changing artwork should
normally require the full governance path. A guardian veto should stop a
proposed payload, not substitute another one.

This role creates an operational obligation. Someone must monitor scheduled
actions, understand their complete effect, and act within the veto window. An
unwatched veto power is only theoretical.

## Pause domains

`StreamAdmins` defines six pause domains in the current source. The owner or a
registered pause guardian can pause. The owner or a registered unpause
administrator can resume.

| Domain             | Stops                                                                                               | Does not stop                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Drop execution     | New signed Drop execution                                                                           | Withdrawals and unrelated reads                                            |
| Mint               | Legacy `StreamMinter.mint` and `mintAndAuction`                                                     | Existing ownership and the separate manager unless its phase is paused     |
| Auction bid        | New bids                                                                                            | Auction-credit withdrawals                                                 |
| Auction settlement | Winner and no-bid settlement entries                                                                | Bidder and seller credit withdrawals                                       |
| Metadata mutation  | Core, contract-metadata, collection-metadata, and preservation writes that consult the shared check | Existing metadata reads                                                    |
| Randomness request | New requests in the current randomizer adapters                                                     | Existing request reads and provider callbacks governed by their own checks |

The identifiers are in
[`StreamPauseDomains`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamPauseDomains.sol#L5-L12).
Pause and resume authority are implemented in
[`StreamAdmins.setPaused`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamAdmins.sol#L137-L157)
and its
[`authority checks`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamAdmins.sol#L223-L229).

`StreamMintManager` has a separate per-phase pause and does not consult global
`MINT`. Any cutover must decide whether that distinction is intentional and
present it explicitly.

Pauses should preserve withdrawals and other safe exits wherever possible.
Otherwise incident control can trap the users it is meant to protect.

## Permanent selector freezes

The Governance V2 source can make selected operations permanently unavailable.
A selector freeze is stronger than a pause and must cover the complete
effective call surface, including aliases and module paths that reach the same
state change.

Freezing a selector in one executor does not help if another privileged module
can perform the same write directly. Final freeze evidence should enumerate all
equivalent mutation paths and prove they are closed.

## Signer epochs

Signed authorizations are tied to signer epochs. Rotation can invalidate prior
authorizations without confusing them with signatures from the new signer.

Reviewers should establish:

- which signatures become invalid after rotation;
- whether an epoch can ever be reused;
- how ERC-1271 contract-wallet signatures are checked;
- whether auctions registered under the prior epoch remain valid;
- what happens during emergency compromise;
- how the public learns which signer and epoch were active.

Epochs make a change visible. They do not prove that the new signer is correctly
controlled or that its service applies community policy.

## Explicit successor modules

In the Governance V2 source, a successor is a new immutable contract recognized
as following an older module. The predecessor, bytecode, and history remain
onchain. Governance records the transition instead of rewriting the old
implementation behind a proxy address.

A collector can therefore distinguish:

- the contract that originally acted;
- the later contract recognized for future duties;
- the governance decision that connected them;
- commitments and liabilities that stayed with the predecessor.

A safe cutover must answer:

- which new actions route to the successor;
- which reads and liabilities remain with the predecessor;
- whether state is read, copied, or recomputed;
- whether both contracts can act concurrently;
- which signatures, nonces, counters, and balances are shared;
- how clients discover the current module;
- whether permanent Core can reject an incompatible successor;
- what evidence proves continuity before the pointer changes.

A successor should not rewrite token history or silently relax an artwork
commitment. If it changes served bytes, mint authority, value flow, or
authoritative metadata, that consequence must be stated directly.

Successor declaration has a 30-day minimum delay in the source action classes.
The delay makes cutover a separate ceremony with before-and-after invariants,
independent readback, and a published continuity record.

## Emergency actions

Emergency authority is still authority. A faster path should have a narrower
effect, stronger monitoring, and a clear route back to ordinary governance.

The code and public catalog should enumerate exactly what emergency actors can
pause, veto, rotate, or withdraw. Saying that a multisig “can fix things” is not
a security model.

Emergency recovery must not become:

- a shortcut around action delays;
- an unbounded native-value transfer;
- a hidden module replacement;
- a way to alter an artist-approved payload;
- a route that strands user withdrawals or refunds.

## Why this governance is intentionally explicit

Over a long artwork horizon, providers fail and technical or operational
assumptions change. The source design records how replaceable duties move while
keeping permanent identity and historical contracts visible.

The safest governance action is one whose complete effect can be simulated from
published bytes before its delay begins. That standard also exposes
unnecessary complexity: if two paths can perform the same sensitive action, if
a scheduled action rereads mutable inputs, or if a guardian can author policy,
the boundary has failed.

## What can fail

- bootstrap authority remains an alternate governor after sealing;
- the system manifest binds a wrong address, code hash, or inventory root;
- a role reaches more selectors than its name suggests;
- a module is registered with wrong code or initialization;
- a scheduled action omits native value or another sensitive field;
- execution rereads mutable state and changes the reviewed meaning;
- a guardian can author a replacement instead of only vetoing;
- a pause blocks user exits or misses an alternate call path;
- a selector freeze has an alias bypass;
- a predecessor and successor accept the same authorization or spend the same
  liability;
- clients follow a new module without verifying the governed continuity record.

## Questions for reviewers

1. Is every effective role expressible as a selector-level capability list?
2. Should the governance executor ever be able to send native value?
3. Are all action parameters fixed and visible at scheduling time?
4. Which pause domains must preserve withdrawals and refunds?
5. What invariants must hold before a successor becomes current?
6. Which governance powers should become permanently unavailable after launch?
7. Is 30 days enough notice for a successor that changes an artwork-affecting
   duty?
8. Which governance mechanism can be removed without creating an opaque upgrade,
   emergency, or offchain coordination path?
