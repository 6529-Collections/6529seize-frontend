import { DISPUTE_DECISION_DELAY, ZERO_ADDRESS } from "@/lib/stream/constants";
import type { EnglishAuctionActions } from "@/lib/stream/dataSource";
import {
  deriveState,
  endAfterBid,
  LAUNCH_RULES,
  minimumBid,
  pauseExpiry,
  resumedEnd,
} from "@/lib/stream/englishAuction";
import { later, type MockStreamEngine, revert } from "@/lib/stream/mock/engine";
import { mockHash } from "@/lib/stream/mock/ids";
import type { MockEnglishAuction } from "@/lib/stream/mock/state";
import type {
  Address,
  EnglishAuctionState,
  OneOfOneAuction,
  Wei,
  WorkKey,
} from "@/lib/stream/types";

/** `saleIdOf(token, tokenId)`: on-chain keccak256(abi.encode(token, tokenId)). */
function englishSaleId(token: Address, tokenId: bigint): string {
  return mockHash(`sale:english:${token.toLowerCase()}:${tokenId}`);
}

export function findEnglishAuction(
  engine: MockStreamEngine,
  saleId: string
): MockEnglishAuction {
  const auction = engine.state.englishAuctions.get(saleId);
  if (!auction) {
    revert("UnknownSale", { saleId });
  }
  syncPauseExpiry(engine, auction);
  return auction;
}

/**
 * A pause ends by itself after 7 days; the auction resumes to its resumed end.
 * As the contract, it is still PAUSED through `pausedAt + MAX_PAUSE` inclusive.
 */
export function syncPauseExpiry(
  engine: MockStreamEngine,
  auction: MockEnglishAuction
): void {
  if (auction.stored !== "PAUSED" || auction.pausedAt === null) {
    return;
  }
  const expiry = pauseExpiry(auction.pausedAt);
  if (engine.now() <= expiry) {
    return;
  }
  auction.endTime = resumedEnd(auction, expiry);
  auction.pausedTotal += expiry - auction.pausedAt;
  auction.pausedAt = null;
  auction.stored = "ACTIVE";
}

export function englishState(
  engine: MockStreamEngine,
  auction: MockEnglishAuction
): EnglishAuctionState {
  syncPauseExpiry(engine, auction);
  return deriveState(auction, engine.now());
}

/** `start`: mints the token into custody and starts its 24-hour clock. */
export function startEnglishAuction(
  engine: MockStreamEngine,
  work: WorkKey,
  startTime: number = engine.now()
): MockEnglishAuction {
  const token = engine.token(work);
  const saleId = englishSaleId(token.token, token.tokenId);
  const auction: MockEnglishAuction = {
    saleId,
    work,
    program: token.program,
    startTime,
    endTime: startTime + LAUNCH_RULES.duration,
    bidder: null,
    recipient: null,
    bid: 0n,
    bids: [],
    pausedAt: null,
    pausedTotal: 0,
    pauseUsed: false,
    stored: "ACTIVE",
    settlement: null,
    pendingDelivery: null,
    refusingRecipients: [],
  };
  engine.state.englishAuctions.set(saleId, auction);
  token.owner = engine.contracts.englishAuction;
  token.sale = {
    kind: "ENGLISH_AUCTION",
    adapter: engine.contracts.englishAuction,
    saleId,
  };
  engine.record(work, {
    kind: "auction-started",
    actor: null,
    source: "ISaleAdapter.SaleStarted",
    at: startTime,
  });
  return auction;
}

/** Not `IFederationRegistry.isActive`: the contract or its artist is delisted. */
function isDelisted(engine: MockStreamEngine, work: WorkKey): boolean {
  const contract = engine.token(work).federatedContract;
  if (contract === null) {
    return false;
  }
  const entry = engine.state.federated.get(contract);
  return entry?.status !== "ACTIVE" || entry.artistDelisted;
}

/** A delisted contract cannot sell through the network's adapters. */
export function assertListed(engine: MockStreamEngine, work: WorkKey): void {
  if (isDelisted(engine, work)) {
    revert("TargetNotAllowed", {
      token: engine.token(work).federatedContract ?? "",
    });
  }
}

export function placeEnglishBid(
  engine: MockStreamEngine,
  auction: MockEnglishAuction,
  from: Address,
  amount: Wei,
  recipient: Address = from
): void {
  const state = englishState(engine, auction);
  if (state !== "ACTIVE") {
    revert("InvalidAuctionState", { state });
  }
  assertListed(engine, auction.work);
  const required = minimumBid(auction);
  if (amount < required) {
    revert("BidTooLow", {
      required: required.toString(),
      offered: amount.toString(),
    });
  }
  engine.debit(from, amount);
  if (auction.bidder !== null) {
    engine.addCredit(auction.bidder, auction.bid);
  }
  const now = engine.now();
  const endTime = endAfterBid(auction.endTime, now);
  auction.bids.push({
    bidder: from,
    recipient,
    amount,
    endTime,
    at: now,
    extended: endTime > auction.endTime,
    txHash: engine.pendingTxHash(),
  });
  auction.endTime = endTime;
  auction.bidder = from;
  auction.recipient = recipient;
  auction.bid = amount;
  engine.record(auction.work, {
    kind: "bid",
    actor: from,
    amount,
    source: "IEnglishAuction.BidPlaced",
  });
}

/**
 * An unsold 1/1 (owner decision 17). 6529 Stream records the outcome and
 * moves a canonical work from the auction's custody to the museum itself
 * (`settlePrimary` returns the museum as `holder`; nothing is pending). Any
 * other token's work goes to its artist, delivered by the auction.
 */
function settleUnbid(
  engine: MockStreamEngine,
  auction: MockEnglishAuction,
  outcome: "UNBID" | "FROZEN_OUT"
) {
  const token = engine.token(auction.work);
  const now = engine.now();
  if (auction.program === "canonical") {
    const museum = engine.museumAddress();
    token.owner = museum;
    engine.state.museum.push({
      work: auction.work,
      arrivedAt: now,
      reason: outcome === "UNBID" ? "no-bids" : "freeze-exit",
      txHash: engine.pendingTxHash(),
    });
    engine.record(auction.work, {
      kind: "to-museum",
      actor: engine.contracts.stream,
      source: `IStream.PrimarySaleSettled(${outcome}) + ERC721.Transfer(→ museum), by 6529 Stream`,
    });
    return { outcome: "museum" as const, to: museum };
  }
  const artist = engine.state.artists.get(token.artistId);
  // While a recovery override is pending nobody may act as the artist, and
  // settlement waits for its outcome (IDENTITY-1). The contract then reverts
  // with `InvalidRecipient(address(0))`: the token reports no creator.
  const restrained =
    artist?.restrainedUntil !== undefined &&
    artist.restrainedUntil !== null &&
    engine.now() < artist.restrainedUntil;
  if (artist === undefined || restrained) {
    revert("InvalidRecipient", { recipient: ZERO_ADDRESS });
  }
  token.owner = artist.authority;
  engine.record(auction.work, {
    kind: "to-artist",
    actor: null,
    source: "ISaleAdapter.SaleSettled + ERC721.Transfer(→ artist)",
  });
  return { outcome: "artist" as const, to: artist.authority };
}

export function settleEnglishAuction(
  engine: MockStreamEngine,
  auction: MockEnglishAuction
): void {
  const state = englishState(engine, auction);
  if (state !== "ENDED") {
    revert("InvalidAuctionState", { state });
  }
  const token = engine.token(auction.work);
  const now = engine.now();
  // MARKET-5: a delisted federated contract's sale ends unsold (FROZEN_OUT);
  // any standing bid is credited back.
  const frozenOut = isDelisted(engine, auction.work);
  if (auction.bidder !== null && frozenOut) {
    engine.addCredit(auction.bidder, auction.bid);
    auction.bidder = null;
    auction.recipient = null;
  }
  // `IMintTarget.settlePrimary`: the token records the outcome first.
  token.primarySale =
    auction.bidder === null
      ? {
          outcome: frozenOut ? "FROZEN_OUT" : "UNBID",
          currency: ZERO_ADDRESS,
          price: 0n,
        }
      : { outcome: "SOLD", currency: ZERO_ADDRESS, price: auction.bid };
  if (auction.bidder === null) {
    const unbid = settleUnbid(
      engine,
      auction,
      frozenOut ? "FROZEN_OUT" : "UNBID"
    );
    auction.settlement = {
      ...unbid,
      price: 0n,
      fee: 0n,
      sellerProceeds: 0n,
      at: now,
    };
  } else {
    const paid = engine.payPrimary(
      token.economics.seller,
      token.economics.feeShare,
      auction.bid
    );
    const to = auction.recipient ?? auction.bidder;
    if (auction.refusingRecipients.includes(to)) {
      auction.pendingDelivery = to;
      engine.record(auction.work, {
        kind: "delivery-pending",
        actor: to,
        source: "IEnglishAuction.DeliveryPending",
      });
    } else {
      token.owner = to;
    }
    auction.settlement = {
      outcome: "collector",
      to,
      price: auction.bid,
      fee: paid.fee,
      sellerProceeds: paid.seller,
      at: now,
    };
    engine.record(auction.work, {
      kind: "settled",
      actor: to,
      amount: auction.bid,
      source: "ISaleAdapter.SaleSettled",
    });
  }
  auction.stored = "SETTLED";
  token.primarySaleSettled = true;
}

export function pauseEnglishAuction(
  engine: MockStreamEngine,
  auction: MockEnglishAuction
): void {
  const state = englishState(engine, auction);
  if (state !== "ACTIVE") {
    revert("InvalidAuctionState", { state });
  }
  if (auction.pauseUsed) {
    revert("PauseExhausted", { saleId: auction.saleId });
  }
  auction.stored = "PAUSED";
  auction.pausedAt = engine.now();
  auction.pauseUsed = true;
  engine.record(auction.work, {
    kind: "dispute-paused",
    actor: null,
    source: "IEnglishAuction.AuctionPaused",
  });
}

/** The TDH vote outcome: upheld cancels and burns; rejected resumes. */
export function resolveEnglishDispute(
  engine: MockStreamEngine,
  auction: MockEnglishAuction,
  upheld: boolean
): void {
  const state = englishState(engine, auction);
  if (state !== "PAUSED" || auction.pausedAt === null) {
    revert("InvalidAuctionState", { state });
  }
  const allowedAt = auction.pausedAt + DISPUTE_DECISION_DELAY;
  const now = engine.now();
  if (now < allowedAt) {
    revert("UnpauseTooEarly", { allowedAt });
  }
  auction.pausedTotal += now - auction.pausedAt;
  if (upheld) {
    if (auction.bidder !== null) {
      engine.addCredit(auction.bidder, auction.bid);
    }
    const token = engine.token(auction.work);
    token.burned = true;
    token.owner = null;
    auction.stored = "CANCELLED";
    auction.settlement = {
      outcome: "burned",
      to: null,
      price: 0n,
      fee: 0n,
      sellerProceeds: 0n,
      at: now,
    };
    engine.record(auction.work, {
      kind: "dispute-cancelled",
      actor: null,
      source: "IEnglishAuction.AuctionCancelled",
    });
  } else {
    auction.endTime = resumedEnd(auction, now);
    auction.stored = "ACTIVE";
    engine.record(auction.work, {
      kind: "dispute-resumed",
      actor: null,
      source: "IEnglishAuction.AuctionResumed",
    });
  }
  auction.pausedAt = null;
}

export function englishView(
  engine: MockStreamEngine,
  auction: MockEnglishAuction
): OneOfOneAuction {
  const token = engine.token(auction.work);
  const state = englishState(engine, auction);
  return {
    saleId: auction.saleId,
    work: auction.work,
    token: token.token,
    tokenId: token.tokenId,
    program: auction.program,
    currency: ZERO_ADDRESS,
    state,
    startTime: auction.startTime,
    endTime: auction.endTime,
    scheduledEnd: auction.startTime + LAUNCH_RULES.duration,
    config: {
      duration: LAUNCH_RULES.duration,
      extensionWindow: LAUNCH_RULES.extensionWindow,
      incrementShare: LAUNCH_RULES.incrementShare,
      incrementFloor: LAUNCH_RULES.incrementFloor,
    },
    bidder: auction.bidder,
    recipient: auction.recipient,
    bid: auction.bid,
    minimumBid: minimumBid(auction),
    bids: [...auction.bids],
    pause: {
      pausedAt: auction.pausedAt,
      pausedTotal: auction.pausedTotal,
      used: auction.pauseUsed,
      expiresAt:
        auction.pausedAt === null ? null : pauseExpiry(auction.pausedAt),
    },
    terms: {
      seller: token.economics.seller,
      feeRecipient: token.economics.feeRecipient,
      feeShare: token.economics.feeShare,
    },
    settlement: auction.settlement,
    pendingDelivery: auction.pendingDelivery,
  };
}

export function createEnglishActions(
  engine: MockStreamEngine
): EnglishAuctionActions {
  return {
    bid: (from, saleId, amount, recipient) =>
      later(() =>
        engine.tx("auctionBid", () => {
          placeEnglishBid(
            engine,
            findEnglishAuction(engine, saleId),
            from,
            amount,
            recipient ?? from
          );
        })
      ),
    settle: (_from, saleId) =>
      later(() =>
        engine.tx("auctionSettle", () => {
          settleEnglishAuction(engine, findEnglishAuction(engine, saleId));
        })
      ),
    claimDelivery: (from, saleId, to) =>
      later(() =>
        engine.tx(null, () => {
          const auction = findEnglishAuction(engine, saleId);
          if (auction.pendingDelivery !== from) {
            revert("NoPendingDelivery", { saleId });
          }
          engine.token(auction.work).owner = to;
          auction.pendingDelivery = null;
          engine.record(auction.work, {
            kind: "delivery-claimed",
            actor: from,
            source: "IEnglishAuction.DeliveryClaimed",
          });
        })
      ),
    withdrawBid: (from, saleId) =>
      later(() =>
        engine.tx(null, () => {
          const auction = findEnglishAuction(engine, saleId);
          const state = englishState(engine, auction);
          if (state !== "PAUSED") {
            revert("InvalidAuctionState", { state });
          }
          if (auction.bidder !== from) {
            revert("NotHighBidder", { caller: from });
          }
          engine.addCredit(from, auction.bid);
          auction.bidder = null;
          auction.recipient = null;
          engine.record(auction.work, {
            kind: "bid-withdrawn",
            actor: from,
            amount: auction.bid,
            source: "IEnglishAuction.BidWithdrawn",
          });
        })
      ),
    claimCredits: (from, to) =>
      later(() =>
        engine.tx(null, () => {
          const amount = engine.state.credits.get(from) ?? 0n;
          if (amount === 0n) {
            revert("NothingToClaim", { account: from, currency: ZERO_ADDRESS });
          }
          engine.state.credits.set(from, 0n);
          engine.creditBalance(to, amount);
          return amount;
        })
      ),
  };
}
