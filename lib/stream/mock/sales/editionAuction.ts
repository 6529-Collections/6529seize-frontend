import {
  EDITION_AUCTION_CONFIG,
  MAX_EDITION_BID_QTY,
} from "@/lib/stream/constants";
import { revenueThreshold } from "@/lib/stream/clearing";
import {
  addBid,
  type BookBid,
  type BookResult,
  clearBook,
  createBook,
  findBid,
  moveBid,
  raiseToGetIn,
  unitsAhead,
  whatIfBid,
  whatIfRaise,
  wonBy,
} from "@/lib/stream/editionBook";
import {
  acceptsBids,
  editionPhase,
  editionTimes,
  softEndAfterBid,
} from "@/lib/stream/editionTiming";
import { candidateRows, stepTotalRows } from "@/lib/stream/editionViews";
import { ladderPrices, nearestStep } from "@/lib/stream/ladder";
import { type MockStreamEngine, revert } from "@/lib/stream/mock/engine";
import { mockHash } from "@/lib/stream/mock/ids";
import {
  assertListed,
  englishState,
} from "@/lib/stream/mock/sales/englishAuction";
import type { MockEditionAuction } from "@/lib/stream/mock/state";
import type {
  Address,
  EditionActivity,
  EditionAuction,
  EditionAuctionPhase,
  EditionAuctionStatus,
  EditionAuctionTimes,
  EditionBidView,
  EditionCandidate,
  EditionClearing,
  EditionQuote,
  EditionSettlement,
  EditionStepTotal,
  EnglishAuctionState,
  Wei,
  WorkKey,
} from "@/lib/stream/types";

function editionSaleId(edition: WorkKey): string {
  return mockHash(`sale:edition:${edition}`);
}

const priceCache = new Map<string, Wei[]>();

/** Every step's price for an auction's locked ladder (cached per ladder). */
export function auctionPrices(auction: MockEditionAuction): Wei[] {
  const {
    basePrice: base,
    stepsPerDecade: perDecade,
    stepCount: steps,
  } = auction.terms;
  const key = `${base}:${perDecade}:${steps}`;
  let prices = priceCache.get(key);
  if (!prices) {
    prices = ladderPrices({
      basePrice: base,
      stepsPerDecade: perDecade,
      stepCount: steps,
    });
    priceCache.set(key, prices);
  }
  return prices;
}

export function findEditionAuction(
  engine: MockStreamEngine,
  edition: WorkKey
): MockEditionAuction {
  const auction = engine.state.editionAuctions.get(edition);
  if (!auction) {
    revert("UnknownAuction", { edition });
  }
  return auction;
}

/**
 * Registers the edition auction of `edition` (status NONE until `open`).
 * Terms lock now: the governed defaults, the creator cap and the payout terms.
 */
export function prepareEditionAuction(
  engine: MockStreamEngine,
  edition: WorkKey,
  options: {
    readonly master: WorkKey | null;
    readonly cap: number;
    readonly fixedAnchorEnd?: number;
  }
): MockEditionAuction {
  const token = engine.token(edition);
  const oneOfOneSaleId =
    options.master === null
      ? null
      : (engine.token(options.master).sale?.saleId ?? null);
  const auction: MockEditionAuction = {
    saleId: editionSaleId(edition),
    edition,
    master: options.master,
    program: token.program,
    status: "NONE",
    terms: {
      basePrice: EDITION_AUCTION_CONFIG.basePrice,
      stepsPerDecade: EDITION_AUCTION_CONFIG.stepsPerDecade,
      stepCount: EDITION_AUCTION_CONFIG.stepCount,
      marginShare: EDITION_AUCTION_CONFIG.marginShare,
      closeOffset: EDITION_AUCTION_CONFIG.closeOffset,
      softWindow: EDITION_AUCTION_CONFIG.softWindow,
      maxExtension: EDITION_AUCTION_CONFIG.maxExtension,
      maxCount: options.cap,
      feeShare: token.economics.feeShare,
      seller: token.economics.seller,
      feeRecipient: token.economics.feeRecipient,
    },
    openedAt: 0,
    softEnd: null,
    fixedAnchorEnd: options.fixedAnchorEnd ?? null,
    oneOfOneSaleId,
    book: createBook(EDITION_AUCTION_CONFIG.stepCount, options.cap),
    result: null,
    lowStep: null,
    highStep: null,
    settling: null,
    events: [],
  };
  engine.state.editionAuctions.set(edition, auction);
  token.sale = {
    kind: "UNIFORM_AUCTION",
    adapter: engine.contracts.editionAuction,
    saleId: auction.saleId,
  };
  return auction;
}

export function openPreparedAuction(
  engine: MockStreamEngine,
  auction: MockEditionAuction,
  at: number = engine.now()
): void {
  if (auction.status !== "NONE") {
    revert("AuctionExists", { saleId: auction.saleId });
  }
  if (auction.oneOfOneSaleId !== null) {
    const state = oneOfOneState(engine, auction);
    if (state === "NONE" || state === "CANCELLED") {
      revert("NoOneOfOneAuction", { master: auction.master ?? "" });
    }
  }
  auction.status = "OPEN";
  auction.openedAt = at;
  logEvent(engine, auction, { kind: "opened", source: "AuctionOpened" }, at);
}

type WithoutStamp<E> = E extends unknown ? Omit<E, "at" | "txHash"> : never;

/** Records one of the sale's events, as the chain source reads them from logs. */
export function logEvent(
  engine: MockStreamEngine,
  auction: MockEditionAuction,
  event: WithoutStamp<EditionActivity>,
  at: number = engine.now()
): void {
  auction.events.push({
    ...event,
    at,
    txHash: engine.pendingTxHash(),
  } as EditionActivity);
}

/** `Auction.lowStep` and `highStep`: every step any bid has used. */
function trackStep(auction: MockEditionAuction, step: number): void {
  auction.lowStep = Math.min(auction.lowStep ?? step, step);
  auction.highStep = Math.max(auction.highStep ?? step, step);
}

export function oneOfOneState(
  engine: MockStreamEngine,
  auction: MockEditionAuction
): EnglishAuctionState | null {
  if (auction.oneOfOneSaleId === null) {
    return null;
  }
  const oneOfOne = engine.state.englishAuctions.get(auction.oneOfOneSaleId);
  return oneOfOne ? englishState(engine, oneOfOne) : "NONE";
}

function anchorEnd(engine: MockStreamEngine, auction: MockEditionAuction) {
  if (auction.fixedAnchorEnd !== null) {
    return auction.fixedAnchorEnd;
  }
  const oneOfOne =
    auction.oneOfOneSaleId === null
      ? undefined
      : engine.state.englishAuctions.get(auction.oneOfOneSaleId);
  if (!oneOfOne) {
    return auction.openedAt;
  }
  // `endTimes` reads the 1/1's end as `IEnglishAuction.auction` reports it:
  // while it is paused, the stored end, not the end it will resume to. Bidding
  // stays open while paused (`withdrawalsOpen`), and the close moves when the
  // 1/1 resumes.
  return oneOfOne.endTime;
}

export function auctionTimes(
  engine: MockStreamEngine,
  auction: MockEditionAuction
): EditionAuctionTimes {
  return editionTimes(
    auction.openedAt,
    anchorEnd(engine, auction),
    auction.softEnd,
    auction.terms
  );
}

export function auctionPhase(
  engine: MockStreamEngine,
  auction: MockEditionAuction
): EditionAuctionPhase {
  return editionPhase({
    status: auction.status,
    times: auctionTimes(engine, auction),
    liveUnits: totalUnits(auction),
    settledCount: auction.result?.count ?? null,
    oneOfOneState: oneOfOneState(engine, auction),
    now: engine.now(),
  });
}

function totalUnits(auction: MockEditionAuction): number {
  return auction.book.live.reduce((sum, units) => sum + units, 0);
}

/** The stored result after settle, or the live clearing. */
function currentResult(auction: MockEditionAuction): BookResult {
  return (
    auction.result ??
    clearBook(auction.book, auctionPrices(auction), auction.terms.marginShare)
  );
}

export function clearingView(
  auction: MockEditionAuction,
  result: BookResult
): EditionClearing {
  const prices = auctionPrices(auction);
  const price = result.step === null ? 0n : (prices[result.step] ?? 0n);
  const revenue = BigInt(result.count) * price;
  const networkShare = (revenue * BigInt(auction.terms.feeShare)) / 100_000n;
  return {
    count: result.count,
    step: result.step,
    price,
    revenue,
    networkFee: networkShare,
    sellerShare: revenue - networkShare,
    rationed: result.rationed,
    cutUnits: result.cutUnits,
    cutoff: result.cutoff,
    bestRevenue: result.bestRevenue,
    threshold: revenueThreshold(result.bestRevenue, auction.terms.marginShare),
  };
}

function usedSteps(auction: MockEditionAuction): number[] {
  const steps: number[] = [];
  auction.book.live.forEach((units, step) => {
    if (units > 0) {
      steps.push(step);
    }
  });
  return steps;
}

export function editionAuctionView(
  engine: MockStreamEngine,
  auction: MockEditionAuction
): EditionAuction {
  const used = usedSteps(auction);
  const state = oneOfOneState(engine, auction);
  const token = engine.token(auction.edition);
  const phase = auctionPhase(engine, auction);
  return {
    saleId: auction.saleId,
    edition: auction.edition,
    master: auction.master,
    program: auction.program,
    status: viewStatus(auction, phase),
    phase,
    terms: auction.terms,
    times: auctionTimes(engine, auction),
    liveUnits: totalUnits(auction),
    bidCount: auction.book.bids.length,
    lowStep: used[0] ?? null,
    highStep: used.at(-1) ?? null,
    clearing:
      auction.status === "VOID"
        ? clearingView(auction, {
            ...currentResult(auction),
            count: 0,
            step: null,
          })
        : clearingView(auction, currentResult(auction)),
    oneOfOne:
      auction.oneOfOneSaleId === null || state === null
        ? null
        : { saleId: auction.oneOfOneSaleId, state },
    settled: auction.status === "SETTLED",
    biddingOpen: acceptsBids(phase),
    withdrawalsOpen: phase === "disputed",
    editionCreated: token.created,
    settlement: settlementView(auction),
  };
}

function settlementView(auction: MockEditionAuction): EditionSettlement | null {
  const settling = auction.settling;
  if (settling === null || auction.status === "VOID") {
    return null;
  }
  return {
    cleared: settling.cleared,
    wordsLeft: settling.cleared ? 0 : settling.cursor - settling.low,
    cutUnits: settling.cutUnits,
    cutoff: settling.cutoff,
    departuresSwept: settling.departuresSwept,
    departures: settling.departures,
  };
}

/** `AuctionStatus` as the contract reports it: CLOSED is OPEN past its end. */
function viewStatus(
  auction: MockEditionAuction,
  phase: EditionAuctionPhase
): EditionAuctionStatus {
  if (auction.status !== "OPEN") {
    return auction.status;
  }
  return phase === "closed" || phase === "noBids" ? "CLOSED" : "OPEN";
}

export function stepTotalsView(
  auction: MockEditionAuction
): EditionStepTotal[] {
  const live = currentResult(auction);
  const result =
    auction.status === "VOID" ? { ...live, step: null, rationed: false } : live;
  return stepTotalRows(
    auction.book.live,
    auctionPrices(auction),
    auction.terms.maxCount,
    result
  );
}

export function candidatesView(
  auction: MockEditionAuction
): EditionCandidate[] {
  return candidateRows(
    currentResult(auction),
    auctionPrices(auction),
    auction.terms.marginShare
  );
}

function bidStatus(won: number, qty: number): EditionBidView["status"] {
  if (won >= qty) {
    return "in";
  }
  return won > 0 ? "partly" : "out";
}

export function bidView(
  engine: MockStreamEngine,
  auction: MockEditionAuction,
  bid: BookBid
): EditionBidView {
  const prices = auctionPrices(auction);
  const price = prices[bid.step] ?? 0n;
  const escrow = BigInt(bid.quantity) * price;
  const isVoid = auction.status === "VOID";
  const result = currentResult(auction);
  const won = isVoid ? 0 : wonBy(bid, result);
  const clearingPrice = result.step === null ? 0n : (prices[result.step] ?? 0n);
  const status = bidStatus(won, bid.quantity);
  const canRaise =
    status !== "in" &&
    !bid.withdrawn &&
    acceptsBids(auctionPhase(engine, auction));
  return {
    bidId: bid.id,
    bidder: bid.bidder,
    step: bid.step,
    price,
    quantity: bid.quantity,
    position: bid.position,
    escrow,
    placedAt: bid.placedAt,
    status,
    unitsWon: won,
    refund: bid.withdrawn ? 0n : escrow - BigInt(won) * clearingPrice,
    unitsAhead: unitsAhead(auction.book, bid),
    raiseToGetIn: canRaise
      ? raiseToGetIn(auction.book, bid, prices, auction.terms.marginShare)
      : null,
    withdrawn: bid.withdrawn,
    claimed: bid.claimed,
  };
}

export function quoteBid(
  auction: MockEditionAuction,
  step: number,
  qty: number
): EditionQuote {
  const prices = auctionPrices(auction);
  const whatIf = whatIfBid(
    auction.book,
    step,
    qty,
    prices,
    auction.terms.marginShare
  );
  return {
    step,
    quantity: qty,
    escrow: BigInt(qty) * (prices[step] ?? 0n),
    result: clearingView(auction, whatIf.result),
    unitsWon: whatIf.unitsWon,
    unitsPushedOut: whatIf.unitsPushedOut,
    unitsPulledIn: whatIf.unitsPulledIn,
  };
}

/** What raising `bidId` to `newStep` would do, or null if that raise is not allowed. */
export function quoteRaise(
  auction: MockEditionAuction,
  bidId: number,
  newStep: number
): EditionQuote | null {
  const bid = findBid(auction.book, bidId);
  if (
    bid === undefined ||
    bid.withdrawn ||
    bid.claimed ||
    !Number.isInteger(newStep) ||
    newStep <= bid.step ||
    newStep >= auction.terms.stepCount
  ) {
    return null;
  }
  const prices = auctionPrices(auction);
  const whatIf = whatIfRaise(
    auction.book,
    bid,
    newStep,
    prices,
    auction.terms.marginShare
  );
  return {
    step: newStep,
    quantity: bid.quantity,
    escrow:
      BigInt(bid.quantity) *
      ((prices[newStep] ?? 0n) - (prices[bid.step] ?? 0n)),
    result: clearingView(auction, whatIf.result),
    unitsWon: whatIf.unitsWon,
    unitsPushedOut: whatIf.unitsPushedOut,
    unitsPulledIn: whatIf.unitsPulledIn,
  };
}

function assertBidding(engine: MockStreamEngine, auction: MockEditionAuction) {
  const phase = auctionPhase(engine, auction);
  if (!acceptsBids(phase)) {
    revert("BiddingClosed", {
      saleId: auction.saleId,
      endTime: auctionTimes(engine, auction).endTime,
    });
  }
  assertListed(engine, auction.edition);
}

function assertStep(auction: MockEditionAuction, step: number) {
  if (!Number.isInteger(step) || step < 0 || step >= auction.terms.stepCount) {
    revert("InvalidStep", { step });
  }
}

function applySoftClose(engine: MockStreamEngine, auction: MockEditionAuction) {
  auction.softEnd = softEndAfterBid(
    auctionTimes(engine, auction),
    engine.now(),
    auction.terms
  );
}

export function ownBid(
  auction: MockEditionAuction,
  from: Address,
  bidId: number
) {
  const bid = findBid(auction.book, bidId);
  if (!bid) {
    revert("UnknownBid", { saleId: auction.saleId, bidId });
  }
  if (bid.bidder !== from) {
    revert("NotBidder", { caller: from });
  }
  return bid;
}

export function placeEditionBid(
  engine: MockStreamEngine,
  auction: MockEditionAuction,
  from: Address,
  step: number,
  qty: number
): BookBid {
  assertBidding(engine, auction);
  assertStep(auction, step);
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_EDITION_BID_QTY) {
    revert("InvalidQuantity", { quantity: qty });
  }
  const price = auctionPrices(auction)[step] ?? 0n;
  const endBefore = auctionTimes(engine, auction).endTime;
  engine.debit(from, BigInt(qty) * price);
  applySoftClose(engine, auction);
  const bid = addBid(auction.book, {
    bidder: from,
    step,
    qty,
    at: engine.now(),
  });
  trackStep(auction, step);
  const endTime = auctionTimes(engine, auction).endTime;
  logEvent(engine, auction, {
    kind: "bid",
    bidder: from,
    bidId: bid.id,
    step,
    quantity: qty,
    endTime,
    extended: endTime > endBefore,
    source: "BidPlaced",
  });
  return bid;
}

export function raiseEditionBid(
  engine: MockStreamEngine,
  auction: MockEditionAuction,
  from: Address,
  bidId: number,
  newStep: number
): void {
  assertBidding(engine, auction);
  assertStep(auction, newStep);
  const bid = ownBid(auction, from, bidId);
  if (bid.withdrawn || newStep <= bid.step) {
    revert("InvalidStep", { step: newStep });
  }
  const prices = auctionPrices(auction);
  const difference =
    BigInt(bid.quantity) * ((prices[newStep] ?? 0n) - (prices[bid.step] ?? 0n));
  const endBefore = auctionTimes(engine, auction).endTime;
  const fromStep = bid.step;
  engine.debit(from, difference);
  applySoftClose(engine, auction);
  moveBid(auction.book, bid, newStep);
  trackStep(auction, newStep);
  const endTime = auctionTimes(engine, auction).endTime;
  logEvent(engine, auction, {
    kind: "raised",
    bidder: from,
    bidId: bid.id,
    fromStep,
    step: newStep,
    quantity: bid.quantity,
    paid: difference,
    endTime,
    extended: endTime > endBefore,
    source: "BidRaised",
  });
}

export function claimEditionBid(
  engine: MockStreamEngine,
  auction: MockEditionAuction,
  from: Address,
  bidId: number,
  to: Address
): { readonly editions: number; readonly refund: Wei } {
  if (auction.status !== "SETTLED" && auction.status !== "VOID") {
    revert("InvalidAuctionState", { status: auction.status });
  }
  const bid = ownBid(auction, from, bidId);
  if (bid.claimed || bid.withdrawn) {
    // A claim or withdrawal deletes the bid record on-chain.
    revert("UnknownBid", { saleId: auction.saleId, bidId });
  }
  const view = bidView(engine, auction, bid);
  bid.claimed = true;
  engine.mintEditions(auction.edition, to, view.unitsWon);
  engine.creditBalance(to, view.refund);
  logEvent(engine, auction, {
    kind: "claimed",
    bidder: from,
    bidId,
    to,
    unitsWon: view.unitsWon,
    refund: view.refund,
    source: "BidClaimed",
  });
  if (view.unitsWon > 0) {
    engine.record(auction.edition, {
      kind: "editions-minted",
      actor: to,
      amount: view.escrow - view.refund,
      source: "ERC1155.TransferSingle (claim)",
    });
  }
  return { editions: view.unitsWon, refund: view.refund };
}

/** A small deterministic generator, so a simulated crowd replays the same way. */
function generator(seed: number): () => number {
  let state = seed % 2_147_483_647;
  if (state <= 0) {
    state += 2_147_483_646;
  }
  return () => {
    state = (state * 16_807) % 2_147_483_647;
    return (state - 1) / 2_147_483_646;
  };
}

/** Quantities like a real crowd: mostly one or two, sometimes a handful. */
function crowdQuantity(random: () => number): number {
  const roll = random();
  if (roll < 0.5) {
    return 1;
  }
  return roll < 0.8
    ? 2 + Math.floor(random() * 2)
    : 4 + Math.floor(random() * 7);
}

/** Mock only: other bidders bid around the current price (the dev controls' "+1 bidder"). */
export function simulateEditionBids(
  engine: MockStreamEngine,
  auction: MockEditionAuction,
  count: number,
  bidders: readonly Address[]
): void {
  const prices = auctionPrices(auction);
  const random = generator(
    engine.state.txSequence * 7_919 + auction.book.bids.length * 31 + 17
  );
  for (let index = 0; index < count; index += 1) {
    const center =
      clearBook(auction.book, prices, auction.terms.marginShare).step ??
      nearestStep(10n ** 16n, auction.terms);
    // Roughly normal, about 6 steps (a third of a price doubling) either side.
    const spread = (random() + random() + random() - 1.5) * 2 * 6;
    const step = Math.max(
      0,
      Math.min(auction.terms.stepCount - 1, Math.round(center + spread))
    );
    const qty = crowdQuantity(random);
    const bidder = bidders[(auction.book.bids.length + index) % bidders.length];
    const cost = BigInt(qty) * (prices[step] ?? 0n);
    if (bidder !== undefined && engine.balanceOf(bidder) >= cost) {
      placeEditionBid(engine, auction, bidder, step, qty);
    }
  }
}
