export const COLLECT_TDH_TARGET_MESSAGES = {
  "collect.tdhTarget.title": "Reach target TDH",
  "collect.tdhTarget.description":
    "Choose how much TDH you want and when. Compare your existing collection’s trajectory with purchases that could close the gap.",
  "collect.tdhTarget.target": "Target TDH",
  "collect.tdhTarget.timeframe": "Timeframe",
  "collect.tdhTarget.collection": "Collection to purchase",
  "collect.tdhTarget.advanced": "Advanced options",
  "collect.tdhTarget.interpretation": "Target definition",
  "collect.tdhTarget.total": "Total TDH at the end",
  "collect.tdhTarget.additional": "Additional TDH above my baseline",
  "collect.tdhTarget.additionalHint":
    "Your baseline includes the TDH your current holdings would gain during this timeframe.",
  "collect.tdhTarget.budget": "Maximum purchase budget (ETH)",
  "collect.tdhTarget.optionalBudget": "Optional",
  "collect.tdhTarget.budgetHint":
    "Leave blank to estimate the purchase budget needed. Gas is shown separately.",
  "collect.tdhTarget.find": "Find a purchase plan",
  "collect.tdhTarget.invalidTarget": "Enter a valid target TDH amount.",
  "collect.tdhTarget.invalidRecipient":
    "Choose one of this profile’s confirmed wallets to count these purchases toward its TDH.",
  "collect.tdhTarget.profileDelivery":
    "TDH is calculated across this profile’s confirmed wallets. A gift outside the profile adds no TDH to this target.",
  "collect.tdhTarget.checking":
    "Checking your collection and available listings…",
  "collect.tdhTarget.failed": "This target could not be checked. Try again.",
  "collect.tdhTarget.oneDay": "1 day",
  "collect.tdhTarget.deadline": "Projected TDH on {date} (UTC).",
  "collect.tdhTarget.baseline": "Without purchases",
  "collect.tdhTarget.projected": "With this purchase plan",
  "collect.tdhTarget.shortfall": "Additional TDH needed",
  "collect.tdhTarget.noPurchase": "No purchases needed",
  "collect.tdhTarget.noPurchaseDescription":
    "Your existing collection is projected to meet this target at the selected deadline.",
  "collect.tdhTarget.bestFound": "Best purchase plan found",
  "collect.tdhTarget.partial": "Closest purchase plan found",
  "collect.tdhTarget.remaining": "Remaining gap: {tdh} TDH",
  "collect.tdhTarget.purchaseSubtotal": "Estimated purchase subtotal",
  "collect.tdhTarget.gas": "Estimated gas",
  "collect.tdhTarget.gasAtReview": "Quoted at purchase review",
  "collect.tdhTarget.coverage":
    "Checked {orders} indexed listings; retained {candidates} eligible listing orders for this search.",
  "collect.tdhTarget.partialIndex":
    "This search did not cover the complete listing index.",
  "collect.tdhTarget.searchWork":
    "Evaluated {count} portfolios within a limit of {limit}.",
  "collect.tdhTarget.feesIncluded":
    "The purchase subtotal already includes {fees} in signed listing fees.",
  "collect.tdhTarget.reviewHint":
    "Prices and gas are refreshed before wallet confirmation. This TDH projection applies to the complete plan and selected delivery wallet; changing either requires a new projection.",
  "collect.tdhTarget.searchLimit":
    "This is the best plan found within the search coverage, not a proven market-wide minimum.",
  "collect.tdhTarget.noPlan":
    "No purchase plan found within the available listings and constraints.",
  "collect.tdhTarget.review": "Review purchase",
  "collect.tdhTarget.offer": "Plan offers for these artworks",
  "collect.tdhTarget.offerWallet":
    "Offers deliver to the paying wallet. Choose that wallet above and check the target again to plan offers with this projection.",
  "collect.tdhTarget.offerTiming":
    "Offers add TDH only if they fill. A later fill leaves less time to earn TDH; this purchase projection does not forecast offer fills.",
  "collect.tdhTarget.assumptions": "Projection assumptions and coverage",
  "collect.tdhTarget.quantity": "{quantity} editions",
  "collect.tdhTarget.oneEdition": "1 edition",
  "collect.tdhTarget.updated": "Snapshot at block {block} · Rules {version}",
  "collect.tdhTarget.stale":
    "This plan has changed or expired. Check the target again before continuing.",
} as const;
