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
  "publicReview.pages.artworkLifecycle.currentSummary":
    "This page is for artists, collectors, and people reviewing Stream. It explains how a Stream artwork moves from setup to its final state. No contract knowledge is needed.",
  "publicReview.pages.artworkLifecycle.currentIntro":
    "## The lifecycle in one minute\n\nA Stream artwork is built step by step.\n\nFirst, the collection gets a permanent identity in the Core. The Core is the shared home for all Stream tokens. Next, the artwork files, minting rules, payments, and other details are added. The artwork can then be minted or sold.\n\nLater, supply can close, key details can be locked, and preservation records can be added. Only then can the artwork reach its final state.\n\nMinted, sold, frozen, preserved, and final are different stages. This page explains what each stage means and why it matters.",
  "publicReview.pages.artworkLifecycle.currentIdentitySection": `## 1. The collection gets a permanent identity

### What happens

Before anything is minted or sold, Stream gives the collection a permanent ID in the Core.

The ID stays the same even if the collection later uses a different minting or sale tool.

### Who creates it

An account with permission to create collections starts it. Stream then records the artist, supply limit, purchase limit, and the wait before supply can become final.

### What the current contract records

The Core stores the collection ID and its basic information. Each token later receives:

- one ID across all Stream tokens; and
- one serial number inside its collection.

**Why this matters:** The artwork keeps one clear identity even when the tools around it change.

### Technical details

The Core is the shared ERC-721 NFT contract. [\`StreamCore.createCollection\`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L336) creates the collection. [\`setCollectionData\`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamCore.sol#L379) stores its artist and supply settings.`,
  "publicReview.pages.artworkLifecycle.currentArtworkPackageSection": `## 2. The artwork package is prepared

### What happens

A Stream artwork is more than an image. Its package can include:

- artwork files, such as images, animation, and code;
- details, such as its name, traits, and collection;
- supply, minting, and sale rules;
- payment details;
- randomness rules, if the artwork uses them; and
- preservation and final-state records.

### Who controls each part

Different records can have different approved writers. For example, an artist controls an artist statement. An independent institution can add preservation evidence.

### What stays permanent

The token’s identity stays in the Core. Other tools, such as a display module or randomness service, may need a replacement years later.

The current contracts keep these parts separate and restrict who may write each kind of record.

**Why this matters:** A tool can be replaced without giving the artwork a new identity.

### Technical details

Display, sale, randomness, and preservation features can live in separate modules. Record-family checks keep artist, owner, institution, observer, rights, and archive records with their approved writers.`,
  "publicReview.pages.artworkLifecycle.currentArtistApprovalSection": `## 3. The artist can sign the current setup

### What happens

The artist can sign one exact snapshot of the collection.

That snapshot includes:

- the artist’s wallet;
- collection information, scripts, and dependencies;
- current live supply and token metadata;
- randomness settings; and
- purchase, supply, and final-supply settings.

A successful mint changes the live supply and token metadata. The old signature then stops matching the current snapshot.

### Who decides

Only the recorded artist can approve the snapshot. The artist can sign directly or provide a signed message that another account submits.

### What the current contract does

The contract stores the approved snapshot and can report whether it still matches the current state.

This signature is evidence only. The minting paths do not check it. A missing or outdated signature does not pause or stop minting.

### How this differs from the ADR design

This snapshot signature is not the mint-policy approval required by the accepted design. That separate approval is explained in the next section.

**Why this matters:** People can see what the artist signed without mistaking the signature for permission to mint.

### Technical details

The current snapshot signature uses EIP-712. It is tied to the chain and Core contract. It supports ordinary wallets and ERC-1271 smart-contract wallets. The snapshot includes the collection-freeze manifest hash, which changes when live supply or live token metadata changes.`,
  "publicReview.pages.artworkLifecycle.currentDistributionSection": `## 4. The minting rules are chosen

### What happens

Before collectors can mint, rules are set for:

- the type of release;
- its opening and closing time;
- who may mint;
- the price; and
- supply and wallet limits.

### Who decides

Accounts with the required Stream roles configure the current contracts.

The accepted design adds an artist check. For an artist-bound collection, the artist must approve the mint policy or give someone limited signed permission to act for them.

An ADR, or Architecture Decision Record, is an accepted design decision. It describes the target design, which may be ahead of the reviewed code.

The artist permission must be checked before every mint. The same permission can cover later mints while the policy stays the same. A new permission is needed when the policy changes.

The reviewed contracts do not yet enforce this artist-permission check.

### What the current contracts check

The reviewed code has two separate minting paths:

- The signed-drop and auction path checks its own sale time and supply rules.
- The manager path checks phases, approved executors, optional access gates, policy details, and usage limits.

The paths do not share every check or counter. Each path must be reviewed on its own.

**Why this matters:** Minting tools can change without changing the token’s permanent identity, but every path must enforce the right limits.

### Technical details

The signed-drop and auction path uses [\`StreamMinter\`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMinter.sol). The manager path uses [\`StreamMintManager\`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMintManager.sol) and [\`StreamMintLedger\`](https://github.com/6529-Collections/6529Stream/blob/513bd7e079eafe109df6ae1ae21bfbca6fec6786/smart-contracts/StreamMintLedger.sol). The Core keeps the token identity while these outside modules apply minting policy.`,
  "publicReview.pages.artworkLifecycle.currentCurationSection": `## 5. The selected drop receives signed approval

### What happens

The community process applies its curation rules outside the blockchain. These rules may use TDH, which means Total Days Held. TDH measures how long eligible assets have been held.

A service then prepares the exact sale details. An approved signer signs them. The signer is a wallet trusted to approve the result.

### Who decides

The community process chooses the artist, calculates TDH, and applies its fairness rules. The signer approves the exact action created from that result.

The contract does not choose the artist, calculate TDH, or decide whether the result is fair.

### What the current contract checks

The signed approval fixes:

- the blockchain and Stream contract;
- the collection and artwork;
- who pays and who receives the token;
- the fixed price or starting auction terms;
- when the approval expires; and
- a unique ID that prevents reuse.

Before the sale starts, the contract checks the signer and every signed detail. Changing the artwork, buyer, price, sale type, or deadline makes the approval invalid.

In this path, one approval covers one token. After a successful use, it cannot be used again.

**Why this matters:** The contract can only start the sale with the terms that were approved.`,
  "publicReview.pages.artworkLifecycle.currentMintExecutionSection": `## 6. The mint completes fully or not at all

### What happens

The chosen minting path checks its rules and asks the Core to create the token.

### What each path checks

**Signed-drop and auction path**

- The drop contract checks the signed approval, sale details, and any required payment.
- The minter checks that minting is not paused, the minting window is open, and enough supply remains.
- The Core applies its own collection and token checks.

**Manager path**

- The manager checks the active phase, approved executor, optional access rules, expected policy, and quantity.
- The ledger records the limits used by that path.
- The manager and Core prepare and complete the token in the same transaction.

These paths do not use the same approval or counters.

### What happens if a check fails

All checks and changes happen in one blockchain transaction. If a check fails, the whole transaction is cancelled:

- no token is created;
- supply does not change;
- the signed-drop approval stays unused, if that path was used;
- manager counters return to their earlier values, if that path was used; and
- no payment credit is recorded, if that path creates one.

If the transaction succeeds, the token and the records for that path update together.

### Missing ADR check

The accepted design also requires valid artist permission for an artist-bound collection. The reviewed contracts do not yet enforce that check.

**Why this matters:** A collector cannot receive a half-finished mint.`,
  "publicReview.pages.artworkLifecycle.currentTokenIdentitySection": `## 7. The minted token gets a permanent ID

### What happens

When a mint succeeds, the Core gives the token two numbers:

- a global ID across all Stream tokens; and
- a serial number inside its collection.

Both numbers stay with the token for its full history.

### What happens if the token is burned

Stream keeps two supply counts:

- **Minted ever:** every token successfully minted, including burned tokens.
- **Live supply:** tokens that have not been burned.

Burning removes the token from current ownership and lowers the live supply.

It does not lower the minted-ever count or make room for a replacement mint.

The token’s ID, collection link, serial number, and burn record remain stored. Its ID is never reused.

**Why this matters:** Burning a token does not erase its history or change the identity of other tokens.

### Technical details

The Core stores the collection ID and collection serial directly for each token. It does not calculate them from the token ID. This matches the accepted ADR design.`,
  "publicReview.pages.artworkLifecycle.currentRemainingSections": `## 8. Randomness is requested and recorded

### What happens

If an artwork uses randomness, minting starts a request. The request is tied to the collection, token, provider, and provider version.

The request can be:

- **Waiting:** the provider has not answered yet.
- **Complete:** the final value was accepted.
- **Stale:** the old provider version can no longer finish it.
- **Processing failed:** the provider answered, but the Core could not save the result.

### What the current contracts record

The contracts keep the request ID, times, final seed, a hash of the provider result, any failure hash, and the retry count.

If saving the result fails, a retry uses the same saved seed. It does not ask for a new random value.

**Why this matters:** A technical retry cannot become a hidden redraw.

### Technical details

The provider version is called an **epoch**. It lets Stream separate requests made before and after a provider change. A hash helps prove that later data matches the original result without storing all of that result onchain.

## 9. Metadata describes the artwork

### What happens

Apps and marketplaces use \`tokenURI\` to read a token's artwork description.

The current renderer can combine:

- collection details;
- scripts and dependencies;
- token data, images, and traits; and
- randomness, when the artwork uses it.

### What can still be incomplete

A \`tokenURI\` does not prove that every part is ready or preserved.

- Randomness may still be waiting.
- An image or other file may be stored elsewhere and become unavailable.
- A script may need a browser or dependency that no longer works.
- A hash can prove that retrieved bytes are correct, but it cannot keep those bytes available.

The accepted ADR design adds clear pending and final metadata states. It also requires the final freeze record to identify every input needed to display the work.

**Why this matters:** A useful artwork record must explain both what the token says and what is needed to display it.

## 10. Sale money becomes balances to withdraw

### What happens

A sale records how much each recipient is owed. Recipients withdraw their money later.

This means one recipient that cannot accept a payment does not block the sale for everyone else.

### What the current contracts record

The current fixed-price path records balances for the account that starts the sale, the protocol, and the curator reserve. The auction path records balances for the same groups and for bidder refunds.

Every recorded balance must be backed by money held by the contract. Emergency withdrawal can use only extra money that is not owed to anyone.

The repository also contains newer revenue modules for clearer split rules and supported assets. The current sale paths do not use those modules everywhere yet.

**Why this matters:** A completed sale cannot lose track of who is owed money, and one failed withdrawal cannot block other people.

### Technical details

The ADRs call money owed by a contract a **liability**. A pull payment means the contract records that liability first and the recipient withdraws it in a separate transaction.

## 11. An auction ends once

### What happens

When an auction starts, the auction contract holds the token. Each new highest bid replaces the previous leader. The previous bidder receives a balance they can withdraw.

After the auction ends, anyone can trigger settlement.

### Possible outcomes

- **A winning bid:** the winner receives the token and the sale balances are recorded.
- **No bids:** the token normally returns to the account that started the auction. If that account is another contract, it can use a separate claim path.
- **Cancellation:** this is allowed only before the first bid and before the auction ends.

Each outcome is terminal. This means the auction cannot settle, transfer, refund, or cancel a second time.

**Why this matters:** The same token or payment cannot be handled twice.

## 12. Burning affects more than ownership

Section 7 explained that burning does not erase a token's ID. It also affects other parts of the artwork record.

### What the current contracts do

- The owner and live token are removed.
- Live supply falls, but minted-ever supply does not.
- The token ID, collection link, serial number, and burn record remain.
- \`tokenURI\` is no longer available for the burned token.
- A later valid randomness answer can be kept for audit, but it cannot bring the token back.
- Existing sale, payment, and preservation history remains separate from ownership.

The accepted burn-to-mint design also requires a burned token ID to be usable only once as proof for a later claim.

**Why this matters:** Future readers can tell the difference between a token that never existed and one that was minted and later burned.

## 13. Supply closes

### What happens

After minting ends and the required wait passes, an authorized Stream account can close supply.

The current Core sets the maximum supply to the number minted so far. Burned tokens still count because supply closure uses minted-ever history. If nothing was minted, supply closes at zero.

### What closes

Every mint path must eventually ask the Core for the next collection serial. After supply closes, the Core has no serial left to give. It rejects any later attempt to create a token, whether the request comes through an old mint phase, signed approval, or auction registration.

Supply closure does not freeze scripts, metadata, or other artwork details. That happens in later stages.

### Difference from the ADR design

The final supply is visible in current contract state. The accepted design also expects a clear closure event. The current \`setFinalSupply\` function does not emit its own supply-closed event.

**Why this matters:** The collection's final edition size cannot grow later.

## 14. The Core is permanently frozen

### What happens

\`freezeCollection\` first makes supply final and saves a hash of the frozen Core state. The Core then rejects changes inside that boundary.

The freeze stops:

- new mints and burns;
- changes to the artist snapshot approval;
- changes to the randomness module; and
- covered collection and live-token metadata changes.

### What can still happen

Collectors can still transfer their tokens. New preservation evidence can also be added in its separate record system.

Core freeze is not the same as full artwork finality. It locks the permanent Core boundary. Section 16 explains the later finality ceremony across the wider artwork record.

**Why this matters:** People can see exactly which permanent data has stopped changing without assuming that every part of the artwork is already final.

## 15. Preservation records can still be added

### What happens

Approved writers can add preservation records for files, storage locations, manifests, signatures, and other evidence.

These records are append-only. A new record does not delete an older one. A separate pointer only makes the newest record easier to find.

Preservation records stay open after the Core is frozen. This lets a future archive add recovery information without rewriting the artist's earlier record.

### What a hash cannot do

A hash can prove that a file matches an earlier commitment. It cannot keep the file online.

The accepted ADR design therefore also expects the actual files in independent storage, plus enough runtime information to open or run the artwork. The current contract records evidence of preservation. It cannot by itself guarantee that an outside storage service stays available.

**Why this matters:** Long-term preservation needs both proof and access to the real artwork materials.

## 16. Artwork finality is the last ceremony

### What happens

A finality proposal records the exact artwork package to be made final. It also sets a waiting period and an expiry time.

Before execution, the current registry checks that:

- the collection status is closed;
- burning is blocked;
- the Core is frozen;
- the exact proposed record still matches; and
- the required content and the correct artist approval or platform record are present.

Before the waiting period ends, a guardian can veto the proposal. An administrator can cancel it any time before it is executed or expires. If the execution window ends, the proposal expires.

A cancelled or expired proposal can be scheduled again. A new artist approval is needed when the artist-signed finality record changes. The same unchanged record does not automatically need a new signature.

After execution, the covered artwork state is final. Append-only preservation evidence can still be added without changing that final artwork package.

**Why this matters:** Everyone gets time to inspect the exact irreversible action before it happens.

## 17. Replaceable modules can have successors

### What happens

Some tools around the artwork may become old or stop working. This can include a renderer, storage route, or randomness provider.

The accepted design replaces such a module with a new version. It does not silently edit the old contract. The old version remains readable, while the successor handles clearly assigned future work.

A successor cannot rewrite the token's Core identity or any frozen artwork commitment.

### What a safe change must explain

- Which future actions move to the successor?
- Which pending jobs and money stay with the old module?
- Can both versions act at the same time?
- How do signatures, counters, and replay protection work across the change?
- Which old commitments remain binding?

The current module system exposes a module type, version, schema hash, and link to the module it replaces. Signatures for an old contract do not automatically become valid in a new one.

**Why this matters:** Stream can replace aging tools without changing the artwork's permanent identity or hiding its history.

## What collectors should be able to see

The product should show:

- whether randomness is still waiting;
- whether metadata is complete;
- whether supply is closed;
- whether the Core is frozen;
- which preservation package applies;
- whether artwork finality has happened; and
- which replaceable module version is current.

These are separate facts. For example, frozen does not also mean preserved or final.

## Technical review checklist

Reviewers should test what happens when:

- a collection starts with the wrong artist, supply, or module;
- signed details are changed, copied, expired, or reused;
- a failed mint leaves a token, counter, approval, or payment changed;
- mint paths together exceed the intended supply;
- randomness is delayed, fails, or is redrawn during recovery;
- metadata has a correct hash but missing or unusable files;
- money owed by a contract is missing or cannot be withdrawn;
- burning erases history or wrongly opens new supply;
- supply closes but one mint path still works;
- Core freeze leaves another change path open;
- finality executes a different record from the reviewed proposal; or
- a successor duplicates authority, pending work, money, or replay state.

## Questions for reviewers

1. Is the purpose of each stage clear?
2. Which changes need artist approval?
3. Which failures should undo the whole transaction, and which need a visible recovery state?
4. Are supply closure, Core freeze, preservation, and artwork finality clearly separate?
5. Which burn and history records must remain readable forever?
6. What evidence must exist before finality can be scheduled?
7. What must be proven before a successor becomes active?`,
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
  "publicReview.development.heading": "Is Stream ready to launch?",
  "publicReview.development.answer": "Not yet.",
  "publicReview.development.summary":
    "Stream has working contracts and many tests. But important safety checks are still missing.",
  "publicReview.development.beforeLaunch":
    "Before launch, Stream still needs:",
  "publicReview.development.beforeLaunch.audit":
    "An independent security audit.",
  "publicReview.development.beforeLaunch.liveTesting":
    "Testing with real services and marketplaces.",
  "publicReview.development.beforeLaunch.launchSetup":
    "A final, verified launch setup.",
  "publicReview.development.beforeLaunch.blockers":
    "All serious release blockers resolved.",
  "publicReview.development.pagePurpose":
    "This page explains what works, what is still uncertain, and what must happen before Stream can launch.",
  "publicReview.development.lastChecked": "Last checked",
  "publicReview.development.openBlockers": "Open release blockers",
  "publicReview.development.editorial.scopeHeading":
    "What this review covers",
  "publicReview.development.editorial.scopeSummary":
    "Stream was not live when this review was created, and no Stream contracts held funds.",
  "publicReview.development.editorial.progress.heading":
    "How we describe progress",
  "publicReview.development.editorial.progress.intro":
    "We track two separate things:",
  "publicReview.development.editorial.progress.built":
    "What has been built.",
  "publicReview.development.editorial.progress.proof":
    "What proof exists that it is safe and ready.",
  "publicReview.development.editorial.progress.caveat":
    "A progress label shows how far the work has moved. It does not mean Stream is ready to launch.",
  "publicReview.development.editorial.progress.labelHeading": "Label",
  "publicReview.development.editorial.progress.meaningHeading":
    "What it means",
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
  "publicReview.development.editorial.code.missingLabel":
    "What is missing:",
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
  "publicReview.development.editorial.code.minting.heading":
    "Minting rules",
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
  "publicReview.development.editorial.plan.plannedLabel":
    "What is planned:",
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
  "publicReview.development.editorial.plan.roles.heading":
    "Exact launch roles",
  "publicReview.development.editorial.plan.roles.planned":
    "The launch design lists 37 roles. Each must be connected to exact accounts or contracts, allowed actions, scopes, delays, and removal rules.",
  "publicReview.development.editorial.plan.roles.reason":
    "The launch team and reviewers can see exactly who can do what.",
  "publicReview.development.editorial.plan.roles.missing":
    "The final launch candidate has not yet proven all 37 role assignments and limits.",
  "publicReview.development.editorial.plan.boundary":
    "\"Accepted plan\" means the direction is agreed. It does not mean the work is built, connected, tested, or ready for launch.",
  "publicReview.development.editorial.open.heading": "Not final",
  "publicReview.development.editorial.open.intro":
    "These are proposals or later-version ideas. They are not launch features.",
  "publicReview.development.editorial.open.proposalLabel":
    "What is proposed:",
  "publicReview.development.editorial.open.missingLabel":
    "What is missing:",
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
  "publicReview.development.editorial.proof.heading": "What counts as proof",
  "publicReview.development.editorial.proof.intro":
    "Not all proof tells us the same thing. Each step answers a different question.",
  "publicReview.development.editorial.proof.adrBoundary":
    "ADR means Architecture Decision Record. It records a design or proposal; it does not prove that the design is built or ready to launch.",
  "publicReview.development.editorial.proof.proofHeading": "Proof",
  "publicReview.development.editorial.proof.meaningHeading":
    "What it tells us",
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
