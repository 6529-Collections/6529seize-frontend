# Governance, pausing, and successors

Stream does not use a conventional upgradeable proxy for its permanent Core.
Instead, governance can recognize modules, schedule sensitive actions, pause
defined domains, and record successors. This avoids silently replacing the
Core's bytecode, but it does not remove governance risk.

The main components are
[`StreamModuleRegistry.sol`](https://github.com/6529-Collections/6529Stream/blob/e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8/smart-contracts/StreamModuleRegistry.sol),
[`StreamGovernanceExecutor.sol`](https://github.com/6529-Collections/6529Stream/blob/e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8/smart-contracts/StreamGovernanceExecutor.sol),
[`StreamRoleRegistry.sol`](https://github.com/6529-Collections/6529Stream/blob/e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8/smart-contracts/StreamRoleRegistry.sol),
and
[`StreamAdmins.sol`](https://github.com/6529-Collections/6529Stream/blob/e73d4b9cb15c3c868a76b99aa3f438d4e9e75cb8/smart-contracts/StreamAdmins.sol).

## Roles are capabilities

### IMPLEMENTED

The role registry associates accounts with protocol capabilities. The useful
review question is not “is this account an admin?” It is:

- which exact selectors can the account reach;
- on which modules or collections;
- whether the action is immediate or delayed;
- whether another party can veto it;
- whether the role can grant itself or another account more authority;
- how revocation and signer rotation work.

Role names are documentation. Effective authority comes from every call path,
registry check, fallback, executor, and module relationship.

## Module registration

### IMPLEMENTED

The module registry records recognized contracts and their status. Registration
can bind a code hash and interface expectations so that governance cannot point
at an unrelated address without leaving evidence.

Reviewers should verify:

- when code hash is measured;
- whether the target can be a proxy or metamorphic contract;
- which interface check is required;
- whether an inactive or deprecated module can still be called through another
  path;
- whether status changes are scheduled;
- whether historical module records remain queryable.

A code hash proves which runtime bytecode occupied an address at a particular
time. It does not prove that the bytecode is safe, correctly initialized, or
connected to the intended dependencies.

## Scheduled actions

### IMPLEMENTED

The governance executor schedules sensitive calls, enforces a delay, permits
cancellation or guardian intervention, and executes the bound action after its
waiting period.

The scheduled record needs to commit to:

- target;
- native value;
- calldata, including selector and arguments;
- predecessor or ordering requirements;
- earliest execution time;
- expiry;
- governing epoch or configuration;
- unique salt or nonce.

Execution must apply that exact record. It must not accept a fresh value or
calldata fragment that was not visible during the review delay.

## Native-value authority

### KNOWN LIMITATION

The repository's current risk register identifies governance executor
native-value authority as an open issue. A generic executor that can send ETH
has authority over more than contract configuration. It may move unaccounted
funds, fund arbitrary calls, or interact with payable targets in ways that are
hard to classify.

The release needs a precise answer for:

- which balances the executor may control;
- whether value is part of the scheduled action hash;
- whether value is capped or target-restricted;
- how liabilities are excluded;
- what event proves the transfer;
- whether an emergency path has the same power.

This is a code and threat-model question, not merely an operational policy.

## Governed parameter binding

### KNOWN LIMITATION

The current governance evidence does not yet prove that every governed action
binds every security-sensitive parameter from proposal through execution.

For each governed selector, reviewers should compare:

1. the values visible when the action is scheduled;
2. the values included in its identifier or signature;
3. the values checked during execution;
4. any storage read again at execution time;
5. the values emitted in events.

If a mutable registry, global default, or caller-supplied argument fills in a
missing field at execution, the delayed action can mean something different
from what reviewers saw.

## Guardian

The guardian is intended as a rapid defensive role. It can stop or veto defined
operations, particularly during a timelock.

A guardian should not quietly become a second governor. Its allowed actions
should be monotonic safety actions where practical:

- pause a domain;
- veto a pending action;
- prevent a suspicious successor cutover.

Resuming, replacing modules, moving funds, or changing artwork normally needs
the full governance path.

## Pause domains

### IMPLEMENTED

Stream uses domain-specific pausing rather than treating the whole protocol as
one switch. This can let ownership transfers continue while a mint or auction
path is investigated.

Every pause domain needs a published matrix:

| Domain | Stops | Does not stop | Who pauses | Who resumes |
| --- | --- | --- | --- | --- |
| Minting | New token creation paths | Existing token ownership unless stated | Defined guardian/governance role | Defined governance path |
| Sales | New sale execution or auction operations as specified | Unrelated metadata or transfers | Defined guardian/governance role | Defined governance path |
| Metadata | Defined mutation paths | Reads of existing metadata | Defined guardian/governance role | Defined governance path |
| Governance | Defined execution paths | Already permanent Core behavior | Defined emergency role | Explicit recovery path |

The final matrix must come from selector-level code inspection. The table above
states the required documentation shape, not a substitute for that inspection.

Pausing should not strand refunds, withdrawals, or other user exits unless that
tradeoff is explicit and justified.

## Selector freezes

### IMPLEMENTED

Governance can make selected operations unavailable permanently. A selector
freeze is stronger than a temporary pause and must identify the effective call
surface, including aliases or module paths that reach the same state change.

Freezing a selector in one executor does not help if another privileged module
can perform the same write directly.

## Signer epochs

Signed authorizations are tied to signer epochs. Rotating the signer can
invalidate prior authorizations without confusing them with signatures from the
new signer.

Reviewers should establish:

- which signatures become invalid after rotation;
- whether an epoch can ever be reused;
- how contract-wallet signatures are checked;
- whether auctions already registered under the prior epoch remain valid;
- what happens during emergency compromise;
- how the public learns which epoch was active.

## Successor modules

### IMPLEMENTED

A successor is a new contract recognized as following an older module. The old
contract and its history remain onchain. Governance records the transition
instead of mutating the old bytecode.

That is only safe when cutover behavior is explicit:

- which new actions route to the successor;
- which old liabilities remain with the predecessor;
- how state is read or migrated;
- whether both modules can act concurrently;
- which signatures and nonces are shared;
- how clients discover the current module;
- whether the permanent Core can reject an incompatible successor.

The production deployment checklist should treat successor cutover as a
separate ceremony with before-and-after invariants.

## Emergency actions

Emergency authority is still authority. A faster path should have a narrower
effect, stronger monitoring, and a clear route back to ordinary governance.

Reviewers should reject vague statements that an emergency multisig “can fix
things.” The code should enumerate what it can pause, veto, rotate, or withdraw,
with exact limits.

## What we think

The non-proxy model is legible only if the module graph and authority graph are
published together. Users should be able to see the permanent Core, current
modules, predecessors, successors, code hashes, active roles, pending actions,
pause state, and frozen selectors from one read-only view.

The safest governance action is one whose complete effect can be simulated from
the scheduled bytes before the delay begins.

## What can fail

- a role reaches more selectors than its name suggests;
- a module is registered with the wrong code or initialization;
- a scheduled action omits value or another security-sensitive parameter;
- execution rereads mutable state and changes the reviewed meaning;
- a guardian can author changes instead of only stopping them;
- a pause blocks user exits or misses an alternate call path;
- a selector freeze has an alias bypass;
- predecessor and successor modules accept the same authorization or spend the
  same liability.

## Questions for reviewers

1. Is every effective role expressible as a selector-level capability list?
2. Should the governance executor ever be able to send arbitrary native value?
3. Are all action parameters fixed at scheduling time?
4. Which pause domains must preserve withdrawals and refunds?
5. What invariants must hold before a successor becomes current?
6. Which governance powers, if any, should become permanently unavailable after
   launch?
