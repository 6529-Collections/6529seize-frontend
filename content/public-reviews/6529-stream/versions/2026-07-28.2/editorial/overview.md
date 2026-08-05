# 6529 Stream: public review

Stream is intended to be 6529 Network's reference ERC-721 contract for 1/1
digital art. It closes a practical gap in the Network's ability to mint:
important works may not fit The Memes because of their subject, style, number,
format, or audience, but they should still have a serious path from community
support to permanent onchain identity.

It is also a deliberate attempt to push the state of the art. Stream asks what
“museum-grade” treatment should mean for a 1/1 NFT expected to survive for
decades or centuries: attributable artist consent, provenance, context,
reconstructable materials, explicit economics, preservation evidence,
different kinds of finality, and visible future stewardship.

These are goals, not claims that the current candidate is finished. The exact
implementation state, missing evidence, and release blockers remain
centralized on [Current Implementation and
Readiness](./security-testing-and-known-limitations).

## Two objectives

1. **Support 6529 Network.** Give the Network a general-purpose home for
   community-curated 1/1 works that should not be forced into The Memes'
   particular format or selection model.
2. **Advance long-term treatment of digital art.** Build an open reference
   contract that treats identity, artist intent, provenance, context,
   dependencies, preservation, and survivability as protocol concerns rather
   than website promises.

The software is [MIT
licensed](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/LICENSE).
Anyone may inspect it, fork it, change it, and deploy an independent version,
subject to that license. Whether independent deployments should recognize one
another is a separate design question, not something the license decides.

## The intended first 6529 Network use case

The first program under discussion is a TDH-threshold path for 1/1 works,
provisionally called the **Stream Main Stage**. The name and the numeric policy
are not final.

Unlike The Memes' ranked contest, this would be a threshold rule:

1. An artist proposes a work, or a work inside an artist collection, to the
   Main Stage.
2. The work must remain above a published Total Days Held (TDH) support
   threshold for a published interval. **10 million TDH** and **24 hours** are
   candidate values, not contract constants or approved policy.
3. Once the offchain process determines and records that the rule was
   satisfied, an authorization builder prepares the exact payload, the
   configured signer signs it, and a caller submits it. Ethereum does not
   calculate TDH, and Solidity verifies the signer and payload—not the TDH
   calculation, threshold interval, or behavior of those offchain actors.
4. That authorization mints the 1/1 into auction custody and opens a
   zero-reserve English auction. A **24-hour scheduled auction** is the current
   product idea. The signature fixes its initial absolute end time, but the
   pinned source applies a contract-wide extension setting that an authorized
   admin can change during an active auction. It is not signed or pinned per
   auction, so the actual close is not guaranteed to remain 24 hours. Zero
   reserve also currently permits zero-value bids, which needs an explicit
   launch decision.
5. The intended 6529 program split is **75% to the artist and 25% to the
   Network**. The reviewed contracts support configurable proceeds rules; that
   75/25 policy is not hardcoded in the pinned source. The source's current
   legacy default is 50% poster, 25% protocol, and 25% curator, while a separate
   target specification says 90% artist and 10% protocol. The launch policy and
   deployment configuration must reconcile those three positions. It must also
   prove that both sale lanes use the intended percentages and that their
   `poster` and protocol payout addresses are actually the artist and Network.

This makes the proposed social rule simple: a work either clears the published
threshold for the required time or it does not. The signed authorization binds
the selected work and initial auction inputs, but the pinned source still
leaves the extension rule and auction-settlement proceeds configuration
mutable, as the readiness ledger records.

## One Stream, many artist collections

The reviewed Core can hold many native collections inside one shared ERC-721
contract. Each token receives a deployment-global Stream token ID and a serial
inside its collection.

That would let an emerging photographer—say, Punk 6529—propose a coherent
photography collection within Stream while every photograph still requires a
separate one-use authorization after offchain threshold evidence is produced.
The contract verifies that authorization; it does not verify the TDH result.
The shared contract gives those works one visible Network home. Core records
their artist, scripts, metadata state, supply, and local sequence; which facts
become terminal depends on the later collection freeze and the separate
satellite-record and artwork-finality boundaries.

This is not the same as giving every artist a separate ERC-721 address.
Marketplaces that group NFTs only by contract address may show the shared
Stream contract first and the native collection second. A separately deployed
Stream would instead have its own Core address, token namespace, governance,
configuration, and trust boundary.

## Key questions before launch

These choices should be decided explicitly rather than smuggled into
deployment scripts:

1. **Where should 6529 Network Museum accession collections live?** Publishing
   them inside the main Stream could improve visibility and make accession
   events part of the Network's shared 1/1 history. A separate Museum
   deployment would use a more conventional institutional boundary and keep
   accession events operationally contained.
2. **When should another program share the main Core?** A creator or community
   such as hugofaz might want a distinct 1/1 program with card-based TDH or
   another curation rule. Is that a native collection inside the main Stream,
   or an independent deployment with its own policy and governance?
3. **Should independent deployments be discoverable together onchain?** A
   registry could link related Stream deployments, their operators, code
   versions, and declared status without pretending they share governance or
   quality. Is that useful, and who—if anyone—may call an entry canonical?
4. **What exactly are the first Network parameters?** The Main Stage name,
   eligible TDH, threshold, required time above threshold, auction duration,
   reserve, extension rule, signer, evidence record, and 75/25 configuration
   all need one published launch policy.

## Why the architecture is modular

Ethereum sharply limits deployed contract size, and Stream's responsibilities
do not all have the same lifetime. Token identity should be extremely hard to
change. Sale formats, metadata tools, randomness providers, revenue machinery,
and operational controls may need to improve or be replaced.

Stream therefore uses a permanent Core surrounded by separately visible
contracts. Core holds shared ERC-721 identity and the smallest common
invariants. Other contracts handle mint policy, signed sales, auctions,
revenue, randomness, metadata, preservation, roles, and pauses. The
longer-term source also models delayed governance and successor records, but
the current rehearsal does not deploy that machinery.

This is a modular contract suite, not a claim that every component is a
frictionless hot-swappable plug-in. A replacement remains a new contract with
new code and an explicit relationship to its predecessor. The architectural
test is whether Stream can irreversibly freeze the defined Core state of an
individual collection while separately governed satellite duties evolve
without breaking supply, artist consent, custody, liabilities, or historical
evidence. That collection freeze is not a freeze of the entire shared Core or
every surrounding contract.

## Interesting features

- **[One permanent identity surface for many
  collections](./tokens-collections-and-minting#one-permanent-identity-surface-for-many-collections).**
  A token has both a deployment-global ID and a collection-local serial.
  Burning it ends ownership, not its identity or history.
- **[Exact artist
  consent](./for-artists#you-approve-a-specific-state).** The artist signs
  a named state, not a vague “I approve Stream” message. Changing a bound
  field makes the old approval describe an older state.
- **[A signed bridge from community judgment to
  execution](./curation-and-tdh-authorization#from-a-community-decision-to-a-contract-call).**
  TDH stays offchain, but the resulting one-use authorization fixes the
  collection, work, timing, sale mode, and economic terms Solidity will accept.
- **[Auction custody and pull
  payments](./fixed-price-sales-and-auctions#the-auction-flow).** The work is
  minted into auction custody before bidding. Proceeds and refunds become
  withdrawable credits so a recipient cannot block settlement by rejecting an
  inline transfer.
- **[Configurable, inspectable
  economics](./revenue-splits-and-royalties#the-native-eth-flow).** Contract-,
  collection-, and token-level native-sale rules create visible poster,
  protocol, and curator credits. Richer collaborator split machinery also
  exists in source, but is not wired into the rehearsed sale path.
- **[Generative-art context as part of the
  record](./metadata-scripts-and-dependencies).** Scripts, token data,
  dependencies, content commitments, and renderer inputs can be named and
  versioned instead of living only in a mutable website.
- **[Randomness without an invisible
  reroll](./randomness#a-failed-core-write-must-not-become-a-reroll).** Requests bind the provider and
  provider era. If post-processing fails, the same accepted seed can be retried
  while that provider and era remain current.
- **[Several distinct meanings of
  final](./freezing-preservation-and-artwork-finality).** Supply closure, Core
  freeze, preservation evidence, and terminal artwork finality answer
  different questions. The longer-term source models them separately; the
  readiness ledger identifies which parts are not yet in the rehearsed path.
- **[Source-designed successors around a non-proxy
  Core](./governance-pausing-and-successors).** The pinned source can record a
  new contract's predecessor without hiding bytecode behind the old Core
  address. The rehearsal does not deploy that machinery or prove which action
  makes a successor authoritative.

The [Artwork Lifecycle](./artwork-lifecycle) follows one work from collection
creation through authorization, mint, sale, randomness, metadata, preservation,
freeze, and finality. The pages above then isolate each mechanism so reviewers
can examine it without repeating a second full contract tour here.

## Why this complexity exists

Complexity should earn its place. The useful question is not whether Stream has
many components, but which real requirement each component addresses and where
that responsibility would go if the component were removed.

Some responses below are connected in the current rehearsal; others are
implemented only in the longer-term source design. The
[readiness ledger](./security-testing-and-known-limitations) classifies that
boundary rather than asking this architecture argument to double as a status
page.

| Requirement | Stream response | What simplification would externalize |
| --- | --- | --- |
| Keep an artwork's identity stable | A permanent shared Core records token and collection identity | Identity becomes dependent on one sale contract, renderer, website, or later migration |
| Let infrastructure improve without silently rewriting the art | Separate contracts surround the non-proxy Core; the longer-term source can record predecessor and successor relationships | Either old infrastructure can never change, or an upgradeable proxy can replace behavior beneath the same address |
| Make artist consent specific | Typed state approval with ordinary-account and contract-wallet signature support | Consent becomes a vague message, operator assertion, or private workflow |
| Connect community curation to exact execution | A signed authorization binds the chain, contract, signer era, collection, participants, economics, timing, and sale mode | The offchain decision and onchain action can drift apart |
| Support different distribution policies safely | The source keeps mint phases, executors, gates, policy hashes, and durable counters outside the permanent token layer | Every new distribution rule either bloats the Core or depends on a private eligibility database |
| Handle generative randomness without reroll ambiguity | Requests bind provider and era; fulfillment stores evidence; failed Core writes can retry the same derived seed while that provider and era remain current | Provider delay, callback failure, retries, and migration become informal operator decisions |
| Preserve executable artwork, not only a token URI | Scripts, token data, dependencies, content commitments, manifests, and preservation records describe what the work needs | Critical materials and runtime assumptions remain scattered across mutable services |
| Say exactly what “final” means | The source separates supply finalization, Core freeze, preservation evidence, and terminal artwork finality | One “immutable” badge conceals remaining mutation paths, dependencies, and operational duties |
| Represent real artistic economics | Native sales record poster, protocol, curator, refund, and bidder credits; disconnected source machinery models richer splits and settlement | Collaborator payments, curator rewards, refunds, rounding, and royalty policy move into private accounting |
| Survive organizational and technical change | The longer-term source models delayed actions, guardians, module registration, permanently disabled functions, and successors | Future operators either have no recovery path or rely on opaque emergency authority |
| Respond to incidents without freezing everything | Pause domains separate minting, bidding, settlement, metadata, and randomness, with distinct pause and resume powers | A single emergency switch either misses the affected path or strands unrelated users |

This table is also an invitation to simplify. A reviewer who thinks a mechanism
is unnecessary should identify the requirement that can be dropped, narrowed,
moved offchain, or served by a smaller design. “Too complex” begins the
analysis; it does not finish it.

## Exact source and current state

The source is pinned to
[`513bd7e079eafe109df6ae1ae21bfbca6fec6786`](https://github.com/6529-Collections/6529Stream/tree/513bd7e079eafe109df6ae1ae21bfbca6fec6786),
with Git tree
`b50ec53109f5f8d6b4f4b07f4cb6fd3c1d0e3100`. Every code link in this review
points to that commit. A later candidate receives a new review version so its
code, explanation, and feedback remain historically reproducible.

[Current Implementation and
Readiness](./security-testing-and-known-limitations) is the single inventory of
what the pinned rehearsal connects, what exists in source, which accepted
targets still need implementation, which ideas remain proposals, and what
evidence is required before release.

The generated Technical Reference is compiled from the same pinned source. It
inventories the contracts, interfaces, libraries, functions, events, errors,
signatures, selectors, and source ranges seen by the compiler. It supports
navigation and completeness checks; it does not decide whether the design or
implementation is correct.

## Questions for reviewers

1. Does Stream take responsibility for the right parts of a serious 1/1
   artwork's lifecycle?
2. Which mechanisms solve a real long-term requirement, and which should be
   removed or narrowed?
3. Is a shared, multi-collection permanent Core the right long-term identity
   model?
4. Is the boundary between permanent and replaceable components clear enough?
5. Which powers should require an artist signature, a delay, a guardian veto,
   or more than one of those?
6. Which external dependencies are acceptable for artwork intended to remain
   usable for decades?
7. Does the design make complexity inspectable, or merely distribute it across
   more contracts?
