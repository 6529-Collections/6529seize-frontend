export const PUBLIC_REVIEW_MESSAGES = {
  "navigation.nfts.theMemes": "The Memes",
  "navigation.nfts.gradient": "6529 Gradient",
  "navigation.nfts.nextGen": "NextGen",
  "navigation.nfts.memeLab": "Meme Lab",
  "navigation.nfts.rememes": "ReMemes",
  "navigation.nfts.streamReview": "6529 Stream — Review",
  "navigation.nfts.activity": "NFT Activity",
  "navigation.nfts.memesCalendar": "Memes Calendar",
  "publicReview.metadata.title": "{page} | 6529 Stream Contract Review",
  "publicReview.metadata.description":
    "Review the proposed 6529 Stream contract before finalization and deployment.",
  "publicReview.eyebrow": "{contract} contract",
  "publicReview.status.heading": "Review status",
  "publicReview.status.lifecycle.draft": "Draft",
  "publicReview.status.lifecycle.scheduled": "Scheduled",
  "publicReview.status.lifecycle.publicReview": "Public review",
  "publicReview.status.lifecycle.reviewClosed": "Review closed",
  "publicReview.status.lifecycle.remediation": "Remediation",
  "publicReview.status.lifecycle.audit": "Audit",
  "publicReview.status.lifecycle.finalCandidate": "Final candidate",
  "publicReview.status.lifecycle.deployed": "Deployed",
  "publicReview.status.lifecycle.archived": "Archived",
  "publicReview.status.deployment.notDeployed": "Preparing for launch",
  "publicReview.status.deployment.deployed": "Contract deployed",
  "publicReview.status.audit.preAudit": "Audit planned",
  "publicReview.status.audit.inProgress": "Audit in progress",
  "publicReview.status.audit.complete": "Audit complete",
  "publicReview.status.version": "Review version {version}",
  "publicReview.status.viewCurrentVersion": "View current review",
  "publicReview.status.source": "Source {commit}",
  "publicReview.status.sourceAriaLabel":
    "Open the exact {contract} source commit {commit}",
  "publicReview.status.explanations.draft":
    "Preparation is underway. Public routes open when the review is published.",
  "publicReview.status.explanations.scheduled":
    "This review is scheduled. Its materials are visible, and feedback opens at the scheduled start.",
  "publicReview.status.explanations.publicReview":
    "This contract candidate is open for public review. Independent audit and deployment remain ahead.",
  "publicReview.status.explanations.reviewClosed":
    "The public feedback window is closed. The review record remains available.",
  "publicReview.status.explanations.remediation":
    "The contract is being revised in response to review findings. New feedback is closed.",
  "publicReview.status.explanations.audit":
    "The contract is in formal audit. New public feedback is closed.",
  "publicReview.status.explanations.finalCandidate":
    "This is the final deployment candidate. New public feedback is closed.",
  "publicReview.status.explanations.deployed":
    "The reviewed contract has been deployed. Security reports now follow the configured post-deployment disclosure policy.",
  "publicReview.status.explanations.archived":
    "This review is archived. Its source, explanation, and feedback record remain available.",
  "publicReview.audiences.heading": "Choose a reading path",
  "publicReview.audiences.description":
    "Every page is public. These paths highlight the questions most useful to each kind of reviewer.",
  "publicReview.audiences.community.title": "Community",
  "publicReview.audiences.community.description":
    "Understand the promises, trust boundaries, funds, and open decisions.",
  "publicReview.audiences.artists.title": "Artists",
  "publicReview.audiences.artists.description":
    "Review consent, creative control, metadata, randomness, and permanence.",
  "publicReview.audiences.technical.title": "Technical reviewers",
  "publicReview.audiences.technical.description":
    "Follow modules, roles, state transitions, edge cases, and exact source.",
  "publicReview.audiences.auditors.title": "Auditors",
  "publicReview.audiences.auditors.description":
    "Use the editorial map alongside generated reference and retained evidence.",
  "publicReview.audiences.startPath": "Start the {audience} path",
  "publicReview.authorship.label": "A small human disclosure",
  "publicReview.authorship.body":
    "punk6529 would like the record to show that bots wrote this. He supplied the mission, the standards, and a suspicious amount of side-eye.",
  "publicReview.navigation.label": "Contract review pages",
  "publicReview.navigation.contentsLabel": "All contract review pages",
  "publicReview.navigation.sequenceLabel":
    "Previous and next contract review pages",
  "publicReview.navigation.menu": "Review navigation",
  "publicReview.navigation.contents": "Review contents",
  "publicReview.navigation.onThisPage": "On this page",
  "publicReview.surface.navigation": "Review-wide destinations",
  "publicReview.surface.navigationMobileContext": "in mobile review navigation",
  "publicReview.surface.navigationSidebarContext": "in review sidebar",
  "publicReview.surface.backToReview": "Back to review contents",
  "publicReview.surface.reference": "Technical reference",
  "publicReview.surface.feedback": "All public feedback",
  "publicReview.surface.history": "Review history",
  "publicReview.navigation.previous": "Previous",
  "publicReview.navigation.next": "Next",
  "publicReview.navigation.pagePosition": "Page {current} of {total}",
  "publicReview.pages.overview.title": "Overview",
  "publicReview.pages.overview.summary":
    "A map of the full protocol, its present review state, and the decisions the community is being asked to examine.",
  "publicReview.overviewGuide.whatIs.heading": "What is Stream?",
  "publicReview.overviewGuide.whatIs.description":
    "Stream is a proposed system for publishing and selling digital art. It keeps the artwork, its history, and its important rules connected over time—from launch and sales to long-term preservation.",
  "publicReview.overviewGuide.whatIs.reviewContext":
    "This site is the public review of the smart contracts behind Stream. It explains what the code can enforce and what still depends on people or outside systems.",
  "publicReview.overviewGuide.artworkParts.heading":
    "A Stream artwork is more than the media you see",
  "publicReview.overviewGuide.artworkParts.description":
    "Here are five important parts of a Stream artwork:",
  "publicReview.overviewGuide.artworkParts.identity.title": "Identity",
  "publicReview.overviewGuide.artworkParts.identity.description":
    "Each artwork collection gets a permanent identity record. Every minted token also gets its own record, so both can be identified over time.",
  "publicReview.overviewGuide.artworkParts.materials.title": "Media",
  "publicReview.overviewGuide.artworkParts.materials.description":
    "The artwork may include images, video, audio, code, or other files. For example, Stream can keep artwork code and descriptions directly in the contract. Larger files, such as videos or high-resolution images, can live on IPFS or another storage service, with Stream keeping the link.",
  "publicReview.overviewGuide.artworkParts.approval.title": "Artist control",
  "publicReview.overviewGuide.artworkParts.approval.description":
    "Addresses with the right permission prepare the artwork and minting plan. Before minting begins, the artist's wallet approves the exact content and rules. Important later changes need fresh approval; without it, the change is rejected and the current setup remains active. The artist can also permanently prevent selected artwork files or code from being changed.",
  "publicReview.overviewGuide.artworkParts.rules.title": "Sales and payments",
  "publicReview.overviewGuide.artworkParts.rules.description":
    "The smart contracts store the rules for a specific sale—for example, whether it uses a fixed price or auction, its price or reserve price, and which configured recipients should receive the primary-sale money. For later marketplace sales, the contracts only report royalty information; the marketplace decides whether to pay it.",
  "publicReview.overviewGuide.artworkParts.preservation.title":
    "Locked core details",
  "publicReview.overviewGuide.artworkParts.preservation.description":
    "When no more tokens should be created, Stream governance can close the collection. It can then permanently disable burning, so owners can no longer remove its tokens from circulation, and lock the collection's main settings. Existing tokens can still be transferred, and preservation records can still be added. A separate delayed process can later record the complete artwork as final.",
  "publicReview.overviewGuide.control.heading":
    "Artist control is part of the intended design",
  "publicReview.overviewGuide.control.description":
    "For artwork linked to an artist, Stream is designed to require the artist to approve important steps. This includes confirming that the collection represents their work and may publicly name them as its artist, confirming the exact content of the artwork before its first token is minted, and approving mint or sale rules where required. Each approval covers exact information. If that information changes, a new approval is needed.",
  "publicReview.overviewGuide.journey.heading":
    "How one artwork moves through Stream",
  "publicReview.overviewGuide.journey.description":
    "See the main steps an artwork follows in Stream, from the artist's plan through sales and payments to keeping its records clear over time and marking it as final.",
  "publicReview.overviewGuide.journey.prepare.title": "Plan the artwork",
  "publicReview.overviewGuide.journey.prepare.linkLabel": "Artist guide",
  "publicReview.overviewGuide.journey.prepare.description":
    "First, the artwork, number of editions, and sale are planned. The result may be decided by the artist, a community vote, or another review process.",
  "publicReview.overviewGuide.journey.approve.title":
    "Create the artwork records",
  "publicReview.overviewGuide.journey.approve.linkLabel": "Artwork lifecycle",
  "publicReview.overviewGuide.journey.approve.description":
    "The artwork's contract records are created. These include its details and the wallets and percentages used to split sale money.",
  "publicReview.overviewGuide.journey.authorize.title": "Create the permission",
  "publicReview.overviewGuide.journey.authorize.linkLabel":
    "Permission details",
  "publicReview.overviewGuide.journey.authorize.description":
    "A registered signer wallet creates permission for one exact mint or auction. Nothing happens yet.",
  "publicReview.overviewGuide.journey.sell.title": "Use the permission",
  "publicReview.overviewGuide.journey.sell.linkLabel":
    "Mint and auction details",
  "publicReview.overviewGuide.journey.sell.description":
    "The permission is submitted to the contract. If it passes the checks, the contract marks it as used first. It then mints the token or starts the auction.",
  "publicReview.overviewGuide.journey.pay.title": "Record the payment shares",
  "publicReview.overviewGuide.journey.pay.linkLabel": "Payment details",
  "publicReview.overviewGuide.journey.pay.description":
    "The contract records how much primary-sale money each recipient is owed. The money is not sent automatically. Each recipient withdraws their share later.",
  "publicReview.overviewGuide.journey.preserve.title":
    "Close and freeze the collection",
  "publicReview.overviewGuide.journey.preserve.linkLabel": "Freeze details",
  "publicReview.overviewGuide.journey.preserve.description":
    "An authorized wallet can close the collection when minting ends. This stops new tokens, blocks token destruction, and freezes the main settings.",
  "publicReview.overviewGuide.journey.finality.title":
    "Mark the artwork as complete",
  "publicReview.overviewGuide.journey.finality.linkLabel": "Finality details",
  "publicReview.overviewGuide.journey.finality.description":
    "An authorized wallet starts the final step. If no guardian stops it during the waiting period and any required artist approval exists, the protected records become permanent.",
  "publicReview.overviewGuide.readPage": "Read {page}",
  "publicReview.overviewGuide.audiences.heading": "Choose what matters to you",
  "publicReview.overviewGuide.audiences.description":
    "You do not need to read all fourteen pages. Start with the path closest to your role.",
  "publicReview.overviewGuide.audiences.artists.title": "Artists",
  "publicReview.overviewGuide.audiences.artists.description":
    "See what you approve, what can still change, and when your choices become permanent.",
  "publicReview.overviewGuide.audiences.collectors.title":
    "Collectors and minters",
  "publicReview.overviewGuide.audiences.collectors.description":
    "Follow what happens before a purchase, during a mint or sale, and after the artwork becomes final.",
  "publicReview.overviewGuide.audiences.auditors.title": "Auditors",
  "publicReview.overviewGuide.audiences.auditors.description":
    "Start with known limits, test evidence, and the risks that still block release.",
  "publicReview.overviewGuide.startPage": "Start with {page}",
  "publicReview.forArtistsGuide.eyebrow": "A simple guide for artists",
  "publicReview.forArtistsGuide.heading": "Your artwork, your choices",
  "publicReview.forArtistsGuide.description":
    "You define the artwork and approve the plan. Stream records the sale rules and what later becomes final.",
  "publicReview.forArtistsGuide.reviewContext":
    "Stream is still being designed. This guide explains the intended artist experience in plain language. The sections below explain how the contracts work in more detail.",
  "publicReview.forArtistsGuide.artwork.heading": "Your artwork in Stream",
  "publicReview.forArtistsGuide.artwork.description":
    "An artwork in Stream includes its media, identity, edition size, artist approval, and sale and payment rules. Its records also show important changes and what later became final.",
  "publicReview.forArtistsGuide.artwork.identity.title":
    "Artwork and identity",
  "publicReview.forArtistsGuide.artwork.identity.description":
    "The artwork has its own identity. Its records show who the artist is, which files belong to the artwork, and which tokens were created from it.",
  "publicReview.forArtistsGuide.artwork.editions.title": "Editions and minting",
  "publicReview.forArtistsGuide.artwork.editions.description":
    "You choose whether it is a one-of-one or an edition, how many can exist, and how minting works. Artists can use randomness to generate a result for each token. The random value is saved, so the result can be recreated later.",
  "publicReview.forArtistsGuide.artwork.approval.title": "Your approval",
  "publicReview.forArtistsGuide.artwork.approval.description":
    "Your wallet approves one version of the artwork, including how many tokens can exist. If those details change, your old approval no longer applies. Without a new approval, the changed version is not approved by you.",
  "publicReview.forArtistsGuide.artwork.sales.title":
    "Sales, payments, and royalties",
  "publicReview.forArtistsGuide.artwork.sales.description":
    "The plan states how collectors first receive tokens: through a fixed-price mint or an auction. It also states the price, currency, and who receives the money. Later sales may pay royalties, but marketplaces do not always pay them.",
  "publicReview.forArtistsGuide.artwork.control.title":
    "What can still change",
  "publicReview.forArtistsGuide.artwork.control.description":
    "Before the artwork becomes final, details such as file links, token supply, minting, and sale settings can still be corrected or completed. Changes stay in the artwork's history. Some changes make the artist's old approval no longer apply.",
  "publicReview.forArtistsGuide.artwork.preservation.title":
    "Files and artwork history",
  "publicReview.forArtistsGuide.artwork.preservation.description":
    "The artwork's records can show where its files are stored and how to check that they have not changed. They can also include artist statements, authenticity details, and exhibition history. The files themselves still need reliable long-term storage.",
  "publicReview.forArtistsGuide.journey.heading": "Your journey",
  "publicReview.forArtistsGuide.journey.description":
    "Along the way, its details are reviewed and approved, and collectors can mint or buy under the sale rules. After the final checks, further changes to the artwork itself are meant to stop.",
  "publicReview.forArtistsGuide.journey.prepare.title": "Prepare",
  "publicReview.forArtistsGuide.journey.prepare.description":
    "Gather the artwork files and everything they need to work. Choose the edition size, who should be credited, and how collectors can mint or buy at launch. Decide where the files will be stored and who receives the mint money.",
  "publicReview.forArtistsGuide.journey.review.title": "Review",
  "publicReview.forArtistsGuide.journey.review.description":
    "Check one readable plan showing the artwork identity, supply, sale terms, payments, roles, and future change powers.",
  "publicReview.forArtistsGuide.journey.approve.title": "Approve",
  "publicReview.forArtistsGuide.journey.approve.description":
    "Use your wallet to sign the exact collection state you accept. If the plan changes, the new state needs its own approval.",
  "publicReview.forArtistsGuide.journey.select.title": "Community selection",
  "publicReview.forArtistsGuide.journey.select.description":
    "The community evaluates the work outside the contracts. If it passes that process, a wallet Stream trusts signs a launch permission containing the exact artwork and launch terms.",
  "publicReview.forArtistsGuide.journey.launch.title": "Launch",
  "publicReview.forArtistsGuide.journey.launch.description":
    "Stream checks the signed permission before launch. Collectors can then mint or buy under the approved sale rules.",
  "publicReview.forArtistsGuide.journey.finalize.title": "Finalize",
  "publicReview.forArtistsGuide.journey.finalize.description":
    "After the work and its dependencies are checked, the finality process is meant to close the remaining artwork-changing paths.",
  "publicReview.forArtistsGuide.approval.heading": "Before you approve",
  "publicReview.forArtistsGuide.approval.description":
    "Your wallet signature should cover one exact plan. Check these items before signing:",
  "publicReview.forArtistsGuide.approval.identity":
    "The correct artwork and collection identity",
  "publicReview.forArtistsGuide.approval.materials":
    "Every file, script, and outside dependency the work needs",
  "publicReview.forArtistsGuide.approval.supply":
    "The maximum supply and every open way to mint",
  "publicReview.forArtistsGuide.approval.sale":
    "The sale type, price or auction rules, currency, and refund rules",
  "publicReview.forArtistsGuide.approval.payments":
    "Every payment recipient and their share",
  "publicReview.forArtistsGuide.approval.roles":
    "Who can still change, pause, or operate each part",
  "publicReview.forArtistsGuide.approval.finality":
    "Which later actions cannot be undone",
  "publicReview.forArtistsGuide.changes.heading": "What can change?",
  "publicReview.forArtistsGuide.changes.description":
    "The answer depends on where the artwork is in its life. The simple model is:",
  "publicReview.forArtistsGuide.changes.beforeLaunch.title": "Before launch",
  "publicReview.forArtistsGuide.changes.beforeLaunch.description":
    "Allowed settings can still be prepared or corrected. You can refuse to approve a plan that is wrong.",
  "publicReview.forArtistsGuide.changes.afterLaunch.title":
    "After minting starts",
  "publicReview.forArtistsGuide.changes.afterLaunch.description":
    "Minted history, payments, and signed actions remain recorded. Some settings or operating roles may still be active.",
  "publicReview.forArtistsGuide.changes.afterFinality.title": "After finality",
  "publicReview.forArtistsGuide.changes.afterFinality.description":
    "The design is meant to close the remaining artwork-affecting changes and leave a record people can verify later.",
  "publicReview.forArtistsGuide.changes.caveat":
    "The exact boundary between editable and permanent is still under review. Check the technical evidence below before relying on any specific promise.",
  "publicReview.forArtistsGuide.actors.heading": "Who else has power?",
  "publicReview.forArtistsGuide.actors.description":
    "Your approval matters, but Stream also depends on other people, roles, and services. Their powers should be visible before you sign.",
  "publicReview.forArtistsGuide.actors.community.title":
    "Community and trusted signer",
  "publicReview.forArtistsGuide.actors.community.description":
    "The community decides curation outside the contracts. A separate trusted wallet turns an accepted result into the signed permission Stream can check.",
  "publicReview.forArtistsGuide.actors.operators.title":
    "Stream operators and governance",
  "publicReview.forArtistsGuide.actors.operators.description":
    "These roles operate shared parts of the system and can make only the changes their contract permissions allow.",
  "publicReview.forArtistsGuide.actors.guardian.title": "Guardian",
  "publicReview.forArtistsGuide.actors.guardian.description":
    "A guardian may stop a suspicious delayed action. That safety role should not be able to invent new artwork content for you.",
  "publicReview.forArtistsGuide.actors.services.title": "Outside services",
  "publicReview.forArtistsGuide.actors.services.description":
    "Storage, websites, randomness providers, and marketplaces supply things the contracts cannot guarantee by themselves.",
  "publicReview.forArtistsGuide.sales.heading": "Sales and payments",
  "publicReview.forArtistsGuide.sales.description":
    "A launch may use a fixed price or an auction. The plan should make the price, currency, custody, cancellation rules, recipients, and payment shares clear. Primary-sale money can be recorded as amounts each recipient withdraws.",
  "publicReview.forArtistsGuide.sales.royalties":
    "Stream can state the intended royalty, but it cannot force every outside marketplace to pay it.",
  "publicReview.forArtistsGuide.permanence.heading":
    "Making the work permanent",
  "publicReview.forArtistsGuide.permanence.description":
    "Finality is the last check before the artwork record is meant to stop changing. A digital fingerprint can prove that a file matches, but it does not keep that file online.",
  "publicReview.forArtistsGuide.permanence.files":
    "Confirm that every required file and dependency can still be retrieved.",
  "publicReview.forArtistsGuide.permanence.fingerprints":
    "Confirm that the recorded fingerprints match the intended materials.",
  "publicReview.forArtistsGuide.permanence.supply":
    "Confirm the final supply, mint history, payments, and any randomness results.",
  "publicReview.forArtistsGuide.permanence.delay":
    "Use the finality delay to find mistakes before the last change paths close.",
  "publicReview.forArtistsGuide.readPage": "Read {page}",
  "publicReview.forArtistsGuide.evidence.heading":
    "Want the technical evidence?",
  "publicReview.forArtistsGuide.evidence.description":
    "The detailed review below explains how the current contracts try to provide this artist experience. It includes the proposed mechanisms, source links, open questions, and known limits.",
  "publicReview.forArtistsGuide.evidence.action":
    "Continue to the detailed contract review",
  "publicReview.pages.overviewNarrative.title": "Overview",
  "publicReview.pages.overviewNarrative.summary":
    "How Stream is designed to help artists publish and sell digital art while keeping each artwork's identity, sale rules, and history clear over time.",
  "publicReview.pages.artworkLifecycle.title": "Artwork Lifecycle",
  "publicReview.pages.artworkLifecycle.summary":
    "How an artwork moves from preparation through minting, preservation, and finality.",
  "publicReview.pages.forArtists.title": "For Artists",
  "publicReview.pages.forArtists.summary":
    "What the artist chooses, confirms, must check, and cannot undo.",
  "publicReview.pages.rolesAndTrust.title": "Roles and Trust",
  "publicReview.pages.rolesAndTrust.summary":
    "Every role that can act, what it can change, and where trust remains.",
  "publicReview.pages.whoCanDoWhat.title": "Who Can Do What",
  "publicReview.pages.whoCanDoWhat.summary":
    "Who can act, what each person or contract can change, and how those powers end.",
  "publicReview.pages.curationAndTdhAuthorization.title":
    "Curation and TDH Authorization",
  "publicReview.pages.curationAndTdhAuthorization.summary":
    "How offchain curation and TDH decisions become signed onchain authorization.",
  "publicReview.pages.tokensCollectionsAndMinting.title":
    "Tokens, Collections, and Minting",
  "publicReview.pages.tokensCollectionsAndMinting.summary":
    "The shared ERC-721 system for collections, token issuance, supply, and mint controls.",
  "publicReview.pages.fixedPriceSalesAndAuctions.title":
    "Fixed-Price Sales and Auctions",
  "publicReview.pages.fixedPriceSalesAndAuctions.summary":
    "The sale mechanisms, bidding rules, settlement paths, and edge cases.",
  "publicReview.pages.revenueSplitsAndRoyalties.title":
    "Revenue, Splits, and Royalties",
  "publicReview.pages.revenueSplitsAndRoyalties.summary":
    "Where primary-sale funds and secondary royalties go, and how recipients are configured.",
  "publicReview.pages.randomness.title": "Randomness",
  "publicReview.pages.randomness.summary":
    "How unpredictable values enter the protocol and which outcomes depend on them.",
  "publicReview.pages.metadataScriptsAndDependencies.title":
    "Metadata, Scripts, and Dependencies",
  "publicReview.pages.metadataScriptsAndDependencies.summary":
    "How token presentation, generative scripts, and external dependencies are stored and referenced.",
  "publicReview.pages.freezingPreservationAndArtworkFinality.title":
    "Freezing, Preservation, and Artwork Finality",
  "publicReview.pages.freezingPreservationAndArtworkFinality.summary":
    "The mechanisms that move artwork data from editable to permanently fixed.",
  "publicReview.pages.governancePausingAndSuccessors.title":
    "Governance, Pausing, and Successors",
  "publicReview.pages.governancePausingAndSuccessors.summary":
    "How governance acts, emergencies are handled, and successor contracts are recognized.",
  "publicReview.pages.changesEmergenciesAndFutureContracts.title":
    "Changes, Emergencies, and Future Contracts",
  "publicReview.pages.changesEmergenciesAndFutureContracts.summary":
    "How Stream announces changes, stops problems, replaces service contracts, and ends powers permanently.",
  "publicReview.pages.securityTestingAndKnownLimitations.title":
    "Security, Testing, and Known Limitations",
  "publicReview.pages.securityTestingAndKnownLimitations.summary":
    "Current engineering evidence, unresolved findings, constraints, and pre-audit caveats.",
  "publicReview.pages.currentImplementationAndReadiness.title":
    "Current Implementation and Readiness",
  "publicReview.pages.currentImplementationAndReadiness.summary":
    "The authoritative record of what is connected, implemented, proposed, tested, audited, and still required before release.",
  "publicReview.pages.whereDevelopmentStands.title": "Where Development Stands",
  "publicReview.pages.whereDevelopmentStands.summary":
    "What worked in this review snapshot, what was being connected, and the evidence required before launch.",
  "publicReview.pages.communityReview.title": "Community Review",
  "publicReview.pages.communityReview.summary":
    "How to examine the proposal, frame actionable feedback, and follow the review record.",
  "publicReview.development.heading": "Development update",
  "publicReview.development.checkedAt": "Checked {date}",
  "publicReview.development.source": "Development source",
  "publicReview.development.finishedRecently": "Finished recently",
  "publicReview.development.workingOn": "Working on now",
  "publicReview.development.beforeLaunch": "Still needed before launch",
  "publicReview.development.evidenceSummary":
    "Evidence checklist: {complete} complete, {pending} under review, and {missing} remaining. {blockers} recorded issues currently prevent release.",
  "publicReview.development.openEvidence": "Open the supporting evidence",
  "publicReview.development.openEvidenceLabel":
    "Open supporting evidence for {item} (opens in a new tab)",
  "publicReview.development.snapshotNote":
    "The detailed review below is version {version}, pinned to contract source {commit}.",
  "publicReview.development.reviewQuestionsHeading":
    "Where your input would help",
  "publicReview.development.reviewQuestionsDescription":
    "Choose the question closest to your experience. Each one explains the issue in plain language and links to the relevant evidence.",
  "publicReview.development.readQuestion": "Open this question",
  "publicReview.development.readQuestionLabel": "Open this question: {title}",
  "publicReview.development.sourceLabel":
    "Development source (opens in a new tab)",
  "publicReview.evidence.heading": "Evidence labels",
  "publicReview.evidence.summary": "How to read evidence labels",
  "publicReview.evidence.labels.implemented": "Implemented",
  "publicReview.evidence.labels.tested": "Tested",
  "publicReview.evidence.labels.proposed": "Proposed",
  "publicReview.evidence.labels.openForFeedback": "Open for feedback",
  "publicReview.evidence.labels.auditPending": "Audit pending",
  "publicReview.evidence.labels.deferred": "Deferred",
  "publicReview.evidence.labels.knownLimitation": "Known limitation",
  "publicReview.evidence.implemented":
    "Implemented: present in the pinned Solidity source.",
  "publicReview.evidence.tested":
    "Tested: exercised by retained automated tests; wider review provides security assurance.",
  "publicReview.evidence.proposed":
    "Proposed: described in a design or specification and awaiting full implementation.",
  "publicReview.evidence.openForFeedback":
    "Open for feedback: an active decision the review should challenge.",
  "publicReview.evidence.auditPending":
    "Audit pending: the external audit for this candidate remains outstanding.",
  "publicReview.evidence.deferred":
    "Deferred: intentionally outside the current implementation target.",
  "publicReview.evidence.knownLimitation":
    "Known limitation: a recorded constraint, gap, or unresolved risk.",
  "publicReview.markdown.externalLink": "Opens in a new tab",
  "publicReview.markdown.codeRegion": "Scrollable code example",
  "publicReview.markdown.tableRegion":
    "Scrollable table in the contract review",
  "publicReview.reference.eyebrow": "Generated technical reference",
  "publicReview.reference.backToReview": "Back to contract review",
  "publicReview.reference.openReference": "Open technical reference",
  "publicReview.reference.overviewTitle": "Solidity technical reference",
  "publicReview.reference.overviewDescription":
    "A deterministic inventory generated from the exact pinned Solidity source, compiler output, and retained release evidence.",
  "publicReview.reference.generatedLabel": "Generated from source",
  "publicReview.reference.scrollSectionsLeft": "Scroll reference sections left",
  "publicReview.reference.scrollSectionsRight":
    "Scroll reference sections right",
  "publicReview.reference.sourceCommit": "Pinned source commit",
  "publicReview.reference.sourceTree": "Pinned source tree",
  "publicReview.reference.compiler": "Compiler",
  "publicReview.reference.evmVersion": "EVM version",
  "publicReview.reference.optimizer": "Optimizer",
  "publicReview.reference.optimizerEnabled": "Enabled, {runs} runs",
  "publicReview.reference.optimizerDisabled": "Disabled",
  "publicReview.reference.viaIr": "Via IR",
  "publicReview.reference.commitTimestamp": "Source commit timestamp",
  "publicReview.reference.generator": "Generator",
  "publicReview.reference.outputChecksum": "Bundle checksum",
  "publicReview.reference.definitions": "Definitions",
  "publicReview.reference.contracts": "Contracts",
  "publicReview.reference.interfaces": "Interfaces",
  "publicReview.reference.libraries": "Libraries",
  "publicReview.reference.sourceFiles": "Source files",
  "publicReview.reference.lineCount": "Line count",
  "publicReview.reference.warnings": "Generator warnings",
  "publicReview.reference.releaseEvidence": "Release evidence",
  "publicReview.reference.releaseTracked": "Release evidence tracked",
  "publicReview.reference.releaseNotTracked": "No release artifact",
  "publicReview.reference.releaseEvidenceDescription":
    "Checksums and counts below come from retained release artifacts and describe this source snapshot. Audit results require an independent audit.",
  "publicReview.reference.auditorEvidence": "Auditor evidence",
  "publicReview.reference.auditorEvidenceDescription":
    "These records are generated from the retained release manifest, readiness evidence, risk register, governed-parameter inventory, and NatSpec baseline at this exact source commit. They expose known gaps and await approval.",
  "publicReview.reference.releaseStatus": "Release status",
  "publicReview.reference.publicBeta": "Public beta",
  "publicReview.reference.productionRelease": "Production release",
  "publicReview.reference.unfinishedRequirements": "Unfinished requirements",
  "publicReview.reference.openRiskBlockers": "Open risk blockers",
  "publicReview.reference.retainedArtifacts": "Bound artifacts",
  "publicReview.reference.releaseReadiness": "Release-readiness evidence",
  "publicReview.reference.releaseReadinessDescription":
    "Every retained requirement for public beta and production is shown, including incomplete rows, owners, notes, and exact evidence files.",
  "publicReview.reference.searchRequirements": "Search requirements",
  "publicReview.reference.searchRequirementsPlaceholder":
    "Requirement, owner, or notes",
  "publicReview.reference.releasePhase": "Release phase",
  "publicReview.reference.requirementStatus": "Requirement status",
  "publicReview.reference.requirementResults": "{total} requirements",
  "publicReview.reference.noEvidenceRetained":
    "No retained evidence is attached to this requirement.",
  "publicReview.reference.riskRegister": "Risk register",
  "publicReview.reference.riskRegisterDescription":
    "Search the contract's retained risk register. Open blockers, planned mitigations, and locally mitigated risks remain distinct.",
  "publicReview.reference.searchRisks": "Search risks",
  "publicReview.reference.searchRisksPlaceholder":
    "Risk ID, title, owner, mitigation, or residual risk",
  "publicReview.reference.riskArea": "Risk area",
  "publicReview.reference.riskStatus": "Risk status",
  "publicReview.reference.riskResults": "{visible} of {total} risks",
  "publicReview.reference.mitigation": "Mitigation",
  "publicReview.reference.residualRisk": "Residual risk",
  "publicReview.reference.owner": "Owner",
  "publicReview.reference.targetGate": "Target gate",
  "publicReview.reference.trackingLink": "Tracking link {number}",
  "publicReview.reference.showMoreRisks": "Show more risks",
  "publicReview.reference.governedParameters": "Governed parameters",
  "publicReview.reference.governedParametersDescription":
    "This is the generated inventory of gas and time parameters governed after deployment, with their permanent identifiers, normative sources, expected hosts, and guarded consumers.",
  "publicReview.reference.searchParameters": "Search governed parameters",
  "publicReview.reference.searchParametersPlaceholder":
    "Name, identifier, preimage, source, or consumer",
  "publicReview.reference.parameterFamily": "Parameter family",
  "publicReview.reference.parameterResults": "{total} governed parameters",
  "publicReview.reference.parameterId": "Permanent parameter ID",
  "publicReview.reference.parameterPreimage": "Identifier preimage",
  "publicReview.reference.normativeSource": "Normative source",
  "publicReview.reference.expectedHosts": "Expected host bindings",
  "publicReview.reference.consumers": "Guarded consumers",
  "publicReview.reference.candidateBinding": "Candidate binding",
  "publicReview.reference.candidateBindingIssue":
    "Open the issue blocking candidate binding",
  "publicReview.reference.mutationModel": "Mutation model",
  "publicReview.reference.minimumDelay": "Minimum delay",
  "publicReview.reference.maximumRaise": "Maximum raise multiplier",
  "publicReview.reference.seconds": "{count} seconds",
  "publicReview.reference.forbiddenSurfaces": "Forbidden surfaces:",
  "publicReview.reference.genesisGasValue": "Genesis gas value",
  "publicReview.reference.immutableGasFloor": "Immutable gas floor",
  "publicReview.reference.failureClass": "Failure class",
  "publicReview.reference.genesisBlocks": "Genesis blocks",
  "publicReview.reference.immutableBlockFloor": "Immutable block floor",
  "publicReview.reference.wallClockFloor": "Wall-clock floor (seconds)",
  "publicReview.reference.measurementEvidence": "Measurement evidence",
  "publicReview.reference.fixedStipendCompatibility":
    "Fixed-stipend compatibility",
  "publicReview.reference.natSpecGaps": "Known documentation gaps",
  "publicReview.reference.natSpecGapsDescription":
    "This is the complete normalized NatSpec baseline for the release surface. Functions, public-variable getters, events, custom errors, and declarations not found in the local source are counted separately and retain their reason and follow-up.",
  "publicReview.reference.searchDocumentationGaps": "Search documentation gaps",
  "publicReview.reference.searchDocumentationGapsPlaceholder":
    "Contract, signature, source, reason, or follow-up",
  "publicReview.reference.documentationGapType": "Documentation gap type",
  "publicReview.reference.documentationGapStatus": "Documentation gap status",
  "publicReview.reference.documentationGapResults":
    "{visible} of {total} documentation gaps",
  "publicReview.reference.followUp": "Follow-up:",
  "publicReview.reference.noDocumentationGaps":
    "No documentation gaps match the selected filters.",
  "publicReview.reference.showMoreGaps": "Show more documentation gaps",
  "publicReview.reference.artifactChecksums": "Retained artifact checksums",
  "publicReview.reference.classifications": "Source classifications",
  "publicReview.reference.searchDefinitions": "Search definitions",
  "publicReview.reference.searchDefinitionsPlaceholder":
    "Name, path, or classification",
  "publicReview.reference.filterScope": "Source scope",
  "publicReview.reference.filterKind": "Definition kind",
  "publicReview.reference.filterClassification": "Classification",
  "publicReview.reference.all": "All",
  "publicReview.reference.noDefinitions":
    "No definitions match the selected filters.",
  "publicReview.reference.resultsCount": "{visible} of {total} definitions",
  "publicReview.reference.showMoreDefinitions": "Show more definitions",
  "publicReview.reference.declarationResultsCount":
    "{visible} of {total} declarations",
  "publicReview.reference.openDefinition": "Open {name}",
  "publicReview.reference.definitionTitle": "{kind} {name}",
  "publicReview.reference.definitionKind": "Definition kind",
  "publicReview.reference.abstract": "abstract",
  "publicReview.reference.definitionDescription":
    "Generated declaration inventory, ABI surface, source ranges, and release evidence for this definition.",
  "publicReview.reference.classification": "Classification",
  "publicReview.reference.classificationReason":
    "Why it is classified this way",
  "publicReview.reference.source": "Source",
  "publicReview.reference.sourceCodeRegion": "Solidity source code",
  "publicReview.reference.lines": "Lines {start}–{end}",
  "publicReview.reference.openPinnedSource": "Open pinned source on GitHub",
  "publicReview.reference.deploymentStatus": "Deployment status",
  "publicReview.reference.releaseCatalog": "Release catalog",
  "publicReview.reference.genesisTarget": "Genesis target",
  "publicReview.reference.yes": "Yes",
  "publicReview.reference.no": "No",
  "publicReview.reference.bytecodeSize": "Deployed bytecode",
  "publicReview.reference.bytes": "{count} bytes",
  "publicReview.reference.abiChecksum": "ABI checksum",
  "publicReview.reference.bytecodeChecksum": "Bytecode checksum",
  "publicReview.reference.deployedBytecodeChecksum":
    "Deployed bytecode checksum",
  "publicReview.reference.inheritance": "Inheritance",
  "publicReview.reference.directInheritance": "Direct bases",
  "publicReview.reference.linearizedInheritance":
    "Compiler linearization order",
  "publicReview.reference.linearizedInheritanceDescription":
    "The exact C3 linearized definition order recorded by the compiler, beginning with this definition.",
  "publicReview.reference.noInheritance": "No inherited definitions recorded.",
  "publicReview.reference.declarations": "Local declarations",
  "publicReview.reference.globalDeclarations": "All callable declarations",
  "publicReview.reference.globalDeclarationsDescription":
    "Search every function, event, and custom error in the pinned source, including synthetic getters and file-scope declarations.",
  "publicReview.reference.searchAllDeclarations":
    "Search functions, events, and errors",
  "publicReview.reference.searchAllDeclarationsPlaceholder":
    "Signature, selector, topic, contract, or source path",
  "publicReview.reference.declarationLocation": "Declaration location",
  "publicReview.reference.definitionScope": "Inside a contract or library",
  "publicReview.reference.fileScope": "File scope",
  "publicReview.reference.showMoreDeclarations": "Show more declarations",
  "publicReview.reference.loadingDeclarations": "Loading declarations…",
  "publicReview.reference.loadingMoreDeclarations":
    "Loading more declarations…",
  "publicReview.reference.declarationsLoadError":
    "The declaration index could not be loaded. Try again.",
  "publicReview.reference.retryDeclarations": "Try again",
  "publicReview.reference.abiSurface": "Compiled ABI surface",
  "publicReview.reference.abiSurfaceDescription":
    "Includes inherited ABI entries and links each entry to its declaring definition.",
  "publicReview.reference.searchDeclarations": "Search declarations",
  "publicReview.reference.searchDeclarationsPlaceholder":
    "Name, signature, selector, or topic",
  "publicReview.reference.filterDeclarationKind": "Declaration kind",
  "publicReview.reference.noDeclarations":
    "No declarations match the selected filters.",
  "publicReview.reference.functions": "Functions",
  "publicReview.reference.readFunctions": "Read functions",
  "publicReview.reference.writeFunctions": "Write functions",
  "publicReview.reference.payableFunctions": "Payable functions",
  "publicReview.reference.events": "Events",
  "publicReview.reference.errors": "Errors",
  "publicReview.reference.otherDeclarations": "Other local declarations",
  "publicReview.reference.modifiers": "Modifiers",
  "publicReview.reference.stateVariables": "State variables",
  "publicReview.reference.structs": "Structs",
  "publicReview.reference.enums": "Enums",
  "publicReview.reference.userDefinedValueTypes": "User-defined value types",
  "publicReview.reference.fileScopeDeclarations": "File-scope declarations",
  "publicReview.reference.fileScopeDeclarationsDescription":
    "Structs, enums, custom value types, functions, events, errors, and variables declared outside a contract in this exact source file.",
  "publicReview.reference.members": "Members",
  "publicReview.reference.declarationMembersTable": "Members of {declaration}",
  "publicReview.reference.canonicalName": "Canonical name",
  "publicReview.reference.initializer": "Initializer",
  "publicReview.reference.semanticIdentity": "Stable generated identity",
  "publicReview.reference.semanticId": "Semantic ID",
  "publicReview.reference.routeKey": "Lossless route key",
  "publicReview.reference.inherited": "Inherited",
  "publicReview.reference.local": "Local",
  "publicReview.reference.selector": "Selector",
  "publicReview.reference.topic": "Topic 0",
  "publicReview.reference.mutability": "Mutability",
  "publicReview.reference.functionKind": "Function kind",
  "publicReview.reference.syntheticGetter": "Synthetic state-variable getter",
  "publicReview.reference.virtual": "Virtual",
  "publicReview.reference.anonymousEvent": "Anonymous event",
  "publicReview.reference.none": "None",
  "publicReview.reference.anonymous": "Anonymous",
  "publicReview.reference.visibility": "Visibility",
  "publicReview.reference.parameters": "Inputs",
  "publicReview.reference.outputs": "Outputs",
  "publicReview.reference.noParameters": "None",
  "publicReview.reference.indexed": "Indexed",
  "publicReview.reference.name": "Name",
  "publicReview.reference.type": "Type",
  "publicReview.reference.internalType": "Internal type",
  "publicReview.reference.storageLocation": "Storage location",
  "publicReview.reference.underlyingType": "Underlying type",
  "publicReview.reference.constant": "Constant",
  "publicReview.reference.immutable": "Immutable",
  "publicReview.reference.interfaceTitle": "Interface {name}",
  "publicReview.reference.interfaceDescription":
    "Published interface identity and compiled selector surface for the pinned review source.",
  "publicReview.reference.interfaceId": "Interface ID",
  "publicReview.reference.interfaceIdSource": "Interface ID source",
  "publicReview.reference.interfaceAbiChecksum": "Interface ABI checksum",
  "publicReview.reference.sourceTitle": "Source: {path}",
  "publicReview.reference.sourceDescription":
    "Exact source bytes retained for this review version, with line-level feedback context.",
  "publicReview.reference.sourceChecksum": "Source checksum",
  "publicReview.reference.snippetChecksum":
    "Exact declaration snippet checksum",
  "publicReview.reference.byteRange": "Compiler byte range",
  "publicReview.reference.byteRangeValue":
    "Start {start}, length {length} bytes",
  "publicReview.reference.sourceScope": "Source scope",
  "publicReview.reference.sourceDefinitions": "Definitions in this file",
  "publicReview.reference.selectLines": "Select code lines",
  "publicReview.reference.selectLinesDescription":
    "Choose a start and end line. The exact file checksum and selected lines will be attached to feedback.",
  "publicReview.reference.startLine": "Start line",
  "publicReview.reference.endLine": "End line",
  "publicReview.reference.selectionInvalid":
    "The start line must not be after the end line.",
  "publicReview.reference.selectedRange": "Selected lines {start}–{end}",
  "publicReview.reference.selectSingleLine": "Select line {line}",
  "publicReview.reference.copySelection": "Copy selected code",
  "publicReview.reference.copiedSelection": "Selected code copied.",
  "publicReview.reference.copyFailed":
    "The selected code could not be copied. Select and copy it manually.",
  "publicReview.reference.openSelection": "Open selected lines on GitHub",
  "publicReview.reference.commentSelection": "Comment on selected lines",
  "publicReview.reference.feedbackRegion": "Feedback for selected source lines",
  "publicReview.reference.skipCode": "Send feedback on these selected lines",
  "publicReview.reference.selectionReady":
    "This source reference is ready to attach to structured feedback.",
  "publicReview.reference.warningSummary": "Warning summary",
  "publicReview.reference.warningCategories": "Categories",
  "publicReview.reference.warningCodes": "Codes",
  "publicReview.reference.warningRecords": "Individual warning records",
  "publicReview.reference.warningDescription":
    "Warnings identify documentation or evidence gaps. They do not mean the generator omitted the declaration.",
  "publicReview.reference.noWarnings":
    "The generator recorded no warnings for this definition.",
  "publicReview.reference.natspec": "NatSpec",
  "publicReview.reference.noNatspec":
    "No NatSpec was present at this source declaration.",
  "publicReview.reference.routeUnavailable":
    "The requested generated reference does not exist in this review version.",
  "publicReview.reference.sourceLine": "Line {lineNumber}",
  "publicReview.feedback.title": "Send feedback",
  "publicReview.feedback.jump": "Jump to send feedback",
  "publicReview.feedback.category": "Feedback type",
  "publicReview.feedback.severity": "Suspected severity",
  "publicReview.feedback.comment": "Comment",
  "publicReview.feedback.required": "required",
  "publicReview.feedback.commentHint": "Write a comment…",
  "publicReview.feedback.advanced": "Add technical detail",
  "publicReview.feedback.whyItMatters": "Why this matters",
  "publicReview.feedback.suggestedChange": "Suggested change",
  "publicReview.feedback.preconditions": "Preconditions",
  "publicReview.feedback.expectedBehavior": "Expected behavior",
  "publicReview.feedback.observedBehavior": "Observed behavior",
  "publicReview.feedback.reproduction": "Reproduction or proof of concept",
  "publicReview.feedback.preview": "Preview Wave message",
  "publicReview.feedback.previewHeading": "Wave message preview",
  "publicReview.feedback.submit": "Post to review Wave",
  "publicReview.feedback.submitting": "Posting feedback…",
  "publicReview.feedback.connect": "Connect wallet to comment",
  "publicReview.feedback.reconnect": "Re-authenticate wallet",
  "publicReview.feedback.connecting": "Opening wallet…",
  "publicReview.feedback.closed":
    "Feedback submissions for this review version are closed.",
  "publicReview.feedback.checking": "Checking Wave access…",
  "publicReview.feedback.unavailable":
    "The configured discussion Wave is not available for feedback.",
  "publicReview.feedback.ineligible":
    "Your active profile is not eligible to comment in this Wave.",
  "publicReview.feedback.validationError":
    "Review the highlighted fields before continuing.",
  "publicReview.feedback.commentRequired": "Enter a comment.",
  "publicReview.feedback.submitError":
    "Your feedback was not posted. Your draft has been preserved so you can try again.",
  "publicReview.feedback.connectError":
    "The wallet connection could not be completed. Please try again.",
  "publicReview.feedback.success": "Feedback posted successfully.",
  "publicReview.feedback.pageContext": "Page: {page}",
  "publicReview.feedback.sectionContext": "Section: {section}",
  "publicReview.feedback.sourceContext":
    "Source: {path}, lines {lineStart}–{lineEnd}",
  "publicReview.feedback.sectionSelector": "Comment on",
  "publicReview.feedback.wholePage": "The whole page",
  "publicReview.feedback.hashingReference":
    "Preparing the tamper-evident checksum for this exact code selection…",
  "publicReview.feedback.hashUnavailable":
    "This browser could not verify the selected code checksum. Code-linked feedback is disabled; reload in a current browser and try again.",
  "publicReview.comments.show": "Show feedback",
  "publicReview.comments.hide": "Hide feedback",
  "publicReview.comments.title": "Page comments",
  "publicReview.comments.viewLedger": "View the full feedback ledger",
  "publicReview.comments.loading": "Loading page comments…",
  "publicReview.comments.loadError":
    "Comments could not be loaded from the review Wave.",
  "publicReview.comments.empty": "No comments yet for this page.",
  "publicReview.comments.emptyLoaded":
    "No comments for this page are present in the loaded feedback.",
  "publicReview.comments.status": "{count} page comments loaded.",
  "publicReview.comments.byline": "{author} · {date} at {time}",
  "publicReview.comments.avatarAlt": "{author}'s profile picture",
  "publicReview.feedback.categories.question": "Question",
  "publicReview.feedback.categories.artistWorkflow": "Artist workflow",
  "publicReview.feedback.categories.productOrUx": "Product or UX",
  "publicReview.feedback.categories.protocolDesign":
    "Protocol and mechanism design",
  "publicReview.feedback.categories.documentation": "Documentation",
  "publicReview.feedback.categories.implementationBug": "Implementation bug",
  "publicReview.feedback.categories.exploitable":
    "Possible exploitable security vulnerability",
  "publicReview.feedback.categories.testingOrEvidenceGap":
    "Testing or evidence gap",
  "publicReview.feedback.categories.accessibilityOrLocalization":
    "Accessibility or localization",
  "publicReview.feedback.severities.notAssessed": "Pending assessment",
  "publicReview.feedback.severities.informational": "Informational",
  "publicReview.feedback.severities.low": "Low",
  "publicReview.feedback.severities.medium": "Medium",
  "publicReview.feedback.severities.high": "High",
  "publicReview.feedback.severities.critical": "Critical",
  "publicReview.feedback.pages.referenceOverview":
    "Technical reference overview",
  "publicReview.feedback.pages.referenceDefinition":
    "Contract or library definition",
  "publicReview.feedback.pages.referenceInterface": "Published interface",
  "publicReview.feedback.pages.referenceSource": "Solidity source file",
  "publicReview.feedback.pages.referenceFunction": "Solidity function",
  "publicReview.feedback.pages.referenceEvent": "Solidity event",
  "publicReview.feedback.pages.referenceError": "Solidity custom error",
  "publicReview.feedback.pages.referenceDeclaration": "File-scope declaration",
  "publicReview.ledger.title": "Public feedback ledger",
  "publicReview.ledger.intro":
    "Structured feedback submitted for this exact review version.",
  "publicReview.ledger.search": "Search loaded feedback",
  "publicReview.ledger.category": "Type",
  "publicReview.ledger.page": "Page",
  "publicReview.ledger.contract": "Contract",
  "publicReview.ledger.severity": "Severity",
  "publicReview.ledger.disposition": "Disposition",
  "publicReview.ledger.all": "All",
  "publicReview.ledger.new": "New",
  "publicReview.ledger.loading": "Loading feedback…",
  "publicReview.ledger.loadError":
    "Feedback could not be loaded from the review Wave.",
  "publicReview.ledger.retry": "Try again",
  "publicReview.ledger.empty": "No loaded feedback matches these filters.",
  "publicReview.ledger.loadMore": "Load more feedback",
  "publicReview.ledger.loadingMore": "Loading more feedback…",
  "publicReview.ledger.status": "{count} matching feedback items loaded.",
  "publicReview.ledger.warning":
    "{count} Wave messages could not be included because their full review metadata was unavailable or invalid.",
  "publicReview.ledger.warningDiagnostics": "Show exclusion details",
  "publicReview.ledger.warningDiagnostic": "Drop {dropId}: {reason}",
  "publicReview.ledger.reactions": "{count} reactions",
  "publicReview.ledger.openDiscussion": "Open discussion in the Wave",
  "publicReview.ledger.sourceReference": "Open pinned source reference",
  "publicReview.ledger.internalSourceReference":
    "Open this selection in the review",
  "publicReview.ledger.githubSourceReference":
    "Open immutable evidence on GitHub",
  "publicReview.ledger.exportCsv": "Export loaded feedback as CSV",
  "publicReview.ledger.exportMarkdown": "Export loaded feedback as Markdown",
  "publicReview.ledger.exportEmpty":
    "Load feedback before creating an auditor export.",
  "publicReview.ledger.exportRequiresCompleteLedger":
    "Load all remaining feedback before creating an auditor export.",
  "publicReview.ledger.pageTitle": "6529 Stream public feedback",
  "publicReview.ledger.pageIntro":
    "A filterable record of structured community and auditor feedback for this exact contract review version.",
  "publicReview.ledger.navigation": "View public feedback",
  "publicReview.ledger.unknownAuthor": "Unknown author",
  "publicReview.ledger.byline":
    "{author} · {page} · Submitted {date} at {time}",
  "publicReview.ledger.filters": "Filter public feedback",
  "publicReview.ledger.itemLabel": "Feedback from {author}",
} as const;
