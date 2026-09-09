export const PUBLIC_REVIEW_ENTRY_GUIDE_MESSAGES = {
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
  "publicReview.pages.startHere.markdown": `The goal is to keep the artwork and its history clear even as the tools around it change.

**This candidate is under community review. Its published review record says it is not deployed and its independent audit is still ahead.**

## What kinds of art can it support?

The reviewed contract can represent these formats:

| Format | A simple example |
| --- | --- |
| **1/1** | One artwork with one token. |
| **1/1/x** | A series of distinct works, each with its own token—for example, 100 different outputs from one artwork program. |
| **Editions** | Multiple copies of an artwork, each represented by its own token—for example, an edition of 50. |

Editions are not restricted to The Memes. Stream's collection system can represent other artwork too. Work may use images, animation, video, audio, code, or a combination.

These examples describe what the contract can represent. **The formats and publishing process offered at launch still need to be confirmed.** Collection creation currently requires an approved account; this review is not an open publishing service.

## How does a release work?

An artwork needs a release plan: the work itself, token supply, sale terms, and who receives the money. Community selection, where used, happens outside the contracts.

In the reviewed sale path, an approved Stream signer authorizes exact mint or auction terms. Someone submits that permission, and the contracts check it before creating the token or starting the auction. Collectors can then hold or transfer their tokens under the applicable rules.

Artist consent is central to the intended design. The current collection signature records an artist's approval of particular facts, but **it does not itself stop minting when that approval is missing or outdated**. Stronger approval rules remain work to complete.

## What lasts?

Stream keeps token identities and history. It also has separate steps for ending minting, locking defined artwork data, and recording preservation evidence.

Those steps must be described precisely. A token can exist while its artwork is still waiting for a random result. A frozen record can point to a file stored elsewhere. A record of a file cannot keep that file online by itself.

## Choose what you want to understand

- [**For artists:** your work, choices, approvals, and payments.](/reviews/6529-stream/for-artists)
- [**For collectors:** what you receive, how buying works, and what can change.](/reviews/6529-stream/for-collectors)
- [**Review the code:** the exact candidate, its contracts, evidence, and open gaps.](/reviews/6529-stream/review-the-code)

## Help shape it

What would make you comfortable releasing or collecting an artwork through Stream? Which promise is unclear or missing?

[Read how to give feedback.](/reviews/6529-stream/community-review)`,
  "publicReview.pages.artistEntry.title": "Stream for artists",
  "publicReview.pages.artistEntry.summary":
    "Stream's goal is to give your artwork a lasting identity and a clear record of how it is released, paid for, and preserved.",
  "publicReview.pages.artistEntry.markdown": `**This guide describes the candidate under review. It is not a live publishing service.**

## Decide what you are releasing

Your plan should identify the artwork, its files, its license, and its supply. Is it one unique work, a series of distinct works, or an edition? If code generates the art, which code and inputs are needed to recreate it?

The contract can represent these formats, including editions outside The Memes. The launch team still needs to confirm which publishing flows will be offered and how artists are selected.

You should be able to review one readable plan showing:

- The exact artwork and every file or program it needs.
- How many tokens may exist and who may mint them.
- The sale method, price or auction terms, and payment recipients.
- Who can change the work or its settings, and when those powers end.

## Know what your approval covers

The intended design gives artists a say in important release decisions. An approval should show you the actual facts before asking for a signature.

The reviewed code currently records a signature for one particular collection state. If that state changes, the old signature no longer describes it. However, the minting paths do not require that signature to be current—or present—before minting.

**Signing the collection state is not the same as approving every sale, payment split, or later change.** Wider artist-permission checks still need to be completed and verified.

For review, ask which actions must require your approval and how the screen will explain each one.

## Understand who gets paid

The current signed sales use ETH. They record money owed to the named sale poster, protocol, and curator reserve. Recipients collect their balances later. One failed withdrawal does not erase the amount owed.

The sale poster is not automatically the artist. The release plan must explain who that account represents and how your share reaches you.

The code also contains a separate system for fixed recipient lists and payment shares. Current signed sales do not use it. Collaborator payments therefore need a confirmed launch path; the presence of split-wallet code alone is not enough.

For later marketplace sales, Stream reports royalty information. The marketplace decides whether to pay it.

[Explore payments and royalties.](/reviews/6529-stream/revenue-splits-and-royalties)

## Decide what can change—and what should become permanent

Before the relevant locks, authorized accounts can change some artwork data and settings. Your review should identify those accounts and the limits on their powers.

Ending minting, freezing Core data, adding preservation records, and finalizing the wider artwork are separate steps. Finality includes a waiting period and a guardian who can stop the scheduled action. Reviewers still need to prove that every intended artwork-changing route is covered.

Before an irreversible step, the package should contain the files, any required software, and instructions that another person can actually use. A matching file fingerprint proves that a recovered copy is correct; it cannot recover a missing file.

[Explore permanence and preservation.](/reviews/6529-stream/freezing-preservation-and-artwork-finality)

## What would work for your practice?

- Which decisions must always need your approval?
- What should collaborators, delegates, or an estate be allowed to do?
- What would you need to see before making the artwork permanent?

Recovery, delegation, and estate arrangements are still open design work. Your real studio workflow is useful evidence for this review.

[Give feedback](/reviews/6529-stream/community-review) · [Back to the introduction](/reviews/6529-stream)`,
  "publicReview.pages.collectorEntry.title": "Stream for collectors",
  "publicReview.pages.collectorEntry.summary":
    "When considering a Stream artwork, you should be able to understand what you receive, how the sale works, and what can still change afterward.",
  "publicReview.pages.collectorEntry.markdown": `**This guide describes the candidate under review. Its published review record says it is not deployed and its independent audit is still ahead.**

## Know the artwork you would receive

Stream can represent a single work, a series of distinct works, or an edition. Each token has its own identity and a recorded link to its collection. Editions are not limited to The Memes.

Before a sale, the artwork page should make these facts easy to find:

- The artist, artwork, format, and license.
- The supply limit, how many tokens have been created, and whether more can be minted.
- The exact token or kind of output you will receive.
- Whether the artwork is complete or still waiting for a random result.
- Where its files live and who can still change relevant data.

These are requirements for the intended experience, not a claim that every launch screen already exists.

## Understand the sale

The reviewed signed sale paths use ETH.

For a fixed-price mint, the approval names the price, the wallet that pays, and the wallet that receives the token. Those wallets may be different—for example, when buying a gift. A valid free claim requires no payment, but still fixes the recipient and artwork details.

For an auction, the auction contract holds the token while people bid. After bidding ends, someone must submit the settlement transaction. That person cannot choose a different winner or price.

## Know where your bid and refund go

The current highest bid stays in the auction until a higher bid replaces it or the auction settles.

If you are outbid, the contract records a refund for you to withdraw. **The refund is not sent automatically.** If your withdrawal fails, the recorded balance remains available.

An auction cannot be cancelled after its first valid bid. Late bids can extend its end time. The reviewed code also allows an administrator to change shared bid-increase and extension settings during an active auction. Whether those rules should instead be fixed at the start is an important review question.

[Explore buying, bidding, and refunds.](/reviews/6529-stream/fixed-price-sales-and-auctions)

## Understand what can change after minting

Token ownership, artwork completion, and permanent artwork locks are different facts.

The current artist signature records approval of particular collection facts. Minting does not itself prove that the artist approved every part of the release plan; stronger consent checks are still work to complete.

Some generative work may be waiting for randomness. Retrying a failed save uses the same accepted result, but unresolved requests can leave the work unfinished. Recovery rules still need review.

Some artwork data remains changeable until the relevant locks are applied. Supply closure and full artwork finality also have unresolved gaps in this candidate. A single “finished” badge would hide these distinctions.

## Consider long-term access

A file stored outside Ethereum depends on people or services keeping it available. Even preserved code may need a particular browser, library, or other software to display correctly.

Look for a clear list of required files, working copies, and instructions for opening or recreating the artwork. A stored fingerprint helps check a copy; it does not keep that copy online.

[Explore artwork storage](/reviews/6529-stream/metadata-scripts-and-dependencies) · [Explore permanent locks](/reviews/6529-stream/freezing-preservation-and-artwork-finality)

## What would you want answered before collecting?

- Which facts must be visible before you buy or bid?
- Which rules should never change once a sale starts?
- What would give you confidence that you can still access the artwork years later?

[Give feedback](/reviews/6529-stream/community-review) · [Back to the introduction](/reviews/6529-stream)`,
  "publicReview.pages.codeEntry.title": "Review the Stream code",
  "publicReview.pages.codeEntry.summary":
    "Start with the exact candidate, the paths it actually connects, and the claims those paths are meant to support.",
  "publicReview.pages.codeEntry.markdown": `This review covers **2026-08-01.1**, pinned to source **513bd7e079eafe109df6ae1ae21bfbca6fec6786**. Its publication record marks the candidate as not deployed and pre-audit. Later repository changes are outside this snapshot.

[Open the pinned source](https://github.com/6529-Collections/6529Stream/tree/513bd7e079eafe109df6ae1ae21bfbca6fec6786) · [Open the generated technical reference](/reviews/6529-stream/reference)

## Start with the actual connections

The Core is the shared ERC-721 contract that keeps collection and token identities, ownership, supply, and defined freeze rules.

The reviewed setup has important parallel paths:

| Area | Current connection |
| --- | --- |
| Signed sales | \`StreamDrops\` checks the authorization. Fixed-price mints and current auctions use \`StreamMinter\`. |
| Manager minting | \`StreamMintManager\` and \`StreamMintLedger\` provide a separate phase, gate, counter, and batch path connected to Core. Signed sales do not use it. |
| Payments | Drops and Auctions keep local credits. Separate resolver, settlement, and split-wallet contracts exist but do not settle those current sales. |
| Artwork and authority | Randomness, metadata, preservation, finality, and governance have separate contracts and permissions. Code presence does not establish complete launch wiring. |

Trace each supported route end to end. Do not attribute one route's checks to another.

## Check the most consequential claims first

**Artist consent:** the current collection-state signature is evidence, not a condition enforced by the minting paths. Compare intended consent rules with every caller that can mint or change protected facts.

**Supply and replay:** test both minting paths together, failed batches, reused permissions, burns, and replacement managers. An empty collection's supply can be reopened after \`setFinalSupply\` while it remains unfrozen.

**Money and auctions:** trace credits, refunds, reserves, and withdrawals. Examine active-auction setting changes and the missing payment-token binding in the separate settlement replay key.

**Randomness and permanence:** test provider changes while results are unfinished, same-seed recovery, missing artwork files, and alternate writers or modules that could bypass the claimed finality boundary.

[Read the detailed development status and known limitations.](/reviews/6529-stream/security-testing-and-known-limitations)

## Follow claims to evidence

The technical reference contains the source inventory, callable declarations, retained evidence, risk register, governed parameters, and documentation gaps. Use the topic chapters for reasoning and their pinned links for verification.

Keep three things distinct: behavior implemented in this code, accepted design still awaiting completion, and proposals that remain open. Connection, deployment, live-service testing, and independent audit require their own evidence.

Local tests do not establish the real launch roles, provider funding, marketplace behavior, or long-term artwork access.

## Leave a finding someone can act on

Identify the claimed rule, exact code, required conditions, and call sequence. Explain the result and who it affects. Include a reproducer or test when possible, and separate demonstrated behavior from assumptions.

Use the review's current reporting instructions for sensitive findings. Report an unclear product promise too: it can lead users to trust protection the code does not provide.

[How to report a finding](/reviews/6529-stream/community-review) · [Public feedback](/reviews/6529-stream/feedback) · [Back to the introduction](/reviews/6529-stream)`,
} as const;
