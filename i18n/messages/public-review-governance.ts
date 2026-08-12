export const PUBLIC_REVIEW_GOVERNANCE_MESSAGES = {
  "publicReview.pages.changesEmergenciesAndFutureContracts.currentEditorial": `# Changes, Emergencies, and Future Contracts

## The short answer

Stream keeps its permanent Core at the same address. It does not silently replace the Core's code.

The reviewed source handles other changes in four main ways:

1. setup powers are closed after the initial contracts and roles are checked;
2. normal changes are published, delayed, and recorded before they can run;
3. an incident can pause one part of Stream without stopping everything; and
4. a new service contract can be registered without deleting the old contract or its history.

Different people can take different actions. An authorized proposer schedules a governance change. An authorized canceller can stop it. Anyone can execute the exact approved action during its execution window. Pause guardians can stop defined operations, while only the owner or an approved unpause administrator can restart them.

Some powers can also end permanently. That is stronger than a pause and needs its own delayed action and review.

**Current status:** These mechanisms exist in the pinned Solidity source. This review page does not prove that a launch setup uses them correctly. It also does not prove deployment, an independent audit, or safety. Exact launch roles, addresses, settings, and change ceremonies still need their own evidence.

[Who Can Do What](./roles-and-trust) explains the roles in more detail.

## From setup to normal operation

### What happens

A deployment process first creates the contracts. Temporary setup permissions then connect them, assign the first roles, and record the expected contract list.

Setup then closes in one direction:

1. deploy the contracts;
2. bind the role registry, Governance Root, Core, manifest records, code hashes, guardians, and other expected facts;
3. read the setup back and check it independently;
4. seal the system manifest;
5. transfer executor ownership to the Governance Root; and
6. prove that the temporary setup account has no route back in.

### What the current code does

The reviewed source implements this one-way setup lifecycle in [\`StreamGovernanceManifest\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamGovernanceManifest.sol#L12-L54) and [the bootstrap bind and seal functions](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamGovernanceExecutor.sol#L807-L893).

### What still needs proof

The code is only the mechanism. A wrong address, code hash, guardian list, or contract inventory can still be sealed as the official setup.

The launch record must show the exact values, an independent readback, and proof that the temporary authority is gone.

**Why this matters:** A one-way seal is useful only if the facts being sealed are correct.

## Changes announced in advance

### What happens

An authorized proposer publishes the full call data and schedules a change. The action waits for its required delay. An authorized actor may cancel it. A terminal-freeze guardian has a narrower power: the guardian may veto a terminal-freeze action before its execution time begins.

After the delay, anyone may execute the action during its open window. They cannot choose different call data, targets, values, or state commitments.

### What the current code records

The action binds:

- the ordered calls;
- each target and selector;
- the ETH value for each call;
- the full call-data hash;
- the old and new state commitments;
- the earliest execution time and expiry;
- the reason and manifest commitments; and
- a unique nonce.

The exact call data is published onchain before scheduling. At execution, the contract rebuilds the action ID, checks the stored call data again, checks the time window, and requires the exact ETH total.

See [scheduling](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamGovernanceExecutor.sol#L305-L403) and [execution checks](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamGovernanceExecutor.sol#L1156-L1295).

### What remains open

The mechanism exists, but open risk \`RISK-GOV-004\` still asks for end-to-end proof that every real governed action binds every sensitive value.

**Why this matters:** The action that runs later must mean exactly what people reviewed during the delay.

## How long each kind of change waits

The current executor uses six action classes:

| Class | ID | Minimum delay |
| --- | ---: | ---: |
| Immediate tightening | 0 | 0 |
| Delayed loosening | 1 | 48 hours |
| Terminal freeze | 2 | 72 hours |
| Pointer replacement | 3 | 48 hours |
| Funds recovery | 4 | 14 days |
| Successor declaration | 5 | 30 days |

Class ID \`6\` is retired and cannot be reused. Delayed actions must also leave an open execution window after the wait.

The IDs are defined in the [action-class interface](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/IStreamGovernanceExecutor.sol#L69-L79). The wait times are enforced by the [minimum-delay function](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamGovernanceBootstrap.sol#L299-L311).

The waits reflect the size of the decision:

- removing authority can be safe immediately;
- adding authority needs public notice;
- a permanent freeze needs time to inspect every path it closes;
- replacing a pointer needs both the old and new address to be visible;
- recovering funds needs proof that the funds are not owed to users; and
- a successor can change long-term duties, so the class has the longest wait.

**Important limit:** A class existing in the executor does not prove that every intended change uses the right class. The exact launch catalog must map each function to its required class.

## What each approved change must include

Reviewers should compare five views of every governed change:

1. the values shown when it is scheduled;
2. the values used to build its action ID;
3. the values checked when it runs;
4. any live storage read again when it runs; and
5. the values written to events.

If the action fills in a missing value from changeable storage at execution time, its result may differ from what people reviewed.

### Accepted ADR design and current code

[ADR 0017](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0017-raise-only-parameter-governance.md#L48-L71) is accepted for the pre-genesis production target. It says launch gas and time settings may change only through a delayed Governance V2 action:

- the delay is at least 48 hours;
- the new value must be higher than the old value;
- one action may increase it by no more than 2x;
- there is no lowering or emergency change path;
- zero governance authority makes the setting immutable; and
- permanent governance loss makes the setting read-only.

The reviewed parameter hosts implement those checks. If a value later needs to become smaller, the accepted design requires a reviewed successor host or a new deployment line. See the ADR's [governance-loss consequence](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0017-raise-only-parameter-governance.md#L140-L153).

An accepted ADR records the chosen design. It does not by itself prove that the full launch setup is connected, tested, audited, or safe.

The exact candidate parameter list and proposal-to-execution proof remain open.

## When a change can move ETH

### What the current code does

The executor includes the ETH value in each scheduled call. It checks the full batch total at execution. A payment to an address without contract code is allowed only if governance has approved that receiver.

See the [native receiver and value checks](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamGovernanceBootstrap.sol#L322-L417) and the [exact execution total](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamGovernanceExecutor.sol#L1228-L1279).

### What remains open

The source risk register still marks \`RISK-GOV-003\` as an open High risk. The concern is that the executor's power to move ETH may still be too broad or not limited enough for the launch setup.

The final design and accounting must show:

- which balances the executor may receive;
- which targets may receive ETH;
- whether values are capped or limited by action class;
- how bidder, seller, curator, randomness, and other user liabilities are excluded;
- which event proves each transfer; and
- how residual ETH can be recovered without taking money owed to users.

**Why this matters:** Binding an ETH value makes a transfer visible. It does not prove that the transfer is allowed or that the money is unclaimed.

## Stopping a scheduled change

There are two separate stop paths in the reviewed executor.

- An authorized cancellation actor may cancel a scheduled action before it expires.
- A terminal-freeze guardian may veto only a terminal-freeze action, and only before its execution time starts.

The guardian does not get to write a replacement action. A different payload must be scheduled and reviewed as a new action.

See [cancellation and terminal-freeze veto](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamGovernanceExecutor.sol#L407-L470).

This power also creates a duty outside the contracts. Someone must monitor scheduled actions, understand their full effect, and act before the veto window closes.

**Why this matters:** A veto button does not protect anyone if no one is watching it.

## Stopping one part of Stream during an incident

The shared admin contract defines six pause domains. The owner or a registered pause guardian can pause a domain. Only the owner or a registered unpause administrator can resume it.

| Domain | Stops | Not stopped by that domain |
| --- | --- | --- |
| Drop execution | New signed Drop execution | Withdrawals and unrelated reads |
| Mint | Legacy \`StreamMinter.mint\` and \`mintAndAuction\` | Existing ownership and the separate manager unless its phase is paused |
| Auction bid | New bids | Auction-credit withdrawals |
| Auction settlement | Winner and no-bid settlement entries | Bidder and seller credit withdrawals |
| Metadata mutation | Core, contract-metadata, collection-metadata, and preservation writes that use the shared pause check | Existing metadata reads |
| Randomness request | New requests in the current randomizer adapters | Existing request reads and provider callbacks with their own checks |

The six identifiers are in [\`StreamPauseDomains\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamPauseDomains.sol#L5-L12). Pause and resume authority are in [\`StreamAdmins.setPaused\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamAdmins.sol#L137-L157) and its [authority checks](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamAdmins.sol#L223-L229).

\`StreamMintManager\` also has a separate pause for each mint phase. Its owner controls that pause. It does not automatically follow the shared \`MINT\` domain. See [\`setPhasePaused\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMintManager.sol#L225-L239).

A launch setup must say whether those two mint pause systems are meant to stay separate.

**Why this matters:** An incident control should stop new harm without trapping withdrawals, refunds, or other safe exits.

## Emergency powers

Emergency authority is still authority. A faster path should have a smaller effect, stronger monitoring, and a clear route back to normal governance.

The current code separates several emergency actions:

- pause guardians can pause shared domains;
- unpause administrators can resume them;
- terminal-freeze guardians can veto a defined permanent action; and
- approved signer-function administrators can rotate the Drop signer, advance its epoch, or cancel a Drop.

These powers are not interchangeable. A pause guardian does not automatically have the power to resume, replace a module, move funds, or change artwork.

A safe launch catalog must list every emergency actor, exact function, scope, and recovery step. It must also prove that no emergency route:

- skips a required delay;
- moves unlimited ETH;
- hides a module change;
- alters an artist-approved payload; or
- blocks withdrawals or refunds.

## Powers that can end permanently

### What the current code does

Governance can classify a target function as a terminal-freeze operation. A scheduled call to that function must then use the terminal-freeze class. That class has a 72-hour wait and requires guardian coverage.

The target call performs the permanent state change. The executor does not make every equivalent path disappear automatically.

See the [selector classification](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamGovernancePolicy.sol#L300-L344) and [class enforcement](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamGovernanceBootstrap.sol#L398-L414).

### What still needs proof

Before calling a power permanently closed, reviewers must list every route that can make the same change:

- every executor;
- every privileged module;
- every direct function;
- every alias; and
- every successor path.

Then the final evidence must prove that each route is closed.

**Why this matters:** Closing one function is not a permanent guarantee if another function can do the same thing.

## Replacing a signing key

### What happens

The signed Drop path uses a signer address and a signer epoch. An epoch is a numbered signing period.

Changing the signer increases the epoch. An approved administrator can also increase the epoch without changing the signer. An authorization is valid only when its signer and epoch match the current values.

The current source supports both ordinary wallet signatures and ERC-1271 contract-wallet signatures. See [signer changes](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L219-L236), [authorization checks](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L561-L578), and [contract-wallet validation](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L769-L785).

### What reviewers should check

- Which old approvals stop working after an epoch change?
- Can an epoch ever be reused?
- What happens to an auction already registered under an older epoch?
- What is the emergency process after a key compromise?
- How does the public learn which signer and epoch were active?

An epoch makes the change visible in code. Operating evidence must still prove control of the new signer and show that the approved process was followed.

## Adding a service contract

### What the current code does

The module registry stores each registered contract's type, version, interface, gas limit, runtime code hash, manifest details, status, and timestamps.

Registration requires a delayed-loosening governance action. The registry checks the live code hash and ERC-165 interface before it stores the module. A later status change can mark the module active, deprecated, or revoked after an incident.

See [module registration](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamModuleRegistry.sol#L113-L220) and [status changes](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamModuleRegistry.sol#L223-L275).

### What the registry does not prove

A matching code hash proves which runtime code is at an address. It does not prove safe design, correct setup, or correct connections to the rest of Stream.

Reviewers must still check:

- whether the address can change its code;
- which interface is required;
- whether a deprecated or revoked module is still reachable another way;
- how clients find the module they should use; and
- whether old module records stay readable.

## Replacing a service contract

### What happens

A successor is a new contract that names the contract it follows. The old contract, its code, and its history remain onchain.

The module identity interface includes an immutable \`streamModuleSupersedes\` field for the immediate predecessor. The registry separately records the new module and its status. See [the module identity fields](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/IStreamModule.sol#L10-L35).

This is not a proxy upgrade. Registering a new module does not edit the old module or the permanent Core.

### Current code boundary

The executor defines a \`SUCCESSOR_DECLARATION\` action class with a 30-day minimum delay. However, the current module-registration function requires the \`DELAYED_LOOSENING\` class, whose minimum is 48 hours.

The pinned source therefore contains the 30-day class, the predecessor identity field, and the governed registry. Registration alone is not proof of a complete 30-day successor changeover. The launch catalog must show which exact action uses the successor class, which pointer or duties move, and when the new module becomes current.

### What a safe changeover must answer

- Which new actions go to the successor?
- Which reads, pending jobs, and debts stay with the old contract?
- Is state read from the old contract, copied, or recalculated?
- Can both contracts act at the same time?
- Which signatures, nonces, counters, and balances are shared?
- How do clients find the current module?
- Can the permanent Core reject an incompatible successor?
- What evidence proves continuity before any pointer changes?

A successor must not rewrite token history or any frozen artwork promise. If it changes served bytes, mint authority, money movement, or authoritative metadata, that effect must be stated directly.

**Why this matters:** A visible predecessor link preserves history, but it does not by itself prevent two contracts from sharing authority or spending the same liability.

## How changes stay visible

Stream is meant to last longer than a typical app release. Services can fail. Security assumptions can change. Some replaceable tools may need a successor.

The design separates:

- the permanent Core identity;
- replaceable service duties;
- temporary pauses for immediate harm;
- delayed changes that can be inspected before execution; and
- powers that can end permanently.

The safest change is one whose full result can be rebuilt from the published bytes before its waiting period begins.

The public record should show the old contract, new contract, governance action, changed duties, and any promises or debts that stay with the old contract.

## What can fail

- temporary setup power still works after sealing;
- the sealed manifest contains a wrong address, code hash, guardian list, or inventory root;
- a role can call more functions than its name suggests;
- a module has the wrong code or setup;
- a scheduled action leaves out ETH value or another sensitive input;
- execution reads changed storage and produces a different result;
- a guardian can do more than stop a defined action;
- a pause blocks safe exits or misses another call path;
- a permanent freeze leaves an alias open;
- an old and new module accept the same approval or spend the same debt; or
- a client follows a new module without checking the continuity record.

## Questions for reviewers

1. Does the role list show every action each role can take?
2. Should the governance executor ever be able to send ETH?
3. Are all sensitive values fixed and visible when an action is scheduled?
4. Which pause domains must preserve withdrawals and refunds?
5. Which exact action uses the 30-day successor class, and what makes the successor current?
6. What must remain true before, during, and after a successor changeover?
7. Which governance powers should end permanently before launch?
8. What is the smallest set of change powers that still allows public notice, emergency response, and a clear historical record?`,
} as const;
