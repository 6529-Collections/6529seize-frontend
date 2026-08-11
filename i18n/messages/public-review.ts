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
  "publicReview.forArtistsGuide.artwork.heading":
    "Understand the plan before you approve it",
  "publicReview.forArtistsGuide.artwork.description":
    "Before launch, check the artwork, edition size, sale, payments, and who can still make changes. Stream records the exact version you approve.",
  "publicReview.forArtistsGuide.artwork.identity.title":
    "What artwork are you publishing?",
  "publicReview.forArtistsGuide.artwork.identity.description":
    "Choose the files, scripts, and other parts the artwork needs. Stream records the artist, the artwork, and the tokens created from it.",
  "publicReview.forArtistsGuide.artwork.editions.title":
    "Is it unique or an edition?",
  "publicReview.forArtistsGuide.artwork.editions.description":
    "Choose whether there is one token or an edition, how many tokens can exist, and how each token is created. If the work uses randomness, Stream saves the result for each token so it can be recreated later.",
  "publicReview.forArtistsGuide.artwork.sales.title":
    "How can collectors get it?",
  "publicReview.forArtistsGuide.artwork.sales.description":
    "The plan shows whether collectors mint at a fixed price or bid in an auction. It also shows the sale rules and who can take part.",
  "publicReview.forArtistsGuide.artwork.payments.title":
    "Where does the money go?",
  "publicReview.forArtistsGuide.artwork.payments.description":
    "Check the price, currency, and everyone who receives a share. Stream can state a royalty for later sales, but outside marketplaces may not pay it.",
  "publicReview.forArtistsGuide.artwork.approval.title":
    "What are you approving?",
  "publicReview.forArtistsGuide.artwork.approval.description":
    "Your wallet approves one exact version of the plan. If important details change, you need to review and approve the new version.",
  "publicReview.forArtistsGuide.artwork.control.title":
    "What can change or become permanent?",
  "publicReview.forArtistsGuide.artwork.control.description":
    "Before finality, some files, supply, minting, and sale settings can still change. Stream keeps a record of those changes. The finality process is meant to close the remaining ways the artwork itself can change.",
  "publicReview.forArtistsGuide.journey.heading":
    "How your artwork moves through Stream",
  "publicReview.forArtistsGuide.journey.description":
    "Your artwork moves through six stages. Each stage has different choices, checks, and approvals.",
  "publicReview.forArtistsGuide.journey.listLabel":
    "Artwork journey stages",
  "publicReview.forArtistsGuide.journey.prepare.title": "Prepare",
  "publicReview.forArtistsGuide.journey.prepare.description":
    "Add the artwork files and anything they need to work. Choose the edition size, sale method, credits, storage, and payment shares.",
  "publicReview.forArtistsGuide.journey.review.title": "Review",
  "publicReview.forArtistsGuide.journey.review.description":
    "Check the complete plan. Make sure the artwork, sale, payments, and who can still make changes are correct.",
  "publicReview.forArtistsGuide.journey.approve.title": "Approve",
  "publicReview.forArtistsGuide.journey.approve.description":
    "Use your wallet to approve one exact version of the plan. If an important detail changes, review and approve the new version.",
  "publicReview.forArtistsGuide.journey.select.title": "Community selection",
  "publicReview.forArtistsGuide.journey.select.description":
    "The community reviews the work outside the contracts. If it is selected, a separate Stream wallet signs the exact mint or auction terms.",
  "publicReview.forArtistsGuide.journey.launch.title": "Launch",
  "publicReview.forArtistsGuide.journey.launch.description":
    "Stream checks the signed permission. Collectors can then mint or bid using only those sale terms.",
  "publicReview.forArtistsGuide.journey.finalize.title": "Finalize",
  "publicReview.forArtistsGuide.journey.finalize.description":
    "Finality has a waiting period. During this time, the artist and reviewers check the files, supply, and every remaining way the artwork could change. The final step is meant to close those remaining change paths.",
  "publicReview.forArtistsGuide.journey.important":
    "Important: Ending minting, freezing settings, recording preservation evidence, and finalizing the artwork are separate steps. Completing one does not complete the others.",
  "publicReview.forArtistsGuide.approval.heading": "Before you approve",
  "publicReview.forArtistsGuide.approval.description":
    "Your wallet approval covers specific details, not every part of Stream. Check what the signature covers and review the wider artwork plan before signing.",
  "publicReview.forArtistsGuide.approval.listLabel": "Approval checklist",
  "publicReview.forArtistsGuide.approval.signing.title":
    "What you are signing",
  "publicReview.forArtistsGuide.approval.signing.description":
    "Check the artwork, artist wallet, contract, network, and version.",
  "publicReview.forArtistsGuide.approval.artworkSupply.title":
    "Artwork and supply",
  "publicReview.forArtistsGuide.approval.artworkSupply.description":
    "Check every required file and the maximum number of tokens. Include every way more tokens can be created.",
  "publicReview.forArtistsGuide.approval.salePayments.title":
    "Sale and payments",
  "publicReview.forArtistsGuide.approval.salePayments.description":
    "Check the sale type, price, currency, refunds, payment recipients, and shares.",
  "publicReview.forArtistsGuide.approval.powerFinality.title":
    "Power and finality",
  "publicReview.forArtistsGuide.approval.powerFinality.description":
    "Check who can change, pause, or restart each part. Check what every permanent step locks.",
  "publicReview.forArtistsGuide.approval.note":
    "If a signed detail changes, the old approval stays with the old version. Review the new version before signing again.",
  "publicReview.forArtistsGuide.changes.heading": "What can still change?",
  "publicReview.forArtistsGuide.changes.description":
    "Stream makes parts of your artwork permanent at different times. Ending minting, freezing settings, and artwork finality are separate steps.",
  "publicReview.forArtistsGuide.changes.beforeLaunch.title":
    "Before minting starts",
  "publicReview.forArtistsGuide.changes.beforeLaunch.description":
    "Review the plan. If something is wrong, do not approve it. A corrected version can be prepared for you.",
  "publicReview.forArtistsGuide.changes.afterLaunch.title":
    "After minting starts",
  "publicReview.forArtistsGuide.changes.afterLaunch.description":
    "Minted tokens, payments, and signed actions stay in the history. Some settings can still change. Important changes may need a new approval from you.",
  "publicReview.forArtistsGuide.changes.afterFinality.title":
    "After artwork finality",
  "publicReview.forArtistsGuide.changes.afterFinality.description":
    "Finality is designed to lock the artwork records it covers. Before this happens, a waiting period lets the guardian stop a suspicious finality action.",
  "publicReview.forArtistsGuide.actors.heading":
    "Who else can affect your artwork?",
  "publicReview.forArtistsGuide.actors.description":
    "Your approval matters, but other people and services also have a role. Before you sign, check what each one can do and where its power ends.",
  "publicReview.forArtistsGuide.actors.community.title": "Community review",
  "publicReview.forArtistsGuide.actors.community.description":
    "The community reviews and selects the work outside the contracts. The contracts cannot tell whether this decision was fair or correct.",
  "publicReview.forArtistsGuide.actors.signer.title":
    "Stream signing wallet",
  "publicReview.forArtistsGuide.actors.signer.description":
    "If the work is selected, a separate Stream wallet signs the exact mint or auction terms. The contracts can check that signature.",
  "publicReview.forArtistsGuide.actors.operators.title": "People who run Stream",
  "publicReview.forArtistsGuide.actors.operators.description":
    "The contracts give different roles different powers. Check who can change, pause, or restart each part of Stream.",
  "publicReview.forArtistsGuide.actors.guardian.title": "Guardian",
  "publicReview.forArtistsGuide.actors.guardian.description":
    "The guardian is a safety brake. It can pause a specific part of Stream or stop a planned change during its waiting period. It cannot replace that change with different artwork or terms.",
  "publicReview.forArtistsGuide.actors.services.title": "Outside services",
  "publicReview.forArtistsGuide.actors.services.description":
    "File storage, websites, services that provide random results, and marketplaces work outside the contracts. Stream can record links and evidence. It cannot keep a service online or force a marketplace to pay royalties.",
  "publicReview.forArtistsGuide.sales.heading":
    "How sales and payments work",
  "publicReview.forArtistsGuide.sales.buy.title": "How collectors buy",
  "publicReview.forArtistsGuide.sales.buy.description":
    "Collectors pay the signed fixed price or bid in an auction. The current signed sale paths use ETH. Before launch, check the auction end time, cancellation rules, and refund rules.",
  "publicReview.forArtistsGuide.sales.money.title":
    "Where the money goes",
  "publicReview.forArtistsGuide.sales.money.description":
    "Check every person or wallet that receives money and their share. After the sale, Stream records how much each one can withdraw. Each person withdraws separately, so one failed payment does not block everyone else.",
  "publicReview.forArtistsGuide.sales.royalties.title": "Later royalties",
  "publicReview.forArtistsGuide.sales.royalties.description":
    "Stream can show royalty information for later marketplace sales. The marketplace decides whether to pay it.",
  "publicReview.forArtistsGuide.permanence.heading":
    "Before your artwork becomes final",
  "publicReview.forArtistsGuide.permanence.description":
    "Finality is meant to lock the artwork records it covers. Ending minting, freezing settings, and adding preservation records are separate steps.",
  "publicReview.forArtistsGuide.permanence.files.title":
    "Check every required part",
  "publicReview.forArtistsGuide.permanence.files.description":
    "Make sure every file, script, font, and other required part can still be found and opened.",
  "publicReview.forArtistsGuide.permanence.fingerprints.title":
    "Check the recorded fingerprints",
  "publicReview.forArtistsGuide.permanence.fingerprints.description":
    "A file fingerprint is a code made from the file. A matching code shows that the file has not changed. It does not keep the file online.",
  "publicReview.forArtistsGuide.permanence.record.title":
    "Check the final record",
  "publicReview.forArtistsGuide.permanence.record.description":
    "Confirm the token supply, mint history, payments, and any saved randomness results.",
  "publicReview.forArtistsGuide.permanence.delay.title":
    "Use the waiting period",
  "publicReview.forArtistsGuide.permanence.delay.description":
    "Finality has a delay so you and other reviewers can find mistakes. A guardian can stop the action during this time, but cannot replace it with different artwork or terms.",
  "publicReview.forArtistsGuide.permanence.reviewStatus.title":
    "What is still under review",
  "publicReview.forArtistsGuide.permanence.reviewStatus.description":
    "Stream is meant to close every approved path that can change the artwork. The current review has not yet proved that every path is closed. Check the technical evidence before relying on finality.",
  "publicReview.forArtistsGuide.nextStep.heading": "Your next step",
  "publicReview.forArtistsGuide.nextStep.description":
    "Review the exact approval package. If it matches the plan you accept, sign it. If anything is missing or unclear, ask for a corrected version.",
  "publicReview.forArtistsGuide.readPage": "Read {page}",
  "publicReview.forArtistsGuide.evidence.heading": "Read the contract details",
  "publicReview.forArtistsGuide.evidence.description":
    "The short sections below show what is in the reviewed code, what comes from accepted design decisions, and what is still proposed.",
  "publicReview.forArtistsGuide.evidence.action":
    "Continue to the contract details",
  "publicReview.forArtistsDetails.heading": "How to read the details",
  "publicReview.forArtistsDetails.description":
    "The labels show what kind of evidence each section uses. A section can use more than one.",
  "publicReview.forArtistsDetails.basis.code.label": "Reviewed code",
  "publicReview.forArtistsDetails.basis.code.description":
    "Includes behavior present in the pinned contract snapshot.",
  "publicReview.forArtistsDetails.basis.accepted.label": "Accepted design",
  "publicReview.forArtistsDetails.basis.accepted.description":
    "Includes decisions approved in an ADR. They may not be complete in the pinned code.",
  "publicReview.forArtistsDetails.basis.proposed.label": "Still proposed",
  "publicReview.forArtistsDetails.basis.proposed.description":
    "Includes ideas that are not approved or safe to rely on yet.",
  "publicReview.forArtistsDetails.identity.title":
    "Your collection has a durable identity",
  "publicReview.forArtistsDetails.identity.intro":
    "Stream is designed around one shared ERC-721 Core contract. It gives every token a global ID and a serial number inside its collection.",
  "publicReview.forArtistsDetails.identity.point.artist":
    "The Core records the collection and its artist wallet.",
  "publicReview.forArtistsDetails.identity.point.burn":
    "The collection link stays in the contract's history after a token is burned.",
  "publicReview.forArtistsDetails.identity.point.modules":
    "Sale, rendering, and randomness contracts can change without changing this Core identity.",
  "publicReview.forArtistsDetails.identity.outro":
    "Stream is not deployed yet. This describes the reviewed design, not a live guarantee.",
  "publicReview.forArtistsDetails.approval.title":
    "Approving a specific collection state",
  "publicReview.forArtistsDetails.approval.intro":
    "The current artist signature approves one exact collection state. It also binds the network and Core contract.",
  "publicReview.forArtistsDetails.approval.point.artist": "Artist wallet",
  "publicReview.forArtistsDetails.approval.point.freeze":
    "Collection freeze fingerprint",
  "publicReview.forArtistsDetails.approval.point.purchases":
    "Maximum collection purchases",
  "publicReview.forArtistsDetails.approval.point.supply":
    "Total collection supply",
  "publicReview.forArtistsDetails.approval.point.delay":
    "Delay before final supply",
  "publicReview.forArtistsDetails.approval.outro":
    "If one value changes, the old signature stays with the old state. This signature does not directly approve every file, sale rule, payment share, or finality action. Check those separately.",
  "publicReview.forArtistsDetails.scope.title":
    "The scope of artist approval",
  "publicReview.forArtistsDetails.scope.intro":
    "Today's signature is narrow. The wider design is still deciding which other actions need a fresh artist signature.",
  "publicReview.forArtistsDetails.scope.point.files":
    "Artwork files and manifests",
  "publicReview.forArtistsDetails.scope.point.supply": "Final supply",
  "publicReview.forArtistsDetails.scope.point.sale":
    "Sale and payment rules",
  "publicReview.forArtistsDetails.scope.point.randomness":
    "Randomness provider",
  "publicReview.forArtistsDetails.scope.point.freeze": "Core freeze",
  "publicReview.forArtistsDetails.scope.point.finality": "Artwork finality",
  "publicReview.forArtistsDetails.scope.point.recovery":
    "Recovery that changes what viewers receive",
  "publicReview.forArtistsDetails.scope.outro":
    "These are open design questions, not current guarantees. A guardian may stop a planned action, but should not be able to replace it with different artwork.",
  "publicReview.forArtistsDetails.statements.title":
    "Statements made in the artist's name",
  "publicReview.forArtistsDetails.statements.intro":
    "Stream separates records by who is allowed to speak: artist, owner, institution, independent reviewer, and other roles.",
  "publicReview.forArtistsDetails.statements.rules":
    "The reviewed code limits who can submit protected record types. An ordinary admin cannot automatically submit an artist statement.",
  "publicReview.forArtistsDetails.statements.point.author":
    "Who submitted the statement",
  "publicReview.forArtistsDetails.statements.point.authority":
    "Which wallet or authority allowed it",
  "publicReview.forArtistsDetails.statements.point.subject":
    "Which collection or token it concerns",
  "publicReview.forArtistsDetails.statements.point.change":
    "Whether it can be revised, locked, or replaced by a newer record",
  "publicReview.forArtistsDetails.statements.outro":
    "A record can prove who submitted a claim. It cannot prove that the claim is true. Rights, archive, and provenance claims still need outside evidence.",
  "publicReview.forArtistsDetails.files.title":
    "Artwork files, scripts, and token data",
  "publicReview.forArtistsDetails.files.intro":
    "The artwork may depend on more than one image. It can include scripts, fonts, libraries, token data, and outside files.",
  "publicReview.forArtistsDetails.files.check":
    "Before approval or finality, ask for one clear file list. It should show:",
  "publicReview.forArtistsDetails.files.point.parts":
    "Every required file and script",
  "publicReview.forArtistsDetails.files.point.order":
    "The order in which scripts run",
  "publicReview.forArtistsDetails.files.point.versions":
    "The version of each dependency",
  "publicReview.forArtistsDetails.files.point.locations":
    "Where each file can be found",
  "publicReview.forArtistsDetails.files.point.hashes":
    "A fingerprint for the exact bytes",
  "publicReview.forArtistsDetails.files.point.rebuild":
    "Instructions for recreating the work",
  "publicReview.forArtistsDetails.files.outro":
    "A matching fingerprint shows that a file has not changed. It does not keep the file available.",
  "publicReview.forArtistsDetails.editions.title":
    "One-of-ones and editions",
  "publicReview.forArtistsDetails.editions.intro":
    "The Core can hold a one-of-one or an edition. Check:",
  "publicReview.forArtistsDetails.editions.point.maximum":
    "The maximum number of tokens",
  "publicReview.forArtistsDetails.editions.point.minted":
    "How many tokens have ever been minted",
  "publicReview.forArtistsDetails.editions.point.live":
    "How many live tokens remain after burns",
  "publicReview.forArtistsDetails.editions.point.paths":
    "Every remaining way to mint",
  "publicReview.forArtistsDetails.editions.point.control":
    "Who can change supply or mint rules",
  "publicReview.forArtistsDetails.editions.point.close":
    "What closes minting for good",
  "publicReview.forArtistsDetails.editions.outro":
    "Burning a token removes its ownership record. It does not erase mint history or restore the used mint allowance.",
  "publicReview.forArtistsDetails.mint.title": "Choosing who can mint",
  "publicReview.forArtistsDetails.mint.intro":
    "Artwork identity and mint rules are separate. Mint rules can include times, supply limits, wallet limits, eligibility checks, and an approved signer.",
  "publicReview.forArtistsDetails.mint.authorization":
    "In the current signed Drop path, one authorization can mint only one token. An edition needs several authorizations or another approved mint path.",
  "publicReview.forArtistsDetails.mint.outro":
    "Before launch, check who can authorize a mint and how used, expired, or cancelled permissions are blocked.",
  "publicReview.forArtistsDetails.curation.title": "Curation and TDH",
  "publicReview.forArtistsDetails.curation.intro":
    "Community curation and TDH happen outside the contracts.",
  "publicReview.forArtistsDetails.curation.signature":
    "If a work is selected, a Stream signing wallet signs the exact mint or auction terms. The contract checks that signature.",
  "publicReview.forArtistsDetails.curation.limit":
    "The contract can check that the signed terms were not changed. It cannot check whether the community process was fair or the selection was correct.",
  "publicReview.forArtistsDetails.sales.title":
    "Fixed-price sales and auctions",
  "publicReview.forArtistsDetails.sales.intro":
    "The reviewed sale paths use ETH. Before launch, check:",
  "publicReview.forArtistsDetails.sales.point.fixed":
    "Fixed price: token, price, payer, recipient, deadline, payment shares, and cancellation state",
  "publicReview.forArtistsDetails.sales.point.auction":
    "Auction: reserve, end time, extension rule, token custody, refunds, cancellation boundary, and no-bid result",
  "publicReview.forArtistsDetails.sales.point.cancel":
    "An auction can be cancelled only before its first valid bid and before it ends",
  "publicReview.forArtistsDetails.sales.outro":
    "The contracts record proceeds and refunds as credits. Each person withdraws their own credit later. One failed withdrawal does not block the sale.",
  "publicReview.forArtistsDetails.revenue.title":
    "Revenue, collaborators, and royalties",
  "publicReview.forArtistsDetails.revenue.intro":
    "Primary-sale money can be shared among the artist, collaborators, curator, protocol, and other recipients.",
  "publicReview.forArtistsDetails.revenue.paths":
    "The reviewed code has native ETH credit paths for Drops and Auctions. It also has a separate revenue resolver and split-wallet foundation. These are different payment paths.",
  "publicReview.forArtistsDetails.revenue.point.people":
    "Every recipient and share",
  "publicReview.forArtistsDetails.revenue.point.profile":
    "Which payment profile applies",
  "publicReview.forArtistsDetails.revenue.point.change":
    "Who can change the profile and when",
  "publicReview.forArtistsDetails.revenue.point.rounding":
    "How rounding, remaining funds, and withdrawals work",
  "publicReview.forArtistsDetails.revenue.point.royalty":
    "The royalty receiver and rate",
  "publicReview.forArtistsDetails.revenue.outro":
    "Stream can publish ERC-2981 royalty information. Marketplaces choose whether to pay it.",
  "publicReview.forArtistsDetails.randomness.title": "Randomness",
  "publicReview.forArtistsDetails.randomness.intro":
    "If the artwork uses randomness, check the provider and failure plan before minting.",
  "publicReview.forArtistsDetails.randomness.point.state":
    "The reviewed code records whether a request is waiting, complete, stale, or received but not fully processed",
  "publicReview.forArtistsDetails.randomness.point.result":
    "It stores a fingerprint of the provider result and the seed made from it",
  "publicReview.forArtistsDetails.randomness.point.retry":
    "If local processing fails, a retry uses the same saved seed. It does not ask for a new random result",
  "publicReview.forArtistsDetails.randomness.point.control":
    "Check who can change the provider, what happens to unfinished requests, and who pays provider fees",
  "publicReview.forArtistsDetails.freeze.title": "Freezing the work",
  "publicReview.forArtistsDetails.freeze.intro":
    "Four steps are easy to confuse:",
  "publicReview.forArtistsDetails.freeze.point.supply":
    "Final supply: no more tokens can be minted",
  "publicReview.forArtistsDetails.freeze.point.core":
    "Core freeze: locks the collection fields covered by the Core contract",
  "publicReview.forArtistsDetails.freeze.point.preservation":
    "Preservation records: save evidence about the files needed to understand or recreate the work",
  "publicReview.forArtistsDetails.freeze.point.finality":
    "Artwork finality: a delayed step intended to close the remaining ways the artwork can change",
  "publicReview.forArtistsDetails.freeze.separate":
    "These are separate. Completing one does not complete the others.",
  "publicReview.forArtistsDetails.freeze.check":
    "Before freeze or finality, check the files, fingerprints, supply, randomness, payments, open mint and sale paths, and who can still make changes.",
  "publicReview.forArtistsDetails.freeze.limit":
    "Accepted ADRs describe stronger freeze and finality goals. The current public review has not yet proved that every artwork-changing path is closed. Do not rely on finality until the technical review is complete.",
  "publicReview.forArtistsDetails.lifetime.title":
    "Collaborators, delegation, recovery, and estates",
  "publicReview.forArtistsDetails.lifetime.intro":
    "The current artist approval is not a complete lifetime authority system. A future system may need:",
  "publicReview.forArtistsDetails.lifetime.point.collaborators":
    "Collaborators with narrow roles",
  "publicReview.forArtistsDetails.lifetime.point.delegation":
    "Delegated signing powers",
  "publicReview.forArtistsDetails.lifetime.point.recovery":
    "Wallet recovery and key changes",
  "publicReview.forArtistsDetails.lifetime.point.estates":
    "Estate instructions and successor roles",
  "publicReview.forArtistsDetails.lifetime.point.disputes":
    "Rules for disputes and sanctions",
  "publicReview.forArtistsDetails.lifetime.status":
    "ADR 0022's registry and helper design is still proposed. It is not approved or implemented.",
  "publicReview.forArtistsDetails.lifetime.question":
    "The key question: can someone recover access without gaining power to replace the artwork or rewrite its history?",
  "publicReview.forArtistsDetails.design.title": "Design position",
  "publicReview.forArtistsDetails.design.intro":
    "Artists should never have to sign a hash they cannot understand. Before a wallet asks for a signature, the screen should show:",
  "publicReview.forArtistsDetails.design.point.work":
    "The exact artwork and version",
  "publicReview.forArtistsDetails.design.point.files":
    "The files and token supply",
  "publicReview.forArtistsDetails.design.point.sale":
    "The sale and payment rules",
  "publicReview.forArtistsDetails.design.point.randomness":
    "The randomness provider",
  "publicReview.forArtistsDetails.design.point.power":
    "Who can change what",
  "publicReview.forArtistsDetails.design.point.permanent":
    "What becomes permanent",
  "publicReview.forArtistsDetails.design.outro":
    "The goal is simple: every important choice should be visible before it becomes final.",
  "publicReview.forArtistsDetails.questions.title": "Questions for artists",
  "publicReview.forArtistsDetails.questions.intro":
    "These decisions are still worth discussing:",
  "publicReview.forArtistsDetails.questions.point.signature":
    "Which actions must need your signature?",
  "publicReview.forArtistsDetails.questions.point.shared":
    "Which actions should also need approval from the people who run Stream?",
  "publicReview.forArtistsDetails.questions.point.collaborators":
    "What should a collaborator be allowed to do?",
  "publicReview.forArtistsDetails.questions.point.recovery":
    "What recovery and estate process would you trust?",
  "publicReview.forArtistsDetails.questions.point.preservation":
    "What evidence would you need before freezing the work?",
  "publicReview.forArtistsDetails.questions.point.payments":
    "Which sale and payment settings should become permanent?",
  "publicReview.forArtistsDetails.questions.point.finality":
    "Would the finality process give you confidence, or add too much work?",
  "publicReview.rolesGuide.status.heading": "Start with status",
  "publicReview.rolesGuide.status.description":
    "Stream is still being prepared. A role may exist in the code without being active in the current rehearsal. Check the label before treating a power as available.",
  "publicReview.rolesGuide.status.working.title": "Working in rehearsal",
  "publicReview.rolesGuide.status.working.description":
    "Connected to the current rehearsal path.",
  "publicReview.rolesGuide.status.connected.title":
    "Connected for integration",
  "publicReview.rolesGuide.status.connected.description":
    "Connected to selected contracts, but not used by every current path.",
  "publicReview.rolesGuide.status.source.title": "Built in source",
  "publicReview.rolesGuide.status.source.description":
    "The code exists. Final accounts, settings, and release wiring are not proven.",
  "publicReview.rolesGuide.status.planned.title": "Planned",
  "publicReview.rolesGuide.status.planned.description":
    "The design is accepted. Complete code or wiring is still missing.",
  "publicReview.rolesGuide.status.open.title": "Still open",
  "publicReview.rolesGuide.status.open.description":
    "No final design decision has been made.",
  "publicReview.rolesGuide.current.heading":
    "Working in the current rehearsal",
  "publicReview.rolesGuide.current.description":
    "These are the main powers used by the current signed Drop and auction path.",
  "publicReview.rolesGuide.current.artist.title": "Artist",
  "publicReview.rolesGuide.current.artist.description":
    "Signs one exact collection state. The signature covers specific collection facts, not every later action.",
  "publicReview.rolesGuide.current.collector.title": "Collector",
  "publicReview.rolesGuide.current.collector.description":
    "Can mint with a valid signed permission, bid, withdraw, transfer, or burn when the current rules allow it.",
  "publicReview.rolesGuide.current.signer.title": "Stream sale signer",
  "publicReview.rolesGuide.current.signer.description":
    "Approves one exact fixed-price mint or auction. Changing the signer also changes the signer version, so old permissions stop working.",
  "publicReview.rolesGuide.current.admins.title": "Owner and administrators",
  "publicReview.rolesGuide.current.admins.description":
    "The owner assigns roles. A global administrator has broad power. A function administrator is limited to one named action on one contract.",
  "publicReview.rolesGuide.current.pause.title":
    "Pause and restart administrators",
  "publicReview.rolesGuide.current.pause.description":
    "A pause guardian can stop configured operations. A separate administrator decides when to restart them.",
  "publicReview.rolesGuide.current.anyone.title": "Anyone",
  "publicReview.rolesGuide.current.anyone.description":
    "Anyone may settle an auction after it ends. The winner and payment amounts come from contract state.",
  "publicReview.rolesGuide.inactive.heading":
    "Built but not active in the current path",
  "publicReview.rolesGuide.inactive.description":
    "These roles exist in source or selected integrations. They are not all used by the current signed sale path.",
  "publicReview.rolesGuide.inactive.mint.title": "Mint manager",
  "publicReview.rolesGuide.inactive.mint.description":
    "Can prepare and execute mints under policy and counter checks. The current signed Drop still uses the older mint route.",
  "publicReview.rolesGuide.inactive.revenue.title":
    "Revenue resolver and split contracts",
  "publicReview.rolesGuide.inactive.revenue.description":
    "Connect to selected parts of Stream. Current Drops and auctions still record sale credits inside their own contracts.",
  "publicReview.rolesGuide.inactive.governance.title": "Governance roles",
  "publicReview.rolesGuide.inactive.governance.description":
    "Separate roles can propose, cancel, veto, and execute delayed changes. Final accounts, targets, delays, and value limits are not yet bound.",
  "publicReview.rolesGuide.inactive.records.title": "Record writers",
  "publicReview.rolesGuide.inactive.records.description":
    "Code limits who may add each kind of record. Final record types, permission providers, and grants are not yet bound.",
  "publicReview.rolesGuide.inactive.modules.title":
    "Module and successor roles",
  "publicReview.rolesGuide.inactive.modules.description":
    "Code can record a replacement service while keeping the older service visible. The final module map and handover evidence are not yet proven.",
  "publicReview.rolesGuide.inactive.randomness.title": "Randomness roles",
  "publicReview.rolesGuide.inactive.randomness.description":
    "Code separates randomness setup and delivery. Live provider setup, funding, monitoring, and recovery remain unproven.",
  "publicReview.rolesGuide.future.heading": "Planned or still open",
  "publicReview.rolesGuide.future.description":
    "The ADRs describe these ideas. They must not be shown as protection that Stream already provides.",
  "publicReview.rolesGuide.future.revenueAdapter.title":
    "Revenue validation adapter",
  "publicReview.rolesGuide.future.revenueAdapter.description":
    "The design is accepted, but the complete adapter and matching resolver are not implemented in this snapshot.",
  "publicReview.rolesGuide.future.artistAdapter.title":
    "Artist identity adapter",
  "publicReview.rolesGuide.future.artistAdapter.description":
    "ADR 0022 proposes this check. It is not approved or implemented as a current protection.",
  "publicReview.rolesGuide.future.artistRecovery.title":
    "Artist authority and recovery",
  "publicReview.rolesGuide.future.artistRecovery.description":
    "Delegates, guardians, estates, sanctions, disputes, and recovery do not yet have a complete design.",
  "publicReview.rolesGuide.future.finalityRecovery.title":
    "Finality recovery record",
  "publicReview.rolesGuide.future.finalityRecovery.description":
    "ADR 0020 proposes a visible recovery record that keeps the original finality history. It is not implemented.",
  "publicReview.rolesGuide.outside.heading":
    "Responsibilities outside the contracts",
  "publicReview.rolesGuide.outside.description":
    "Smart contracts cannot control every part of Stream. These duties still depend on people and services.",
  "publicReview.rolesGuide.outside.community.title":
    "Community decisions and TDH",
  "publicReview.rolesGuide.outside.community.description":
    "Curation and TDH decisions happen outside the contracts before a sale permission is signed.",
  "publicReview.rolesGuide.outside.signing.title": "Signer security",
  "publicReview.rolesGuide.outside.signing.description":
    "People and services must protect signing keys, rotate them after a problem, and watch for unexpected permissions.",
  "publicReview.rolesGuide.outside.services.title":
    "Storage and public services",
  "publicReview.rolesGuide.outside.services.description":
    "Artwork storage, websites, browsers, RPC nodes, and indexers must remain available and show the correct data.",
  "publicReview.rolesGuide.outside.operations.title":
    "Deployment and incident response",
  "publicReview.rolesGuide.outside.operations.description":
    "Safe owners, deployment teams, and monitors need clear owners, recovery steps, and public evidence.",
  "publicReview.rolesGuide.outside.marketplaces.title": "Marketplaces",
  "publicReview.rolesGuide.outside.marketplaces.description":
    "Stream can report royalty information. A marketplace still decides whether to pay it.",
  "publicReview.rolesGuide.risks.heading": "Main risks",
  "publicReview.rolesGuide.risks.description":
    "A clear role name does not guarantee that the power is safe. Review the full action and its limits.",
  "publicReview.rolesGuide.risks.admin.title": "A role is too broad",
  "publicReview.rolesGuide.risks.admin.description":
    "A global or function role may reach more actions than people expect.",
  "publicReview.rolesGuide.risks.signer.title": "A signer is stolen or wrong",
  "publicReview.rolesGuide.risks.signer.description":
    "A stolen key or bad signing service may approve a sale the community did not choose.",
  "publicReview.rolesGuide.risks.pause.title": "A pause blocks safe exits",
  "publicReview.rolesGuide.risks.pause.description":
    "An emergency stop may also block refunds, withdrawals, settlement, or unfinished mints.",
  "publicReview.rolesGuide.risks.artist.title":
    "The artist approves less than the page suggests",
  "publicReview.rolesGuide.risks.artist.description":
    "The product may imply broad approval even when the signature covers only a small set of facts.",
  "publicReview.rolesGuide.risks.status.title":
    "Source code is mistaken for an active protection",
  "publicReview.rolesGuide.risks.status.description":
    "A control may exist in Solidity without being connected, configured, or ready for release.",
  "publicReview.rolesGuide.risks.successor.title":
    "Old and new services overlap",
  "publicReview.rolesGuide.risks.successor.description":
    "A replacement service may accept the same permission or responsibility as the service it replaces.",
  "publicReview.rolesGuide.questions.heading": "Questions for reviewers",
  "publicReview.rolesGuide.questions.description":
    "These decisions should be clear before deployment.",
  "publicReview.rolesGuide.questions.global":
    "Which broad administrator roles should end before launch?",
  "publicReview.rolesGuide.questions.delay":
    "Which changes need a public waiting period?",
  "publicReview.rolesGuide.questions.artist":
    "Which actions need approval from both the artist and Stream operators?",
  "publicReview.rolesGuide.questions.pause":
    "Can collectors still settle, withdraw, or receive refunds during a pause?",
  "publicReview.rolesGuide.questions.successor":
    "What public evidence is required before a replacement service becomes active?",
  "publicReview.rolesGuide.evidence.heading": "Check the detailed evidence",
  "publicReview.rolesGuide.evidence.description":
    "Use the development and governance pages to check the exact code status, open risks, and release evidence.",
  "publicReview.rolesGuide.evidence.readPage": "Read {page}",
  "publicReview.pages.overviewNarrative.title": "Overview",
  "publicReview.pages.overviewNarrative.summary":
    "An introduction to Stream and its public review for artists, collectors, and the wider community.",
  "publicReview.pages.artworkLifecycle.title": "Artwork Lifecycle",
  "publicReview.pages.artworkLifecycle.summary":
    "How an artwork moves from preparation through minting, preservation, and finality.",
  "publicReview.pages.forArtists.title": "For Artists",
  "publicReview.pages.forArtists.summary":
    "For artists considering or preparing to publish their work through Stream.",
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
