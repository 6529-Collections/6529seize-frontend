export const PUBLIC_REVIEW_STREAM_DIAGRAM_MESSAGES = {
  "publicReview.diagram.formats.caption": "Three ways to represent artwork",
  "publicReview.diagram.formats.unique.title": "1/1",
  "publicReview.diagram.formats.unique.detail": "One artwork. One token.",
  "publicReview.diagram.formats.series.title": "1/1/x",
  "publicReview.diagram.formats.series.detail":
    "Distinct works in a series. One token for each work.",
  "publicReview.diagram.formats.edition.title": "Editions",
  "publicReview.diagram.formats.edition.detail":
    "Copies of one artwork. One token for each copy.",
  "publicReview.diagram.artist.caption":
    "Agreed but unfinished · separate artist decisions",
  "publicReview.diagram.artist.hub": "Your approval",
  "publicReview.diagram.artist.attribution.title": "Accept attribution",
  "publicReview.diagram.artist.attribution.detail":
    "Agree to be named as the artist.",
  "publicReview.diagram.artist.mint.title": "Approve minting",
  "publicReview.diagram.artist.mint.detail":
    "Authorize how tokens may be created.",
  "publicReview.diagram.artist.payment.title": "Approve payment changes",
  "publicReview.diagram.artist.payment.detail":
    "Consent to the economic changes that require your approval.",
  "publicReview.diagram.artist.finality.title": "Approve artwork finality",
  "publicReview.diagram.artist.finality.detail":
    "Accept exactly what becomes permanent.",
  "publicReview.diagram.artist.note":
    "Each approval needs a clear scope. These are separate decisions, not one blanket signature or a fixed sequence.",
  "publicReview.diagram.roles.caption": "Roles and the limits of their powers",
  "publicReview.diagram.roles.artist.title": "Artist",
  "publicReview.diagram.roles.artist.detail":
    "Attribution, mint consent, payment and finality approvals.",
  "publicReview.diagram.roles.artist.status": "Agreed but unfinished",
  "publicReview.diagram.roles.collector.title": "Collector",
  "publicReview.diagram.roles.collector.detail":
    "Own and transfer a token; burn only when Core permits.",
  "publicReview.diagram.roles.manager.title": "Mint manager",
  "publicReview.diagram.roles.manager.detail":
    "Mint policy and ledger logic exist; installation into Core is blocked.",
  "publicReview.diagram.roles.governance.title": "Governance executor",
  "publicReview.diagram.roles.governance.detail":
    "Supply the matching action, scope and state for governed changes.",
  "publicReview.diagram.roles.pause.title": "Pause authority",
  "publicReview.diagram.roles.pause.detail":
    "Stop operations that check its pause domain.",
  "publicReview.diagram.roles.guardian.title": "Finality guardian",
  "publicReview.diagram.roles.guardian.detail":
    "Veto a scheduled finality action under the registry rules.",
  "publicReview.diagram.roles.poster.title": "Sale poster",
  "publicReview.diagram.roles.poster.detail":
    "Receive the poster share and relevant auction return rights.",
  "publicReview.diagram.roles.poster.status": "Built · older sales",
  "publicReview.diagram.built": "Built in this code",
  "publicReview.diagram.roles.details": "Read the full role table",
  "publicReview.diagram.code.caption": "Two different mint paths",
  "publicReview.diagram.code.permanent":
    "Implemented parts · connection to Core blocked",
  "publicReview.diagram.code.policy.title": "Check mint policy",
  "publicReview.diagram.code.policy.detail": "Mint manager",
  "publicReview.diagram.code.ledger.title": "Record used claims",
  "publicReview.diagram.code.ledger.detail": "Mint ledger",
  "publicReview.diagram.code.core.title": "Create tokens",
  "publicReview.diagram.code.core.detail":
    "Permanent Core, via the manager’s executor library",
  "publicReview.diagram.code.orderNote":
    "This is the execution order in the implemented logic. The real manager and ledger cannot yet pass Core's installation checks. The ledger does not call Core.",
  "publicReview.diagram.code.legacy": "Built · older sale rehearsal",
  "publicReview.diagram.code.drops.title": "Drops",
  "publicReview.diagram.code.drops.detail": "Sale permissions",
  "publicReview.diagram.code.minter.title": "Old minter",
  "publicReview.diagram.code.minter.detail": "Legacy mint calls",
  "publicReview.diagram.code.helper.title": "Legacy Core",
  "publicReview.diagram.code.helper.detail": "Test helper in the rehearsal",
  "publicReview.diagram.code.unfinished": "Agreed but unfinished",
  "publicReview.diagram.code.unfinishedDetail":
    "Real module installation, artist consent, royalty activation, and the launch sale and payment connections to permanent Core.",
  "publicReview.diagram.code.proposed": "Still proposed",
  "publicReview.diagram.code.proposedDetail":
    "ADR 0019 payment orchestration and ADR 0023 artist architecture.",
  "publicReview.diagram.code.details": "Read the full component notes",
  "publicReview.diagram.payment.caption": "Built · older ETH sale contracts",
  "publicReview.diagram.payment.pay.title": "Buyer pays ETH",
  "publicReview.diagram.payment.pay.detail": "Fixed-price sale or auction",
  "publicReview.diagram.payment.credit.title": "Sale records credits",
  "publicReview.diagram.payment.credit.detail":
    "Poster, protocol and curator reserve",
  "publicReview.diagram.payment.withdraw.title": "Recipients withdraw",
  "publicReview.diagram.payment.withdraw.detail":
    "Withdrawal and recovery limits are explained below",
  "publicReview.diagram.payment.separate":
    "Built separately · settlement and split wallets",
  "publicReview.diagram.payment.separateDetail":
    "The older sales do not route through this system. The complete sale connection remains unfinished.",
  "publicReview.diagram.finality.caption":
    "Built · permanent Core · required order",
  "publicReview.diagram.finality.close.title": "Close minting",
  "publicReview.diagram.finality.close.detail": "No new tokens. Cannot reopen.",
  "publicReview.diagram.finality.burn.title": "Block burns",
  "publicReview.diagram.finality.burn.detail":
    "Stop token destruction permanently.",
  "publicReview.diagram.finality.freeze.title": "Freeze Core",
  "publicReview.diagram.finality.freeze.detail":
    "After burns are blocked; the same transaction is allowed once governance conditions are met.",
  "publicReview.diagram.finality.wider":
    "Wider artwork finality · separate checks",
  "publicReview.diagram.finality.widerDetail":
    "Registry logic exists, but its Core installation is blocked. Complete component coverage and artist approval remain unfinished.",
  "publicReview.diagram.finality.preserve": "Preservation · ongoing work",
  "publicReview.diagram.finality.preserveDetail":
    "Keep usable copies, software and recovery instructions. Freezing Core does not keep files online.",
} as const;
