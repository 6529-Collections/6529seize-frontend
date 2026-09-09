## Changes have specific permissions

The permanent Core is not an upgradeable proxy. Surrounding contracts can be replaced through governed references. Each operation has its own scope, authority, and timing; there is no blanket promise that an admin can change or stop everything.

**Built in this code:** a governance executor, role and module registries, action commitments, and Core-side checks. **Agreed but unfinished:** the exact launch catalog, identities, settings, replacement continuity, and non-local operating evidence must be completed.

## A governed change binds the actual transition

Core checks the active governance context, including the action, target, scope, old state, and new state. Tightening a rule, loosening it, and making a terminal change are different action classes.

The executor now has a closed catalog of permitted actions and native-value policies. The catalog is bound during bootstrap; scheduling and execution verify its commitments and selected entries. It should not be described as an unrestricted arbitrary-call authority.

See [Core transition checks](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/core/StreamCore.sol#L990), [executor](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/domains/governance/StreamGovernanceExecutor.sol), and [action catalog](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/domains/governance/StreamGovernanceActionPolicy.sol).

## What can be paused

The older admin contract has separate pause domains for Drop execution, minting, auction bids, auction settlement, metadata changes, and randomness requests. A pause works only where the called code checks that domain. The mint manager has its own phase controls, and the permanent Core has collection status controls.

Pausing a sale does not imply stopping every token transfer, read, withdrawal, or unrelated contract. An incident plan must name the exact operations it can stop and the exits that remain available. Unpausing has its own authority rules.

See [admin pause](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/domains/access/StreamAdmins.sol#L149), [manager](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/domains/mint/StreamMintManager.sol), and [Core collection status](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/core/StreamCore.sol#L335).

## Replace a module without losing history

Core pointer changes check the registered target and its expected identity. Pointer freezing is separate from collection freezing. A pointer change is not evidence that data, claims, balances, or consent have been migrated correctly.

The accepted design requires continuity for the state each replacement owns. Reviewers must follow unfinished mint operations, consumed permissions, owed payments, artist records, and finality evidence through the exact changeover. A delay alone does not prove a safe replacement.

See [pointer update](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/core/StreamCore.sol#L661), [pointer freeze](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/smart-contracts/core/StreamCore.sol#L715), and [long-term architecture](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/stream-long-term-architecture.md).

## Questions for reviewers

Can a role perform a broader action than its public description suggests? Does execution reject a changed target or changed state? Can an emergency response preserve withdrawals and evidence? Is every proposed replacement accompanied by a complete continuity plan?
