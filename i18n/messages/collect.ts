export const COLLECT_MESSAGES = {
  "collect.tdhDaily.recalculate": "Recalculate",
  "collect.tdhDaily.resultTitle": "Daily TDH purchase plan",
  "collect.tdhDaily.shortfall":
    "The best basket found is {value} base TDH/day short of your target.",
  "collect.tdhDaily.more": "Show more listings ({count} remaining)",
  "collect.tdhDaily.personal": "Your profile’s boost effect",
  "collect.tdhDaily.boost": "Profile boost",
  "collect.tdhDaily.boostChange": "{before}× → {after}×",
  "collect.tdhDaily.personalRate": "Profile’s boosted daily TDH",
  "collect.tdhDaily.rateChange": "{before} → {after} TDH/day",
  "collect.tdhDaily.existingStock": "Change to existing accumulated TDH",
  "collect.tdhDaily.stockExplanation":
    "The profile calculation includes your existing holdings and set boosts. Accumulated TDH is separate from the daily earning rate.",
  "collect.tdhDaily.limit":
    "Best basket found in the available indexed listings. Discrete editions can exceed a daily target or leave ETH unspent. Purchase costs include listing fees; gas is quoted at review.",

  "collect.blend.approach": "Approach",
  "collect.blend.tier.conservative": "Conservative",
  "collect.blend.tier.base": "Base",
  "collect.blend.tier.aggressive": "Aggressive",
  "collect.blend.offerBudget": "Offer budget (WETH, optional)",
  "collect.blend.help.conservative":
    "Favor patient offers. Collect now only where the observed listing is especially competitive.",
  "collect.blend.help.base":
    "Balance offers with competitively priced listings for each NFT.",
  "collect.blend.help.aggressive":
    "Favor completing your selection sooner, within the observed prices and your limits. Edited prices and chosen routes stay yours.",
  "collect.blend.refreshRequired":
    "These market references have expired. Refresh prices before reviewing a proposal.",
  "collect.blend.reason.excluded": "This NFT is not selected.",
  "collect.blend.reason.locked":
    "An existing purchase or offer keeps this NFT reserved.",
  "collect.blend.reason.invalidQuantity":
    "Choose a valid quantity for this NFT.",
  "collect.blend.reason.manualPrice": "Your edited price is preserved.",
  "collect.blend.reason.manualBuy": "You chose to collect this NFT now.",
  "collect.blend.reason.manualOffer":
    "You chose to make an offer for this NFT.",
  "collect.blend.reason.buyUnavailable":
    "No exact listing covers this quantity. Rebuild your plan to check availability.",
  "collect.blend.reason.staleReference":
    "The market reference needs refreshing. Rebuild your plan for current listings.",
  "collect.blend.reason.noReference":
    "There is not enough applicable market evidence. Enter your own price.",
  "collect.blend.reason.crossedMarket":
    "The observed offer meets or exceeds the listing. Choose your own price after checking the market.",
  "collect.blend.reason.tightSpread":
    "The listing is close to the observed WETH offer for this approach.",
  "collect.blend.reason.spreadOffer":
    "The proposal uses the gap between the observed offer and listing.",
  "collect.blend.reason.askOffer":
    "The proposal is discounted from the observed listing.",
  "collect.blend.reason.askBuy":
    "This approach favors collecting at the observed listing.",
  "collect.blend.reason.bidOnly":
    "Only an applicable WETH offer is available as a reference.",
  "collect.blend.reason.invalidAmount":
    "A valid exact amount could not be calculated. Enter your own price.",
  "collect.offerPlan.blendTier.label": "Strategy",
  "collect.offerPlan.blendTier.conservative": "Conservative",
  "collect.offerPlan.blendTier.base": "Base",
  "collect.offerPlan.blendTier.aggressive": "Aggressive",
  "collect.offerPlan.blendTier.conservativeDescription":
    "Match the observed bid. Suggest buying when the gap is at most 2% of the listed cost. With only a listing, propose 70% of its cost.",
  "collect.offerPlan.blendTier.baseDescription":
    "Propose one third of the way from the observed bid toward the listed cost. Suggest buying when the gap is at most 8%. With only a listing, propose 85% of its cost.",
  "collect.offerPlan.blendTier.aggressiveDescription":
    "Propose two thirds of the way from the observed bid toward the listed cost. Suggest buying when the gap is at most 20%, or when only a listing is available.",
  "collect.offerPlan.blendTier.disclaimer":
    "These editable suggestions use observed prices, not estimated acceptance rates. Prices, availability, budget and funding are checked before each review. Purchases use ETH; offers use WETH.",
  "collect.offerPlan.blendReason.excluded": "Not selected",
  "collect.offerPlan.blendReason.locked":
    "An existing commitment is being tracked",
  "collect.offerPlan.blendReason.invalid_quantity":
    "Enter a supported quantity",
  "collect.offerPlan.blendReason.manual_price": "Your price",
  "collect.offerPlan.blendReason.manual_buy": "Your choice to buy",
  "collect.offerPlan.blendReason.manual_offer":
    "Your choice to offer; enter a price",
  "collect.offerPlan.blendReason.buy_unavailable":
    "Refresh listings for this quantity",
  "collect.offerPlan.blendReason.stale_reference": "Refresh observed prices",
  "collect.offerPlan.blendReason.no_reference":
    "No usable price reference; enter your price",
  "collect.offerPlan.blendReason.crossed_market":
    "Bid and listing prices conflict; refresh or enter your price",
  "collect.offerPlan.blendReason.tight_spread":
    "The observed bid is close to the listed cost",
  "collect.offerPlan.blendReason.spread_offer":
    "Proposed within this artwork’s observed price gap",
  "collect.offerPlan.blendReason.ask_offer":
    "Proposed from the listed cost; no bid reference",
  "collect.offerPlan.blendReason.ask_buy":
    "Listing available; no bid reference",
  "collect.offerPlan.blendReason.bid_only":
    "Matched the observed bid; no whole-quantity purchase available",
  "collect.offerPlan.blendReason.invalid_amount":
    "Enter a valid price for this quantity",
  "collect.tdhBrowse.metricValue": "≈ {value}",
  "collect.tdhBrowse.metricUnit": "base TDH/day per ETH",
  "collect.tdhDaily.title": "Find your daily TDH",
  "collect.tdhDaily.description":
    "Enter a daily target or an ETH budget. We’ll calculate the other using current listings.",
  "collect.tdhDaily.target": "Base TDH per day",
  "collect.tdhDaily.budget": "Purchase budget (ETH)",
  "collect.tdhDaily.targetPlaceholder": "Enter a daily target",
  "collect.tdhDaily.budgetPlaceholder": "Enter an ETH budget",
  "collect.tdhDaily.calculating": "Calculating from current listings…",
  "collect.tdhDaily.calculatingField": "Calculating…",
  "collect.tdhDaily.basis":
    "Base earning rate per full held day. Listing fees included; gas quoted at review. Personal boosts are shown separately.",
  "collect.tdhDaily.invalidTarget":
    "Enter a positive daily rate with up to 2 decimal places.",
  "collect.tdhDaily.invalidBudget":
    "Enter a positive ETH amount with up to 18 decimal places.",
  "collect.tdhDaily.failed":
    "This estimate could not be calculated. Please try again.",
  "collect.tdhDaily.retry": "Try again",
  "collect.tdhDaily.achieved": "Selected NFTs earn {value} base TDH per day.",
  "collect.tdhDaily.purchase": "Current listing cost: {value} ETH.",
  "collect.tdhDaily.connect":
    "Connect your profile to calculate a purchase plan.",
  "collect.tdhDaily.connectAction": "Connect profile",
  "collect.tdhDaily.derivedTarget": "Calculated from your ETH budget",
  "collect.tdhDaily.derivedBudget":
    "Calculated from your daily target; rounded up to 4 decimals",
  "collect.plan.exactAmounts": "Exact amounts",
  "collect.plan.exactPurchases": "NFT purchases",
  "collect.plan.exactGas": "Network fee reserve",
  "collect.offerPlan.refreshPrices": "Refresh prices",
  "collect.offerPlan.introCalculated":
    "Prices are calculated for each NFT using your chosen method. Review the proposals, edit any price, then choose Review offer. Accepted offers deliver to your paying wallet.",
  "collect.expiry.custom": "Custom…",
  "collect.expiry.endsAt": "Expiry date and time",
  "collect.expiry.timezone": "Your timezone: {zone}",
  "collect.expiry.exact": "Expires {date}",
  "collect.expiry.range": "Choose an expiry within the next 30 days.",
  "collect.expiry.invalid.invalid":
    "Enter a valid date and time. Times skipped when the clocks change cannot be used.",
  "collect.expiry.invalid.ambiguous":
    "This local time occurs twice when the clocks change. Choose a later time.",
  "collect.expiry.invalid.tooSoon":
    "Choose an expiry at least 5 minutes from now.",
  "collect.expiry.invalid.tooLate":
    "Choose an expiry earlier than 30 days from now.",
  "collect.blend.retainedPurchase": "Your purchase review is saved here.",
  "collect.blend.previousPurchase":
    "A purchase review from an earlier plan is still open. Its NFTs and destination have been kept.",
  "collect.blend.discardPurchase": "Discard purchase draft",
  "collect.blend.finishReview":
    "Resume or discard the existing purchase review before starting another.",
  "collect.blend.resumePriorPurchase": "Resume prior plan review",
  "collect.blend.resumePurchase": "Resume purchase review",
  "collect.blend.title": "Choose how to acquire each NFT",
  "collect.blend.intro":
    "Start with offers, or choose Collect now where your plan has listings for the full quantity. Review purchases and sign each offer separately.",
  "collect.blend.acquireFor": "How to acquire {title}",
  "collect.blend.offer": "Offer",
  "collect.blend.selectNFT": "Select {title}",
  "collect.blend.nfts": "NFT acquisition choices",
  "collect.blend.noFullListing":
    "No priced listing combination for this full quantity in your chosen plan.",
  "collect.blend.reserved": "Reserved for purchase review",
  "collect.blend.buyCost": "Observed listings: {amount} ETH",
  "collect.blend.buyQuantity": "Quantity: {quantity} · includes listing fees",
  "collect.blend.purchaseEstimate": "Purchase estimate: {amount} ETH",
  "collect.blend.separateBudgets":
    "Gas is quoted at purchase review. The WETH offer budget is separate.",
  "collect.blend.reviewBuys": "Review purchases ({count})",
  "collect.strategy.title": "How would you like to collect?",
  "collect.strategy.buy": "Collect now",
  "collect.strategy.match_bid": "At WETH offer",
  "collect.strategy.improve_bid": "WETH + %",
  "collect.strategy.discount_ask": "Ask − %",
  "collect.strategy.blended": "Blended",
  "collect.strategy.help.buy":
    "Choose from the priced listings below and review one purchase.",
  "collect.strategy.help.match_bid":
    "Match the highest applicable WETH offer for each NFT. Review the calculated prices before signing.",
  "collect.strategy.help.improve_bid":
    "Choose how far above each NFT’s highest applicable WETH offer you want to bid.",
  "collect.strategy.help.discount_ask":
    "Choose a percentage below each NFT’s asking price. Offers are made in WETH.",
  "collect.strategy.help.blended":
    "Choose which NFTs to collect now and which to offer on. Review ETH purchases and WETH offers separately.",
  "collect.offerWorkspace.back": "Back to collecting",
  "collect.offerWorkspace.plan": "Plan offers",
  "collect.offerWorkspace.planMissing": "Make offers for missing NFTs",
  "collect.offerWorkspace.alternatives":
    "For trait sets, offers cover the NFTs chosen in your plan. Other matching NFTs remain alternatives.",
  "collect.offerPlan.title": "Plan offers",
  "collect.offerPlan.intro":
    "Set a price for each NFT, then review and sign the offers you choose. Accepted offers deliver to your paying wallet.",
  "collect.offerPlan.pricing": "Price method",
  "collect.offerPlan.method.manual": "Enter each price",
  "collect.offerPlan.method.matchBid": "Match observed WETH offer",
  "collect.offerPlan.method.improveBid": "Above observed WETH offer",
  "collect.offerPlan.method.discountAsk": "Below observed ask",
  "collect.offerPlan.method.goal": "Conservative allocation",
  "collect.offerPlan.help.manual":
    "Enter the amount you want to offer for each NFT. Each price is yours to choose.",
  "collect.offerPlan.help.match_bid":
    "Use the highest applicable WETH offer in the observed index for each NFT. Missing references need your own price.",
  "collect.offerPlan.help.improve_bid":
    "Calculate each price above its observed WETH offer once. Future offers will not be followed automatically.",
  "collect.offerPlan.help.discount_ask":
    "Calculate each price below its observed ask. Native ETH asks are compared with WETH at 1:1, before any wrapping costs.",
  "collect.offerPlan.help.goal":
    "Allocate your budget to conservative opening offers supported by the available evidence. Unused WETH stays uncommitted; edited prices stay pinned.",
  "collect.offerPlan.improvement": "Above offer (%)",
  "collect.offerPlan.discount": "Below ask (%)",
  "collect.offerPlan.budget": "Offer budget (WETH)",
  "collect.offerPlan.defaultExpiry": "Default expiry",
  "collect.offerPlan.expiry": "Expiry",
  "collect.offerPlan.unitPrice": "Price per NFT",
  "collect.offerPlan.tokenFallback": "NFT #{token}",
  "collect.offerPlan.selectNFT": "Select {title} for an offer",
  "collect.offerPlan.priceFor": "WETH price per NFT for {title}",
  "collect.offerPlan.quantityFor": "Offer quantity for {title}",
  "collect.offerPlan.expiryFor": "Offer expiry for {title}",
  "collect.offerPlan.reviewFor": "Review offer for {title}",
  "collect.offerPlan.review": "Review offer",
  "collect.offerPlan.published": "Offer published",
  "collect.offerPlan.pinned": "Your price · kept when recalculating",
  "collect.offerPlan.reset": "Use calculated price",
  "collect.offerPlan.resetFor": "Use a calculated price for {title}",
  "collect.offerPlan.details": "Details & expiry",
  "collect.offerPlan.detailsFor": "Details and expiry for {title}",
  "collect.offerPlan.weth": "{amount} WETH",
  "collect.offerPlan.observedBid":
    "Observed offer: {amount} {currency} per NFT at {time}.",
  "collect.offerPlan.observedAsk":
    "Observed ask: {amount} {currency} per NFT at {time}.",
  "collect.offerPlan.reason.manual": "You set this price.",
  "collect.offerPlan.reason.matchBid":
    "Matches the applicable observed WETH offer.",
  "collect.offerPlan.reason.improveBid":
    "Calculated above the applicable observed WETH offer.",
  "collect.offerPlan.reason.discountAsk":
    "Calculated below the applicable observed ask.",
  "collect.offerPlan.reason.goal":
    "A conservative opening proposal within the allocation policy.",
  "collect.offerPlan.reason.noBid":
    "No usable WETH offer reference. Enter a price.",
  "collect.offerPlan.reason.noAsk": "No usable ask reference. Enter a price.",
  "collect.offerPlan.reason.stale":
    "The market reference is too old. Recalculate or enter a price.",
  "collect.offerPlan.reason.unsupported":
    "This NFT cannot be priced by this method.",
  "collect.offerPlan.reason.insufficientEvidence":
    "Too little evidence for an automatic opening price. Enter a price.",
  "collect.offerPlan.reason.amount":
    "The amount cannot be represented safely. Enter a smaller price.",
  "collect.offerPlan.reason.budget":
    "This offer exceeds the available plan budget.",
  "collect.offerPlan.reason.funding":
    "The paying wallet needs more available WETH for these offers.",
  "collect.offerPlan.reason.pinConflict":
    "Your pinned price conflicts with the budget or available WETH. Your price has been kept.",
  "collect.offerPlan.reason.unavailable":
    "No automatic price is available. Enter your own price.",
  "collect.offerPlan.reason.observed":
    "This reference is an observation; its funding and execution have not been verified.",
  "collect.offerPlan.reason.ethComparison":
    "The native ETH ask is compared with WETH at 1:1, before wrapping costs.",
  "collect.offerPlan.reason.unknown":
    "Additional pricing information is unavailable. Check the price before reviewing this offer.",
  "collect.offerPlan.invalid.quantity":
    "Enter 1–100 copies for a Meme, or 1 for a unique NFT.",
  "collect.offerPlan.invalid.price":
    "Enter a positive WETH price with up to 18 decimal places.",
  "collect.offerPlan.invalid.expiry":
    "Choose a preset or a valid custom expiry between 5 minutes and 30 days from now.",
  "collect.offerPlan.invalid.discount":
    "Enter a discount from 0% to 99.99%, with at most two decimal places.",
  "collect.offerPlan.invalid.improvement":
    "Enter an improvement from 0% to 1000%, with at most two decimal places.",
  "collect.offerPlan.invalid.budget":
    "Enter a positive WETH budget with up to 18 decimal places.",
  "collect.offerPlan.selectSome": "Select at least one NFT.",
  "collect.offerPlan.enterEachPrice":
    "Enter a valid price for every selected NFT or pinned row.",
  "collect.offerPlan.analysisFailed":
    "These offers could not be analyzed. Your edits have been kept. Try again.",
  "collect.offerPlan.empty": "Select NFTs to plan offers.",
  "collect.offerPlan.checkAmounts": "Check amounts and WETH",
  "collect.offerPlan.calculate": "Calculate prices",
  "collect.offerPlan.calculating": "Calculating…",
  "collect.offerPlan.findNFT": "Find an NFT in this plan",
  "collect.offerPlan.selectAll": "Select all",
  "collect.offerPlan.clearSelection": "Clear selection",
  "collect.offerPlan.selectionCount": "{selected} of {total} NFTs selected",
  "collect.offerPlan.nfts": "NFT offer prices",
  "collect.offerPlan.noMatches": "No selected NFTs match this search.",
  "collect.offerPlan.pages": "Offer plan pages",
  "collect.offerPlan.previous": "Previous",
  "collect.offerPlan.next": "Next",
  "collect.offerPlan.pageCount": "Page {current} of {total}",
  "collect.offerPlan.proposed": "Proposed offers ({count})",
  "collect.offerPlan.unpriced": "Prices needed: {count}",
  "collect.offerPlan.overBudget":
    "These offers exceed your plan budget. Adjust your prices, selection or budget.",
  "collect.offerPlan.overFunding":
    "These offers exceed the paying wallet’s available WETH at the last check. Adjust them or add WETH, then check again.",
  "collect.offerPlan.fundingSnapshot":
    "Tracked commitments: {commitments} · available: {available}, checked at {time}.",
  "collect.offerPlan.howItWorks": "How these offers work",
  "collect.offerPlan.independent":
    "Each offer is reviewed and signed separately. Sellers can accept independently, so some NFTs may be acquired while others are not. There is no automatic signing or repricing.",
  "collect.offerPlan.observed":
    "Price references are observed exact-token order terms. Bidder funding, live execution and seller acceptance are not verified by this analysis. Missing references never become invented prices.",
  "collect.offerPlan.liability":
    "Every open offer can be accepted. Tracked commitments cover this site’s paying-wallet ledger; offers made elsewhere may add liability. WETH balances are not pooled across your profile’s wallets. Fresh offer review checks funding before signing.",
  "collect.offerPlan.policy": "Calculation policy: {policy}.",
  "collect.offerPlan.publishedUnknown":
    "Check the actual committed offer amounts before allocating more of this budget.",
  "collect.offerPlan.committed": "Already published from this plan: {amount}.",
  "collect.offerPlan.pendingCommitment":
    "Awaiting offer status from this plan: {amount}.",
  "collect.offerPlan.checkPending": "Check offer status · NFT #{token}",
  "collect.offerPlan.pending": "Awaiting offer status",
  "collect.buy.splitDelivery": "Split delivery",
  "collect.plan.batchDescription":
    "Selected listings complete together in one transaction. Price and gas are checked before you confirm.",
  "collect.plan.checkSelection": "Check selected listings",
  "collect.plan.selectionEstimate":
    "Selected listings: {price} · gas quoted at review",
  "collect.plan.priceChanged":
    "A selected listing’s price changed. Refresh this plan before continuing.",
  "collect.plan.selectedTdhPreview": "Preview selected NFTs’ TDH",
  "collect.selection.alreadySelected":
    "This NFT is already selected from another listing.",
  "collect.selection.limit": "Review up to {count} listings in one purchase.",
  "collect.batchReview.quoteTitle": "Your purchase",
  "collect.batchReview.atomic":
    "All selected NFTs will be collected and delivered in one transaction, or none will be collected.",
  "collect.batchReview.quotedQuantity": "Quantity {quantity}",
  "collect.batchReview.deliveryCopies": "Deliver {quantity}",
  "collect.batchReview.outsideProfile": "Outside this profile",
  "collect.batchReview.purchaseTotal": "Purchase total, including fees",
  "collect.batchReview.maximumTotal": "Maximum total with gas",
  "collect.batchReview.gasUnavailable": "Gas quote unavailable",
  "collect.batchReview.gasNote":
    "Unused gas is not charged. A failed transaction can still use gas.",
  "collect.batchReview.feesDetails": "Fees and order details",
  "collect.batchReview.fee": "Fee {number}",
  "collect.batchReview.orderHash": "Order hash",
  "collect.batchReview.ethAmount": "{amount} ETH",
  "collect.batchReview.close": "Close",
  "collect.batchReview.title": "Review purchase",
  "collect.batchReview.description":
    "Choose the NFTs and delivery wallets for this purchase.",
  "collect.batchReview.defaultDelivery": "Default delivery",
  "collect.batchReview.selectAll": "Select all",
  "collect.batchReview.selected": "{selected} of {total} selected",
  "collect.batchReview.selectItem": "Select {title}",
  "collect.batchReview.itemDetail": "#{token} · Quantity {quantity}",
  "collect.batchReview.customizeDelivery": "Change delivery",
  "collect.batchReview.customizeDeliveryFor": "Change delivery for {title}",
  "collect.batchReview.deliveryFor": "Delivery for {title}",
  "collect.batchReview.destinationQuantity": "Destination {number} · Copies",
  "collect.batchReview.addDestination": "Split to another wallet",
  "collect.batchReview.removeDestination": "Remove last destination",
  "collect.batchReview.useDefaultDelivery": "Use default delivery",
  "collect.batchReview.estimate": "Estimated total {price}",
  "collect.batchReview.nextStep":
    "Listing fees included. Next, check live availability and review the final total with gas.",
  "collect.batchReview.prepare": "Review live total",
  "collect.batchReview.back": "Back to selection",
  "collect.batchReview.invalid.empty": "Select at least one NFT to continue.",
  "collect.batchReview.invalid.limit":
    "Select up to {max} listings for one transaction.",
  "collect.batchReview.invalid.allocationLimit":
    "Use up to {allocations} delivery allocations for one transaction.",
  "collect.batchReview.invalid.recipient":
    "Choose a valid destination wallet. ENS names must resolve before continuing.",
  "collect.batchReview.invalid.quantity":
    "Enter positive whole copy counts that add up to the selected quantity.",
  "collect.batchReview.invalid.duplicate":
    "Combine copies for the same wallet into one destination.",
  "collect.batchReview.invalid.consent":
    "Check each destination outside your profile before continuing.",
  "collect.buy.atPrice": "Collect {price}",
  "collect.buy.deliverTo": "Deliver to",
  "collect.buy.changeDelivery": "Change",
  "collect.buy.doneDelivery": "Done",
  "collect.buy.chooseDelivery": "Choose a wallet",
  "collect.buy.otherListings": "Other listings",
  "collect.buy.includedFees": "Fees included in price",
  "collect.buy.lotPrice": "Price for {quantity} copies",
  "collect.buy.listingChanged":
    "This listing changed or is no longer available. Review the current price before you collect.",
  "collect.buy.editPurchase": "Edit purchase",
  "collect.selection.title": "Selected NFTs",
  "collect.selection.count": "{count} selected",
  "collect.selection.estimate": "Estimated {price} · gas added at review",
  "collect.selection.clear": "Clear",
  "collect.selection.review": "Review purchase",
  "collect.selection.addArtwork": "Add {title} to selection",
  "collect.selection.removeArtwork": "Remove {title} from selection",
  "collect.list.chooseOwner":
    "Connect a wallet holding this artwork to list it for sale.",
  "collect.list.checkingOwnership": "Checking ownership…",
  "collect.list.ownershipError": "Ownership could not be checked.",
  "collect.list.retryOwnership": "Retry ownership check",
  "collect.acquire": "Collect",
  "collect.acquireFor": "Collect {title}",
  "collect.menu.offer": "Make an offer",
  "collect.menu.list": "List",
  "collect.menu.accept": "Review offers",
  "collect.disabledAction": "{action}. {reason}",
  "collect.moreActions": "More trading actions for {title}",
  "collect.navigation.label": "Collecting tools",
  "collect.navigation.completeSet": "Complete a set",
  "collect.navigation.tdh": "TDH",
  "collect.navigation.lowest": "Lowest listings",
  "collect.browseArtwork": "Browse artwork",
  "collect.viewCollection": "View {collection}",
  "collect.listings.empty.title": "No listings found",
  "collect.listings.empty.description":
    "No observed listings are available for this collection. Browse the artwork or check again later.",
  "collect.detail.loading": "Loading this artwork…",
  "collect.detail.unavailable":
    "This artwork could not be loaded for trading. Try again.",
  "collect.sets.profileScope":
    "Set coverage includes all confirmed wallets in each profile.",
  "collect.sets.custody": "{artwork}, held by {wallet}",
  "collect.sets.values": "{trait} values: {count}",
  "collect.sets.profiles": "Collector profiles: {count}",
  "collect.sets.mintUnavailable": "Mint count unavailable",
  "collect.art.unavailable": "Artwork preview unavailable",
  "collect.error.catalog": "The catalog could not be loaded. Please try again.",
  "collect.error.analysis":
    "Your collection could not be checked. Try building the plan again.",
  "collect.error.orders": "Orders could not be loaded. Please try again.",
  "collect.error.prepare":
    "This trade could not be prepared. Please try again.",
  "collect.error.prepareNetwork":
    "The trading service could not be reached. Please try again.",
  "collect.error.prepareAuth":
    "Reconnect the paying or signing wallet for this profile, then try again.",
  "collect.error.prepareService":
    "The trading service could not verify this trade right now. Please try again shortly.",
  "collect.error.prepareRateLimited":
    "There have been too many requests. Wait a moment, then try again.",
  "collect.error.prepareDetails":
    "Some trade details could not be verified. Check the quantity, price and destination, then try again.",
  "collect.error.prepareTerms":
    "The current trade terms could not be verified. Check the price, quantity and paying wallet, then try again.",
  "collect.error.prepareUnsupported":
    "This trade uses terms that are not supported. Choose another order or review the offer details.",
  "collect.error.prepareConnectionChanged":
    "The active wallet or profile changed. Review the trade with your current wallet before continuing.",
  "collect.error.prepareRecipientChanged":
    "Your profile's wallets changed. Check the delivery address and review the trade again.",
  "collect.error.offerLimit":
    "The total for all copies exceeds this offer's available budget. Check the quantity and price, or update the budget.",
  "collect.error.offerQuantity":
    "The quantity no longer matches the offer plan. Edit it in the offer plan and review again.",
  "collect.goal.ultimate": "Ultimate — Palette, Size and Traced",
  "collect.goal.coverage": "{owned} of {total} requirements complete",
  "collect.goal.snapshot": "Holdings checked at block {block}",
  "collect.goal.requirement": "Owned: {owned} · Goal: {target}",
  "collect.goal.confirmedWallets":
    "Includes {count} confirmed wallets in this profile.",
  "collect.goal.complete": "This goal is complete.",
  "collect.goal.quoteNeeded":
    "Check available orders for each missing artwork before you collect.",
  "collect.goal.pricingUnavailable":
    "Price optimization is not available yet. You can explore the catalog and check individual orders.",
  "collect.goal.tdhUnavailable":
    "TDH scenarios are not available yet. No estimate has been calculated.",
  "collect.trade.unavailable": "This action is not available yet.",
  "collect.trade.connectSigner":
    "Connect a wallet in this profile to prepare this action.",
  "collect.trade.proxyUnavailable":
    "Switch out of profile proxy mode to trade.",
  "collect.trade.safeUnavailable":
    "This wallet type is not supported for trading yet.",
  "collect.trade.wrongChain":
    "Switch your wallet to Ethereum mainnet to continue.",
  "collect.trade.nativeUnavailable":
    "Trading is not available in the mobile app yet. Open 6529.io in your browser to review this trade.",
  "collect.trade.selectOrder": "Choose an order",
  "collect.trade.noOrders":
    "No executable orders were returned for this artwork.",
  "collect.trade.orderSource":
    "Orders from {source}. Availability may change before checkout.",
  "collect.trade.orderQuantity": "{quantity} available",
  "collect.trade.orderMaker": "Maker: {wallet}",
  "collect.trade.orderSelected": "Selected order",
  "collect.trade.refreshOrders": "Refresh orders",
  "collect.trade.reconnect":
    "Connect the wallet shown in this review to continue. Your recipient and trade are saved.",
  "collect.trade.total": "Total including fees",
  "collect.trade.net": "You receive",
  "collect.trade.sellerReceives": "Seller receives",
  "collect.trade.orderEnds": "Order expires",
  "collect.trade.approvalSpender": "Approved operator",
  "collect.trade.fees": "Signed order fees",
  "collect.trade.payer": "Wallet paying or selling",
  "collect.trade.payingWallet": "Paying wallet",
  "collect.trade.payingWalletLine": "Paying wallet: {wallet}",
  "collect.trade.destination": "NFT recipient",
  "collect.trade.asset": "Artwork",
  "collect.trade.network": "Network",
  "collect.trade.protocol": "Exchange contract",
  "collect.trade.revision": "Review revision",
  "collect.trade.external":
    "This recipient is outside your profile. This delivery does not advance your collection goal.",
  "collect.trade.gasSeparate":
    "Network fees are additional. Review the exact transaction in your wallet.",
  "collect.trade.approval":
    "Approval required. The approved collection or currency amount is shown below.",
  "collect.trade.approvalTarget": "Approval contract",
  "collect.trade.approvalScope": "Approval scope",
  "collect.trade.checkFailed":
    "This payload did not match your reviewed trade. Nothing was sent to your wallet.",
  "collect.trade.refreshReview":
    "Terms changed. Review the updated details before continuing.",
  "collect.trade.walletFailed":
    "The wallet action did not finish. Check Orders before trying again.",
  "collect.trade.pendingHash":
    "The transaction was sent. Its receipt is still being checked; do not create another trade.",
  "collect.trade.orderLive": "Order is live",
  "collect.trade.cancelled": "Order cancelled",
  "collect.menuLabel": "Collect",
  "collect.review.summary": "Purchase summary",
  "collect.review.exactAmounts": "Exact amounts",
  "collect.review.exchangeContract": "Exchange contract",
  "collect.review.approvalContract": "Approval contract",
  "collect.review.marketplaceFee": "Marketplace fee",
  "collect.review.unknownContract": "Unknown contract",
  "collect.review.unknownRecipient": "Unknown recipient",
  "collect.review.copyAddress": "Copy {label} address",
  "collect.review.openExplorer": "Open {label} on Etherscan",
  "collect.review.openSeaFee": "OpenSea fee",
  "collect.review.atMost": "At most",
  "collect.review.sellFrom": "Sell from",
  "collect.review.receiveTo": "Receive payment",
  "collect.review.signWith": "Sign with",
  "collect.review.orderTerms": "Order details",
  "collect.review.edit.buy": "Edit purchase",
  "collect.review.edit.offer": "Edit offer",
  "collect.review.edit.list": "Edit listing",
  "collect.review.edit.accept": "Back to offers",
  "collect.review.edit.cancel": "Back to order",
  "collect.review.orderNet": "You receive",
  "collect.review.feesIncluded": "Fees included",
  "collect.review.offerNote":
    "If accepted, this offer delivers to your paying wallet.",
  "collect.trade.reviewOffer": "Review offer",
  "collect.trade.reviewListing": "Review listing",
  "collect.orders.details": "Order details",
  "collect.review.copies": "Quantity: {quantity}",
  "collect.review.payWith": "Pay with",
  "collect.review.deliverTo": "Deliver to",
  "collect.review.sameWallet": "Pay with & deliver to",
  "collect.review.profileWallet": "In the collecting profile",
  "collect.review.otherRecipient": "Outside the collecting profile",
  "collect.review.price": "Purchase price",
  "collect.review.includedFees": "Includes {amount} in order fees",
  "collect.review.networkCap": "Network fee cap",
  "collect.review.upTo": "Up to {amount}",
  "collect.review.maximum": "Maximum total",
  "collect.review.maximumNote": "Actual network cost may be lower.",
  "collect.review.exactNote":
    "Fee caps are rounded up in the summary. Exact amounts are shown here.",
  "collect.review.gasUnknown": "Not available yet",
  "collect.review.gasUnknownNote":
    "The network fee cap is not available yet; a maximum total cannot be shown.",
  "collect.review.separateCurrencies":
    "The purchase is paid in WETH. Network fees are paid separately in ETH.",
  "collect.review.priceDetails": "Price breakdown",
  "collect.review.contractDetails": "Contract details",
  "collect.review.fee": "Order fee",
  "collect.review.feeTo": "To {address}",
  "collect.review.approval": "Token approval {number}",
  "collect.review.approvalFee": "Included approval fee cap {number}",
  "collect.review.exactGas": "Exact network fee cap",
  "collect.review.exactMaximum": "Exact maximum total",
  "collect.review.nftContract": "NFT contract",
  "collect.review.tokenId": "Token ID",
  "collect.review.listingExpiry": "Listing expires",
  "collect.review.liveCheck":
    "Price and availability are checked again before your wallet opens.",
  "collect.review.quoteRefreshRequired":
    "Refresh quote to continue. Your purchase choices are kept.",
  "collect.trade.refreshRequired":
    "Current terms could not be verified. Please try again.",
  "collect.trade.refreshing": "Refreshing review…",
  "collect.review.refreshQuote": "Refresh quote",
  "collect.review.total.buy": "Purchase price",
  "collect.review.total.offer": "Offer amount",
  "collect.review.total.list": "Listing price",
  "collect.review.total.accept": "Offer amount",
  "collect.review.total.cancel": "Order amount",
  "collect.title": "Build your collection",
  "collect.description":
    "Complete a set, discover listings or find the most TDH for your ETH.",
  "collect.navigation": "Collect navigation",
  "collect.explore": "Explore",
  "collect.goals": "Goals",
  "collect.orders": "Orders",
  "collect.collections": "Collections",
  "collect.collection.all": "All collections",
  "collect.collection.memes": "The Memes",
  "collect.collection.gradients": "Gradients",
  "collect.collection.pebbles": "Pebbles",
  "collect.intent.explore": "Explore the art",
  "collect.intent.lowest": "Find the lowest price",
  "collect.intent.specific": "Find something specific",
  "collect.intent.season": "Complete a season",
  "collect.intent.full_set": "Complete a full set",
  "collect.intent.artist": "Collect an artist",
  "collect.intent.pebbles_set": "Complete a Pebbles set",
  "collect.tdh.projectionTitle": "Project your profile’s TDH",
  "collect.tdh.backToListings": "Back to TDH listings",
  "collect.intent.tdh": "Lowest cost TDH",
  "collect.tdhBrowse.scope": "Ranked by base TDH/day per ETH.",
  "collect.tdhBrowse.value": "≈ {value} base TDH/day per ETH",
  "collect.tdhBrowse.target": "Reach target TDH",
  "collect.tdhBrowse.explain": "How TDH value works",
  "collect.tdhBrowse.method":
    "Compares each NFT’s best supported ETH listing using its current base TDH accrual per full held day. Listing fees are included; gas is checked at purchase. Each listing is verified again before checkout.",
  "collect.tdhBrowse.profile":
    "Holding time starts when you receive an NFT; the seller’s accumulated TDH does not transfer. Profile and set multipliers are excluded here. Use profile projection to compare their effect on your whole profile.",
  "collect.tdhBrowse.snapshot":
    "{count} indexed asks considered · Snapshot {date}.",
  "collect.tdhBrowse.bounded":
    "This comparison covers a bounded portion of the indexed collection. More favorable listings may exist outside this view.",
  "collect.tdhBrowse.stale":
    "These indexed prices are awaiting a market refresh. Checkout checks current availability and price.",
  "collect.tdhBrowse.unavailable":
    "Indexed listings are refreshing. Please try again shortly.",
  "collect.chooseGoal": "What are you collecting?",
  "collect.search": "Search artwork",
  "collect.searchPlaceholder": "Title, artist or token number",
  "collect.searchSubmit": "Search",
  "collect.profileScope": "Collecting as {profile}",
  "collect.profileScopeDetail":
    "Your collection includes all confirmed wallets in this profile.",
  "collect.connectDescription":
    "Explore freely. Connect to see your collection and make a plan.",
  "collect.connect": "Connect wallet",
  "collect.loading": "Loading artwork",
  "collect.buy.loadingListings": "Loading listings",
  "collect.buy.noListings": "No NFTs are currently available to collect.",
  "collect.retry": "Try again",
  "collect.empty.title": "No artwork matches yet",
  "collect.empty.description":
    "Try another collection or search. Your selection is kept.",
  "collect.noPrice": "Check current orders",
  "collect.loadMore": "Load more artwork",
  "collect.artworkLink": "View {title}",
  "collect.action.buy": "Collect",
  "collect.action.offer": "Make offer",
  "collect.action.list": "List",
  "collect.action.accept": "Accept offer",
  "collect.trade.exactOrderChanged":
    "This order could not be verified with the terms you selected. Close this review, refresh Listings and Offers, and select it again.",
  "collect.action.cancel": "Cancel order",
  "collect.actionFor": "{action}: {title}",
  "collect.plan.title": "Your plan",
  "collect.plan.empty": "Start with a collecting goal",
  "collect.plan.emptyDescription":
    "See what your profile owns, what is missing and what you can collect next.",
  "collect.plan.review": "Collect now",
  "collect.plan.makeOffers": "Make offers",
  "collect.plan.results": "Your collecting options",
  "collect.plan.scenarios": "Purchase scenarios",
  "collect.plan.scenario.available": "Available for your goal",
  "collect.plan.scenario.budget": "Within {budget}",
  "collect.plan.scenario.detail":
    "Listings: {count} · Requirements remaining: {remaining}",
  "collect.plan.outcome":
    "After this purchase: {owned} of {total} requirements complete",
  "collect.plan.giftOutcome":
    "Delivery outside this profile does not complete its collecting goal.",
  "collect.review.giftOutcome":
    "Copies delivered outside this profile do not count toward its collecting goals or TDH.",
  "collect.plan.costBreakdown": "NFTs {purchases} · gas reserve {gas}",
  "collect.plan.missingNfts": "Still to collect ({count})",
  "collect.plan.ownedNfts": "Already in your profile ({count})",
  "collect.plan.quantityPrice": "Availability · purchase total",
  "collect.plan.notPriced": "No purchase priced",
  "collect.plan.availableCopies": "{count} priced for your goal",
  "collect.plan.buyCopies": "Collect {count}",
  "collect.plan.outsideBudget": "Outside this budget",
  "collect.plan.checkingAvailability": "Checking listings…",
  "collect.plan.availabilityScope":
    "Availability covers the supported listings found for this goal. Other listings may exist. Matching NFTs can satisfy more than one set requirement; totals count each purchase once.",
  "collect.plan.open": "View plan",
  "collect.plan.estimate": "Estimated total",
  "collect.plan.priceUnavailable": "Price unavailable",
  "collect.plan.assumptions": "Plan assumptions",
  "collect.plan.requirements": "Collection requirements",
  "collect.plan.status.owned": "Owned",
  "collect.plan.status.selected": "Priced for purchase",
  "collect.plan.status.missing": "Missing",
  "collect.plan.status.unavailable": "Unavailable",
  "collect.goal.definition": "Choose your target",
  "collect.goal.collection": "Collection",
  "collect.goal.buildToward": "Build toward",
  "collect.goal.option.full_set": "Full set",
  "collect.goal.option.season": "Season",
  "collect.goal.option.artist": "Artist",
  "collect.goal.season": "Season",
  "collect.goal.artist": "Artist",
  "collect.goal.set": "Set",
  "collect.goal.selectDefinition": "Select a target",
  "collect.goal.selectSeason": "Select a season",
  "collect.goal.selectArtist": "Select an artist",
  "collect.goal.selectSet": "Select a set",
  "collect.goal.targetCount": "Copies per NFT",
  "collect.goal.budget": "Maximum budget (ETH)",
  "collect.goal.optionalBudget": "Budget cap (ETH, optional)",
  "collect.goal.optionalBudgetHint":
    "Leave blank to estimate the full goal. A cap includes estimated gas.",
  "collect.goal.noMatches": "No matches. Try another name.",
  "collect.goal.budgetHint": "Includes purchases and a gas reserve.",
  "collect.goal.horizon": "Projection horizon",
  "collect.goal.horizonDays": "{days} days",
  "collect.goal.collaborations": "Include collaborations",
  "collect.goal.preview": "Build my plan",
  "collect.goal.connect": "Connect to build your profile’s plan",
  "collect.goal.noDefinitions": "No targets are available for this goal yet.",
  "collect.goal.loadingDefinitions": "Loading collecting options…",
  "collect.goal.invalidCount": "Enter a whole number from 1 to 100.",
  "collect.goal.invalidBudget":
    "Enter an ETH amount greater than zero, with at most 18 decimal places.",
  "collect.goal.requiredDefinition":
    "Choose a target before building your plan.",
  "collect.goal.tdhNote":
    "A scenario under current rules. Seller TDH does not transfer with the artwork.",
  "collect.goal.pebblesNote":
    "Complete Palette, Size, Traced or Ultimate coverage across your profile. One Pebble can fill several missing values.",
  "collect.trade.title": "Review your action",
  "collect.trade.quantity": "Quantity",
  "collect.trade.editQuantityInPlan": "Edit in offer plan",
  "collect.trade.unitPrice": "Unit price ({currency})",
  "collect.trade.duration": "Order duration",
  "collect.trade.durationDay": "{days} day",
  "collect.trade.durationDays": "{days} days",
  "collect.trade.recipient": "Receiving wallet address",
  "collect.recipient.mode": "Where to receive the artwork",
  "collect.recipient.myProfile": "Send to me",
  "collect.recipient.other": "Send to a fren",
  "collect.recipient.chooseWallet": "Choose a receiving wallet",
  "collect.recipient.walletsUnavailable":
    "Your profile’s confirmed wallets are not available. You can enter a receiving address with Send to a fren.",
  "collect.recipient.search": "Find a profile, ENS or wallet",
  "collect.recipient.direct": "Or enter a wallet address directly",
  "collect.recipient.apply": "Use this address",
  "collect.recipient.applying": "Updating delivery…",
  "collect.recipient.cancel": "Cancel",
  "collect.recipient.updateFailed": "Delivery could not be updated. Try again.",
  "collect.recipient.profileLevel": "Profile level {level}",
  "collect.recipient.profileTdh": "Profile TDH: {tdh}",
  "collect.recipient.walletTdh": "Wallet TDH: {tdh}",
  "collect.recipient.inProfile":
    "Delivery to this profile. Your payer can be a different wallet.",
  "collect.recipient.external":
    "Delivery outside this profile. These items will not advance your profile’s collecting goal.",
  "collect.trade.prepare": "Review exact terms",
  "collect.trade.invalid.quantity": "Enter a whole quantity from 1 to {max}.",
  "collect.trade.invalid.price":
    "Enter a positive price with at most 18 decimal places.",
  "collect.trade.invalid.recipient":
    "Enter the full receiving wallet address. Names must be resolved before review.",
  "collect.trade.invalid.expiry":
    "Choose a preset or a valid custom expiry between 5 minutes and 30 days from now.",
  "collect.trade.details": "Transaction details",
  "collect.trade.expiry": "Review valid until {time}",
  "collect.trade.expired":
    "This review has expired. Refresh it before continuing.",
  "collect.trade.refresh": "Refresh review",
  "collect.trade.continue": "Continue in wallet",
  "collect.trade.close": "Close",
  "collect.trade.orderWarning":
    "A signed order can be filled while you are away until it expires or is effectively cancelled.",
  "collect.trade.cancelWarning":
    "The order may still fill until cancellation is confirmed.",
  "collect.trade.approvalWarning":
    "A wallet approval and an order signature are separate permissions.",
  "collect.trade.stage.review": "Review the exact terms",
  "collect.trade.stage.preparing": "Checking the action",
  "collect.trade.stage.wallet": "Confirm in your wallet",
  "collect.trade.stage.approval": "Approval requested in your wallet",
  "collect.trade.stage.signature": "Signature requested in your wallet",
  "collect.trade.stage.publishing": "Publishing the signed order",
  "collect.trade.stage.submitted": "Submitted — waiting for confirmation",
  "collect.trade.stage.awaiting_signatures":
    "Awaiting wallet signatures and execution",
  "collect.trade.stage.reconciling": "Checking the outcome",
  "collect.trade.stage.confirmed": "Action confirmed",
  "collect.trade.stage.live": "Order is live",
  "collect.trade.stage.partial": "Partially completed",
  "collect.trade.stage.failed": "The action could not be completed",
  "collect.trade.stage.expired": "Review expired",
  "collect.trade.pendingNote":
    "You can close this view. Check Orders for the latest outcome before trying again.",
  "collect.orders.description":
    "Your listings, offers and transaction outcomes in one place.",
  "collect.orders.empty": "No orders yet",
  "collect.orders.loading": "Loading orders",
  "collect.orders.emptyDescription":
    "Listings, offers and purchases will appear here after you create them.",
  "collect.orders.private": "Connect to view your private order activity.",
  "collect.orders.inspect": "View order",
  "collect.orders.maker": "Wallet: {wallet}",
  "collect.orders.updated": "Updated {time}",
  "collect.entry.collect": "Collect this artwork",
  "collect.entry.complete": "Complete my set",
  "collect.entry.manage": "Manage orders",
  "collect.plan.scanning": "Checking listings: {checked} of {total} artworks",
  "collect.plan.scanningShort": "Checking available listings…",
  "collect.plan.scanError":
    "The listing scan paused. Continue to retry the remaining artworks.",
  "collect.plan.stale":
    "Your profile holdings or the catalog changed. Create a fresh plan.",
  "collect.plan.noPurchases": "No purchases are available for this plan.",
  "collect.plan.observedPool":
    "Best combination found among {count} observed candidates. Other listings may exist.",
  "collect.plan.gasReserve":
    "Includes an estimated network fee reserve for each order. Every purchase receives a fresh exact quote.",
  "collect.plan.remaining": "{count} requirements remain outside this basket.",
  "collect.plan.basket": "Review your collection plan",
  "collect.plan.purchase": "Review purchase",
  "collect.plan.individual":
    "Review and confirm each purchase separately. Availability and prices may change before checkout.",
  "collect.plan.orderGone":
    "This exact order is no longer available. Refresh the plan to choose another.",
  "collect.plan.recipientMissing":
    "This plan has no valid receiving wallet. Refresh the plan and choose a destination before continuing.",
  "collect.plan.tdhPreview": "Preview this basket’s TDH",
  "collect.lowest.scope":
    "Listings are ordered by price within the selected collection.",
  "collect.lowest.selectCollection":
    "Choose a collection to compare its available listings.",
  "collect.tdh.title": "TDH for your collection",
  "collect.tdh.compare": "Compare observed purchases",
  "collect.tdh.additional": "Additional projected TDH",
  "collect.tdh.base": "Additional base TDH",
  "collect.tdh.existing": "Boost change on existing holdings",
  "collect.tdh.cost": "Estimated purchase cost",
  "collect.tdh.rate": "ETH per additional TDH",
  "collect.tdh.scope":
    "Best found within {count} observed candidates. This is a scenario at {days} days, not a guaranteed outcome.",
  "collect.tdh.empty":
    "No observed purchase adds profile TDH within this budget.",
  "collect.tdh.error": "The TDH comparison is unavailable. Please try again.",
  "collect.tdh.excluded": "{count} candidates could not be ranked.",
  "collect.tdh.rules": "Rules: {version} · Holdings block {block}",
  "collect.tdh.external":
    "A delivery outside this profile adds no TDH to this profile.",
  "collect.tdh.assumptions": "Scenario assumptions",
  "collect.tdh.viewArtwork": "View artwork",
  "collect.trade.filled": "Quantity filled",
  "collect.trade.remaining": "Quantity remaining",
  "collect.trade.liability": "Potential offer commitment",
  "collect.trade.offerRecipient":
    "An accepted offer delivers the NFT to the wallet that signs the offer.",
  "collect.trade.offerAllowance":
    "WETH remains in your wallet. Approval covers this offer; another fill may use the balance or allowance this offer needs.",
  "collect.trade.gasCap": "Maximum transaction fee",
  "collect.trade.transactionHash": "Transaction hash",
  "collect.trade.storageUnavailable":
    "This browser cannot safely save transaction recovery. Enable browser storage before continuing.",
  "collect.trade.broadcastUnknown":
    "Your wallet may have submitted this transaction. Check your wallet activity and enter its transaction hash to verify the outcome. This transaction cannot be sent again until its outcome is resolved.",
  "collect.trade.recoveryHash": "Transaction hash from your wallet",
  "collect.trade.recoverHash": "Check this transaction",
  "collect.trade.recoveryCheckFailed":
    "The transaction could not be checked. Keep the same hash and try checking again.",
  "collect.trade.recoveryHashInvalid":
    "Enter the full transaction hash: 0x followed by 64 hexadecimal characters.",
  "collect.trade.lockUnavailable":
    "This browser cannot safely coordinate wallet actions across tabs. Use a current supported browser.",
  "collect.trade.lockActive":
    "This operation is already open in another tab. Complete or reject that wallet request first.",
  "collect.trade.originalProfile":
    "This operation was created for an earlier profile. You can check its outcome or cancel its order using the original wallet. Its destination membership refers to that earlier profile.",
  "collect.trade.acknowledgeExternal":
    "I have checked this destination. Delivery outside my profile will not complete this profile's set or add TDH to it.",
  "collect.rules.saveTitle": "Keep this collecting plan",
  "collect.rules.mode":
    "Save fixed targets and prepare purchases for your approval. Every purchase still needs your review and a wallet confirmation.",
  "collect.rules.planningLimits":
    "Limits apply to purchases prepared through this rule. They do not limit spending elsewhere from this wallet. Pausing cannot revoke a transaction already exposed to your wallet.",
  "collect.rules.review": "Review rule",
  "collect.rules.save": "Save rule",
  "collect.rules.saved": "Your collecting rule is saved.",
  "collect.rules.manage": "Collecting rules",
  "collect.rules.perItem": "maximum per item",
  "collect.rules.limits":
    "Total limit {total} · Gas reserve per purchase {gas} · Up to {actions} purchases",
  "collect.rules.deadline": "Expires {date}",
  "collect.rules.spent": "Confirmed spending {amount} · {actions} purchases",
  "collect.rules.error":
    "This rule could not be updated or no current listing meets its limits. Refresh the rule before trying again.",
  "collect.rules.refreshPlan":
    "Refresh this collecting plan to obtain verified unit prices before saving a rule.",
  "collect.rules.state.ACTIVE": "Active",
  "collect.rules.state.PAUSED": "Paused",
  "collect.rules.state.COMPLETED": "Completed",
  "collect.rules.state.EXPIRED": "Expired",
  "collect.rules.savedTargets": "{count} saved targets",
  "collect.rules.targetRemaining": "{count} still to acquire",
  "collect.rules.prepare": "Find purchase to review",
  "collect.rules.pending": "Open pending review",
  "collect.rules.pause": "Pause",
  "collect.rules.resume": "Resume",
  "collect.rules.refresh": "Refresh rule",
  "collect.rules.empty":
    "Save a rule from a reviewed set plan to keep its targets and limits here.",
  "collect.rules.limited": "Showing the most recent 100 rules.",
} as const;
