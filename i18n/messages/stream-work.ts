/**
 * 6529 Stream copy for the work page and the 1/1 English auction panel.
 * Placeholder until the owner approves the copy document.
 *
 * Fallback debt: `/stream/works/[id]` (the work page, the 1/1 panel and the
 * dev controls) has en-US copy only. Every other locale renders this en-US
 * text, as the whole `stream.*` namespace does (`lib/stream/README.md`,
 * "Localization"). Translations follow once the owner approves the copy.
 */
export const STREAM_WORK_MESSAGES = {
  "stream.workTime.utc": "{time} UTC",
  "stream.workAddress.museum": "6529 Network Museum",
  "stream.workAddress.auction": "1/1 auction custody",
  "stream.workAddress.you": "You",
  "stream.workAddress.youAs": "You ({name})",

  "stream.workPage.federated":
    "Federated · artist-owned · not curated by the network",
  "stream.workPage.burned":
    "Burned after an upheld dispute. Every bid was refunded.",

  "stream.workFacts.title": "About this token",
  "stream.workFacts.token": "Token",
  "stream.workFacts.media": "Media and storage",
  "stream.workFacts.rights": "Rights and money",
  "stream.workFacts.whatLabel": "What it is",
  "stream.workFacts.what.stream-1of1": "A 6529 Stream 1/1 (ERC-721)",
  "stream.workFacts.what.stream-edition":
    "An edition in 6529 Stream Editions (ERC-1155)",
  "stream.workFacts.what.federated-721":
    "A federated 1/1 (ERC-721) in the artist's contract",
  "stream.workFacts.what.federated-1155":
    "A federated edition (ERC-1155) in the artist's contract",
  "stream.workFacts.what.federated-pair-master":
    "The 1/1 half of a federated pair (ERC-721)",
  "stream.workFacts.what.federated-pair-edition":
    "The editions half of a federated pair (ERC-1155)",
  "stream.workFacts.issuerLabel": "Issued by",
  "stream.workFacts.issuer.canonical": "6529 Stream, after a network vote",
  "stream.workFacts.issuer.federated":
    "Artist-owned contract, not curated by the network",
  "stream.workFacts.contractLabel": "Contract",
  "stream.workFacts.contract.stream": "6529 Stream",
  "stream.workFacts.contract.editions": "6529 Stream Editions",
  "stream.workFacts.contract.federated": "{name} ({symbol})",
  "stream.workFacts.tokenId": "Token #{id}",
  "stream.workFacts.artists": "Artists",
  "stream.workFacts.collaborator": "Collaborator",
  "stream.workFacts.linkedLabel": "Linked",
  "stream.workFacts.linked.none": "None",
  "stream.workFacts.linked.editions": "Its editions",
  "stream.workFacts.linked.master": "Edition of",
  "stream.workFacts.linked.token": "{name} #{id}",
  "stream.workFacts.ownerLabel": "Owner",
  "stream.workFacts.owner.burned": "None: burned",
  "stream.workFacts.owner.none": "None",
  "stream.workFacts.owner.pending": "Pending delivery to",
  "stream.workFacts.owner.custody": "The 1/1 auction, until it settles",
  "stream.workFacts.supplyLabel": "Supply",
  "stream.workFacts.supply.void": "None: the edition auction is void",
  "stream.workFacts.supply.noBids": "None: no edition bids",
  "stream.workFacts.supply.sold": "{count} sold · {minted} claimed",
  "stream.workFacts.supply.notYet": "None yet: editions mint after the close",
  "stream.workFacts.cap": "Cap",
  "stream.workFacts.saleLabel": "Sale",
  "stream.workFacts.sale.unknown": "{kind} (not shown in this version)",
  "stream.workFacts.sale.id": "Sale {id}",
  "stream.workFacts.notMinted": "Not minted yet",
  "stream.workFacts.art": "Art",
  "stream.workFacts.file": "{type} · {size} KB",
  "stream.workFacts.generated": "Generated sample art",
  "stream.workFacts.storageLabel": "Storage",
  "stream.workFacts.storage.on-chain":
    "Every file is in the on-chain content store.",
  "stream.workFacts.storage.partly-on-chain":
    "Partly stored on-chain. Arweave and IPFS hold full copies.",
  "stream.workFacts.storage.off-chain": "Stored on Arweave and IPFS.",
  "stream.workFacts.served": "Served copy",
  "stream.workFacts.preview": "Preview",
  "stream.workFacts.hash": "Content hash",
  "stream.workFacts.record.finalized": "Version {version} · finalized",
  "stream.workFacts.record.open": "Version {version} · open",
  "stream.workFacts.license.irrevocable": "Irrevocable",
  "stream.workFacts.license.revocable": "Named in the package",
  "stream.workFacts.license.custom": "Custom text, stored with the record",
  "stream.workFacts.splitLabel": "Primary sale",
  "stream.workFacts.splitValue": "{artist} artist side · {network} network",
  "stream.workFacts.royaltyLabel": "Royalty",
  "stream.workFacts.royaltyValue": "{rate} of resales (ERC-2981)",
  "stream.workFacts.dispute": "Dispute statement",

  "stream.workSales.none": "No sale for this token.",
  "stream.workSales.master": "The 1/1",
  "stream.workSales.masterRule":
    "These editions close {minutes} min after the 1/1's final end: {time}.",

  "stream.workHistory.caption": "History of {title}, newest first",
  "stream.workHistory.when": "When",
  "stream.workHistory.event": "Event",
  "stream.workHistory.amount": "Amount",
  "stream.workStatements.statement": "Statement",
  "stream.workStatements.meta": "{role} · {kind}",
  "stream.workStatements.role.ARTIST": "Artist",
  "stream.workStatements.role.OWNER": "Owner",
  "stream.workStatements.role.CURATOR": "Curator",
  "stream.workStatements.role.PLATFORM": "Platform",
  "stream.workStatements.kind.DISPUTE_OUTCOME": "Dispute outcome",
  "stream.workStatements.kind.DELISTING": "Delisting",
  "stream.workStatements.kind.RELISTING": "Relisting",
  "stream.provenance.bid-withdrawn": "Bid withdrawn",

  "stream.english.currentBid": "Current bid",
  "stream.english.finalBid": "Final bid",
  "stream.english.noBid": "No bids yet",
  "stream.english.noHighBid": "No high bid",
  "stream.english.noBids": "No bids",
  "stream.english.leader": "High bidder",
  "stream.english.winner": "Winner",
  "stream.english.nextBid": "Next bid from",
  "stream.english.ends": "Ends",
  "stream.english.endedAt": "Ended",
  "stream.english.end.paused": "On hold",
  "stream.english.end.cancelled": "Cancelled",
  "stream.english.notStarted": "Not started.",
  "stream.english.rule.increment":
    "Each bid beats the last by {share} or {floor}, whichever is more.",
  "stream.english.rule.antiSnipe":
    "A bid in the last {minutes} minutes moves the end to {minutes} minutes after it.",

  "stream.english.bid.label": "Your bid in ETH",
  "stream.english.bid.submit": "Place bid",
  "stream.english.bid.invalid": "Enter an amount in ETH, like 0.25.",
  "stream.english.bid.tooLow": "Too low: the minimum is {minimum}.",
  "stream.english.bid.minimum": "The minimum is {minimum}.",
  "stream.english.bid.leading": "You're the high bidder.",
  "stream.english.delistedBid":
    "This contract is delisted. Its auctions refuse bids.",
  "stream.english.settle.submit": "Settle",
  "stream.english.settle.anyone": "Anyone can settle.",
  "stream.english.withdraw.submit": "Withdraw my bid",
  "stream.english.withdraw.help": "It comes back as a credit you claim.",
  "stream.english.withdraw.onlyLeader": "The high bidder can withdraw.",
  "stream.english.delivery.to": "Send the work to",
  "stream.english.delivery.submit": "Claim delivery",
  "stream.english.delivery.help": "Use a wallet that accepts ERC-721 tokens.",
  "stream.english.delivery.invalid":
    "Enter a full address: 0x and 40 hex characters.",
  "stream.english.delivery.waiting":
    "Waiting for {name} to claim it, to any address.",
  "stream.english.credits.label": "Your credits: {amount}",
  "stream.english.credits.help": "From outbid and refunded 1/1 bids.",
  "stream.english.credits.submit": "Claim credits",

  "stream.english.paused.title": "Paused for a dispute",
  "stream.english.paused.stopped":
    "Bidding is stopped while a TDH vote decides.",
  "stream.english.paused.upheld":
    "Upheld: the token is burned and every bid refunded.",
  "stream.english.paused.rejected":
    "Rejected: the auction resumes with at least 24 hours to run.",
  "stream.english.paused.editions":
    "Edition bidding continues, and edition bidders can withdraw.",
  "stream.english.paused.reserve":
    "The high bid was withdrawn. The next bid must reach {amount}.",
  "stream.english.paused.since": "Paused",
  "stream.english.paused.decisionFrom": "Decision from",
  "stream.english.paused.expires": "Resumes by itself",
  "stream.english.ended.title": "Bidding has ended",
  "stream.english.ended.sold":
    "Settling sends the work to {name} and pays out.",
  "stream.english.ended.delisted":
    "The contract is delisted. Settling refunds the high bid and returns the work to its artist.",
  "stream.english.ended.toMuseum":
    "No bids. Settling sends the work to the 6529 Network Museum.",
  "stream.english.ended.toArtist":
    "No bids. Settling returns the work to its artist.",
  "stream.english.sold.title": "Sold to {name} for {price}",
  "stream.english.sold.delivered": "Delivered to the winner.",
  "stream.english.sold.refused": "The winner's wallet refused the token.",
  "stream.english.sold.pending": "It waits here until the winner claims it.",
  "stream.english.sold.artistSide": "Artist side ({share})",
  "stream.english.sold.network": "Network ({share})",
  "stream.english.unsold.noBids": "No bids",
  "stream.english.unsold.noWinner": "No winning bid",
  "stream.english.unsold.delisted": "Unsold: the contract was delisted",
  "stream.english.unsold.museum": "The work went to the 6529 Network Museum.",
  "stream.english.unsold.artist": "The work went back to its artist.",
  "stream.english.unsold.museumLink": "See the museum →",
  "stream.english.cancelled.title":
    "Dispute upheld: sale cancelled, token burned",
  "stream.english.cancelled.refunded": "The high bid came back as a credit.",
  "stream.english.cancelled.editions":
    "The edition auction is void. Every edition bid is refunded in full.",
  "stream.english.cancelled.statement": "Outcome: {summary}",
  "stream.english.resumed":
    "A dispute paused this auction for {time}. It resumed without a cancel.",

  "stream.english.times.title": "Times",
  "stream.english.times.start": "Started",
  "stream.english.times.scheduled": "Scheduled end",
  "stream.english.times.end": "End",
  "stream.english.times.endPaused": "Set when the auction resumes",
  "stream.english.times.moved": "Moved by late bids",
  "stream.english.times.movedByResume": "Set when the auction resumed",
  "stream.english.times.editions": "Editions close",
  "stream.english.times.editionsAfter":
    "{minutes} min after the 1/1's final end",
  "stream.english.times.editionsAfterResume":
    "{minutes} min after the 1/1's end, once it resumes",
  "stream.english.times.editionsAfterSoft":
    "{minutes} min after the 1/1's final end, extended by late edition bids",
  "stream.english.times.editionsVoid": "Void: refunded in full.",
  "stream.english.times.editionsLink": "Edition bidding →",
  "stream.english.history.title": "Bid history",
  "stream.english.history.empty": "No bids yet.",
  "stream.english.history.none": "No bids.",
  "stream.english.history.bidder": "Bidder",
  "stream.english.history.amount": "Bid",
  "stream.english.history.placed": "Placed",
  "stream.english.history.leading": "Leading",
  "stream.english.history.won": "Won",
  "stream.english.history.outbid": "Outbid · credited back",
  "stream.english.history.refunded": "Refunded as a credit",
  "stream.english.history.extended": "Moved the end to",

  "stream.devWork.title": "This page: {title}",
  "stream.devWork.contract": "This page: a federated contract",
  "stream.devWork.dispute": "Dispute",
  "stream.devWork.pause": "Guardian: pause",
  "stream.devWork.toDecision": "Skip to decision time",
  "stream.devWork.uphold": "Vote: uphold",
  "stream.devWork.reject": "Vote: reject",
  "stream.devWork.delist": "Vote: delist contract",
  "stream.devWork.relist": "Vote: relist contract",
} as const;
