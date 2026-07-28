# Current Implementation and Readiness

Stream is an incomplete, undeployed, pre-audit candidate under active public
review; there is no live Stream contract and no funds in it.

This page is the single readiness ledger for the review. It answers four
questions:

1. Which contracts form the user-facing path in the current rehearsal?
2. Which other systems are connected, present only in source, accepted but not
   built, or still proposals?
3. What evidence supports each claim, and what evidence is still missing?
4. Which limitations and release blockers prevent production?

The topical pages explain what each mechanism does and why it exists. This page
classifies what is done and not done so readers do not have to reconstruct
status from scattered caveats.

Every statement refers to exact Git commit
[`513bd7e079eafe109df6ae1ae21bfbca6fec6786`](https://github.com/6529-Collections/6529Stream/tree/513bd7e079eafe109df6ae1ae21bfbca6fec6786)
and Git tree `b50ec53109f5f8d6b4f4b07f4cb6fd3c1d0e3100`. A later
commit requires a new review version.

## How to read this page

Start with a system's **implementation state**. That tells you whether a user
would reach it in the rehearsed path, whether it is merely connected nearby,
or whether it exists only as source or design.

In this review, the **rehearsal** is the repository's repeatable deployment
script for constructing and wiring a candidate locally. It is evidence about
composition, not a live-chain deployment.

Then check its **evidence**. Source and local tests can strongly support a
mechanism without proving its candidate wiring, live infrastructure, economic
safety, or audit status.

Finally, read the **known limitations**, **missing evidence**, and **release
blockers**. A system remains unready when a required proof is missing even if
its code exists and its unit tests pass.

## Five implementation states

| State                    | What it means                                                                                                                                        | What a reader should conclude                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Current path**         | The current rehearsal constructs and connects it in the user-facing path being described.                                                            | This is the path selected by the rehearsal, not a live, audited, or final deployment.          |
| **Connected foundation** | The rehearsal constructs it and connects it to some protocol components, but the current user-facing sale or mint path does not call it.             | It is more than loose source, but less than an end-to-end supported path.                       |
| **Source implemented**   | Solidity exists at the pinned commit, but the rehearsal does not prove complete candidate addresses, grants, configuration, or use.                  | Its behavior can be reviewed; its inclusion and production configuration cannot be assumed.   |
| **Accepted target**      | The architecture is accepted for pre-genesis work, but complete conforming source, integration, and evidence do not yet exist.                       | It is a committed direction, not protection the candidate supplies today.                      |
| **Proposed or deferred** | The material remains open design work or is intentionally outside the candidate.                                                                     | It must not be described as current contract behavior or release protection.                   |

Implementation state is not a quality score. A well-tested contract may still
be source-only, while a current-path contract may still contain a blocker. The
states expose the most important integration fact: which contracts actually
compose one supported path?

## Evidence is a separate dimension

| Evidence                           | What it establishes                                                                                                                         | What it does not establish                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Pinned source**                  | The Solidity or artifact exists at the exact reviewed commit.                                                                               | That it is connected, configured, safe, or intended for release.                   |
| **Local tests**                    | Named unit, fuzz, invariant, state-machine, or composition cases passed in the repository environment.                                      | That every composition is covered or live infrastructure behaves like mocks.      |
| **Candidate binding**              | Exact addresses, runtime code hashes, roles, grants, parameters, and module relationships match one release candidate.                      | That external providers or marketplaces behave correctly.                         |
| **Non-local evidence**             | Intended coordinators, contract wallets, public RPCs, marketplaces, storage, retrieval, and operations work outside local mocks.            | That the complete protocol is secure.                                              |
| **External audit and remediation** | Independent experts reviewed the exact candidate and recorded findings, dispositions, fixes, and remaining risk.                            | A permanent guarantee against defects or future operational failure.               |

The repository supplies substantial pinned-source and local-test evidence.
Candidate binding, non-local operation, deployment proof, and external audit
remain incomplete.

## Current path

The rehearsal selects this multi-contract baseline:

| Area                                    | What the rehearsed path does                                                                                                                                                                                                                                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Permanent token and collection identity | [`StreamCore.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol) stores shared ERC-721 identity—the NFT ownership standard—collection records, global token IDs, collection-local serials, supply, artist approval, metadata state, burn history, and Core freeze state. |
| Signed fixed-price Drop                 | `StreamDrops` verifies an EIP-712 structured typed authorization and calls the legacy `StreamMinter`, which calls the legacy Core mint entry.                                                                                                                                                                                    |
| Signed English auction                  | `StreamDrops`, the legacy minter, and `AuctionContract` register the approved sale and mint the token into auction custody before bidding.                                                                                                                                                                                       |
| Native fixed-price accounting           | `StreamDrops` selects its own token, collection, or contract-default split and creates poster, protocol, and curator-reserve credits.                                                                                                                                                                                            |
| Native auction accounting               | `AuctionContract` maintains its own bidder, poster, protocol, and curator credits.                                                                                                                                                                                                                                               |
| Royalty information                     | Core reports one receiver and `690` basis points (`6.9%`) for every token through ERC-2981, the marketplace royalty-reporting standard; it does not call the revenue resolver.                                                                                                                                                     |
| Administration and pauses               | `StreamAdmins` supplies owner, global, target/function, pause-guardian, and unpause authority for the baseline.                                                                                                                                                                                                                   |
| Core and preservation                   | Core and `StreamPreservationRecords` are included in the rehearsal.                                                                                                                                                                                                                                                              |

The construction is visible in
[`RehearseDeployment.s.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/script/RehearseDeployment.s.sol#L169-L270).

This is meaningful functionality. "Current path" means the rehearsal selects
these contracts at this commit. It does not mean deployed, audited, final, or
free of blockers.

## Connected foundations

The rehearsal also constructs substantial systems outside the current signed
Drop and Auction call path.

### Mint manager and durable ledger

[`StreamMintManager.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMintManager.sol)
and
[`StreamMintLedger.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMintLedger.sol)
provide phases, executors, gates, time windows, supply constraints, policy
hashes, prepared Core execution, and durable counters.

The rehearsal connects the manager to Core and authorizes it as a ledger
writer. It still gives the legacy minter to `StreamDrops`. The manager/ledger
and signed Drop are therefore two separate mint lanes rather than one
end-to-end sale path. [Tokens, Collections, and
Minting](./tokens-collections-and-minting#the-two-source-mint-lanes) explains
the difference.

### Revenue, split, asset-policy, and settlement foundation

The rehearsal deploys:

- [`StreamRevenueResolver.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamRevenueResolver.sol);
- [`StreamSplitFactory.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamSplitFactory.sol);
- [`StreamSplitWallet.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamSplitWallet.sol);
- [`StreamAssetPolicyRegistry.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamAssetPolicyRegistry.sol);
- [`StreamPrimarySaleSettlement.sol`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamPrimarySaleSettlement.sol).

The native Drop and Auction paths do not call this foundation, and the
rehearsal configures no settlement caller. Current sale credits, resolver and
split-wallet accounting, and fixed Core royalties remain parallel lanes.
[Revenue, Splits, and Royalties](./revenue-splits-and-royalties) explains their
behavior.

## Source-implemented systems

These systems exist in Solidity. Source presence does not mean the rehearsal or
a production candidate uses them.

| System                              | What exists in source                                                                                                                               | What is not yet established for the candidate                                                                                         |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Governance V2                       | Role registry, delayed executor, cancellation, expiry, guardian veto, selector freezes, action classes, and one-way bootstrap sealing.              | Inclusion in the rehearsal; exact target catalog, roles, parameters, and cutover evidence.                                            |
| Module and successor registry       | Module identities, code hashes, interfaces, status, and explicit successor relationships.                                                           | A complete candidate module graph and continuity evidence.                                                                            |
| Artwork finality                    | Delayed scheduling, cancellation or veto, component manifests, and terminal state.                                                                  | Inclusion in the rehearsal; complete payload binding and terminal-writer proof.                                                       |
| Record-family authorization         | Exact metadata and preservation record-type classes with checks for writer class, collection, and subject.                                          | Admissions, provider addresses, grants, runtime hashes, rotation and revocation evidence, and independent review.                     |
| Raise-only governed parameters      | Delayed, strictly higher, maximum-2x changes with no lowering or emergency mutation path.                                                           | A complete candidate parameter catalog and proposal-to-execution binding.                                                             |
| Collection metadata snapshots       | Immutable snapshot records with exact covered record types and fresh authority checks.                                                              | Exact candidate record admissions and writers.                                                                                         |
| Mint gates and durable counters     | Gate lifecycle, interface, code hash, metadata hash, gas limit, authorizer, quantity, and counter-scope binding.                                     | Use by the current signed Drop; support for nonempty nullifier arrays, which the manager and ledger reject.                           |
| Prepared mint execution             | Manager policy and counter validation followed by atomic Core prepare and complete entries.                                                         | Use by the current signed Drop, which takes the legacy Core route.                                                                     |
| Randomness lifecycle                | Pending, fulfilled, stale, and failed-post-processing states; provider and epoch binding; one derived seed; same-seed retries.                      | Live provider configuration, funding, callbacks, monitoring, stale policy, and recovery evidence.                                    |
| Metadata rendering and dependencies | Onchain and offchain modes, scripts, token data, dependency versions, images, attributes, and mutation-triggered ERC-4906 refresh events.           | Public-RPC, marketplace, browser, maximum-response, and long-term retrieval evidence.                                                  |

[Governance, Pausing, and Successors](./governance-pausing-and-successors) and
[Roles and Trust](./roles-and-trust) explain the authority systems in detail.

## Accepted targets not yet implemented

An accepted target is a committed architecture direction, not code that can be
credited to this candidate.

### Revenue-resolver validation adapter

The accepted revenue architecture adds one immutable, exact-code,
implementation-private validation adapter to resolver write paths. The adapter
owns no state, authority, roles, funds, or events and may make only approved
caller-insensitive, read-only calls to pinned dependencies.

The registered resolver stays the sole state owner, writer, Core royalty
pointer target, and normative event emitter. It authenticates the request,
checks adapter and dependency identities, validates the complete answer, and
only then changes state. The Core-facing royalty read uses resolver storage and
pure computation rather than calling the adapter.

The boundary fails closed: revert, out-of-gas, changed code hash, or malformed
output stops the write before lasting state change. Recovery requires a new
resolver, continuity proof, Registry V2 registration, and governed Core-pointer
replacement.

Complete conforming resolver and adapter source are not present at this commit.
Implementation remains gated on an independently approved normative interface
appendix and freeze commit.

### Satellite-triggered metadata refresh

Core currently emits ERC-4906 refresh events during its own mutations. The
accepted target adds restricted single-token and batch helpers so authorized
satellite contracts can emit standard refresh signals with Stream-native
context.

No such public or external helper exists in the reviewed Solidity. Caller
checks, lifecycle and range bounds, context binding, abuse analysis,
implementation, and tests remain outstanding. [Metadata, Scripts, and
Dependencies](./metadata-scripts-and-dependencies#refresh-events-tell-consumers-that-state-changed)
explains the present events and target.

### Genesis role inventory

Release artifacts describe a thirty-seven-role genesis inventory. It is an
architecture requirement and review target, not a concrete deployment
manifest. The candidate must bind every role to exact accounts, contracts,
selectors, scopes, delays, and revocation conditions.

## Proposed or deferred work

The following items are review input, not protection this candidate supplies:

| Area                                  | Position                                                                                                                                                                                                                                                       |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Artist-registry validation adapter    | ADR 0022 proposes an immutable, stateless, unregistered validation adapter while the registry remains the sole authority and state owner. The ADR authorizes no implementation.                                                                                |
| Payer-bound ERC-20 orchestration      | A sale adapter would verify a payer-signed `PaymentIntent` and alone pull allowance; settlement would record and route the value without pulling the payer. The verifier and top-level path do not exist.                                                     |
| Batch operation-root replay ownership | ADR 0018 proposes making the ledger the durable batch replay owner and joining ledger accounting to per-token prepared-mint events. It is not accepted or implemented.                                                                                         |
| Stale-randomness recovery             | A proposal would add an objective delay and one bounded recovery transition. The current stale state is terminal for that token.                                                                                                                               |
| Append-only artwork-finality recovery | ADR 0020 proposes a companion that preserves the original finality record and appends a governed recovery lineage. It is not accepted or implemented.                                                                                                         |
| Broader artist authority and recovery | Collaborators, delegated roles, guardians, estate instructions, sanctions, disputes, and recovery remain broader design work rather than a complete production artist registry.                                                                              |
| Additional sale profiles              | Dutch auctions, private sales, refund windows, sealed bids, raffles, burn-to-mint, ERC-20 bidding, and other profiles are proposed or deferred unless present in reviewed source and tests.                                                                    |
| `RandomizerNXT` production use        | The source remains in the repository, but reviewed release policy does not approve it as a production provider.                                                                                                                                               |

No topical explanation should present these items as current protection.

## Evidence available today

The repository contains:

- unit tests;
- fuzz tests;
- invariant tests;
- state-machine tests;
- adversarial multi-contract composition tests;
- focused tests for EIP-712, auction timing, mint accounting, burn behavior,
  metadata events, randomness states and retries, governance, and preservation.

The generated Technical Reference compiles the complete Solidity corpus at the
pinned commit and inventories protocol contracts, interfaces, libraries, test
contracts, deployment scripts, definitions, functions, events, errors,
signatures, selectors, and source ranges.

That is substantial engineering evidence. It does not rule out:

- a missing assertion or untested composition;
- a wrong specification implemented and tested consistently;
- deployment or initialization mistakes;
- live-provider differences;
- economic attacks;
- key-management failure;
- long-term storage, browser, RPC, or marketplace failure.

Tests of two mint lanes do not create a signed-Drop-to-MintManager integration
that the rehearsal lacks. Tests of individual revenue contracts do not create
one unified settlement path.

## Static analysis

The pinned
[`SLITHER_BASELINE.json`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/ops/SLITHER_BASELINE.json)
contains `30` open High or Medium findings: `3` High and `27` Medium.

The count alone does not prove exploitability, and static analyzers produce
false positives. It does prove the candidate is not static-analysis clean.
Every finding needs one of:

- a source-backed fix and regression test;
- a demonstrated false-positive analysis;
- an explicit accepted-risk decision with scope and owner;
- removal from the release surface.

The final register should retain tool version, configuration, raw output,
normalization rules, source commit, and disposition evidence.

## Known limitations and unresolved blockers

This is the central status register. Linked topical pages provide the fuller
behavioral explanation.

| Area                            | Current limitation                                                                                                                                                                                                                       | Detailed explanation                                                                                                                                                                                                                             |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Zero-mint final supply          | `setFinalSupply` stores `0` when no token has minted; `setCollectionData` also treats `0` as uninitialized, so an unfrozen collection can receive a new nonzero cap and minting can reopen. There is no separate final-supply flag or event. | [Final supply](./freezing-preservation-and-artwork-finality#final-supply-is-a-supply-promise)                                                                                                                                                     |
| Core bytecode margin            | The pinned proof records `StreamCore` deployed bytecode at `24,152` bytes: `424` bytes below EIP-170. It passes the interim `384`-byte margin by `40` bytes but misses the normative `2,000`-byte margin by `1,576` bytes.               | [Contract bytecode size](#contract-bytecode-size)                                                                                                                                                                                                |
| Governance record families      | `RISK-GOV-002` remains open for candidate admissions, providers, grants, runtime bindings, rotation and revocation evidence, and independent review.                                                                                      | [Record-family authorization](./roles-and-trust#record-family-authorization)                                                                                                                                                                     |
| Governance native value         | `RISK-GOV-003` records that executor native-value authority is too broad or insufficiently constrained.                                                                                                                                  | [Native-value authority](./governance-pausing-and-successors#native-value-authority)                                                                                                                                                             |
| Governed parameter binding      | `RISK-GOV-004` records incomplete end-to-end evidence that every governed action binds every sensitive parameter.                                                                                                                        | [Governed parameter binding](./governance-pausing-and-successors#governed-parameter-binding)                                                                                                                                                     |
| Parallel mint lanes             | Signed Drops and the current auction use legacy `StreamMinter`; manager and ledger behavior is separate.                                                                                                                                 | [The two source mint lanes](./tokens-collections-and-minting#the-two-source-mint-lanes)                                                                                                                                                          |
| Parallel accounting lanes       | Drop, Auction, curator pool, resolver, split wallet, settlement, and fixed Core royalty accounting are not one unified value path or ledger.                                                                                             | [One accountable value path](./revenue-splits-and-royalties#one-wei-should-have-one-accountable-path)                                                                                                                                            |
| Auction terms                   | Bid-increment percentage and extension time are mutable globals, not per-auction snapshots. They have no bound, delay, or change event and can change during active auctions.                                                            | [Minimum next bid](./fixed-price-sales-and-auctions#the-minimum-next-bid-is-exact) and [anti-sniping](./fixed-price-sales-and-auctions#anti-sniping-needs-a-reproducible-clock-rule)                                                           |
| Manager nullifiers              | The gate interface defines nullifiers, but the manager and ledger reject every nonempty nullifier array.                                                                                                                                 | [Gate security inputs](./tokens-collections-and-minting#gates-carry-security-inputs-not-descriptive-metadata)                                                                                                                                    |
| Manager replay ownership        | The manager derives a batch root and token operation IDs after consuming ledger state, while the ledger does not store the root and Core retains an unbounded lifetime token-operation mapping.                                          | [Durable replay ownership](./tokens-collections-and-minting#replay-protection-needs-one-durable-owner)                                                                                                                                           |
| Randomness stale state          | An authorized admin can mark a newly pending request stale without an onchain elapsed-time check. `Stale` is terminal and prevents another request for that token.                                                                       | [Current stale state](./randomness#the-current-stale-state-is-immediate-and-terminal)                                                                                                                                                            |
| Randomness provider replacement | A `FailedPostProcessing` request no longer counts as pending, so the provider can be replaced before retry; old provider or epoch checks then reject that retry.                                                                         | [Provider migration](./randomness#provider-migration-is-prospective-not-retroactive-recovery)                                                                                                                                                    |
| Randomness providers            | Live subscription or controller funding, callbacks, permissions, stale policy, monitoring, and raw-word retrieval are not proven by mocks. `RandomizerNXT` is not approved for production use.                                           | [Provider trust models](./randomness#two-providers-do-not-mean-one-trust-model)                                                                                                                                                                  |
| Shared collection identity      | A Stream collection has no separate ERC-721 contract address. Marketplace and indexer handling of Core-native collection identity remains a non-local launch gate. There is no dormant per-collection facade in this Core.               | [One permanent identity surface](./tokens-collections-and-minting#one-permanent-identity-surface-for-many-collections)                                                                                                                           |
| Metadata refresh                | Mutation-triggered Core events exist, but the accepted satellite-callable helper does not. The current collection batch refresh deliberately covers a superset of globally interleaved token IDs.                                      | [Refresh events](./metadata-scripts-and-dependencies#refresh-events-tell-consumers-that-state-changed)                                                                                                                                           |
| Metadata and RPC size           | Local acceptance of long strings or token URIs does not prove that public RPCs, wallets, indexers, or marketplaces process the result.                                                                                                  | [Size limits](./metadata-scripts-and-dependencies#size-limits-protect-more-than-gas)                                                                                                                                                             |
| Artwork finality                | Scheduling and veto mechanisms exist in source, but complete payload binding and the terminal selector and writer inventory are not proven for a candidate.                                                                             | [Delayed finality](./freezing-preservation-and-artwork-finality#terminal-finality-is-delayed-for-a-reason) and [terminal writers](./freezing-preservation-and-artwork-finality#terminal-means-every-effective-writer-is-accounted-for)          |
| Preservation availability       | A valid content hash proves equality after retrieval; it does not keep bytes, dependencies, browser, RPC, or rendering environment available. Independent package recovery has not been demonstrated.                                    | [Append-only preservation history](./freezing-preservation-and-artwork-finality#preservation-records-keep-history-append-only)                                                                                                                   |

## Contract bytecode size

The pinned
[`bytecode release proof`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/release-artifacts/latest/bytecode-release-proof.json)
records the exact Core measurement above. The narrow margin matters because a
small source or compiler change can cross the chain limit, emergency fixes
become harder, and optimizer and metadata settings affect the result.
"Deploys today" is not the same as a durable engineering margin.

The accepted revenue architecture also sets future limits for the resolver and
adapter: each must be no more than `22,576` bytes of deployed runtime and
`47,152` bytes of full initcode, including constructor arguments. Those limits
retain a `2,000`-byte margin under EIP-170 and EIP-3860 respectively.

Neither accepted future contract is implemented at this commit. Only a final,
canonical isolated build can provide release evidence; issue-worktree and
aggregate-build measurements are diagnostic.

## Candidate-bound evidence still required

The release needs a generated, machine-readable manifest containing:

- exact source and artifact hashes;
- compiler and optimizer settings;
- chain, addresses, creation transactions, and runtime code hashes;
- constructor and initializer arguments;
- Core pointers and the complete module graph;
- role holders, scopes, signer addresses, and signer epochs;
- record-family admissions, authority providers, and grants;
- governed parameters and action classes;
- pause, unpause, and guardian configuration;
- randomness providers, accounts, funding, callbacks, and monitoring;
- revenue, settlement, split, royalty, and liability paths;
- ownership transfers, renunciations, and one-way bootstrap sealing;
- explorer verification;
- independent readback of every critical invariant.

A local deployment script does not prove a live deployment is correct. Someone
other than the deployer must be able to reconstruct and verify the ceremony
without trusting private notes.

The staging review resolves to Wave
`19d4bbf5-86ec-4053-a5f2-bb28d7a2f780`, titled **Stream review (staging)**.
That is the verified staging-only destination.

The user-designated future production destination is Wave
`06e69198-eea7-40c5-95d3-7c1bf5051aba`. It is an intended mapping only.
Production review routes remain disabled, and this staging release neither
enables nor mutates that destination. Any future production activation must
bind this exact Wave through reviewed environment configuration and
independently read the mapping back before accepting feedback.

## Non-local evidence still required

The candidate lacks complete evidence for:

- fork or public-testnet execution against intended infrastructure;
- live VRF and arRNG requests and callbacks;
- production-style signing and ERC-1271 contract-wallet verification;
- marketplace handling of shared identity, metadata, and royalties;
- public-RPC handling of maximum token URI responses;
- independent retrieval and reconstruction of preservation packages;
- long-duration auction operation and failure recovery;
- signer and authority-provider rotation and revocation;
- successor discovery and continuity readback.

Mocks make tests deterministic. They cannot reproduce live service limits,
permissions, latency, billing, availability, or operational failure.

## External audit

There is no completed independent audit and remediation record for this
candidate. Community review can improve the specification and find serious
issues, but it does not replace expert audit.

The audit must cover the exact release candidate and deployment configuration,
not an earlier design branch. A material post-audit change needs an explicit
delta review. Findings need source-backed dispositions, fix commits, regression
evidence, and a record of remaining risk.

## Release blockers

Production must remain blocked until, at minimum:

- all High findings and every material Medium finding are fixed or formally
  resolved;
- the zero-mint final-supply promise is repaired or accurately redefined;
- governance record-family authorization and action binding are proven;
- native-value executor authority is constrained and tested;
- the chosen signed-sale mint lane is explicit and its callers, counters,
  replay state, and Core entry are tested end to end;
- native Drop and Auction accounting is deliberately retained or replaced by
  resolver and settlement integration, with no ambiguous parallel path;
- fixed Core royalties are deliberately retained or replaced by the accepted
  resolver-backed target, with marketplace behavior verified;
- Core meets the adopted bytecode margin or the design is deliberately revised;
- the accepted revenue-adapter architecture has an independently approved
  interface freeze, reconciled specification, conforming implementation,
  independent review, per-contract size proof, and adapter-first deployment
  evidence;
- each production randomness provider has candidate-bound non-local evidence
  and a reviewed stale and failure policy;
- the finality payload and every terminal writer are proven bound;
- deployment, bootstrap, rollback, and successor-cutover ceremonies are
  rehearsed and independently read back;
- preservation packages are independently recovered using only published
  instructions and commitments;
- any future production review activation binds and independently verifies the
  designated production feedback Wave without reusing the staging destination;
- external audit and remediation are complete;
- the final public review version matches the deployment commit and
  configuration exactly.

Public review may add blockers. Removing one requires evidence of resolution,
not a more reassuring label.

## Threat model

The protocol must assume:

- malicious buyers, bidders, recipients, and contract wallets;
- compromised or mistaken privileged accounts;
- stale, replayed, or partly bound signatures;
- unavailable or adversarial randomness infrastructure;
- hostile ETH and token recipients, reentrancy, and forced value;
- malformed metadata and very large return values;
- registries or modules configured in the wrong order;
- front-running, chain reorganizations, timestamp variation, and censorship;
- disappearing storage, RPC, browser, marketplace, and indexing services;
- governance descriptions that differ from executable bytes.

Honest mistakes belong in the model too. An artist can approve the wrong
manifest, an operator can select the wrong address, or governance can bind an
incomplete payload. No attacker is required for permanent damage.

## Review priorities

### Economic and accounting review

Reconstruct every liability across sales, auctions, refunds, randomness
reserves, split wallets, settlement, and emergency surplus. Prove:

- credits never exceed received value;
- the same funds are not promised twice;
- rounding dust has an explicit owner;
- reverting recipients cannot block unrelated users;
- emergency withdrawal excludes every liability;
- successor cutover cannot duplicate or abandon balances;
- contract wallets and self-referential recipients do not break accounting.

Invariant tests should combine sale, bid, refund, withdrawal, pause, burn, and
successor sequences.

### Signature review

Each signed action should bind chain, verifying contract, action type,
collection, relevant participants, economic terms, quantity, replay identity,
signer epoch, and deadline.

Compare the readable UI, typed-data payload, Solidity type hash, recovered
signer, replay storage, and emitted event. A value missing from one layer can
let the user approve one action while the contract executes another.

### Metadata and preservation review

Security includes the artwork experience. Test malformed strings, untrusted
HTML and JavaScript, oversized responses, missing dependencies, wrong hashes,
unavailable storage, and future browser behavior.

The contracts can remain secure while the artwork becomes unavailable. Release
criteria need both smart-contract security and preservation evidence.

## Public findings

The configured disclosure policy permits possible exploitable vulnerabilities
to be reported in the public review Wave while the candidate remains in its
validated predeployment state. That permission comes from explicit review state
and policy, not merely the absence of a deployment.

[How to participate in the community
review](./community-review#public-conduct-and-sensitive-information) contains
the reporting and sensitive-information rules. Each substantive disposition
should link a source commit, test, or documented decision. A status label
without evidence is not a resolution.

## Design position

Stream is ambitious because the problem is ambitious: preserve artistic intent
and token identity while sale infrastructure, randomness providers, metadata
services, governance, and other replaceable systems survive change.

That sophistication demands an exact readiness ledger. It is not suspect by
default, and local source or tests are not enough by themselves. The right
questions are whether each mechanism protects a real requirement, whether its
authority is bounded, and whether an independent party can reconstruct the
complete system.

The release standard is evidence, not confidence.

## Questions for reviewers

1. Does the implementation-state inventory classify any component too strongly?
2. Does the threat model omit an actor, asset, trust boundary, or failure mode?
3. Which current static-analysis findings become exploitable in composition?
4. Is the adopted Core bytecode margin adequate for a permanent contract?
5. Which governance paths still lack complete parameter or record-family
   binding?
6. What non-local evidence must exist before audit and before deployment?
7. Which properties need independent economic or formal verification?
8. Which accepted target is essential for genesis, and which can safely move to
   an explicit successor without weakening the permanent artwork promise?
