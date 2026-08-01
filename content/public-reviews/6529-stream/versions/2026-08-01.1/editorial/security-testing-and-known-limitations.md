# Where Development Stands

At this snapshot, Stream was in public review before deployment and independent
audit. No Stream contracts held funds.

The source reviewed on these pages is the exact Git commit
[`513bd7e079eafe109df6ae1ae21bfbca6fec6786`](https://github.com/6529-Collections/6529Stream/tree/513bd7e079eafe109df6ae1ae21bfbca6fec6786),
with Git tree `b50ec53109f5f8d6b4f4b07f4cb6fd3c1d0e3100`. Every
implementation, test, limitation, and readiness statement below refers to that
snapshot. A later commit requires a new review version.

This page records what worked in the rehearsal, what was connected for
integration, what remained planned, and the evidence required before release.
The separately dated development update on the current Overview records work
completed after this snapshot.

## How this snapshot describes progress

Implementation and evidence are tracked separately. The progress labels show
where each contract sat in the rehearsal:

| Label | Meaning |
| --- | --- |
| **Working in the rehearsal** | Constructed and connected in the user path being described. |
| **Connected for integration** | Constructed and connected to selected protocol components. |
| **Implemented in source** | Solidity exists at the pinned commit; release wiring and configuration need further evidence. |
| **Planned for release** | The design direction is accepted and awaits complete implementation or integration evidence. |
| **Under discussion** | The design remains open or is planned for a later version. |

## A separate evidence dimension

Evidence describes the exact strength and scope of proof.

| Evidence                           | What it establishes                                                                                                                         | Companion evidence required                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Snapshot source**                | The Solidity or artifact exists at the exact reviewed commit.                                                                               | Connection, configuration, safety, and release intent.                            |
| **Local tests**                    | Named unit, fuzz, invariant, state-machine, or composition cases passed in the repository's test environment.                               | That every composition is covered or that live infrastructure behaves like mocks. |
| **Release configuration verified** | Exact addresses, runtime code hashes, roles, grants, parameters, and module relationships match one release candidate.                      | External-provider and marketplace behavior.                                       |
| **Tests with live external services** | Intended coordinators, contract wallets, public RPCs, marketplaces, storage, retrieval, and operating processes work outside local mocks. | Complete protocol review.                                                         |
| **Independent audit and fixes**    | Independent experts reviewed the exact candidate and recorded findings and fixes.                                                           | Operational monitoring and future review.                                         |

The current repository supplies substantial pinned source and local test
evidence. Candidate-bound, non-local, deployment, and external-audit evidence
remain incomplete.

## Working in the rehearsal

The current rehearsal constructs a real multi-contract baseline:

| Area                                    | Current behavior                                                                                                                                                                                                                                                                                                              |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Permanent token and collection identity | [`StreamCore.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol) stores shared ERC-721 identity, collection records, global token IDs, collection-local serials, supply, artist approval, metadata state, burn history, and Core freeze state. |
| Signed fixed-price Drop                 | `StreamDrops` verifies the EIP-712 authorization and calls the legacy `StreamMinter`, which calls the legacy Core mint entry.                                                                                                                                                                                                 |
| Signed English auction                  | The rehearsal connects `StreamDrops`, the legacy minter, and `AuctionContract`; auction registration mints into auction custody before bidding.                                                                                                                                                                               |
| Native fixed-price accounting           | `StreamDrops` selects its own token, collection, or contract-default split and creates poster, protocol, and curator-reserve credits.                                                                                                                                                                                         |
| Native auction accounting               | `AuctionContract` maintains its own bidder, poster, protocol, and curator credits.                                                                                                                                                                                                                                            |
| Royalty information                     | Core returns one fixed receiver and `690` basis points for every token through ERC-2981; the current revenue resolver sits outside this read path.                                                                                                                                                                           |
| Administration and pauses               | `StreamAdmins` supplies owner, global, target/function, pause-guardian, and unpause authority for the current baseline.                                                                                                                                                                                                       |
| Core and preservation                   | Core and `StreamPreservationRecords` are included in the current rehearsal.                                                                                                                                                                                                                                                   |

The exact sale and foundation construction is visible in
[`RehearseDeployment.s.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/script/RehearseDeployment.s.sol#L169-L270).

This baseline already supports meaningful behavior. The rehearsal establishes
the path selected at this pre-audit, pre-deployment commit.

## Connected for integration

The rehearsal also constructs significant systems outside the current signed
Drop and Auction path.

### Mint manager and durable ledger

[`StreamMintManager.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMintManager.sol)
and
[`StreamMintLedger.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMintLedger.sol)
provide phases, executors, gates, time windows, supply constraints, policy
hashes, prepared Core execution, and durable counters.

The rehearsal connects the manager to Core and authorizes it as a ledger writer.
It still passes the legacy minter to `StreamDrops`. The manager/ledger system
and the signed Drop are therefore two distinct source-implemented mint lanes.
[Tokens, Collections, and
Minting](./tokens-collections-and-minting#the-two-source-mint-lanes)
explains the behavioral difference.

### Revenue, split, asset-policy, and settlement foundation

The rehearsal deploys:

- [`StreamRevenueResolver.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRevenueResolver.sol);
- [`StreamSplitFactory.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamSplitFactory.sol);
- [`StreamSplitWallet.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamSplitWallet.sol);
- [`StreamAssetPolicyRegistry.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamAssetPolicyRegistry.sol);
- [`StreamPrimarySaleSettlement.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamPrimarySaleSettlement.sol).

The native Drop and Auction paths use local accounting, and the rehearsal still
needs a configured settlement caller for the wider foundation. Current sale
credits, the resolver and split-wallet system, and fixed Core royalties remain
parallel accounting lanes.
[Revenue, Splits, and
Royalties](./revenue-splits-and-royalties) explains each accounting model.

## Source-implemented systems

These mechanisms exist in Solidity at the reviewed commit. Candidate wiring and
deployment evidence establish when a rehearsal or production candidate uses
them.

| System                              | Source behavior                                                                                                                                    | Candidate status                                                                                                                     |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Governance V2                       | Role registry, delayed executor, cancellation, expiry, guardian veto, selector freezes, action classes, and one-way bootstrap sealing.             | Candidate inclusion plus a bound target catalog, roles, parameters, and cutover evidence.                                            |
| Module and successor registry       | Records module identity, code hashes, interfaces, status, and explicit successor relationships.                                                    | Complete candidate module graph and continuity evidence remain unavailable.                                                          |
| Artwork finality                    | Schedules terminal finality, supports delay, cancellation or veto, component manifests, and terminal state.                                        | Candidate inclusion, complete payload binding, and a proven terminal writer inventory.                                               |
| Record-family authorization         | Classifies exact metadata and preservation record types and checks writer class, collection, and subject.                                          | Admission set, live providers, grants, runtime code hashes, rotation/revocation evidence, and independent review remain unavailable. |
| Raise-only governed parameters      | Enforces delayed, strictly higher, maximum-2x changes with no lowering or emergency mutation path.                                                 | Complete candidate parameter catalog and proposal-to-execution binding remain unavailable.                                           |
| Collection metadata snapshots       | Publishes immutable snapshot records with exact covered record types and fresh authority checks.                                                   | Exact candidate record admissions and writers remain unbound.                                                                        |
| Mint gates and durable counters     | Binds gate lifecycle, interface, code hash, metadata hash, gas limit, authorizer, quantities, and counter scopes.                                  | Integration into a supported launch path; the current signed Drop uses its local lane and nullifier-backed gates await implementation. |
| Prepared mint execution             | Manager validates policy and counters, then calls Core prepare and complete entries atomically.                                                    | Integration into a supported launch path; the current signed Drop uses the legacy Core mint route.                                   |
| Randomness lifecycle                | Stores pending, fulfilled, stale, and failed-post-processing states; binds provider and epoch; derives one seed; retries the same seed.            | Live provider configuration, funding, callbacks, monitoring, stale policy, and recovery evidence remain outstanding.                 |
| Metadata rendering and dependencies | Supports onchain and offchain modes, scripts, token data, dependency versions, images, attributes, and ERC-4906 mutation-triggered refresh events. | Public-RPC, marketplace, browser, maximum-response, and long-term retrieval evidence remain outstanding.                             |

The detailed governance and authority behavior is explained on [Governance,
Pausing, and Successors](./governance-pausing-and-successors) and [Roles and
Trust](./roles-and-trust).

## Planned for release

Planned work has an approved design direction and awaits conforming code and
integration evidence.

### Revenue-resolver validation adapter

The accepted revenue architecture adds one immutable, exact-code validation
adapter to resolver write paths. The adapter owns no state, authority, roles,
funds, or events. It may make only approved caller-insensitive, read-only calls
to pinned dependencies.

The registered resolver remains the sole state owner, writer, Core royalty
pointer target, and normative event emitter. It authenticates the request,
checks adapter and dependency identities, validates the complete returned
result, and only then changes state. The Core-facing royalty read uses resolver
storage and pure computation; it never reaches the adapter.

The boundary fails closed. A revert, out-of-gas result, changed code hash, or
malformed answer reverts before lasting state change. Recovery requires a new
resolver, continuity proof, Registry V2 registration, and governed Core-pointer
replacement.

That architecture is accepted for pre-genesis work. Complete conforming resolver
and adapter source still await implementation at this commit. Implementation
remains gated on an independently approved normative interface appendix and
freeze commit.

### Satellite-triggered metadata refresh

Core currently emits ERC-4906 refresh events as part of its own mutations. The
accepted launch target adds restricted single-token and batch helpers so
authorized satellite contracts can emit standard refresh signals with
Stream-native context.

No such public or external helper exists in the reviewed Solidity. Caller
checks, lifecycle and range bounds, context binding, abuse analysis,
implementation, and tests remain outstanding. [Metadata, Scripts, and
Dependencies](./metadata-scripts-and-dependencies#refresh-events-tell-consumers-that-state-changed) explains the
current events and the target.

### Genesis role inventory

The release artifacts describe a thirty-seven-role genesis inventory as an
architecture requirement and review target. The final candidate must bind every
role to exact accounts, contracts,
selectors, scopes, delays, and revocation conditions.

## Under discussion

The following material is design input awaiting implementation:

| Proposal or deferred area             | Current position                                                                                                                                                                                                                                               |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Artist-registry validation adapter    | ADR 0022 proposes an immutable, stateless, unregistered validation adapter while the registry remains the sole authority and state owner. Implementation still requires separate authorization.                                                              |
| Payer-bound ERC-20 orchestration      | A proposed sale adapter would verify a payer-signed `PaymentIntent` and be the sole protocol contract pulling allowance; the settlement contract would only record and route value. The verifier and top-level path await implementation.                    |
| Batch operation-root replay ownership | ADR 0018 proposes making the ledger the durable batch replay owner and joining ledger accounting to per-token prepared-mint events. It awaits acceptance and implementation.                                                                                  |
| Stale-randomness recovery             | A proposal would add an objective delay and one bounded recovery transition. The current stale state is terminal for that token.                                                                                                                               |
| Append-only artwork-finality recovery | ADR 0020 proposes a companion that preserves the original finality record while appending a governed recovery lineage. It awaits acceptance and implementation.                                                                                               |
| Broader artist authority and recovery | Collaborators, delegated roles, guardians, estate instructions, sanctions, disputes, and recovery remain broader design work toward a complete production artist registry.                                                                                    |
| Additional sale profiles              | Dutch auctions, private sales, refund windows, sealed bids, raffles, burn-to-mint, ERC-20 bidding, and other profiles are proposed or deferred unless present in reviewed source and tests.                                                                    |
| `RandomizerNXT` production use        | Source remains in the repository outside the production providers approved by the reviewed release policy.                                                                                                                                                    |

No topical explanation should present these ideas as protections already
provided by the candidate.

## Test evidence

The repository contains:

- ordinary unit tests;
- fuzz tests;
- invariant tests;
- state-machine tests;
- adversarial multi-contract composition tests;
- focused tests for EIP-712, auction timing, mint accounting, burn behavior,
  metadata events, randomness state and retry behavior, governance, and
  preservation.

The generated Technical Reference compiles the complete Solidity corpus at the
pinned commit and inventories protocol contracts, interfaces, libraries, test
contracts, deployment scripts, definitions, functions, events, errors,
signatures, selectors, and source ranges.

This is meaningful engineering evidence. Independent review must still examine:

- missing assertions;
- an untested composition;
- a wrong specification encoded consistently in implementation and test;
- deployment or initialization mistakes;
- live-provider differences;
- economic attacks;
- key-management failure;
- long-term storage, browser, RPC, or marketplace failure.

In particular, tests cover both mint lanes separately. A
signed-Drop-to-MintManager integration would require new candidate wiring and
tests. Individual revenue-contract tests cover their components; a unified
settlement path requires its own integration.

## Static analysis

The pinned
[`SLITHER_BASELINE.json`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/ops/SLITHER_BASELINE.json)
contains `30` open High or Medium findings: `3` High and `27` Medium.

A count alone measures tool output, and static-analysis tools can produce false
positives. The candidate currently has unresolved static-analysis findings.
Every finding needs one of:

- a source-backed fix and regression test;
- a demonstrated false-positive analysis;
- an explicit accepted-risk decision with scope and owner;
- removal from the release surface.

The final register should preserve tool version, configuration, raw output,
normalization rules, source commit, and response evidence.

## Known limitations and unresolved blockers

This register centralizes release state. The linked topical page owns the fuller
behavioral explanation.

| Area                            | Current limitation                                                                                                                                                                                                                            | Best detailed explanation                                                                                                                                                                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zero-mint final supply          | `setFinalSupply` stores `0` when no token has minted; `setCollectionData` also treats `0` as uninitialized, so an unfrozen collection can be given a new nonzero cap and minting can reopen. There is no separate final-supply flag or event. | [Final supply](./freezing-preservation-and-artwork-finality#final-supply-is-a-supply-promise)                                                                                                                                                   |
| Core bytecode margin            | The pinned build proof records locally compiled `StreamCore` deployed-runtime bytecode at `24,152` bytes: `424` bytes below EIP-170. The interim target is `384` bytes, leaving `40` bytes of headroom. The gap to the normative `2,000`-byte target is `1,576` bytes. | [Contract bytecode size](#contract-bytecode-size)                                                                                                                                                                                               |
| Governance record families      | `RISK-GOV-002` remains open for candidate admissions, providers, grants, runtime bindings, rotation/revocation evidence, and independent review.                                                                                              | [Record-family authorization](./roles-and-trust#record-family-authorization)                                                                                                                                                                    |
| Governance native value         | `RISK-GOV-003` records that executor native-value authority is too broad or insufficiently constrained.                                                                                                                                       | [Native-value authority](./governance-pausing-and-successors#native-value-authority)                                                                                                                                                            |
| Governed parameter binding      | `RISK-GOV-004` records incomplete end-to-end evidence that every governed action binds every sensitive parameter.                                                                                                                             | [Governed parameter binding](./governance-pausing-and-successors#governed-parameter-binding)                                                                                                                                                    |
| Parallel mint lanes             | Signed Drops and the current auction use legacy `StreamMinter`; manager/ledger behavior is separate.                                                                                                                                          | [The two source mint lanes](./tokens-collections-and-minting#the-two-source-mint-lanes)                                                                                                                                                         |
| Parallel accounting lanes       | Drop, Auction, curator pool, resolver, split-wallet, settlement, and fixed Core royalty accounting remain separate value paths and ledgers.                                                                                                     | [One accountable value path](./revenue-splits-and-royalties#one-wei-should-have-one-accountable-path)                                                                                                                                           |
| Settlement asset binding        | ERC-20 settlement receives the asset outside `PrimarySale` and its replay key. An approved caller can select any active asset, and the first successful settlement consumes the shared key.                                                     | [Settlement identity](./revenue-splits-and-royalties#the-settlement-foundation-gives-a-sale-one-replay-safe-identity)                                                                                                                           |
| Auction terms                   | Bid-increment percentage and extension time are mutable global values shared across auctions. They lack a bound, delay, and change event and can change during active auctions.                                                                | [The minimum next bid](./fixed-price-sales-and-auctions#the-minimum-next-bid-is-exact) and [anti-sniping](./fixed-price-sales-and-auctions#anti-sniping-needs-a-reproducible-clock-rule)                                                        |
| Manager nullifiers              | The gate interface defines nullifiers; the current manager and ledger support empty nullifier arrays, with nullifier-backed gates awaiting implementation.                                                                                    | [Gate security inputs](./tokens-collections-and-minting#gates-carry-security-inputs)                                                                                                                                                            |
| Manager replay ownership        | The manager derives a batch root and token operation IDs after consuming ledger state. The ledger stores counters, while Core retains an unbounded lifetime token-operation mapping; a durable joined record is still needed.                  | [Durable replay ownership](./tokens-collections-and-minting#replay-protection-needs-one-durable-owner)                                                                                                                                          |
| Randomness stale state          | The state transition accepts an authorized admin call immediately after a request becomes pending. `Stale` is terminal and prevents another request for that token.                                                                            | [The current stale state](./randomness#the-current-stale-state-is-immediate-and-terminal)                                                                                                                                                       |
| Randomness provider replacement | A `FailedPostProcessing` request leaves the pending count before retry, allowing provider replacement; the old provider or epoch then fails the implemented retry checks.                                                                      | [Provider migration](./randomness#provider-migration-governs-future-requests)                                                                                                                                                                   |
| Randomness Core target          | Provider adapters expose admin-controlled Core-target updates. Requests retain the provider and epoch while omitting the assignment-era Core address used for fulfillment checks and the seed write.                                          | [Provider assignment](./randomness#provider-assignment-creates-an-authorization-era)                                                                                                                                                           |
| Randomness providers            | Live subscription/controller funding, callbacks, permissions, stale policy, monitoring, and raw-word retrieval require live evidence beyond mocks. `RandomizerNXT` sits outside the approved production provider set.                         | [Provider trust models](./randomness#each-provider-has-its-own-trust-model)                                                                                                                                                                     |
| Shared collection identity      | A Stream collection has no separate ERC-721 contract address. Marketplace and indexer handling of Core-native collection identity remains a non-local launch gate. There is no dormant per-collection facade in this Core.                    | [One permanent identity surface](./tokens-collections-and-minting#one-permanent-identity-surface-for-many-collections)                                                                                                                          |
| Metadata refresh                | Mutation-triggered Core events exist. The accepted satellite-callable helper awaits implementation. Current collection batch refresh covers a deliberate superset of globally interleaved token IDs.                                         | [Refresh events](./metadata-scripts-and-dependencies#refresh-events-tell-consumers-that-state-changed)                                                                                                                                          |
| Metadata and RPC size           | Long strings and token URIs pass local tests; public RPCs, wallets, indexers, and marketplaces still need maximum-size processing evidence.                                                                                                    | [Size limits](./metadata-scripts-and-dependencies#size-limits-protect-more-than-gas)                                                                                                                                                            |
| Artwork finality                | Scheduling and veto mechanisms exist in source; a candidate still needs proof of complete payload binding and its terminal selector/writer inventory.                                                                                        | [Delayed finality](./freezing-preservation-and-artwork-finality#terminal-finality-is-delayed-for-a-reason) and [terminal writer inventory](./freezing-preservation-and-artwork-finality#terminal-means-every-effective-writer-is-accounted-for) |
| Preservation availability       | A valid content hash proves equality when bytes are retrieved. Availability requires the bytes, dependencies, browser, RPC, rendering environment, and an independent package-recovery demonstration.                                         | [Append-only preservation history](./freezing-preservation-and-artwork-finality#preservation-records-keep-history-append-only)                                                                                                                  |

## Contract bytecode size

The pinned
[`bytecode release proof`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/release-artifacts/latest/bytecode-release-proof.json)
records the local build's exact deployed-runtime Core measurement above. The
narrow margin matters because
small compiler or source changes can cross the chain limit, emergency fixes
become harder, and optimizer and metadata settings are part of the result.
A durable engineering margin needs evidence beyond a successful deployment
today.

The accepted revenue architecture also imposes independent future limits on the
resolver and adapter: each must be no larger than `22,576` bytes of deployed
runtime and `47,152` bytes of full initcode, including encoded constructor
arguments. Those values preserve a `2,000`-byte margin under EIP-170 and
EIP-3860 respectively.

Neither accepted future contract is implemented at this commit. Only a final,
canonical isolated build can supply release evidence; issue-worktree or
aggregate-build measurements are diagnostic.

## Candidate-bound evidence still required

The release needs a generated, machine-readable candidate manifest covering:

- exact source and artifact hashes;
- compiler and optimizer settings;
- contract addresses, chain, creation transactions, and runtime code hashes;
- constructor and initializer arguments;
- Core pointers and complete module graph;
- role holders, scopes, signer addresses, and signer epochs;
- record-family admissions, authority providers, and grants;
- governed parameter values and action classes;
- pause, unpause, and guardian configuration;
- randomness providers, accounts, funding, callbacks, and monitoring;
- revenue, settlement, split, royalty, and liability paths;
- ownership transfers, renunciations, and one-way bootstrap sealing;
- explorer verification;
- independent readback of every critical invariant.

Correct live deployment requires an independent second party to reconstruct and
verify the ceremony from the scripts and published evidence.

The staging review currently resolves to Wave
`19d4bbf5-86ec-4053-a5f2-bb28d7a2f780`, titled **Stream review (staging)**.
That is the verified staging-only destination.

The user-designated future production destination is Wave
`06e69198-eea7-40c5-95d3-7c1bf5051aba`. This staging-only mapping keeps
production review routes disabled and leaves the production destination
unchanged. Any future production activation
must bind that exact Wave through the reviewed environment configuration and
independently read the mapping back before accepting feedback.

## External evidence still required

The current candidate still needs complete evidence for:

- fork or public-testnet execution against intended infrastructure;
- live VRF and arRNG requests and callbacks;
- production-style signing and ERC-1271 contract-wallet verification;
- marketplace handling of shared collection identity, metadata, and royalties;
- public-RPC handling of maximum token URI responses;
- independent retrieval and reconstruction of preservation packages;
- long-duration auction operation and failure recovery;
- signer and authority-provider rotation and revocation;
- successor discovery and continuity readback.

Mocks are valuable for deterministic tests. Live integration tests must cover
real service limits, permissions, latency, billing, availability, and
operational failure.

## External audit

This candidate awaits a completed independent external audit and remediation
record. Community review can improve the specification and find serious issues,
complementing expert audit.

The audit must cover the exact release candidate and deployment configuration.
Any material post-audit change needs an explicit
delta review. Findings need source-backed responses, fix commits, regression
evidence, and a record of remaining risk.

## Release blockers

At minimum, release to production should remain blocked until:

- all High findings and every material Medium finding are fixed or formally
  resolved;
- the zero-mint final-supply promise is repaired or accurately redefined;
- governance record-family authorization and action binding are proven;
- native-value executor authority is constrained and tested;
- the chosen signed-sale mint lane is explicit and its callers, counters, replay
  state, and Core entry are tested end to end;
- native Drop and Auction accounting is deliberately retained or replaced by
  resolver/settlement integration, with no ambiguous parallel path;
- current fixed royalties are deliberately retained or replaced by the accepted
  resolver-backed target, with marketplace behavior verified;
- the Core meets the adopted bytecode margin or the design is deliberately
  revised;
- the accepted revenue adapter architecture has an independently approved
  interface freeze, reconciled specification, conforming implementation,
  independent review, per-contract size proof, and adapter-first deployment
  evidence;
- every production randomness provider has candidate-bound non-local evidence
  and a reviewed stale/failure policy;
- the finality payload and every terminal writer are proven bound;
- exact deployment, bootstrap, rollback, and successor-cutover ceremonies are
  rehearsed and independently read back;
- preservation packages are independently recovered using only published
  instructions and commitments;
- any future production review activation binds and independently verifies its
  designated production feedback Wave as a unique destination;
- external audit and remediation are complete;
- the final public review version matches the exact deployment commit and
  configuration.

This list can grow as public review discovers new facts. Removing a blocker
requires evidence of resolution.

## Threat model

The protocol must assume interaction with:

- malicious buyers, bidders, recipients, and contract wallets;
- compromised or mistaken privileged accounts;
- stale, replayed, or partially bound signatures;
- unavailable or adversarial randomness infrastructure;
- hostile ETH and token recipients, reentrancy, and forced value;
- malformed metadata and very large return values;
- registries or modules configured in the wrong order;
- front-running, chain reorganization, timestamp variation, and transaction
  censorship;
- disappearing storage, RPC, browser, marketplace, and indexing services;
- governance proposals whose visible description differs from executable
  bytes.

The threat model also includes honest mistakes. An artist approving the wrong
manifest, an operator selecting the wrong address, or a change action binding
an incomplete payload can create permanent damage through ordinary error.

## Review priorities

### Economic and accounting review

Reviewers should reconstruct every liability across sales, auctions, refunds,
randomness reserves, split wallets, settlement, and emergency surplus. They
should prove:

- credits stay at or below value received;
- each unit of value funds one promise;
- rounding dust has an explicit owner;
- unrelated users can progress when a recipient reverts;
- emergency withdrawal excludes all liabilities;
- successor cutover preserves each balance exactly once;
- accounting supports contract wallets and self-referential recipients.

Invariant tests should combine sale, bid, refund, withdrawal, pause, burn, and
successor sequences.

### Signature review

Every signed action should bind chain, verifying contract, action type,
collection, relevant participants, economic terms, quantity, replay identifier,
signer epoch, and deadline.

Reviewers should compare the human-readable UI, typed-data payload, Solidity
type hash, recovered signer, replay storage, and emitted event. A value omitted
from one layer can let the user approve a different action from the one
executed.

### Metadata and preservation review

Security includes the artwork experience. Test malformed strings, untrusted
HTML and JavaScript, oversized responses, missing dependencies, wrong hashes,
unavailable storage, and future browser behavior.

A contract can remain secure while its artwork becomes unavailable. Release
criteria need both smart-contract security and preservation evidence.

## Public findings

The current configured disclosure policy permits possible exploitable
vulnerabilities to be reported in the public review Wave while this candidate is
in its validated predeployment state. The explicit review state and policy grant
that permission.

[How to participate in the community
review](./community-review#public-conduct-and-sensitive-information) contains the
authoritative reporting and sensitive-information guidance. Every substantive
response should link a source commit, test, or documented decision. Evidence
completes the resolution.

## The release standard

Stream must preserve artistic intent and token identity while its supporting
sales, randomness, metadata, and operating services evolve.

Every mechanism needs a clear purpose, a clearly limited set of powers, and
evidence that an independent person can reconstruct its operation. Release
depends on that evidence.

## Questions for reviewers

1. Does this page describe any component as further along than the evidence
   supports?
2. Which person, asset, dependency, or failure mode is missing from the threat
   model?
3. Which current static-analysis findings become exploitable in composition?
4. Is the adopted Core bytecode margin adequate for a permanent contract?
5. Which change paths still omit an important action or parameter?
6. Which tests with live external services are required before audit and
   launch?
7. Which properties need independent economic or formal verification?
8. Which planned features are essential for launch, and which can be added later
   through a recorded replacement contract?
