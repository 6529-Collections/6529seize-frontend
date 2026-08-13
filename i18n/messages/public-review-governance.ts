export const PUBLIC_REVIEW_GOVERNANCE_MESSAGES = {
  "publicReview.pages.changesEmergenciesAndFutureContracts.currentEditorial": `# Changes, Emergencies, and Future Contracts

## The short answer

Stream's main contract stays at the same address and cannot be quietly replaced with different code.

The reviewed code has four main controls:

1. Temporary setup access ends after the contracts and roles are checked.
2. Planned updates are saved on the blockchain and usually wait before they can run.
3. Approved guardians can pause one affected part of Stream without stopping everything.
4. New helper contracts can be added without deleting old contracts or their history.

Different approved accounts submit, stop, pause, and restart changes. After a waiting period, anyone can run an approved update, but they cannot change it.

Some admin powers can also be removed forever. That requires its own delayed update.

**Current status:** These controls exist in the pinned code. This page does not prove that the contracts are deployed, independently audited, or safe. A real launch record must confirm the contract addresses, roles, settings, and setup steps.

[Who Can Do What](./roles-and-trust) explains the roles in more detail.

## From setup to normal operation

### What happens

A deployment process creates the contracts. A temporary setup account then connects them and gives approved accounts their first roles.

Before setup ends, the team must:

1. record the expected contracts, code fingerprints, roles, and guardians;
2. check those details independently;
3. lock the official setup record;
4. move control to Stream's normal governance system; and
5. permanently remove the temporary account's special access.

### What the current code does

The current code records and locks the setup, moves control to normal governance, and closes the temporary access. See [\`StreamGovernanceManifest\`](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamGovernanceManifest.sol#L12-L54) and [the setup lock functions](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamGovernanceExecutor.sol#L807-L893).

### What still needs proof

The code can lock wrong information. The launch record must therefore show the saved values, an independent check, and proof that the temporary account lost access. This matters because a locked setup may be hard or impossible to fix.

## Changes announced in advance

### What happens

An approved account saves the full update on the blockchain, including when it may run. The update waits for review. An approved canceller can stop it. If it removes a power forever, a special guardian can also block it before the waiting period ends.

After the wait, anyone can run the exact approved update during its allowed time. They cannot change it.

### What the current code records

The saved update includes the ordered calls, their exact instructions and ETH values, the expected state before and after, the time window, the public reason, the setup record, and a unique number.

When someone runs the update, the code rebuilds its identity and checks every saved instruction again. It also checks the time window and the exact total amount of ETH.

See [scheduling](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamGovernanceExecutor.sol#L305-L403) and [execution checks](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamGovernanceExecutor.sol#L1156-L1295).

### What remains open

The launch catalog must still show which rules apply to each real update. The update that runs later must be exactly what people reviewed.

## How long each kind of change waits

Stream uses six types of update. The delay shown below is the shortest allowed wait. An update may wait longer.

| Update type | ID | Shortest wait |
| --- | ---: | ---: |
| Reduce a power or risk | 0 | No wait |
| Add or reopen a power | 1 | 48 hours |
| Remove a power forever | 2 | 72 hours |
| Change which helper contract Stream uses | 3 | 48 hours |
| Recover ETH | 4 | 14 days |
| Announce a successor contract | 5 | 30 days |

Type ID 6 was retired before launch and cannot be reused. Every delayed update must leave time for execution after the wait.

The IDs are defined in the [action-class interface](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/IStreamGovernanceExecutor.sol#L69-L79). The wait times are enforced by the [minimum-delay function](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamGovernanceBootstrap.sol#L299-L311).

Longer waits apply to changes that are harder to undo. The launch catalog must still map every governed function to the correct update type.

## What each approved change must include

Reviewers should compare what was announced, what identifies the update, what execution checks, and what the final blockchain record shows. If the saved update leaves out an important value, execution could use a newer value that was never reviewed.

### Special rule for gas and time settings

[ADR 0017](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0017-raise-only-parameter-governance.md#L48-L71) is an accepted design for Stream's gas and time limits:

- changes wait at least 48 hours;
- values can only increase and can at most double in one update;
- there is no emergency shortcut or lowering path; and
- without governance, values stay readable but cannot change.

The current gas and time setting contracts enforce these rules. If a value ever needs to become smaller, Stream needs a reviewed replacement contract or a new deployment. See the ADR's [rule for permanent governance loss](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0017-raise-only-parameter-governance.md#L140-L153).

This accepted ADR sets the design. Open high risk RISK-GOV-004 says the planned production settings still need deployment evidence: the correct contract, starting value, fixed minimum, and supporting measurements.

## When a change can move ETH

### What the current code does

ETH is the currency used for payments on Ethereum. The code saves how much ETH each call will send, and execution must receive that exact total.

If the ETH is sent directly to a wallet instead of a contract, that wallet must already be on an approved receiver list.

See the [native receiver and value checks](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamGovernanceBootstrap.sol#L322-L417) and the [exact execution total](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamGovernanceExecutor.sol#L1228-L1279).

### What remains open

Open high risk RISK-GOV-003 says this power may still be too broad for launch. The launch plan must limit where ETH comes from, who can receive it, how much can move, and how ETH owed to users stays protected. A visible transfer is not automatically a safe transfer.

## Stopping a scheduled change

There are two ways to stop a planned update:

- An approved canceller can stop any scheduled update before its allowed time ends.
- A permanent-removal guardian can block only an update that removes a power forever. The guardian must act before that update becomes available to run.

Neither role can edit the update. A replacement must start the review process again.

See [cancellation and terminal-freeze veto](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamGovernanceExecutor.sol#L407-L470).

The launch plan must name who watches updates and who can act before each deadline.

## Stopping one part of Stream during an incident

Stream has six separate pause areas, not one switch for everything. The main admin or an approved guardian can pause an area. Only the main admin or an approved restart account can resume it.

| Pause switch | What it stops | What still works |
| --- | --- | --- |
| Signed Drops | New signed Drop actions | Withdrawals and unrelated reads |
| Older mint system | New mints and mint-and-auction actions in StreamMinter | Existing token ownership and the newer mint manager |
| Auction bids | New bids | Withdrawing auction credit |
| Auction settlement | New winner and no-bid settlement actions | Bidder and seller credit withdrawals |
| Metadata changes | New writes to metadata and preservation records that use this pause | Reading existing metadata |
| Randomness requests | New requests for randomness | Reading old requests and processing provider replies under their own checks |

The six switches are defined in [StreamPauseDomains](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamPauseDomains.sol#L5-L12). The pause and restart rules are in [StreamAdmins.setPaused](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamAdmins.sol#L137-L157) and its [permission checks](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamAdmins.sol#L223-L229).

The newer StreamMintManager also has a separate owner-controlled pause for each mint phase. It does not automatically follow the shared mint pause. See [the mint phase pause](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamMintManager.sol#L225-L239).

The accepted [admin and governance ADR](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0004-admin-governance.md#L114-L155) says pauses must stay narrow. The launch plan must explain the separate mint pauses and confirm that withdrawals, refunds, and other safe exits remain available.

## Emergency powers

The current code separates emergency jobs:

- a pause guardian can stop one of the six shared areas;
- a restart account can turn that area back on;
- a permanent-removal guardian can block a planned permanent action; and
- a signer administrator can replace the Stream Drop signing key, invalidate older approvals, or cancel one approval.

These jobs do not grant one another. For example, permission to pause does not include permission to restart, move ETH, replace a helper contract, or change artwork. The public role list must name each account, its exact powers, and how normal operation is restored.

## Powers that can end permanently

### What the current code does

Stream can mark certain functions as actions that remove a power forever. Such an update must use the permanent-removal type, wait at least 72 hours, and have special guardians in place.

The called function makes the permanent change. The governance contract only checks that the correct wait and guardian rules were used. It does not automatically close every other function that could make the same change.

See [how functions are marked for permanent removal](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamGovernancePolicy.sol#L300-L344) and [how the update type is enforced](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamGovernanceBootstrap.sol#L398-L414).

### What still needs proof

Before calling a power permanently removed, reviewers must check every governance contract, helper contract, direct function, alternate route, and future replacement path that could do the same job. Every route must be closed.

## Replacing a signing key

### What happens

Stream uses an approved signing key for signed Drops. Each approval records the signer and a signer period, which is a number that separates older approvals from newer ones.

Replacing the signing key starts a new signer period. An approved administrator can also start a new period without changing the key. This is useful after a security concern because approvals from older periods stop matching the current settings.

An approval works only when both values match the current settings. The code accepts signatures from an ordinary wallet or a compatible contract wallet. See [signer changes](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L219-L236), [approval checks](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L561-L578), and [contract-wallet checks](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamDrops.sol#L769-L785).

### What reviewers should check

- Which old approvals and active auctions are affected by a new signer period?
- Can an old period ever be reused?
- If a key is stolen, who changes it and how is the new key checked?

## Adding a service contract

### What the current code does

A service contract means a helper contract that performs one part of Stream's work.

Stream keeps an official list of helper contracts. It records each helper's address, type, version, supported functions, gas limit, code fingerprint, setup records, status, and change time.

Adding a helper contract requires a planned governance update with at least a 48-hour wait.

Before adding it, the registry checks that code exists at the address, that its code fingerprint matches the expected code, and that it supports the required functions.

See [adding a helper contract](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamModuleRegistry.sol#L113-L220) and [changing its status](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/StreamModuleRegistry.sol#L223-L275).

### What the registry does not prove

A matching code fingerprint proves which code was found during registration. It does not prove that the helper is safe, set up correctly, or actually used. Reviewers must also check whether its code can change, whether old or revoked helpers remain reachable, and how apps find the current helper.

## Replacing a service contract

### What happens

A successor is a newer helper contract that names the older contract it follows. The older contract and its history remain on the blockchain.

The accepted [upgrade and redeployment ADR](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0007-upgrade-redeployment.md#L85-L118) says Stream uses new contract deployments instead of quietly replacing code inside old contracts. It also says old state does not move automatically.

The accepted [module identity decision](https://github.com/{sourceRepository}/blob/{sourceCommit}/docs/adr/0009-protocol-v1-open-question-resolutions.md#L59-L78) requires every helper contract to report its type, version, code facts, and the contract it follows.

The current module interface uses streamModuleSupersedes to name the immediate older contract. The registry separately records the newer contract and its status. See [the module identity fields](https://github.com/{sourceRepository}/blob/{sourceCommit}/smart-contracts/IStreamModule.sol#L10-L35).

Adding the newer contract does not change the older contract or Stream's main contract. It also does not automatically make Stream use the newer contract.

### Current code boundary

The governance code has a successor-announcement update type with a 30-day minimum wait.

However, adding a helper contract to the registry uses a different update type with a 48-hour minimum wait.

These are separate mechanisms. The current code does not show one complete 30-day changeover. Registering a helper does not prove that Stream has switched to it.

The launch plan must show:

- the exact action that uses the 30-day wait;
- which duties and contract reference move; and
- when the newer contract becomes current.

### What a safe changeover must answer

- Which work, data, unfinished jobs, and debts stay with the older contract?
- Can both contracts act, accept the same approval, or spend the same ETH?
- How do apps find the current contract?
- Can Stream reject an incompatible replacement?
- What proves that nothing important is lost during the switch?

A successor must not rewrite token history or a frozen promise. Naming the older contract preserves history, but does not prevent both contracts from holding the same power or trying to use the same ETH.

## How changes stay visible

The design keeps these parts separate:

- the permanent identity in Stream's main contract;
- jobs performed by replaceable helper contracts;
- temporary emergency pauses;
- planned updates that wait for public review; and
- admin powers that can be removed forever.

The public update should be detailed enough for another person to work out the result. A contract replacement should name both contracts, the approved update, the work that moves, and anything that stays with the older contract.

## What can fail

- temporary setup access remains open or locks the wrong facts;
- an approved role can do more than its name suggests;
- a planned update leaves out an important value;
- an emergency pause blocks safe exits or misses another route;
- a supposedly permanent removal leaves another route open;
- an old and new helper can use the same approval or ETH; or
- apps switch helpers without checking the approved public record.

## Questions for reviewers

1. Does the role list show every action each approved account can take?
2. What limits should apply if governance can send ETH?
3. Are all important values saved before an update starts waiting?
4. Do pauses keep withdrawals and refunds working?
5. Which action uses the 30-day successor wait, and what makes the newer contract current?
6. Which admin powers should be removed forever before launch?`,
} as const;
