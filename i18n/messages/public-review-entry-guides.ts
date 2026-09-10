export const PUBLIC_REVIEW_ENTRY_GUIDE_MESSAGES = {
  "publicReview.legacyEntryFeedback.artworkFormats":
    "What kinds of art can it support?",
  "publicReview.legacyEntryFeedback.release": "How does a release work?",
  "publicReview.legacyEntryFeedback.permanence": "What lasts?",
  "publicReview.legacyEntryFeedback.paths":
    "Choose what you want to understand",
  "publicReview.legacyEntryFeedback.feedback": "Help shape it",
  "publicReview.legacyEntryFeedback.artistRelease":
    "Decide what you are releasing",
  "publicReview.legacyEntryFeedback.artistApproval":
    "Know what your approval covers",
  "publicReview.legacyEntryFeedback.artistPayments": "Understand who gets paid",
  "publicReview.legacyEntryFeedback.artistPermanence":
    "Decide what can change—and what should become permanent",
  "publicReview.legacyEntryFeedback.artistPractice":
    "What would work for your practice?",
  "publicReview.pages.currentSnapshot.overview.summary":
    "The artwork formats Stream can represent, what is built, and what remains to finish before launch.",
  "publicReview.pages.currentSnapshot.artwork-lifecycle.summary":
    "The intended journey from preparing an artwork to preserving it, with the unfinished steps made clear.",
  "publicReview.pages.currentSnapshot.for-artists.summary":
    "Accepted artist rights, proposed publishing tools, and the limits of the current implementation.",
  "publicReview.pages.currentSnapshot.roles-and-trust.summary":
    "Who can act in the current contracts, and which artist permissions still need implementation.",
  "publicReview.pages.currentSnapshot.curation-and-tdh-authorization.summary":
    "What the older signed-sale permission checks, and what still needs connecting to permanent-Core minting.",
  "publicReview.pages.currentSnapshot.tokens-collections-and-minting.summary":
    "How the permanent Core represents collections, controls minting, and closes supply for good.",
  "publicReview.pages.currentSnapshot.fixed-price-sales-and-auctions.summary":
    "How the older ETH sale and auction contracts work, and where their connection to the permanent Core remains unfinished.",
  "publicReview.pages.currentSnapshot.revenue-splits-and-royalties.summary":
    "Sale credits, split wallets, and royalty information exist; the complete launch payment path still needs work.",
  "publicReview.pages.currentSnapshot.randomness.summary":
    "What Core records for random artwork, what the legacy integration demonstrates, and what still needs building.",
  "publicReview.pages.currentSnapshot.metadata-scripts-and-dependencies.summary":
    "How artwork records, software dependencies, and metadata refresh controls fit together, including unfinished connections.",
  "publicReview.pages.currentSnapshot.freezing-preservation-and-artwork-finality.summary":
    "Closing minting, blocking burns, freezing Core state, and finalizing the wider artwork are separate decisions.",
  "publicReview.pages.currentSnapshot.governance-pausing-and-successors.summary":
    "Built governance and pause controls, and the limits of what they prove about a future contract transition.",
  "publicReview.pages.currentSnapshot.security-testing-and-known-limitations.summary":
    "The pinned candidate's implementation, retained evidence, and remaining launch requirements.",
  "publicReview.pages.currentSnapshot.community-review.summary":
    "Choose a part of Stream to examine and leave feedback tied to the exact candidate.",
  "publicReview.navigation.startHere": "Start here",
  "publicReview.navigation.compactMenu": "Contents",
  "publicReview.navigation.forArtists": "For artists",
  "publicReview.navigation.forCollectors": "For collectors",
  "publicReview.navigation.reviewCode": "Review the code",
  "publicReview.navigation.giveFeedback": "Give feedback",
  "publicReview.navigation.allTopics": "All topics",
  "publicReview.navigation.relatedTopics": "Explore next",
  "publicReview.navigation.shortGuide": "Short guide",
  "publicReview.navigation.topicGuide": "Detailed topic",
  "publicReview.navigation.fullArtistDetails": "Full artist details",
  "publicReview.navigation.artworkPreview": "Explore an example artwork",
  "publicReview.pages.startHere.title": "Meet Stream",
  "publicReview.pages.startHere.summary":
    "Stream is a system being developed for releasing and collecting digital art. It brings together the artwork's identity, how tokens are created and sold, and records that help people understand and preserve the work over time.",
  "publicReview.pages.startHere.markdown": `**Stream is under community review. It is not a live publishing service, and independent audit and launch evidence remain incomplete.**

## What kinds of art can it support?

| Format | A simple example |
| --- | --- |
| **1/1** | One artwork with one token. |
| **1/1/x** | A series of distinct works, each with its own token—for example, 100 different outputs from one artwork program. |
| **Editions** | Multiple copies of an artwork, each represented by its own token—for example, an edition of 50. |

Editions are not restricted to The Memes. Work may use images, animation, video, audio, code, or a combination. **The formats and publishing tools offered at launch still need confirmation.**

All Stream NFTs share one main contract, called **Core**, which records token identity and ownership. Some marketplaces may display different Stream collections together unless they support its collection information.

## How would a release work?

The intended journey is to prepare the artwork and sale terms, obtain the artist's required approvals, create and sell NFT tokens, reveal any generated output, and preserve the finished work. Creating a token is called **minting**.

The main pieces of code exist, but the minting pieces cannot yet connect to Core. Artist approval, sales, and payments still need work before the full journey can function. Successful tests of older contracts do not prove that this new system works from start to finish.

## What do the status labels mean?

- **Built in this code:** an implementation exists. Its connections, audit, and deployment still need their own evidence.
- **Agreed but unfinished:** an accepted requirement still needs implementation or evidence.
- **Still proposed:** the design awaits acceptance.

This review describes the code snapshot checked on September 9, 2026. [See the exact candidate and review priorities.](/reviews/6529-stream/review-the-code)

## What lasts?

Core is designed to remain unchanged after deployment. Closing a collection stops new tokens forever. Preventing token destruction and making the artwork's records permanent are separate decisions. Preserving the files takes ongoing work: a digital fingerprint can verify a recovered copy, but cannot keep it online.

## Choose your path

- [**For artists:** choices, consent, collaborators, and payment.](/reviews/6529-stream/for-artists)
- [**For collectors:** buying, supply, changeable rules, and access.](/reviews/6529-stream/for-collectors)
- [**Review the code:** implementations, connections, and evidence.](/reviews/6529-stream/review-the-code)

[Help shape Stream.](/reviews/6529-stream/community-review)`,
  "publicReview.pages.artistEntry.title": "Stream for artists",
  "publicReview.pages.artistEntry.summary":
    "Stream's goal is to give your artwork a lasting identity and a clear record of how it is released, paid for, and preserved.",
  "publicReview.pages.artistEntry.markdown": `**Stream is being developed and is open for community review. It is not a live publishing service.** Its main contract, called Core, can represent unique works, series, and editions outside The Memes. Launch publishing tools and artist selection still need confirmation.

## Review one clear release plan

You should see the artwork and required files, license, token supply, sale terms, payment recipients, and who may make later changes. All Stream NFTs share one Core address; separate marketplace collection pages depend on marketplace support.

## Know what your approval covers

**Agreed but unfinished:** artist acceptance, consent for minting, approval of relevant payment changes, and final artwork approval must have clear, enforced meanings. A signature screen should show the exact decision you are making.

These protections are not fully implemented. The older code lets an artist sign selected collection details, but does not require that signature before creating tokens. It does not prove that the artist approved the whole release plan.

The agreed plan also lets artists change signing wallets, requires collaborators to accept their roles, and provides for limited delegates and estates. The contracts and screens needed to support all of this remain unfinished. Full artist details below explains the design decisions.

## Understand who gets paid

The older sale contracts set aside shares for a named seller account (the **poster**), the platform, and curators. The poster is not automatically the artist or the wallet submitting the transaction. The release plan must explain how your share and collaborators' shares reach the right people.

Code for dividing payments between recipients exists, but it is not yet connected into a complete sale through the permanent Core.

Stream is designed to tell marketplaces who should receive resale royalties and how much. This candidate cannot yet activate that connection, so its royalty lookup currently returns zero. Even with that connection working, outside marketplaces decide whether to pay royalties.

[Explore payments and royalties.](/reviews/6529-stream/revenue-splits-and-royalties)

## Decide what becomes permanent

Closing a collection permanently stops new tokens, even if none have been created. Preventing token destruction (burning), locking Core's collection rules, and making the wider artwork permanent are separate steps. Review the exact files, software, supporting files, and permissions covered by each step.

A matching fingerprint proves a recovered file is correct; it cannot retrieve a missing file. A useful preservation package needs copies and instructions another person can use.

[Explore permanence and preservation.](/reviews/6529-stream/freezing-preservation-and-artwork-finality)

## What would work for your practice?

Which decisions must always require your signature? What should collaborators or an estate be allowed to do? What would you need to inspect before making the work permanent?

Open **Full artist details** below for the accepted requirements, implementation limits, and exact source links.

[Give feedback](/reviews/6529-stream/community-review) · [Back to the introduction](/reviews/6529-stream)`,
  "publicReview.pages.collectorEntry.title": "Stream for collectors",
  "publicReview.pages.collectorEntry.summary":
    "When considering a Stream artwork, you should be able to understand what you receive, how the sale works, and what can still change afterward.",
  "publicReview.pages.collectorEntry.markdown": `**Stream is under community review. This candidate is not deployed, and independent audit and launch evidence remain incomplete.**

## Know what you would receive

Stream can represent one unique work, a series of distinct works, or an edition. Editions are not limited to The Memes. Each token has its own identity and a recorded collection link.

All Stream NFTs share one main contract, called **Core**. Some marketplaces may group different Stream collections together unless they support the collection information. A collection ID does not guarantee a separate marketplace page.

## Check supply and changeable rules

Core supports three supply rules: a fixed maximum, a maximum that authorized governance can change, or no numeric maximum. Any collection can be closed to stop new tokens forever, even if none have been created. Burning destroys a token but does not erase its identity or its place in the number ever created.

Stopping new tokens, preventing burns, locking Core's collection rules, and making the wider artwork permanent are different steps. Before buying, you should be able to see which are complete and who can still make changes.

[Explore collection and minting rules.](/reviews/6529-stream/tokens-collections-and-minting)

## Understand the sale

The older contracts demonstrate fixed-price ETH sales and auctions. Refunds and sale proceeds are recorded as balances that recipients must withdraw. Some recovery and withdrawal paths have known problems. Tests of those older contracts do not prove a working sale through the new permanent Core: its minting pieces cannot yet be installed, and the complete sale connection remains unfinished.

The **poster** is the seller account named in the sale permission. Someone else may submit the transaction. Sale screens should identify the artwork, total cost, recipient, deadline, refund rules, and whether the final artwork is ready to view.

[Explore sales and auctions.](/reviews/6529-stream/fixed-price-sales-and-auctions)

## Check consent and reveal status

Creating a token (minting) does not by itself prove that the artist approved the full release. Artist consent is an agreed requirement whose complete implementation still needs work.

Some artwork needs a random result after minting. Core records which contract is responsible for coordinating that result. The complete reveal and recovery service still needs building and testing. Owning a token does not prove that its final artwork is already available.

## Consider long-term access

Look for the required files, usable copies, and instructions for opening or recreating the work. Files outside Ethereum need people or services to keep them available. Even saved code may require particular software. A fingerprint helps check a copy; it cannot keep that copy online.

[Explore artwork storage](/reviews/6529-stream/metadata-scripts-and-dependencies) · [Give feedback](/reviews/6529-stream/community-review)`,
  "publicReview.pages.codeEntry.title": "Review the Stream code",
  "publicReview.pages.codeEntry.summary":
    "Start with the exact candidate, its implemented parts, the missing connections, and the claims each part is meant to support.",
  "publicReview.pages.codeEntry.markdown": `This review covers **2026-09-09.1**, pinned to **92ea123380917032f01aae09691141a2a72df935** and checked on September 9, 2026. The candidate remains not deployed and pre-audit. Later changes are outside this snapshot.

[Open the pinned source](https://github.com/6529-Collections/6529Stream/tree/92ea123380917032f01aae09691141a2a72df935) · [Open the technical reference](/reviews/6529-stream/reference)

## Start with the actual connections

| Area | Built code and its boundary |
| --- | --- |
| Permanent Core | ERC-721 ownership, collection identity, terminal closure, burn blocking, manager-only minting, and governed module references. |
| Manager and ledger | ADR 0018's mint execution and replay accounting are implemented. The real manager and ledger fail permanent-Core installation checks; their existence does not establish a working connection. |
| Older signed sales | Drops and Auctions retain local ETH credits and use the old minter. The rehearsal imports a test-only legacy Core. This does not prove a permanent-Core sale integration. |
| Royalties and metadata | Core has a royalty lookup function, but its resolver cannot be installed and the lookup returns zero. Router hooks, fallback metadata, and restricted refresh helpers exist; serving integrations need separate evidence. |
| Artist authority | An evidence archive and contract directory exist, but Core's artist-registry connection is disabled. Full artist consent is unfinished; ADR 0023's architecture remains proposed. |

The source has moved into domain folders. Follow this version's generated declarations and pinned links rather than old flat-file line numbers.

## Check the consequential claims first

**Artist consent:** accepted requirements cover attribution, mint consent, payment changes, collaborators, and succession. Trace each required check through concrete callers; the old snapshot signature is not a whole-plan approval.

**Supply and replay:** test terminal closure, including zero minted tokens, cap changes, failed batches, burns, used nullifiers, and manager replacement. The old empty-collection reopening caveat belongs to the legacy Core.

**Paid minting:** first prove real registry registration and governed installation of the real manager and ledger into permanent Core. Then join sale, settlement, ledger, and token operation records. Passing tests with stand-ins does not prove those connections. ADR 0019 remains proposed.

**Finality and replacement:** check the exact authority, component set, waiting period, veto, writer coverage, and preserved obligations. ADR 0020 recovery remains proposed.

## Follow claims to evidence

Use three labels: **built in this code**, **agreed but unfinished**, and **still proposed**. Code existence, integration, deployment, marketplace behavior, and independent audit need different evidence.

ADRs are design decision records. An accepted decision does not make its specification final: the specification inventory still lists Draft documents. The policy requires the governing specifications to reach Final before deployment, with permanent interfaces and rules fully defined.

Use the [specification policy](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/spec-policy.md) to find the owning requirement, then compare it with pinned Solidity. State any difference. Historical implementation notes and old contradiction lists are not current-code evidence. AUTHORIZER counters, gates, and one-use claims exist; shared counters across phases and successor continuity remain unfinished.

[ADR 0021](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/adr/0021-immutable-revenue-resolver-validation-adapter.md) accepts a revenue architecture, not a production implementation. [ADR 0022](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/adr/0022-immutable-artist-registry-validation-adapter.md) and [ADR 0023](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/adr/0023-modular-artist-authority-domain-ownership.md) remain proposed. Tests and supporting documents do not change those decision statuses.

The committed Core size proof reports 18,997 runtime bytes and 5,579 bytes of headroom. This is retained build evidence. Public beta and production remain blocked by missing audit and deployment evidence and incomplete launch bindings.

[Read development status and the exact evidence.](/reviews/6529-stream/security-testing-and-known-limitations)

## Leave a finding someone can act on

Name the claimed rule, exact source, conditions, and call sequence. Explain who is affected. Distinguish a demonstrated result from an assumption, and an older rehearsal from the permanent-Core path.

[How to report a finding](/reviews/6529-stream/community-review) · [Public feedback](/reviews/6529-stream/feedback)`,
  "publicReview.corrections.revenueSummary":
    "Sale credits and split-wallet code exist; royalty activation and the complete launch payment path remain unfinished.",
  "publicReview.corrections.roleIntroduction":
    "Core is the main contract for token identity and ownership. Separate contracts handle tasks such as minting, payments, and artwork records. People have different permissions to use and configure them.",
  "publicReview.corrections.curationIntroduction":
    "TDH (Total Days Held) is 6529's holding-based score. Its calculation and community selection happen outside the Stream contracts.",
  "publicReview.corrections.signerEpoch":
    "The older Drop code checks that a permission has not expired, been cancelled, or already been used. It also checks the signer's version number, called an epoch. Changing that number invalidates older permissions.",
  "publicReview.corrections.mintHeading":
    "## Minting logic and its blocked connection",
  "publicReview.corrections.mintSpecificationLink": "[mint specification]",
  "publicReview.corrections.randomnessCommitment":
    "**Built in the permanent Core:** Core records which entropy coordinator is selected when a token is minted. This is the contract responsible for coordinating its random result. Core passes a mint commitment, a fingerprint of the mint inputs, to that coordinator; it does not store the commitment itself. **Agreed but unfinished:** the complete service still needs the coordinator, provider, reveal funding, and recovery path connected and tested.",
  "publicReview.corrections.metadataIntroduction":
    "Core records the token's identity and fixed token data. Metadata is the information used to describe and display it, such as its name and artwork location. Separate contracts store those records; a router is the contract Core asks for the current display information.",
  "publicReview.corrections.metadataHeading":
    "## How marketplaces learn about changes",
  "publicReview.corrections.governanceIntroduction":
    "Core's code cannot be swapped after deployment. Separate contracts can be replaced through approved governance actions: each change must follow the required permissions, checks, and waiting periods.",
  "publicReview.corrections.governancePointers":
    "A pointer is Core's stored reference to another contract. Changing it requires checks against the registered contract and its expected identity. Freezing a pointer prevents later replacement of that reference; it is separate from freezing a collection.",
  "publicReview.corrections.readinessSpecifications":
    "The agreed design requires artist approval, collaborator and estate protections, correct payment for each mint, connected launch components, and replacements that preserve obligations and history.\n\nThe specification inventory still lists Draft documents. Accepted design decisions do not make those documents Final or prove that the code meets them. The specification policy blocks deployment until the governing specifications reach Final; permanent interfaces and rules must be completed before Core is deployed. See the [specification policy](https://github.com/6529-Collections/6529Stream/blob/92ea123380917032f01aae09691141a2a72df935/docs/spec-policy.md).",
  "publicReview.corrections.mintComponents":
    "The permanent Core, mint manager, and ledger are implemented separately. The real manager and ledger cannot yet pass Core's installation checks, so their connection needs fixing and testing together.",
  "publicReview.corrections.mintExecution":
    "The manager's execution logic checks its phase and gates, records used allowances and claims in the ledger, then asks Core to mint. The real manager cannot yet be installed into permanent Core, so this describes implemented logic whose connection is blocked.",
  "publicReview.corrections.lifecycleFreeze":
    "Burn blocking is a separate irreversible step after closure. It must happen before Core freeze, but the two actions can execute in the same transaction once the required governance conditions are met. Freeze locks the Core collection boundary; it does not by itself freeze every external artwork record or keep a file online.",
  "publicReview.corrections.artistRoyalties":
    "Stream is designed to report royalty instructions to marketplaces. This candidate cannot install its royalty resolver, so the Core lookup currently returns zero. This connection must be completed before deploying permanent Core. Even then, royalty information cannot force a marketplace to pay.",
  "publicReview.corrections.managerRole":
    "Implemented phase and ledger checks prepare mint requests. The real manager cannot yet pass permanent-Core installation checks.",
  "publicReview.corrections.artistConnection":
    "The newer artist archive stores evidence and the registry directory identifies contracts. Neither is the completed authority system, and Core's artist-registry connection is currently disabled. ADR 0023's division of artist responsibilities remains proposed.",
  "publicReview.corrections.managerChecks":
    "**Built separately; connection blocked:** the manager and ledger contain mint execution and accounting logic, but neither implements the ERC-165 interface response required for installation into permanent Core. Their custom marker methods do not satisfy that check. The real registry, governed installation, manager, ledger, and Core still need to work together.\n\nThe manager's logic checks the phase, caller, token batch, and required gates.",
  "publicReview.corrections.mintRemaining":
    "Fixing module installation will not by itself complete artist consent or a paid sale. Shared counters across phases, global counters, and successor continuity also remain unfinished.",
  "publicReview.corrections.freezeOrder":
    "Burn blocking is a separate irreversible action after closure. Burns must be blocked before Core is frozen. These actions can happen in the same transaction once the required governance conditions are met; Core does not require an extra block between them. The specification also permits ordered artwork finalization in that batch when all of its separate conditions are satisfied.",
  "publicReview.corrections.finalityConnection":
    "The source contains a finality registry and a read adapter that combines Core facts with collection metadata. The real registry also lacks the interface response required for installation into Core. Its scheduling, veto, and execution checks are implemented separately from that blocked connection.",
  "publicReview.corrections.royaltyLookup":
    "**Lookup code exists; activation is blocked:** Core has a royaltyInfo function, but its royalty-resolver interface is unresolved and installation is rejected. Ordinary configuration of this candidate therefore leaves the lookup at no receiver and zero royalty. This must be resolved before deploying permanent Core; adding a new resolver afterward cannot repair a disabled Core connection. The separate primary-revenue resolver is not the complete royalty system.\n\nDo not describe this Core as reporting a universal fixed 6.9% royalty; that belongs to the legacy Core.",
  "publicReview.corrections.withdrawalLimits":
    "Fixed-price and auction credits are separate balances in separate contracts. A failed withdrawal rolls back that attempt and preserves its credit, but that does not guarantee a working recovery route. Rotating the curator pool can strand older reserve credits until configuration is restored. Auction bidder refunds are also separate from seller proceeds; the winning bid is not an outbid-refund credit.",
  "publicReview.corrections.assetDeprecation":
    "The split factory and wallets represent fixed recipients and shares. The resolver selects revenue policies, and the settlement contract provides a separate payment entry point. These components need to be connected to the actual sale path; merely deploying a wallet does not route sale money into it.\n\nThe specification requires eligible existing balances to remain withdrawable when a payment token is deprecated, meaning retired from new use. The current split wallet instead blocks those withdrawals until the token is reactivated. Treat the required withdrawal protection as unfinished.",
  "publicReview.corrections.auctionLimits":
    "If there are no bids, the token returns to an ordinary poster wallet. A contract poster receives a claim right so it can choose a receiving address. Cancellation is limited to the pre-bid case and the permitted poster/admin callers. A failed safe transfer rolls back that cancellation.\n\nThe winner has no equivalent alternate-recipient recovery. If a winning contract cannot receive the NFT, settlement fails and both the NFT and winning payment remain held. The no-bid return path does not solve that case.\n\nThe older auction also reads mutable payment splits at settlement: an authorized admin can change who gets paid after a funded bid. A zero-reserve auction accepts zero-value bids that can extend its timer, and rounding can let a tiny outbid equal the previous bid. These are limitations of the retained older code, not evidence about unimplemented replacement sale contracts.",
  "publicReview.corrections.randomnessGas":
    "These integrations belong to the older Core flow. The retained sale rehearsal uses a test-only legacy Core and wires those randomizers there. A passing legacy callback is not proof of a complete reveal connection for the permanent Core.\n\nThe legacy VRF callback defaults to 40,000 gas. That budget needs testing with the intended provider: if the callback runs out of gas before saving the seed, the local retry cannot recover it. The post-processing retry only covers results already accepted. The production provider needs measured callback limits and a tested recovery path.",
  "publicReview.corrections.readinessMint":
    "- The manager and ledger implement ADR 0018's batch operation roots, per-token identities, and replay accounting, but the real modules fail permanent-Core installation checks.",
  "publicReview.corrections.readinessRoyalty":
    "- Core has royalty lookup code and restricted metadata refresh helpers. Its royalty-resolver connection is disabled, leaving the lookup at zero; the artist-registry connection is disabled too.",
  "publicReview.corrections.readinessPriority":
    "First prove real module registration and governed installation into permanent Core, then trace one complete artist-approved paid mint. Check rollback and replay across manager, ledger, payment, and Core. Keep legacy rehearsals separate from permanent-Core evidence. Check failed NFT delivery, old-credit withdrawals, changed auction splits, and provider callback gas before relying on the older flows. Exercise closure, burn blocking, finality, emergency stops, and module replacement with their exact authorities.",
} as const;
