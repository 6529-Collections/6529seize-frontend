# Security, testing, and known limitations

Stream is pre-audit and is not production-ready. This page records the evidence
that exists and the evidence that does not. It is not a security certification.

The candidate under review is the exact Git commit
[`018c8788750980e143c38ace0666684bf641ec4f`](https://github.com/6529-Collections/6529Stream/tree/018c8788750980e143c38ace0666684bf641ec4f).
Claims about a later commit require a new review version.

## Threat model

The protocol must assume interaction with:

- malicious buyers, bidders, recipients, and contract wallets;
- compromised or mistaken privileged accounts;
- stale, replayed, or partially bound signatures;
- unavailable or adversarial randomness infrastructure;
- hostile ETH recipients and reentrancy;
- malformed metadata and very large return values;
- registries or modules configured in the wrong order;
- front-running, chain reorganization, timestamp variation, and transaction
  censorship;
- disappearing storage, RPC, browser, marketplace, and indexing services;
- governance proposals whose visible description differs from executable
  bytes.

The threat model also includes honest mistakes. An artist approving the wrong
manifest or an operator selecting the wrong module address can create permanent
damage without an attacker.

## Accepted revenue-adapter trust boundary

### ACCEPTED TARGET - NOT IMPLEMENTED

The accepted revenue-resolver architecture would add one immutable, exact-code
validation adapter to resolver write paths. The adapter owns no state,
authority, roles, funds, or events. It may make only the approved
caller-insensitive, read-only calls to exact pinned dependencies. The resolver
authenticates the request, checks the adapter and dependency identities, checks
the complete returned result, and only then changes state or emits events. The
Core-facing royalty read uses only resolver storage and pure computation; it
never reaches the adapter.

This boundary deliberately fails closed. If the adapter or one of its pinned
dependencies reverts, runs out of gas, changes code, or returns a malformed or
mismatched answer, the resolver write reverts before any lasting effect. There
is no fallback validator and no bypass. Recovery requires a new resolver, a
continuity proof, a new Registry V2 registration, and a governed Core-pointer
replacement.

## Test evidence

### TESTED

The repository contains unit tests, fuzz tests, invariant tests, state-machine
tests, and adversarial composition tests. This breadth is useful because
multi-contract failures often appear only when otherwise correct modules are
combined.

The generated Technical Reference compiles the complete Solidity corpus for the
pinned commit and inventories the declarations the compiler sees. The initial
inventory includes protocol contracts, interfaces, libraries, test contracts,
and deployment scripts, with the protocol surface separated from test and
script surfaces.

Tests establish evidence about the cases they execute. They do not prove the
absence of:

- missing assertions;
- an untested composition;
- a wrong specification encoded consistently in both implementation and test;
- deployment or initialization mistakes;
- differences in live provider behavior;
- economic attacks;
- key-management failure;
- long-term external dependency failure.

## Static analysis

### KNOWN LIMITATION

The pinned
[`SLITHER_BASELINE.json`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/ops/SLITHER_BASELINE.json)
contains 30 open High or Medium findings: 3 High and 27 Medium. A count alone
does not establish severity or exploitability, and tools can produce false
positives. It does establish that the release cannot honestly be described as
static-analysis clean.

Every item needs one of:

- a source-backed fix and regression test;
- a demonstrated false-positive analysis;
- an explicit accepted-risk decision with scope and owner;
- removal from the release surface.

The final register should preserve tool version, configuration, raw output,
normalization rules, source commit, and disposition evidence.

## Contract bytecode size

### KNOWN LIMITATION

The pinned
[`bytecode release proof`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/release-artifacts/latest/bytecode-release-proof.json)
records `StreamCore` deployed bytecode at 24,152 bytes. That is 424 bytes below
the EIP-170 maximum of 24,576 bytes.

The repository uses an interim 384-byte margin, which this candidate passes by
40 bytes. Its normative production target is a 2,000-byte margin, which this
candidate misses by 1,576 bytes.

This matters because:

- small compiler or source changes can cross the chain limit;
- emergency fixes become harder when there is almost no space;
- optimizer and metadata settings are part of the result;
- deploying close to the limit reduces engineering flexibility.

“It deploys today” is not the same as having a durable safety margin.

The accepted revenue-resolver architecture also imposes independent size gates
on its two future contracts. The resolver and validation adapter must each be
no larger than 22,576 bytes of deployed runtime under EIP-170 and 47,152 bytes
of full initcode, including encoded constructor arguments, under EIP-3860.
Each limit preserves 2,000 bytes of margin under its applicable protocol
maximum.

Those measurements must come from the final canonical isolated build.
Issue-worktree and aggregate-build measurements are diagnostic only, not
release evidence. Neither future target is implemented at this reviewed
commit, so this review cannot claim that either one passes its gate.

## Governance blockers

### KNOWN LIMITATION

The current risk register includes three governance families that require
resolution:

- **RISK-GOV-002:** record-family authorization is source implemented, but the
  exact candidate, production admission set, live providers, grant map,
  deployed runtime/code-hash bindings, non-local rotation/revocation evidence,
  and independent review are unavailable;
- **RISK-GOV-003:** governance executor native-value authority is too broad or
  insufficiently constrained;
- **RISK-GOV-004:** end-to-end binding evidence for governed parameters is
  incomplete.

These are architectural risks. A local allowlist or reassuring role name does
not resolve them unless every effective path is covered.

The current risk-register title for RISK-GOV-002 still describes the historical
whole-module problem. Reviewers should use the
[`record-family source catalog`](https://github.com/6529-Collections/6529Stream/blob/018c8788750980e143c38ace0666684bf641ec4f/release-artifacts/record-family-authorization-source-catalog.json)
for current source behavior and the risk register for the still-open release
gate.

## End-to-end wiring blockers

### KNOWN LIMITATION

Several source-implemented components are not one supported end-to-end path:

- signed Drops and the current auction use legacy `StreamMinter`;
- `StreamMintManager` and `StreamMintLedger` form a separate mint lane;
- native Drop and Auction proceeds remain in those contracts' local accounting;
- revenue resolver, split wallets, asset policy, and primary settlement are
  separate foundations;
- ERC-20 payer-bound orchestration is proposed and its top-level verifier does
  not exist;
- current Core royalties are fixed at 690 basis points to one receiver, while
  resolver-backed royalties are an accepted target;
- Governance V2 and artwork finality source are not part of the current
  rehearsal's deployed contract set.

Compilation and unit tests for each component do not prove these boundaries have
been reconciled. Before a candidate claim, the release needs a generated wiring
manifest and end-to-end tests for every supported sale, mint, revenue, royalty,
governance, and finality lane.

## External audit

### AUDIT PENDING

There is no completed independent external audit and remediation record for
this candidate. Community review can find important issues and improve the
specification. It is not a replacement for expert audit.

An audit should cover the exact release candidate and deployment configuration,
not an earlier design branch. Any material post-audit change needs an explicit
delta review.

## Deployment evidence

### EVIDENCE PENDING

Local deployment scripts are not proof of a correct live deployment. Production
evidence should include:

- exact compiler and optimizer settings;
- exact source and artifact hashes;
- deployed addresses, chain, creation transactions, and runtime code hashes;
- constructor and initializer arguments;
- role holders and signer epochs;
- module graph and interface checks;
- pause and guardian configuration;
- randomness provider accounts, funding, callbacks, and monitoring;
- ownership or authority renunciations;
- explorer verification;
- a dry-run and independent readback of every critical invariant.

The ceremony should produce a machine-readable manifest that a second party can
verify without trusting the deployer's notes.

## Non-local integration evidence

### EVIDENCE PENDING

The current candidate does not contain complete evidence for:

- fork or public-testnet execution against intended infrastructure;
- live randomness requests and callbacks;
- production-style signing and contract-wallet verification;
- marketplace royalty and metadata behavior;
- ordinary public RPC handling of maximum token URI responses;
- independent retrieval of preservation packages;
- long-duration auction and failure recovery operations.

Mocks are useful for determinism. They cannot reproduce the service limits,
permissions, latency, billing, and failure behavior of real providers.

## Economic and accounting review

Revenue, auctions, refunds, randomness reserves, and emergency surplus can all
place native value in related contracts. Reviewers should reconstruct every
liability and prove that:

- credits cannot exceed funds received;
- the same funds are not promised twice;
- rounding dust has an explicit owner;
- reverting recipients cannot block unrelated users;
- emergency withdrawal excludes all liabilities;
- successor cutover cannot duplicate or abandon balances;
- contract wallets and self-referential recipients do not break accounting.

Invariant tests should run across combined sale, refund, withdrawal, pause,
burn, and successor sequences.

## Signature review

Every signed action should bind the chain, verifying contract, action type,
collection, relevant participants, economic terms, quantities, nonce or replay
identifier, signer epoch, and deadline.

Reviewers should compare the human-readable UI, typed-data payload, Solidity
type hash, recovered signer, replay storage, and emitted event. If one layer
omits a value, the user may approve a different action from the one executed.

## Metadata and preservation review

Security includes the artwork experience. Test malformed strings, untrusted
HTML and JavaScript, oversized responses, missing dependencies, incorrect
hashes, unavailable storage, and future browser behavior.

A contract can remain secure while the art becomes unavailable. The release
criteria need both smart-contract security and preservation evidence.

## How public findings are handled

This review instance is in a validated, configured predeployment state, and its
published disclosure policy explicitly permits possible exploitable
vulnerabilities to be reported in the public Wave. Reviewers may describe the
affected code and consequences directly.

That permission is scoped to this review state and policy; it is not inferred
solely from the absence of a deployment. If the review state or disclosure
policy changes, the submission UI must fail closed or use the newly configured
disclosure route.

Do not include private keys, credentials, personal information, or instructions
that attack an unrelated live system. A finding should contain enough
reproduction detail for the Stream team and auditors to validate it against the
pinned candidate.

Every substantive response should link a source commit, test, or documented
decision. A status label without evidence is not a disposition.

## Release blockers

At minimum, production should remain blocked until:

- all High findings and every material Medium finding are fixed or formally
  resolved;
- governance record-family authorization and action binding are proven;
- the chosen signed-sale mint lane is explicit and its current Drop/Auction
  callers, counters, replay state, and Core entry are tested end to end;
- native Drop/Auction accounting is either deliberately retained or replaced by
  resolver/settlement integration, with no ambiguous parallel path;
- current fixed royalties are either deliberately retained or replaced by the
  accepted resolver-backed target, with marketplace behavior verified;
- native-value executor authority is constrained and tested;
- the Core meets the adopted bytecode margin or the design is deliberately
  revised;
- the accepted revenue-resolver adapter architecture has an independently
  approved interface freeze, reconciled specification, conforming and
  independently reviewed implementation, per-contract size and release proof,
  and adapter-first deployment evidence;
- external audit and remediation complete;
- every production randomness provider has non-local evidence;
- exact deployment and rollback/cutover ceremonies are rehearsed;
- preservation packages are independently recovered;
- the final public review version matches the exact deployment commit.

This list can grow as review discovers new facts.

## What we think

The right security posture for a permanent contract is an evidence ledger, not
a confidence statement. A reviewer should be able to move from a known
limitation to its source, test, decision, fix commit, and verification result.

The protocol is ambitious and the engineering work is substantial. That makes
clear release blockers more important, not less.

## Questions for reviewers

1. Does the threat model omit an actor, asset, trust boundary, or failure mode?
2. Which current static-analysis findings are exploitable in composition?
3. Is the adopted Core bytecode margin adequate for a permanent contract?
4. Which governance paths still lack complete parameter or record-family
   binding?
5. What non-local evidence must be produced before audit and before deployment?
6. Which properties need independent economic or formal verification?
