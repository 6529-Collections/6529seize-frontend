# Governance, pausing, and successors

This review covers an incomplete, undeployed candidate; [Current Implementation and Readiness](./security-testing-and-known-limitations) is the authoritative record of what is connected, implemented, proposed, and still required.

Stream does not use a conventional upgradeable proxy for its permanent Core.
Governance cannot silently replace the Core's bytecode while leaving the same
address in place. Instead, it can recognize modules, schedule sensitive actions,
pause defined domains, freeze selected powers, and record explicit successors.

That choice is central to the protocol's long-term design. The identity and
history of the artwork remain anchored in the old contracts, while replaceable
duties can move to new, separately visible contracts. It does not eliminate
governance risk; it makes the change and the actor responsible for it easier to
inspect.

This page explains **how authority changes over time**. [Roles and
Trust](./roles-and-trust) explains who holds each capability.

## From bootstrap to governed operation

A new system needs temporary authority to deploy contracts, bind their
dependencies, assign initial roles, and prove that the intended graph exists.
That bootstrap power should not become a permanent alternate governor.

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

This ceremony is security-critical. A wrong address, code hash, guardian set, or
inventory root can become authoritative when sealing succeeds. The reviewed
source contains the mechanism; the complete candidate bindings, independent
readback, and non-local ceremony evidence remain readiness requirements.

## Module registration

The module registry records recognized contracts and their lifecycle status. A
registration can bind runtime code hash and interface expectations, so
governance cannot point clients at an unrelated address without leaving
evidence.

Reviewers should verify:

- when the code hash is measured;
- whether a target can be a proxy or metamorphic contract;
- which interface check is required;
- whether an inactive or deprecated module remains reachable through another
  path;
- whether status changes are delayed;
- whether historical module records remain queryable;
- how clients discover the current module without trusting a private index.

A matching code hash proves which runtime bytecode occupied an address at the
measured time. It does not prove that the code is safe, correctly initialized,
or connected to the intended dependencies.

## Scheduled actions

The governance executor can publish a proposed call, enforce its waiting period,
permit cancellation or guardian intervention, and allow execution after the
delay. Execution is safe only when the action observed during the delay is the
same action later applied.

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

The mechanism exists, but the review evidence does not yet prove complete
binding for every governed selector in a concrete candidate. That proof belongs
in the readiness record, not in a role name or design claim.

## Action classes and minimum delays

Governance classifies actions by consequence:

| Class                 |  ID | Minimum delay |
| --------------------- | --: | ------------: |
| Immediate tightening  |   0 |             0 |
| Delayed loosening     |   1 |      48 hours |
| Terminal freeze       |   2 |      72 hours |
| Pointer replacement   |   3 |      48 hours |
| Funds recovery        |   4 |       14 days |
| Successor declaration |   5 |       30 days |

Numeric IDs are append-only. Former class `6` is retired and cannot be reused.
Delayed classes also require an open execution window. The source constants and
delay rules are visible in the
[`action-class interface`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/IStreamGovernanceExecutor.sol#L69-L79)
and
[`delay function`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamGovernanceBootstrap.sol#L299-L311).

The distinctions matter:

- an action that only removes authority may be safe immediately;
- an action that expands authority should be visible before it takes effect;
- a terminal freeze needs time for artists and collectors to inspect the exact
  boundary;
- replacing a module pointer must expose both old and new contracts;
- recovering funds requires a precise proof that liabilities are not being
  withdrawn;
- declaring a successor changes the protocol's long-term interpretation and
  deserves the longest default review.

## Native-value authority

The source risk register identifies governance-executor native-value authority
as open High risk `RISK-GOV-003`. A generic executor that can send ETH controls
more than configuration. It can fund payable calls, move unaccounted balances,
or interact with targets in ways a selector label does not reveal.

The final design needs a precise answer for:

- which balances the executor may receive or control;
- whether native value is included in the scheduled-action commitment;
- whether value is capped, class-limited, or target-restricted;
- how bidder, seller, curator, randomness, and other liabilities are excluded;
- what event proves the transfer;
- whether an emergency path has the same power;
- how residual ETH is recovered without creating a general withdrawal key.

This is a code and accounting boundary, not merely an operational policy.

## Governed parameter binding

For each governed selector, reviewers should compare:

1. values visible when the action is scheduled;
2. values included in the action identifier;
3. values checked at execution;
4. mutable storage read again at execution;
5. values emitted in events.

If a mutable registry, global default, or caller-supplied argument fills a gap at
execution time, the delayed action can mean something different from what
reviewers saw.

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

This trades recovery flexibility for a smaller and more auditable authority
surface. The source hosts implement the rule. The complete candidate parameter
catalog and proposal-to-execution binding proof are still required. See
[`ADR 0017`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/docs/adr/0017-raise-only-parameter-governance.md#L48-L71)
and its
[`governance-loss consequence`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/docs/adr/0017-raise-only-parameter-governance.md#L140-L153).

## Guardian intervention

The guardian is a rapid defensive role. It can stop or veto a defined operation,
particularly during a timelock. It should not quietly become a second governor.

Where practical, guardian actions should be monotonic safety actions:

- pause a domain;
- veto a pending action;
- prevent a suspicious successor cutover.

Resuming operations, replacing modules, moving funds, or changing artwork should
normally require the full governance path. A guardian veto should prevent an
already-proposed payload; it should not substitute a different payload.

The guardian also creates an operational obligation. Someone must monitor
scheduled actions, understand their complete effect, and act within the veto
window. A veto power that is not watched is only theoretical.

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

`StreamMintManager` has a separate per-phase pause and does not consult the
global `MINT` domain. Any cutover must decide whether that distinction is
intentional and present it explicitly.

Pausing should preserve withdrawals and other safe user exits wherever possible.
Otherwise an incident-control mechanism can trap the users it is meant to
protect.

## Permanent selector freezes

Governance can make selected operations permanently unavailable. A selector
freeze is stronger than a temporary pause and must identify the complete
effective call surface, including aliases and module paths that reach the same
state change.

Freezing a selector in one executor does not help if another privileged module
can perform the same write directly. The final freeze evidence should enumerate
all equivalent mutation paths and prove they are closed.

## Signer epochs

Signed authorizations are tied to signer epochs. Rotation can invalidate prior
authorizations without confusing them with signatures issued by the new signer.

Reviewers should establish:

- which signatures become invalid after rotation;
- whether an epoch can ever be reused;
- how ERC-1271 contract-wallet signatures are checked;
- whether auctions registered under the prior epoch remain valid;
- what happens during emergency compromise;
- how the public learns which signer and epoch were active.

Epochs make a change visible. They do not prove that the new signer is correctly
controlled or that the signing service applies the community's policy.

## Explicit successor modules

A successor is a new immutable contract recognized as following an older
module. The predecessor, its bytecode, and its history remain onchain. Governance
records the transition instead of rewriting the old implementation behind a
proxy address.

That is valuable for art because a collector can distinguish:

- the contract that originally acted;
- the later contract recognized for future duties;
- the governance decision that connected them;
- the commitments and liabilities that remained with the predecessor.

A safe cutover must answer:

- which new actions route to the successor;
- which reads and liabilities remain with the predecessor;
- whether state is read, copied, or recomputed;
- whether both contracts can act concurrently;
- which signatures, nonces, counters, and balances are shared;
- how clients discover the current module;
- whether the permanent Core can reject an incompatible successor;
- what evidence proves continuity before the pointer changes.

A successor should not rewrite token history or silently relax an artwork
commitment. If it changes what bytes are served, who can mint, how funds move, or
which metadata is authoritative, that consequence must be stated directly.

Successor declaration therefore has a 30-day minimum delay in the source action
classes. The production checklist should treat cutover as a separate ceremony
with before-and-after invariants, independent readback, and a published
continuity record.

## Emergency actions

Emergency authority is still authority. A faster path should have a narrower
effect, stronger monitoring, and a clear route back to ordinary governance.

The code and public catalog should enumerate exactly what emergency actors can
pause, veto, rotate, or withdraw. A statement that a multisig "can fix things"
is not a security model.

Emergency recovery must not become:

- a shortcut around action delays;
- an unbounded native-value transfer;
- a hidden module replacement;
- a way to alter an artist-approved payload;
- a route that strands user withdrawals or refunds.

## Why this governance is intentionally explicit

Stream is designed for a much longer horizon than a typical application
release. Over that horizon, providers fail, cryptographic and operational
assumptions change, and some modules will need successors. Pretending nothing
will ever change would not make the system simpler; it would push change into
unrecorded social coordination, abandoned interfaces, or emergency keys.

The governance design therefore separates:

- the permanent identity that should not be rewritten;
- replaceable duties that may need a successor;
- temporary intervention that should stop harm without authoring policy;
- delayed decisions whose complete effects should be inspectable in advance;
- powers that can be surrendered permanently.

The standard for simplification is not fewer contracts or roles by itself. A
simplification is successful only if it preserves the same artistic,
operational, and security guarantees with a smaller effective authority surface.

The safest governance action is one whose complete effect can be simulated from
the published bytes before its delay begins.

## What can fail

- bootstrap authority remains an alternate governor after sealing;
- the system manifest binds a wrong address, code hash, or inventory root;
- a role reaches more selectors than its name suggests;
- a module is registered with wrong code or initialization;
- a scheduled action omits native value or another security-sensitive field;
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
