export const PUBLIC_REVIEW_DEVELOPMENT_MESSAGES = {
  "publicReview.development.heading": "Is Stream ready to launch?",
  "publicReview.development.answer": "Not yet.",
  "publicReview.development.summary":
    "Stream has working contracts and many tests. But important safety checks are still missing.",
  "publicReview.development.beforeLaunch": "Before launch, Stream still needs:",
  "publicReview.development.beforeLaunch.audit":
    "An independent security audit.",
  "publicReview.development.beforeLaunch.liveTesting":
    "Testing with real services and marketplaces.",
  "publicReview.development.beforeLaunch.launchSetup":
    "A final, verified launch setup.",
  "publicReview.development.pagePurpose":
    "This page explains what works, what is still uncertain, and what must happen before Stream can launch.",
  "publicReview.development.lastChecked": "Last checked",
  "publicReview.development.openBlockers": "Open release blockers",
  "publicReview.development.editorial.scopeHeading": "What this review covers",
  "publicReview.development.editorial.scopeSummary":
    "Stream was not live when this review was created, and no Stream contracts held funds.",
  "publicReview.development.editorial.progress.heading":
    "How we describe progress",
  "publicReview.development.editorial.progress.intro":
    "We track two separate things:",
  "publicReview.development.editorial.progress.built": "What has been built.",
  "publicReview.development.editorial.progress.proof":
    "What proof exists that it is safe and ready.",
  "publicReview.development.editorial.progress.caveat":
    "A progress label shows how far the work has moved. It does not mean Stream is ready to launch.",
  "publicReview.development.editorial.progress.labelHeading": "Label",
  "publicReview.development.editorial.progress.meaningHeading": "What it means",
  "publicReview.development.editorial.progress.working.label":
    "Working in the reviewed flow",
  "publicReview.development.editorial.progress.working.meaning":
    "Built and connected in the full user path described here.",
  "publicReview.development.editorial.progress.connected.label":
    "Connected to selected parts",
  "publicReview.development.editorial.progress.connected.meaning":
    "Built and connected to some Stream parts. The full user path may still be incomplete.",
  "publicReview.development.editorial.progress.code.label": "Code exists",
  "publicReview.development.editorial.progress.code.meaning":
    "The code exists in the reviewed version. Launch setup and safety proof may still be missing.",
  "publicReview.development.editorial.progress.plan.label": "Accepted plan",
  "publicReview.development.editorial.progress.plan.meaning":
    "The design direction is accepted. Complete code or connection proof is still missing.",
  "publicReview.development.editorial.progress.open.label": "Not final",
  "publicReview.development.editorial.progress.open.meaning":
    "The design is still open, or the work belongs to a later version.",
  "publicReview.development.editorial.working.heading":
    "What works in the reviewed flow",
  "publicReview.development.editorial.working.intro":
    "These paths are connected in the exact reviewed setup. This is a rehearsal, not a live launch.",
  "publicReview.development.editorial.working.identity.heading":
    "Artwork identity and history",
  "publicReview.development.editorial.working.identity.summary":
    "Core keeps each token's identity, collection, supply, artist approval, metadata state, and burn history. It also records collection freezes, but a freeze is not complete artwork finality.",
  "publicReview.development.editorial.working.sales.heading":
    "Fixed-price sales and auctions",
  "publicReview.development.editorial.working.sales.summary":
    "A fixed-price sale checks a signed approval and uses the existing minting contract. An auction creates the token inside the auction contract before bidding starts.",
  "publicReview.development.editorial.working.payments.heading":
    "Payments and royalties",
  "publicReview.development.editorial.working.payments.summary":
    "Fixed-price sales record credits for the seller, protocol, and curator reserve. Auctions track bidder refunds. Core reports one royalty receiver and a 6.9% royalty for every token; the newer revenue resolver, which stores revenue rules, is not used for this check.",
  "publicReview.development.editorial.working.safety.heading":
    "Safety controls and preservation",
  "publicReview.development.editorial.working.safety.summary":
    "The admin contract can pause everything or selected actions. Separate roles control emergency pauses and unpausing. Core and the preservation-record contract are included, but artwork recovery and every launch role are not yet proven.",
  "publicReview.development.editorial.working.boundary":
    "Only connected behavior is counted here. ADR proposals are not working features.",
  "publicReview.development.editorial.working.setupLink":
    "See the exact rehearsal setup",
  "publicReview.development.editorial.connected.heading":
    "Connected to selected parts",
  "publicReview.development.editorial.connected.intro":
    "Some newer systems are connected to selected contracts. The main Drop and Auction flow does not use them yet.",
  "publicReview.development.editorial.connected.minting.heading":
    "A newer minting path",
  "publicReview.development.editorial.connected.minting.summary":
    "The mint manager and ledger control who may mint, when minting is open, and supply limits. The ledger keeps past-mint counters. The manager is connected to Core and can update the ledger.",
  "publicReview.development.editorial.connected.minting.missing":
    "Signed Drops still use the existing minting contract. The old and new minting paths remain separate.",
  "publicReview.development.editorial.connected.minting.link":
    "Learn how the two minting paths differ",
  "publicReview.development.editorial.connected.payments.heading":
    "A newer payment path",
  "publicReview.development.editorial.connected.payments.summary":
    "The reviewed setup includes newer contracts for payment rules, payment splits, allowed assets, and sale settlement.",
  "publicReview.development.editorial.connected.payments.missing":
    "Drops and Auctions still keep their own payment records, and settlement has no configured caller. Sale credits, payment splits, and Core's royalty information remain separate paths.",
  "publicReview.development.editorial.connected.payments.link":
    "Learn how the payment paths differ",
  "publicReview.development.editorial.connected.boundary":
    "These connections do not prove a complete user flow. ADR proposals are not counted here.",
  "publicReview.development.editorial.code.heading": "Code exists",
  "publicReview.development.editorial.code.intro":
    "The reviewed source contains these features. The exact launch setup has not been proven to use them.",
  "publicReview.development.editorial.code.existsLabel": "What exists:",
  "publicReview.development.editorial.code.missingLabel": "What is missing:",
  "publicReview.development.editorial.code.governance.heading":
    "Governance and contract replacements",
  "publicReview.development.editorial.code.governance.exists":
    "Governance code can delay, cancel, expire, or block actions. It can permanently freeze selected functions and close the initial setup stage. A registry can record each contract's identity, code, status, and approved replacement.",
  "publicReview.development.editorial.code.governance.missing":
    "The launch setup has not been proven to include the complete contract list, roles, delays, settings, and replacement paths.",
  "publicReview.development.editorial.code.artwork.heading":
    "Artwork protection and records",
  "publicReview.development.editorial.code.artwork.exists":
    "Artwork code can delay a permanent final state and allow cancellation or guardian blocking before it becomes final. Other code controls artwork and preservation writers and can create permanent metadata snapshots.",
  "publicReview.development.editorial.code.artwork.missing":
    "The launch setup has not been proven to use these systems. Final artwork data, writers, permissions, live providers, and recovery are not fully defined or independently reviewed.",
  "publicReview.development.editorial.code.minting.heading": "Minting rules",
  "publicReview.development.editorial.code.minting.exists":
    "Some governed settings can only increase after a delay, by no more than double, with no emergency shortcut. The minting system can check permissions, limits, and counters, then prepare and complete a mint as one operation.",
  "publicReview.development.editorial.code.minting.missing":
    "The full settings list is not bound to the launch setup. Signed Drops still use the older minting path, and some planned gate protections are not implemented.",
  "publicReview.development.editorial.code.randomness.heading":
    "Randomness and metadata",
  "publicReview.development.editorial.code.randomness.exists":
    "Randomness code tracks waiting, completed, stale, and failed requests and reuses the same random result for a retry. Metadata code supports data stored on the blockchain or outside it, plus scripts, images, attributes, and update notices.",
  "publicReview.development.editorial.code.randomness.missing":
    "Live randomness funding, callbacks, monitoring, stale-request rules, and recovery are not proven. Metadata still needs real-world proof with public services, browsers, marketplaces, large responses, and long-term storage.",
  "publicReview.development.editorial.code.boundary":
    "This is available code, not active launch protection. ADR proposals are not counted as working features.",
  "publicReview.development.editorial.plan.heading": "Accepted plan",
  "publicReview.development.editorial.plan.intro":
    "The direction is accepted, but complete code and launch proof are still missing.",
  "publicReview.development.editorial.plan.plannedLabel": "What is planned:",
  "publicReview.development.editorial.plan.whyLabel": "Why it helps:",
  "publicReview.development.editorial.plan.missingLabel":
    "What is still missing:",
  "publicReview.development.editorial.plan.revenue.heading":
    "Safer revenue checks",
  "publicReview.development.editorial.plan.revenue.planned":
    "An immutable validation contract would check revenue changes. It would hold no funds, roles, or Stream data and could read only from approved contracts with fixed code.",
  "publicReview.development.editorial.plan.revenue.why":
    "The revenue resolver would stay in control and reject failed checks, changed code, or bad answers before saving anything.",
  "publicReview.development.editorial.plan.revenue.missing":
    "The final validation contract and matching resolver code do not exist in this reviewed version. Their interface and code need independent approval. Recovery would also require a new resolver, continuity proof, registry approval, and a governed Core update.",
  "publicReview.development.editorial.plan.metadata.heading":
    "Metadata refresh from approved contracts",
  "publicReview.development.editorial.plan.metadata.planned":
    "Approved Stream contracts will be able to send standard metadata refresh notices for one token or a group of tokens.",
  "publicReview.development.editorial.plan.metadata.reason":
    "Marketplaces and other services can learn that token metadata changed and should be loaded again.",
  "publicReview.development.editorial.plan.metadata.missing":
    "Core currently sends these notices only for its own changes. The new public helpers do not exist. Permissions, lifecycle rules, token limits, abuse protection, implementation, and tests are still required.",
  "publicReview.development.editorial.plan.metadata.link":
    "Learn more about metadata refresh",
  "publicReview.development.editorial.plan.roles.heading": "Exact launch roles",
  "publicReview.development.editorial.plan.roles.planned":
    "The launch design lists 37 roles. Each must be connected to exact accounts or contracts, allowed actions, scopes, delays, and removal rules.",
  "publicReview.development.editorial.plan.roles.reason":
    "The launch team and reviewers can see exactly who can do what.",
  "publicReview.development.editorial.plan.roles.missing":
    "The final launch candidate has not yet proven all 37 role assignments and limits.",
  "publicReview.development.editorial.plan.boundary":
    '"Accepted plan" means the direction is agreed. It does not mean the work is built, connected, tested, or ready for launch.',
  "publicReview.development.editorial.open.heading": "Not final",
  "publicReview.development.editorial.open.intro":
    "These are proposals or later-version ideas. They are not launch features.",
  "publicReview.development.editorial.open.proposalLabel": "What is proposed:",
  "publicReview.development.editorial.open.missingLabel": "What is missing:",
  "publicReview.development.editorial.open.artist.heading":
    "Artist permissions and recovery",
  "publicReview.development.editorial.open.artist.proposal":
    "ADR 0022 proposes an immutable, stateless validation adapter. It would not be registered, store data, or hold authority. The artist registry would remain the only authority and state owner.",
  "publicReview.development.editorial.open.artist.missing":
    "The adapter is not implemented and needs separate approval. Broader rules for collaborators, delegates, guardians, estates, sanctions, disputes, and account recovery are also not final.",
  "publicReview.development.editorial.open.payments.heading":
    "Payments and sale types",
  "publicReview.development.editorial.open.payments.proposal":
    "A proposed ERC-20 token sale contract would check the payer's signed payment instruction and be the only Stream contract allowed to pull the payment. Settlement would only record and distribute it.",
  "publicReview.development.editorial.open.payments.missing":
    "The verifier and complete sale path are not implemented. Dutch auctions, private sales, refund windows, sealed bids, raffles, burn-to-mint, and ERC-20 bidding are proposed or deferred, not current candidate features.",
  "publicReview.development.editorial.open.records.heading":
    "Mint records and artwork recovery",
  "publicReview.development.editorial.open.records.proposal":
    "ADR 0018 would make the ledger the permanent owner of each batch replay record and connect the ledger record to each token's prepared-mint event. ADR 0020 would preserve the original artwork-finality record and add governed recovery history without replacing or hiding the original.",
  "publicReview.development.editorial.open.records.missing":
    "Both proposals still need acceptance and implementation.",
  "publicReview.development.editorial.open.randomness.heading":
    "Randomness recovery and providers",
  "publicReview.development.editorial.open.randomness.proposal":
    "One proposal would add a fixed waiting period and one limited recovery step for stale randomness requests.",
  "publicReview.development.editorial.open.randomness.missing":
    "In the current code, a stale request is final for that token. RandomizerNXT code exists at the reviewed commit, but it is not an approved production provider in the reviewed release policy.",
  "publicReview.development.editorial.open.boundary":
    "None of these proposals are protections provided by the launch candidate.",
  "publicReview.development.editorial.remaining.tests.heading": "Test evidence",
  "publicReview.development.editorial.remaining.tests.intro":
    "The pinned code has several kinds of local tests:",
  "publicReview.development.editorial.remaining.tests.unit":
    "Unit tests check one behavior at a time.",
  "publicReview.development.editorial.remaining.tests.fuzz":
    "Fuzz and invariant tests try many inputs and check rules that should always hold.",
  "publicReview.development.editorial.remaining.tests.composition":
    "State-machine and composition tests combine actions and contracts.",
  "publicReview.development.editorial.remaining.tests.focused":
    "Focused tests cover signatures, auctions, mint accounting, burns, metadata, randomness, governance, and preservation.",
  "publicReview.development.editorial.remaining.tests.provesHeading":
    "What this proves",
  "publicReview.development.editorial.remaining.tests.proves":
    "The pinned code has meaningful local test evidence. The Technical Reference lists the exact compiled code and declarations.",
  "publicReview.development.editorial.remaining.tests.limitsHeading":
    "What this does not prove",
  "publicReview.development.editorial.remaining.tests.limits":
    "Tests can pass while an important risk remains. Reviewers still need to look for:",
  "publicReview.development.editorial.remaining.tests.limit.assertions":
    "Missing checks and untested combinations.",
  "publicReview.development.editorial.remaining.tests.limit.specification":
    "A wrong rule implemented the same way in both code and tests.",
  "publicReview.development.editorial.remaining.tests.limit.deployment":
    "Deployment mistakes, economic attacks, and lost or compromised keys.",
  "publicReview.development.editorial.remaining.tests.limit.external":
    "Failures in real providers, storage, browsers, public blockchain services, or marketplaces.",
  "publicReview.development.editorial.remaining.tests.gapsHeading":
    "Known test gaps",
  "publicReview.development.editorial.remaining.tests.mintGap":
    "The old and new minting paths are tested separately. Connecting a signed Drop to the new mint manager needs its own integration tests.",
  "publicReview.development.editorial.remaining.tests.revenueGap":
    "Revenue components are also tested separately. One joined settlement path needs its own integration tests.",
  "publicReview.development.editorial.remaining.static.heading":
    "Static analysis",
  "publicReview.development.editorial.remaining.static.definition":
    "Static analysis scans code for risky patterns without running it.",
  "publicReview.development.editorial.remaining.static.count":
    "The pinned Slither report has 30 open High or Medium findings: 3 High and 27 Medium.",
  "publicReview.development.editorial.remaining.static.caveat":
    "Some tool findings may be false positives. Even so, the candidate cannot be called clean until every finding has one clear outcome:",
  "publicReview.development.editorial.remaining.static.fix":
    "Fix it and add a test.",
  "publicReview.development.editorial.remaining.static.falsePositive":
    "Prove that it is a false positive.",
  "publicReview.development.editorial.remaining.static.acceptedRisk":
    "Accept the risk and record its owner and scope.",
  "publicReview.development.editorial.remaining.static.remove":
    "Remove the affected code from the release.",
  "publicReview.development.editorial.remaining.static.register":
    "The final record must keep the tool version, settings, raw output, source commit, and response evidence.",
  "publicReview.development.editorial.remaining.static.link":
    "Open the pinned Slither report",
  "publicReview.development.editorial.remaining.limitations.heading":
    "Known limitations",
  "publicReview.development.editorial.remaining.limitations.intro":
    "These are current code or evidence gaps. Proposed ADRs are not counted as fixes.",
  "publicReview.development.editorial.remaining.limitations.minting.heading":
    "Tokens and minting",
  "publicReview.development.editorial.remaining.limitations.minting.finalSupply":
    "A final supply of zero is also treated as not set. Before a collection is frozen, a later update can set a nonzero cap and reopen minting. There is no separate final-supply flag or event.",
  "publicReview.development.editorial.remaining.limitations.minting.paths":
    "Signed Drops and the current Auction use the older minter. The manager and ledger are a separate minting path.",
  "publicReview.development.editorial.remaining.limitations.minting.nullifiers":
    "The gate interface supports one-use nullifiers, but the current manager accepts empty lists. Nullifier-backed gates are not implemented.",
  "publicReview.development.editorial.remaining.limitations.minting.replay":
    "Mint replay data is split between the ledger and Core. ADR 0018 proposes one durable joined record, but it is not accepted or implemented.",
  "publicReview.development.editorial.remaining.limitations.minting.identity":
    "All collections share one Core token contract. ADR 0016 accepts this Core-only design; there is no hidden contract for each collection. Marketplace and indexer support still needs real-world proof.",
  "publicReview.development.editorial.remaining.limitations.minting.link":
    "Read the full token and minting explanation",
  "publicReview.development.editorial.remaining.limitations.payments.heading":
    "Payments and auctions",
  "publicReview.development.editorial.remaining.limitations.payments.paths":
    "Drops, Auctions, the curator pool, resolver, split wallets, settlement, and Core royalties still use separate money paths and records.",
  "publicReview.development.editorial.remaining.limitations.payments.asset":
    "An approved settlement caller can choose any active payment token. The payment token is not part of the sale's replay key, so the first successful settlement uses that shared key.",
  "publicReview.development.editorial.remaining.limitations.payments.auction":
    "The minimum bid increase and auction extension time are global settings. They have no bound, delay, or change event and can change during an active auction.",
  "publicReview.development.editorial.remaining.limitations.payments.link":
    "Read the full revenue explanation",
  "publicReview.development.editorial.remaining.limitations.governance.heading":
    "Governance and contract size",
  "publicReview.development.editorial.remaining.limitations.governance.records":
    "The candidate still lacks complete proof for admitted record types, authority providers, grants, live bindings, rotation, and revocation.",
  "publicReview.development.editorial.remaining.limitations.governance.value":
    "The governance executor can send native ETH too broadly, or its limits are not proven clearly enough.",
  "publicReview.development.editorial.remaining.limitations.governance.binding":
    "There is not yet end-to-end proof that every governed action binds every sensitive value.",
  "publicReview.development.editorial.remaining.limitations.governance.size":
    "StreamCore has only 424 bytes below the chain's runtime-code limit. The detailed size section explains the remaining margin risk.",
  "publicReview.development.editorial.remaining.limitations.governance.link":
    "Read the full governance explanation",
  "publicReview.development.editorial.remaining.limitations.randomness.heading":
    "Randomness",
  "publicReview.development.editorial.remaining.limitations.randomness.stale":
    "An authorized admin can mark a pending request stale immediately. Stale is final for that token.",
  "publicReview.development.editorial.remaining.limitations.randomness.retry":
    "A failed post-processing step can reduce the pending count before retry. Replacing the provider can then prevent the old request from passing retry checks.",
  "publicReview.development.editorial.remaining.limitations.randomness.target":
    "Provider adapters can change their Core target. A request keeps its provider and epoch, but not the Core address used when the request was assigned.",
  "publicReview.development.editorial.remaining.limitations.randomness.live":
    "Funding, callbacks, permissions, monitoring, stale rules, and raw-word recovery still need live proof. RandomizerNXT is not in the approved production provider set.",
  "publicReview.development.editorial.remaining.limitations.randomness.link":
    "Read the full randomness explanation",
  "publicReview.development.editorial.remaining.limitations.artwork.heading":
    "Artwork and metadata",
  "publicReview.development.editorial.remaining.limitations.artwork.refresh":
    "Core sends refresh notices for its own changes. The accepted helper for approved satellite contracts is not implemented. Collection-wide refresh also covers extra token IDs when collections are interleaved.",
  "publicReview.development.editorial.remaining.limitations.artwork.size":
    "Large metadata works in local tests, but public services, wallets, indexers, and marketplaces still need maximum-size tests.",
  "publicReview.development.editorial.remaining.limitations.artwork.finality":
    "Artwork finality can be scheduled or vetoed. The exact final data and every contract allowed to write it are not yet proven. Collection freeze is a separate protection.",
  "publicReview.development.editorial.remaining.limitations.artwork.availability":
    "A content hash proves that retrieved bytes are correct. It does not prove that the bytes, dependencies, browser, blockchain service, or rendering tools will remain available.",
  "publicReview.development.editorial.remaining.limitations.artwork.link":
    "Read the full artwork and preservation explanation",
  "publicReview.development.editorial.remaining.standard.heading":
    "The release standard",
  "publicReview.development.editorial.remaining.standard.identity":
    "Stream must keep token identity and artistic intent safe while replaceable sales, randomness, metadata, and operating services change.",
  "publicReview.development.editorial.remaining.standard.evidence":
    "Every mechanism needs one clear purpose, limited powers, and evidence that an independent person can check. Release depends on that evidence, not on labels or plans.",
  "publicReview.development.editorial.remaining.bytecode.heading":
    "Contract bytecode size",
  "publicReview.development.editorial.remaining.bytecode.coreHeading":
    "StreamCore now",
  "publicReview.development.editorial.remaining.bytecode.core":
    "The pinned build measures StreamCore at 24,152 bytes. The chain limit is 24,576 bytes, so 424 bytes remain. The interim target keeps 384 bytes free, leaving only 40 extra bytes. The long-term 2,000-byte target is still 1,576 bytes away.",
  "publicReview.development.editorial.remaining.bytecode.risk":
    "Small code, compiler, optimizer, or metadata changes could cross the limit. A small margin also makes emergency fixes harder.",
  "publicReview.development.editorial.remaining.bytecode.futureHeading":
    "Accepted future revenue design",
  "publicReview.development.editorial.remaining.bytecode.future":
    "ADR 0021 limits both the future resolver and validation adapter to 22,576 bytes of runtime code and 47,152 bytes of full deployment code, including constructor values.",
  "publicReview.development.editorial.remaining.bytecode.notBuilt":
    "Neither contract exists at the pinned commit. Only a final isolated build can prove its size.",
  "publicReview.development.editorial.remaining.bytecode.link":
    "Open the pinned bytecode proof",
  "publicReview.development.editorial.remaining.candidate.heading":
    "Evidence required for the exact release candidate",
  "publicReview.development.editorial.remaining.candidate.intro":
    "The final candidate needs a machine-readable manifest. It must include:",
  "publicReview.development.editorial.remaining.candidate.codeHeading":
    "Code identity",
  "publicReview.development.editorial.remaining.candidate.code.hashes":
    "Exact source and artifact hashes, plus compiler and optimizer settings.",
  "publicReview.development.editorial.remaining.candidate.code.deployment":
    "Chain, contract addresses, creation transactions, runtime code hashes, and constructor or initializer values.",
  "publicReview.development.editorial.remaining.candidate.code.graph":
    "Core pointers and the complete contract connection map.",
  "publicReview.development.editorial.remaining.candidate.authorityHeading":
    "Authority",
  "publicReview.development.editorial.remaining.candidate.authority.roles":
    "Role holders, scopes, signers, signer versions, pause controls, and guardians.",
  "publicReview.development.editorial.remaining.candidate.authority.records":
    "Admitted record types, authority providers, and grants.",
  "publicReview.development.editorial.remaining.candidate.authority.governance":
    "Governed settings and every allowed action type.",
  "publicReview.development.editorial.remaining.candidate.externalHeading":
    "External services and money",
  "publicReview.development.editorial.remaining.candidate.external.randomness":
    "Randomness providers, accounts, funding, callbacks, and monitoring.",
  "publicReview.development.editorial.remaining.candidate.external.money":
    "Revenue, settlement, splits, royalties, and every liability path.",
  "publicReview.development.editorial.remaining.candidate.deploymentHeading":
    "Deployment proof",
  "publicReview.development.editorial.remaining.candidate.deployment.sealing":
    "Ownership transfers, renounced powers, one-way setup sealing, and explorer verification.",
  "publicReview.development.editorial.remaining.candidate.deployment.readback":
    "An independent readback of every critical rule and connection.",
  "publicReview.development.editorial.remaining.candidate.independent":
    "A second person must be able to rebuild and verify the setup from the scripts and published evidence.",
  "publicReview.development.editorial.remaining.external.heading":
    "Evidence still required from real services",
  "publicReview.development.editorial.remaining.external.intro":
    "Local mocks are controlled substitutes. They do not prove that real services behave the same way.",
  "publicReview.development.editorial.remaining.external.chainHeading":
    "Chain and wallets",
  "publicReview.development.editorial.remaining.external.chain.testnet":
    "Run the candidate on a fork or public test network with the intended infrastructure.",
  "publicReview.development.editorial.remaining.external.chain.wallets":
    "Test production-style signing and contract wallets.",
  "publicReview.development.editorial.remaining.external.servicesHeading":
    "Providers and public services",
  "publicReview.development.editorial.remaining.external.services.randomness":
    "Test live randomness requests, callbacks, provider changes, and revoked access.",
  "publicReview.development.editorial.remaining.external.services.marketplaces":
    "Test shared collection identity, metadata, and royalties in marketplaces and indexers.",
  "publicReview.development.editorial.remaining.external.services.rpc":
    "Test the largest token metadata response through public blockchain services.",
  "publicReview.development.editorial.remaining.external.operationsHeading":
    "Long-running operations",
  "publicReview.development.editorial.remaining.external.operations.preservation":
    "Recover preservation packages independently from published instructions.",
  "publicReview.development.editorial.remaining.external.operations.auctions":
    "Run long auctions and test failure recovery.",
  "publicReview.development.editorial.remaining.external.operations.continuity":
    "Test signer changes, authority-provider changes, successor discovery, and continuity.",
  "publicReview.development.editorial.remaining.external.coverage":
    "These tests must cover real limits, permissions, delays, billing, availability, and failures.",
  "publicReview.development.editorial.remaining.audit.heading":
    "Independent audit",
  "publicReview.development.editorial.remaining.audit.status":
    "The exact release candidate still needs an independent audit and a completed record of every fix or accepted risk. Community review helps, but it does not replace the audit.",
  "publicReview.development.editorial.remaining.audit.scope":
    "The audit must cover the exact code and launch setup. Any important change after the audit needs a focused follow-up review.",
  "publicReview.development.editorial.remaining.audit.record":
    "Each finding needs a source-backed response, a fix commit where needed, a regression test, and a record of any risk that remains.",
  "publicReview.development.editorial.remaining.blockers.heading":
    "Release blockers",
  "publicReview.development.editorial.remaining.blockers.intro":
    "Production release stays blocked until the following work has evidence:",
  "publicReview.development.editorial.remaining.blockers.codeHeading":
    "Fix known code risks",
  "publicReview.development.editorial.remaining.blockers.code.findings":
    "Resolve every High finding and every Medium finding that can materially affect the release.",
  "publicReview.development.editorial.remaining.blockers.code.finalSupply":
    "Fix the zero-mint final-supply behavior or redefine the promise accurately.",
  "publicReview.development.editorial.remaining.blockers.code.governance":
    "Prove record-type authority, action binding, and safe native ETH limits.",
  "publicReview.development.editorial.remaining.blockers.code.bytecode":
    "Meet the chosen Core bytecode margin or deliberately change the design.",
  "publicReview.development.editorial.remaining.blockers.pathHeading":
    "Choose one launch path",
  "publicReview.development.editorial.remaining.blockers.path.minting":
    "Choose the signed-sale minting path and test its callers, counters, replay data, and Core entry end to end.",
  "publicReview.development.editorial.remaining.blockers.path.accounting":
    "Keep or replace the Drop and Auction accounting paths deliberately. Do not leave two unclear routes for the same value.",
  "publicReview.development.editorial.remaining.blockers.path.royalties":
    "Keep or replace the current fixed royalties deliberately, then verify marketplace behavior.",
  "publicReview.development.editorial.remaining.blockers.path.adapter":
    "For ADR 0021, approve the final interface, build matching resolver and adapter code, review both, prove their sizes, and prove adapter-first deployment.",
  "publicReview.development.editorial.remaining.blockers.setupHeading":
    "Prove the exact setup",
  "publicReview.development.editorial.remaining.blockers.setup.randomness":
    "Test every production randomness provider outside local mocks and approve its stale and failure rules.",
  "publicReview.development.editorial.remaining.blockers.setup.finality":
    "Prove the exact artwork-finality data and every contract that can write a final state.",
  "publicReview.development.editorial.remaining.blockers.setup.deployment":
    "Rehearse deployment, setup sealing, rollback, and successor changeover, then read them back independently.",
  "publicReview.development.editorial.remaining.blockers.setup.preservation":
    "Recover preservation packages using only published instructions and commitments.",
  "publicReview.development.editorial.remaining.blockers.setup.feedback":
    "If production feedback is activated, bind and independently verify its one approved Wave.",
  "publicReview.development.editorial.remaining.blockers.reviewHeading":
    "Finish independent review",
  "publicReview.development.editorial.remaining.blockers.review.audit":
    "Complete the external audit and remediation record.",
  "publicReview.development.editorial.remaining.blockers.review.version":
    "Make the final public review match the exact code and configuration deployed.",
  "publicReview.development.editorial.remaining.blockers.outro":
    "Public review can add blockers. A blocker should be removed only when evidence shows that it is resolved.",
  "publicReview.development.editorial.remaining.threats.heading":
    "Threat model",
  "publicReview.development.editorial.remaining.threats.intro":
    "Assume that users, privileged accounts, external services, and ordinary people can act badly or fail.",
  "publicReview.development.editorial.remaining.threats.attackersHeading":
    "Malicious actions",
  "publicReview.development.editorial.remaining.threats.attackers.people":
    "Malicious buyers, bidders, recipients, and contract wallets.",
  "publicReview.development.editorial.remaining.threats.attackers.chain":
    "Front-running, chain reorganizations, changing timestamps, and transaction censorship.",
  "publicReview.development.editorial.remaining.threats.attackers.signatures":
    "Old, replayed, or partly bound signatures, and governance text that does not match the executed bytes.",
  "publicReview.development.editorial.remaining.threats.attackers.money":
    "Reentrancy, forced value, and recipients that reject ETH or tokens.",
  "publicReview.development.editorial.remaining.threats.systemsHeading":
    "Compromised or failing systems",
  "publicReview.development.editorial.remaining.threats.systems.accounts":
    "Compromised or mistaken privileged accounts.",
  "publicReview.development.editorial.remaining.threats.systems.services":
    "Unavailable or hostile randomness, storage, blockchain services, browsers, marketplaces, and indexers.",
  "publicReview.development.editorial.remaining.threats.systems.metadata":
    "Malformed or very large metadata.",
  "publicReview.development.editorial.remaining.threats.systems.config":
    "Registries or contracts connected in the wrong order.",
  "publicReview.development.editorial.remaining.threats.mistakesHeading":
    "Honest mistakes",
  "publicReview.development.editorial.remaining.threats.mistakes":
    "An artist can approve the wrong manifest. An operator can choose the wrong address. A governance action can leave out an important value. Ordinary mistakes can cause permanent damage.",
  "publicReview.development.editorial.remaining.priorities.heading":
    "Review priorities",
  "publicReview.development.editorial.remaining.priorities.moneyHeading":
    "Money and accounting",
  "publicReview.development.editorial.remaining.priorities.moneyIntro":
    "Trace every amount owed across sales, auctions, refunds, randomness reserves, split wallets, settlement, and emergency surplus. Prove that:",
  "publicReview.development.editorial.remaining.priorities.money.received":
    "Credits never exceed value received.",
  "publicReview.development.editorial.remaining.priorities.money.promise":
    "Each unit of value funds only one promise.",
  "publicReview.development.editorial.remaining.priorities.money.dust":
    "Rounding leftovers have a clear owner.",
  "publicReview.development.editorial.remaining.priorities.money.progress":
    "One recipient that rejects payment cannot block unrelated users.",
  "publicReview.development.editorial.remaining.priorities.money.emergency":
    "Emergency withdrawal cannot take money owed to users.",
  "publicReview.development.editorial.remaining.priorities.money.successor":
    "A successor change preserves every balance exactly once.",
  "publicReview.development.editorial.remaining.priorities.money.wallets":
    "Accounting works with contract wallets and recipients that point back to the protocol.",
  "publicReview.development.editorial.remaining.priorities.moneyTests":
    "Invariant tests should combine sales, bids, refunds, withdrawals, pauses, burns, and successor changes.",
  "publicReview.development.editorial.remaining.priorities.signaturesHeading":
    "Signed actions",
  "publicReview.development.editorial.remaining.priorities.signaturesBinding":
    "Every signature should bind the chain, contract, action, collection, people, money terms, quantity, replay ID, signer version, and deadline.",
  "publicReview.development.editorial.remaining.priorities.signaturesCompare":
    "Compare the message shown in the wallet with the Solidity type, recovered signer, replay record, and event. If one value is missing, the user may approve a different action from the one executed.",
  "publicReview.development.editorial.remaining.priorities.artworkHeading":
    "Artwork and preservation",
  "publicReview.development.editorial.remaining.priorities.artworkTest":
    "Test malformed text, unsafe HTML or JavaScript, large responses, missing files, wrong hashes, unavailable storage, and future browser behavior.",
  "publicReview.development.editorial.remaining.priorities.artworkReason":
    "A contract can stay secure while its artwork disappears. Release needs both contract-security proof and preservation proof.",
  "publicReview.development.editorial.remaining.findings.heading":
    "Public findings",
  "publicReview.development.editorial.remaining.findings.policy":
    "The current disclosure policy allows possible exploitable issues to be reported in the public review Wave while this candidate is in its validated predeployment state.",
  "publicReview.development.editorial.remaining.findings.guide":
    "Read the reporting and sensitive-information rules",
  "publicReview.development.editorial.remaining.findings.response":
    "Each important response should link to a source commit, test, or recorded decision. A statement alone does not resolve a finding.",
  "publicReview.development.editorial.remaining.findings.destinationHeading":
    "Feedback destinations",
  "publicReview.development.editorial.remaining.findings.staging":
    "Staging uses Wave 19d4bbf5-86ec-4053-a5f2-bb28d7a2f780, named Stream review (staging).",
  "publicReview.development.editorial.remaining.findings.production":
    "The planned production Wave is 06e69198-eea7-40c5-95d3-7c1bf5051aba. Production review routes are still disabled.",
  "publicReview.development.editorial.remaining.findings.activation":
    "Before production feedback is enabled, the reviewed environment must bind that exact Wave and a second person must read the mapping back.",
  "publicReview.development.editorial.remaining.questions.heading":
    "Questions for reviewers",
  "publicReview.development.editorial.remaining.questions.progress":
    "Does this page say that any part is further along than the evidence shows?",
  "publicReview.development.editorial.remaining.questions.threat":
    "Which person, asset, dependency, or failure is missing from the threat model?",
  "publicReview.development.editorial.remaining.questions.static":
    "Which open static-analysis findings become exploitable when combined?",
  "publicReview.development.editorial.remaining.questions.bytecode":
    "Is the chosen Core bytecode margin large enough for a permanent contract?",
  "publicReview.development.editorial.remaining.questions.governance":
    "Which governance path still leaves out an important action or value?",
  "publicReview.development.editorial.remaining.questions.services":
    "Which real-service tests are required before audit and launch?",
  "publicReview.development.editorial.remaining.questions.proof":
    "Which rules need independent economic or formal proof?",
  "publicReview.development.editorial.remaining.questions.features":
    "Which planned features are required for launch, and which can wait for a later replacement contract?",
  "publicReview.development.editorial.proof.heading": "What counts as proof",
  "publicReview.development.editorial.proof.intro":
    "Not all proof tells us the same thing. Each step answers a different question.",
  "publicReview.development.editorial.proof.adrBoundary":
    "ADR means Architecture Decision Record. It records a design or proposal; it does not prove that the design is built or ready to launch.",
  "publicReview.development.editorial.proof.proofHeading": "Proof",
  "publicReview.development.editorial.proof.meaningHeading": "What it tells us",
  "publicReview.development.editorial.proof.limitHeading":
    "What it does not prove",
  "publicReview.development.editorial.proof.code.label":
    "Code exists in the reviewed version",
  "publicReview.development.editorial.proof.code.meaning":
    "The code or generated file exists in the exact version we reviewed.",
  "publicReview.development.editorial.proof.code.limit":
    "That it is connected, configured, safe, or meant for launch.",
  "publicReview.development.editorial.proof.tests.label": "Local tests pass",
  "publicReview.development.editorial.proof.tests.meaning":
    "The listed tests passed in the project's test environment.",
  "publicReview.development.editorial.proof.tests.limit":
    "That every path is covered or real services work the same way.",
  "publicReview.development.editorial.proof.setup.label":
    "Launch setup checked",
  "publicReview.development.editorial.proof.setup.meaning":
    "Addresses, code versions, roles, permissions, settings, and connections match one release candidate.",
  "publicReview.development.editorial.proof.setup.limit":
    "That marketplaces and other outside services work correctly.",
  "publicReview.development.editorial.proof.services.label":
    "Real services tested",
  "publicReview.development.editorial.proof.services.meaning":
    "The chosen wallets, marketplaces, public services, storage, and operating processes work outside local tests.",
  "publicReview.development.editorial.proof.services.limit":
    "That the full protocol has been reviewed.",
  "publicReview.development.editorial.proof.audit.label":
    "Independent audit completed",
  "publicReview.development.editorial.proof.audit.meaning":
    "Independent experts reviewed the exact candidate. Findings and fixes were recorded.",
  "publicReview.development.editorial.proof.audit.limit":
    "That future changes or daily operations are automatically safe.",
  "publicReview.development.editorial.proof.current":
    "Right now, Stream has strong code and local-test proof.",
  "publicReview.development.editorial.proof.remaining":
    "Proof for one exact launch setup, real services, deployment, and an independent audit is still incomplete.",
  "publicReview.development.editorial.technicalHeading": "Technical details",
  "publicReview.development.editorial.technicalSummary":
    "All findings on this page refer to one exact version of Stream's code.",
  "publicReview.development.editorial.commitLabel": "Commit",
  "publicReview.development.editorial.treeLabel": "Git tree",
  "publicReview.development.editorial.updateRequired":
    "If the code changes, this review must be updated.",
  "publicReview.development.reviewQuestionsHeading":
    "Where your input would help",
  "publicReview.development.reviewQuestionsDescription":
    "Choose the question closest to your experience. Each one explains the issue in plain language and links to the relevant evidence.",
  "publicReview.development.readQuestion": "Open this question",
  "publicReview.development.readQuestionLabel": "Open this question: {title}",
} as const;
