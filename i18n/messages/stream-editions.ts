/**
 * `stream.editionAuction.*` and `stream.editionPages.*`: the 6529 Stream
 * Editions auction panel and the /stream/editions pages (lane FE2). Placeholder
 * copy until the owner approves COPY.md: one short sentence per idea.
 */
export const STREAM_EDITION_MESSAGES = {
  "stream.badge.edition.settling": "Settling",

  "stream.editionAuction.editions.one": "{count} edition",
  "stream.editionAuction.editions.other": "{count} editions",
  "stream.editionAuction.tag.in": "In",
  "stream.editionAuction.tag.partly": "{won} of {qty} in",
  "stream.editionAuction.tag.out": "Out",

  "stream.editionAuction.result.title": "6529 Stream Editions",
  "stream.editionAuction.result.ifNow": "If bidding closed now",
  "stream.editionAuction.result.closed": "Closed",
  "stream.editionAuction.result.final": "Final",
  "stream.editionAuction.result.void": "Void",
  "stream.editionAuction.result.notOpen": "Not open yet",
  "stream.editionAuction.result.noBidsYet": "No bids yet",
  "stream.editionAuction.result.noEditions": "No editions",
  "stream.editionAuction.result.unitOne": "edition at",
  "stream.editionAuction.result.unitOther": "editions at",
  "stream.editionAuction.result.each": "ETH each",
  "stream.editionAuction.result.short": "{count} at {price}",
  "stream.editionAuction.result.firstBid":
    "The first bid sets the price. If nobody bids, no editions are made.",
  "stream.editionAuction.result.nobody": "Nobody bid, so none were made.",
  "stream.editionAuction.result.voidLine":
    "The 1/1 was cancelled, so this sale is void. Every bid is refunded in full.",
  "stream.editionAuction.result.raised":
    "{revenue} ETH raised: {artist} to the artist, {network} to the network.",
  "stream.editionAuction.result.cap": "The artist capped it at {cap}.",
  "stream.editionAuction.result.was": "Was {was} until {time} UTC.",
  "stream.editionAuction.close.label": "Editions close",
  "stream.editionAuction.close.closedLabel": "Editions closed",
  "stream.editionAuction.close.at": "{time} UTC",
  "stream.editionAuction.close.rule":
    "{offset} minutes after the 1/1 ends. A bid in the last {window} minutes moves the close to {window} minutes after it, up to {latest} UTC at the latest.",
  "stream.editionAuction.close.moved":
    "Moved from {base} by late bids. It can move until {latest} UTC at the latest.",
  "stream.editionAuction.close.disputed":
    "The 1/1 is paused for a dispute. The close follows it when it resumes.",

  "stream.editionAuction.book.title": "Bids",
  "stream.editionAuction.book.aside": "{bids} bids · {wanted} wanted",
  "stream.editionAuction.book.empty":
    "No bids yet. Bids appear here from the highest price down.",
  "stream.editionAuction.book.caption":
    "Edition bids by price, highest first, with the price line",
  "stream.editionAuction.book.price": "Price (ETH)",
  "stream.editionAuction.book.editions": "Editions",
  "stream.editionAuction.book.total": "Total so far",
  "stream.editionAuction.book.status": "Status",
  "stream.editionAuction.book.yours": "· {units} yours",
  "stream.editionAuction.book.allYours": "· yours",
  "stream.editionAuction.book.line": "Price line: {count} at {price} ETH",
  "stream.editionAuction.book.lineCap":
    "Price line: {count} at {price} ETH (the cap)",
  "stream.editionAuction.book.rule":
    "Highest bids get in first. Everyone above the line pays the line's price.",
  "stream.editionAuction.book.queue": "At the line, earlier bids come first.",
  "stream.editionAuction.book.gap":
    "A raised bid left a gap at the line. Settlement closes it, so the next bids move up.",
  "stream.editionAuction.book.moreOne": "Show {count} lower price",
  "stream.editionAuction.book.moreOther": "Show {count} lower prices",
  "stream.editionAuction.book.fewer": "Show fewer",

  "stream.editionAuction.why.title": "Why this many",
  "stream.editionAuction.why.titleOne": "Why {count} edition",
  "stream.editionAuction.why.titleOther": "Why {count} editions",
  "stream.editionAuction.why.empty":
    "Once there are bids, this shows how the number of editions is chosen.",
  "stream.editionAuction.why.void":
    "The sale is void, so no editions are made.",
  "stream.editionAuction.why.rule":
    "Each row is one possible result: editions × price = ETH raised.",
  "stream.editionAuction.why.listLabel": "Possible results",
  "stream.editionAuction.why.row": "{count} × {price}",
  "stream.editionAuction.why.sells": "sells",
  "stream.editionAuction.why.most": "most",
  "stream.editionAuction.why.verdictMost":
    "{count} at {price} raises the most, so {count} sell.",
  "stream.editionAuction.why.verdictBreadth":
    "{bestCount} at {bestPrice} raises the most, but {count} at {price} is within {margin} of it and sells more, so it wins.",
  "stream.editionAuction.why.cap": "The artist's cap stops it at {cap}.",
  "stream.editionAuction.why.note":
    "A larger number that reaches the dashed line ({share} of the most) wins instead.",

  "stream.editionAuction.yours.title": "Your bids",
  "stream.editionAuction.yours.aside": "{won} of {wanted} in",
  "stream.editionAuction.yours.connect": "Choose an account to bid.",
  "stream.editionAuction.yours.noneYet": "You have no bids yet.",
  "stream.editionAuction.yours.noneHad": "You had no bids.",
  "stream.editionAuction.yours.winNow":
    "If it closed now: {editions} for {pay} ETH.",
  "stream.editionAuction.yours.winFinal": "You get {editions} for {pay} ETH.",
  "stream.editionAuction.yours.noneNow":
    "None of your bids are in right now. All {held} ETH would come back.",
  "stream.editionAuction.yours.noneFinal":
    "None of your bids got in. All {held} ETH comes back.",
  "stream.editionAuction.yours.voidSummary":
    "The sale is void. All {held} ETH comes back.",
  "stream.editionAuction.yours.backNow": "{back} ETH would come back.",
  "stream.editionAuction.yours.backFinal": "{back} ETH comes back.",
  "stream.editionAuction.yours.bid": "{qty} at {price}",
  "stream.editionAuction.yours.pays": "Pays {price} each. {back} ETH back.",
  "stream.editionAuction.yours.setsPrice": "This bid sets the price.",
  "stream.editionAuction.yours.partly":
    "{won} of {qty} get in. Earlier bids at this price come first.",
  "stream.editionAuction.yours.below": "Below the price line.",
  "stream.editionAuction.yours.queued":
    "At the price line, behind earlier bids.",
  "stream.editionAuction.yours.allBack": "All {amount} ETH comes back.",
  "stream.editionAuction.yours.voidBack": "Refunded in full: {amount} ETH.",
  "stream.editionAuction.yours.withdrawn": "Withdrawn. {amount} ETH returned.",
  "stream.editionAuction.yours.claimed": "Claimed.",
  "stream.editionAuction.yours.raise":
    "Raise to {price} to get in · +{cost} ETH",
  "stream.editionAuction.yours.raiseMoves":
    "That moves everyone's price to {price} ({editions}).",
  "stream.editionAuction.yours.noRaise":
    "No raise gets all of it in right now.",
  "stream.editionAuction.yours.withdraw": "Withdraw · {amount} ETH back",

  "stream.editionAuction.box.title": "Place a bid",
  "stream.editionAuction.box.price": "Price per edition (ETH)",
  "stream.editionAuction.box.lower": "One step lower",
  "stream.editionAuction.box.higher": "One step higher",
  "stream.editionAuction.box.steps": "Prices move in steps of about 5%.",
  "stream.editionAuction.box.snapped":
    "Prices move in steps of about 5%. Using {price}.",
  "stream.editionAuction.box.priceError":
    "Enter a price from {min} to {max} ETH.",
  "stream.editionAuction.box.qty": "Editions",
  "stream.editionAuction.box.fewer": "One fewer",
  "stream.editionAuction.box.more": "One more",
  "stream.editionAuction.box.qtyError": "Enter a whole number from 1 to {max}.",
  "stream.editionAuction.box.enter": "Enter a price and a number of editions.",
  "stream.editionAuction.box.wouldBeIn": "You'd be in",
  "stream.editionAuction.box.wouldGetSome": "You'd get {won} of {qty}",
  "stream.editionAuction.box.wouldBeOut": "You'd be out",
  "stream.editionAuction.box.setsPrice":
    "You'd set the price: {editions} at {price}.",
  "stream.editionAuction.box.priceStays": "Price stays {price}. {editions}.",
  "stream.editionAuction.box.priceMoves":
    "Price for everyone: {from} → {to}. {editions}.",
  "stream.editionAuction.box.pushesOut":
    "{editions} from other bids would drop out.",
  "stream.editionAuction.box.useOne": "Use {price} to get in",
  "stream.editionAuction.box.useAll": "Use {price} to get all {qty} in",
  "stream.editionAuction.box.bid": "Bid",
  "stream.editionAuction.box.bidAmount": "Bid {amount} ETH",
  "stream.editionAuction.box.closed": "Bidding closed",
  "stream.editionAuction.box.notOpen": "Not open yet",
  "stream.editionAuction.box.placed":
    "Bid placed: {qty} at {price}. {standing}",
  "stream.editionAuction.box.placed.in": "It is in.",
  "stream.editionAuction.box.placedPartly": "{won} of {qty} are in.",
  "stream.editionAuction.box.placed.out": "It is out for now.",
  "stream.editionAuction.box.fine":
    "You send the full amount now. After the close, anything above the final price comes back. If you are out, all of it comes back.",
  "stream.editionAuction.box.gas":
    "About {low}–{high} gas · Sepolia, estimated",

  "stream.editionAuction.activity.title": "Activity",
  "stream.editionAuction.activity.empty": "No bids yet.",
  "stream.editionAuction.activity.you": "You",
  "stream.editionAuction.activity.opened": "Bidding opened",
  "stream.editionAuction.activity.bid": "bid {qty} at {price}",
  "stream.editionAuction.activity.raised": "raised {qty} from {from} to {to}",
  "stream.editionAuction.activity.moved": "close moved to {time}",
  "stream.editionAuction.activity.withdrew":
    "withdrew a bid · {amount} ETH back",
  "stream.editionAuction.activity.closed":
    "Bidding closed: {editions} at {price}",
  "stream.editionAuction.activity.closedNone":
    "Bidding closed with no edition bids",
  "stream.editionAuction.activity.scanned": "Settling: {words} words left",
  "stream.editionAuction.activity.cleared":
    "Paid: {artist} ETH to the artist, {network} ETH to the network",
  "stream.editionAuction.activity.swept": "Settling: {gaps} gaps left",
  "stream.editionAuction.activity.settled": "Settled: {editions}. Claims open.",
  "stream.editionAuction.activity.settledNone": "Settled: no editions",
  "stream.editionAuction.activity.voided": "Void: every bid is refunded",
  "stream.editionAuction.activity.claimed":
    "claimed {editions} and {amount} ETH",
  "stream.editionAuction.activity.refunded": "claimed a {amount} ETH refund",

  "stream.editionAuction.banner.notOpen":
    "The editions sale opens with the 1/1. Anyone can open it.",
  "stream.editionAuction.banner.open": "Open the sale",
  "stream.editionAuction.banner.lastMinutes": "Last {window} minutes.",
  "stream.editionAuction.banner.lastMinutesRule":
    "Each bid now moves the close to {window} minutes after it.",
  "stream.editionAuction.banner.oneLast":
    "The 1/1 is in its last {window} minutes.",
  "stream.editionAuction.banner.oneLastRule":
    "A late bid on the 1/1 also moves this close.",
  "stream.editionAuction.banner.noOneBidsMuseum":
    "The 1/1 drew no bids and goes to the 6529 Network Museum.",
  "stream.editionAuction.banner.noOneBidsArtist":
    "The 1/1 drew no bids and goes back to its artist.",
  "stream.editionAuction.banner.stillSell": "The editions still sell.",
  "stream.editionAuction.banner.disputed": "The 1/1 is paused for a dispute.",
  "stream.editionAuction.banner.disputedRule":
    "Bidding continues, and you can withdraw a bid.",
  "stream.editionAuction.banner.void":
    "The 1/1 was cancelled, so this sale is void.",
  "stream.editionAuction.banner.voidSettle":
    "Anyone can settle it to open full refunds.",
  "stream.editionAuction.banner.voidDone":
    "Void: the 1/1 was cancelled. Every bid is refunded in full.",
  "stream.editionAuction.banner.closedResult":
    "Bidding closed: {editions} at {price} ETH.",
  "stream.editionAuction.banner.anyoneSettles":
    "Anyone can settle. Settling pays the artist and opens claims.",
  "stream.editionAuction.banner.oneFirst": "The 1/1 settles first.",
  "stream.editionAuction.banner.toOne": "Go to the 1/1",
  "stream.editionAuction.banner.settle": "Settle",
  "stream.editionAuction.banner.createAndSettle":
    "Create the edition and settle",
  "stream.editionAuction.banner.noBids":
    "Bidding closed with no edition bids. No editions are made.",
  "stream.editionAuction.banner.settlingWords":
    "Settling: {words} words left · anyone can continue.",
  "stream.editionAuction.banner.settlingGaps":
    "Settling: {gaps} gaps left · anyone can continue.",
  "stream.editionAuction.banner.settlingWait":
    "Bids, withdrawals and claims wait until it finishes.",
  "stream.editionAuction.banner.continue": "Continue",
  "stream.editionAuction.banner.settled": "Settled.",
  "stream.editionAuction.banner.claimNow": "Claim {what}.",
  "stream.editionAuction.banner.claim": "Claim",
  "stream.editionAuction.banner.claimed": "Claimed: {what}.",
  "stream.editionAuction.banner.settledResult":
    "Settled: {editions} at {price} ETH.",
  "stream.editionAuction.banner.settledNone": "Settled with no editions.",
  "stream.editionAuction.banner.editionsAndEth": "{editions} and {amount} ETH",
  "stream.editionAuction.banner.eth": "{amount} ETH",

  "stream.editionPages.list.intro":
    "Everyone who wins pays the same price; the number of editions is whatever raises the most.",
  "stream.editionPages.list.live": "Bidding now",
  "stream.editionPages.list.closed": "Closed",
  "stream.editionPages.list.done": "Settled",
  "stream.editionPages.list.result": "{editions} at {price} ETH",
  "stream.editionPages.list.noBidsYet": "No bids yet",
  "stream.editionPages.list.noEditions": "No editions",
  "stream.editionPages.list.void": "Void: refunded",
  "stream.editionPages.page.label": "6529 Stream Editions",
  "stream.editionPages.page.labelFederated": "Federated editions",
  "stream.editionPages.page.by": "by",
  "stream.editionPages.one.label": "The 1/1 · English auction",
  "stream.editionPages.one.link": "{title} →",
  "stream.editionPages.one.none": "Not started",
  "stream.editionPages.one.noBidsYet": "No bids yet",
  "stream.editionPages.one.top": "{amount} ETH top bid · {bids} bids",
  "stream.editionPages.one.ends": "Ends {time} UTC.",
  "stream.editionPages.one.paused": "Paused for a dispute",
  "stream.editionPages.one.ended": "Ended, waiting to settle",
  "stream.editionPages.one.cancelled": "Cancelled after an upheld dispute",
  "stream.editionPages.one.sold": "Sold for {amount} ETH",
  "stream.editionPages.one.museum": "No bids: in the 6529 Network Museum",
  "stream.editionPages.one.artist": "No bids: back to the artist",
  "stream.editionPages.facts.title": "The edition",
  "stream.editionPages.facts.master": "Master",
  "stream.editionPages.facts.supply": "Editions",
  "stream.editionPages.facts.atClose": "Set at the close",
  "stream.editionPages.facts.settling": "Settling",
  "stream.editionPages.facts.none": "None",
  "stream.editionPages.facts.minted": "Minted so far",
  "stream.editionPages.facts.cap": "Artist cap",
  "stream.editionPages.facts.noCap": "No cap",
  "stream.editionPages.facts.license": "License",
  "stream.editionPages.facts.id": "Edition ID",
  "stream.editionPages.holders.title": "Holders",
  "stream.editionPages.holders.empty":
    "Holders appear after settlement, as winners claim.",
  "stream.editionPages.holders.caption": "Edition holders, largest first",
  "stream.editionPages.holders.holder": "Holder",
  "stream.editionPages.holders.editions": "Editions",
  "stream.editionPages.how.title": "How the editions auction works",
  "stream.editionPages.how.one":
    "Bid a price per edition and how many you want. It runs beside the 1/1 and closes 15 minutes after it.",
  "stream.editionPages.how.two":
    "At the close, the highest bids get in. Everyone who gets in pays the same price: the lowest price that got in.",
  "stream.editionPages.how.three":
    "The number of editions is the one that raises the most. If a larger number raises within 10% of that, the larger number wins.",
  "stream.editionPages.how.four":
    "Bids can be raised, not lowered. Anything you overpaid, and every losing bid, comes back in full.",
  "stream.editionPages.mock.label": "Mock",
  "stream.editionPages.mock.note": "Other bidders:",
  "stream.editionPages.mock.one": "+1 bidder",
  "stream.editionPages.mock.ten": "+10 bidders",
} as const;
