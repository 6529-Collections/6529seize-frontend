import {
  EDITION_AUCTION_CONFIG,
  MAX_EDITION_BID_QTY,
} from "@/lib/stream/constants";
import { revenueThreshold } from "@/lib/stream/clearing";
import type { EditionAuctionActions } from "@/lib/stream/dataSource";
import {
  addBid,
  type BookBid,
  type BookResult,
  clearBook,
  createBook,
  findBid,
  moveBid,
  raiseToGetIn,
  removeBid,
  unitsAhead,
  whatIfBid,
  wonBy,
} from "@/lib/stream/editionBook";
import {
  acceptsBids,
  editionPhase,
  editionTimes,
  softEndAfterBid,
} from "@/lib/stream/editionTiming";
import { candidateRows, stepTotalRows } from "@/lib/stream/editionViews";
import { resumedEnd } from "@/lib/stream/englishAuction";
import { ladderPrices } from "@/lib/stream/ladder";
import { later, type MockStreamEngine, revert } from "@/lib/stream/mock/engine";
import { mockHash } from "@/lib/stream/mock/ids";
import {
  assertListed,
  englishState,
} from "@/lib/stream/mock/sales/englishAuction";
import type { MockEditionAuction } from "@/lib/stream/mock/state";
import type {
  Address,
  EditionAuction,
  EditionAuctionPhase,
  EditionAuctionStatus,
  EditionAuctionTimes,
  EditionBidView,
  EditionCandidate,
  EditionClearing,
  EditionQuote,
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
  const { base, perDecade, steps } = auction.terms;
  const key = `${base}:${perDecade}:${steps}`;
  let prices = priceCache.get(key);
  if (!prices) {
    prices = ladderPrices({ base, perDecade, steps });
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
      base: EDITION_AUCTION_CONFIG.base,
      perDecade: EDITION_AUCTION_CONFIG.perDecade,
      steps: EDITION_AUCTION_CONFIG.steps,
      marginShare: EDITION_AUCTION_CONFIG.marginShare,
      offset: EDITION_AUCTION_CONFIG.offset,
      softWindow: EDITION_AUCTION_CONFIG.softWindow,
      maxExtension: EDITION_AUCTION_CONFIG.maxExtension,
      cap: options.cap,
      feeShare: token.economics.feeShare,
      seller: token.economics.seller,
      feeRecipient: token.economics.feeRecipient,
    },
    openedAt: 0,
    softEnd: null,
    fixedAnchorEnd: options.fixedAnchorEnd ?? null,
    oneOfOneSaleId,
    book: createBook(EDITION_AUCTION_CONFIG.steps, options.cap),
    result: null,
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
}

function oneOfOneState(
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
  // While the 1/1 is paused, the edition end follows the end it resumes to.
  return oneOfOne.stored === "PAUSED"
    ? resumedEnd(oneOfOne, engine.now())
    : oneOfOne.endTime;
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
    totalUnits: totalUnits(auction),
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

function clearingView(
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
    networkShare,
    sellerShare: revenue - networkShare,
    rationed: result.rationed,
    cutStepUnits: result.cutStepUnits,
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
    totalUnits: totalUnits(auction),
    bidCount: auction.book.bids.length,
    lo: used[0] ?? null,
    hi: used.at(-1) ?? null,
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
    auction.terms.cap,
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
  const escrow = BigInt(bid.qty) * price;
  const isVoid = auction.status === "VOID";
  const result = currentResult(auction);
  const won = isVoid ? 0 : wonBy(bid, result);
  const clearingPrice = result.step === null ? 0n : (prices[result.step] ?? 0n);
  const status = bidStatus(won, bid.qty);
  const canRaise =
    status !== "in" &&
    !bid.withdrawn &&
    acceptsBids(auctionPhase(engine, auction));
  return {
    bidId: bid.id,
    bidder: bid.bidder,
    step: bid.step,
    price,
    qty: bid.qty,
    pos: bid.pos,
    escrow,
    placedAt: bid.placedAt,
    status,
    won,
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
    qty,
    cost: BigInt(qty) * (prices[step] ?? 0n),
    after: clearingView(auction, whatIf.result),
    won: whatIf.won,
    pushedOut: whatIf.pushedOut,
    pulledIn: whatIf.pulledIn,
  };
}

function assertBidding(engine: MockStreamEngine, auction: MockEditionAuction) {
  const phase = auctionPhase(engine, auction);
  if (!acceptsBids(phase)) {
    revert("BiddingClosed", {
      saleId: auction.saleId,
      endTime: auctionTimes(engine, auction).editionEnd,
    });
  }
  assertListed(engine, auction.edition);
}

function assertStep(auction: MockEditionAuction, step: number) {
  if (!Number.isInteger(step) || step < 0 || step >= auction.terms.steps) {
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

function ownBid(auction: MockEditionAuction, from: Address, bidId: number) {
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
  engine.debit(from, BigInt(qty) * price);
  applySoftClose(engine, auction);
  return addBid(auction.book, { bidder: from, step, qty, at: engine.now() });
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
    BigInt(bid.qty) * ((prices[newStep] ?? 0n) - (prices[bid.step] ?? 0n));
  engine.debit(from, difference);
  applySoftClose(engine, auction);
  moveBid(auction.book, bid, newStep);
}

export function settleEditionAuction(
  engine: MockStreamEngine,
  auction: MockEditionAuction
): void {
  const times = auctionTimes(engine, auction);
  const state = oneOfOneState(engine, auction);
  if (auction.status !== "OPEN") {
    revert("InvalidAuctionState", { status: auction.status });
  }
  if (state === "CANCELLED") {
    auction.status = "VOID";
    return;
  }
  if (
    engine.now() < times.editionEnd ||
    (state !== null && state !== "SETTLED")
  ) {
    revert("SettlementNotReady", { saleId: auction.saleId });
  }
  const result = clearBook(
    auction.book,
    auctionPrices(auction),
    auction.terms.marginShare
  );
  if (result.count > 0) {
    if (!engine.token(auction.edition).created) {
      revert("EditionNotCreated", { edition: auction.edition });
    }
    const clearing = clearingView(auction, result);
    engine.payPrimary(
      auction.terms.seller,
      auction.terms.feeShare,
      clearing.revenue
    );
  }
  auction.result = result;
  auction.status = "SETTLED";
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
  engine.mintEditions(auction.edition, to, view.won);
  engine.creditBalance(to, view.refund);
  if (view.won > 0) {
    engine.record(auction.edition, {
      kind: "editions-minted",
      actor: to,
      amount: view.escrow - view.refund,
      source: "ERC1155.TransferSingle (claim)",
    });
  }
  return { editions: view.won, refund: view.refund };
}

export function createEditionActions(
  engine: MockStreamEngine
): EditionAuctionActions {
  return {
    open: (_from, edition) =>
      later(() =>
        engine.tx("editionOpen", () => {
          openPreparedAuction(engine, findEditionAuction(engine, edition));
        })
      ),
    bid: (from, edition, step, qty) =>
      later(() =>
        engine.tx("editionBid", () => ({
          bidId: placeEditionBid(
            engine,
            findEditionAuction(engine, edition),
            from,
            step,
            qty
          ).id,
        }))
      ),
    raise: (from, edition, bidId, newStep) =>
      later(() =>
        engine.tx("editionRaise", () => {
          raiseEditionBid(
            engine,
            findEditionAuction(engine, edition),
            from,
            bidId,
            newStep
          );
        })
      ),
    withdraw: (from, edition, bidId) =>
      later(() =>
        engine.tx(null, () => {
          const auction = findEditionAuction(engine, edition);
          if (oneOfOneState(engine, auction) !== "PAUSED") {
            revert("WithdrawalsClosed", { saleId: auction.saleId });
          }
          const bid = ownBid(auction, from, bidId);
          if (bid.withdrawn) {
            revert("UnknownBid", { saleId: auction.saleId, bidId });
          }
          const escrow = bidView(engine, auction, bid).escrow;
          removeBid(auction.book, bid);
          engine.creditBalance(from, escrow);
        })
      ),
    settle: (_from, edition) =>
      later(() =>
        engine.tx("editionSettle", () => {
          settleEditionAuction(engine, findEditionAuction(engine, edition));
        })
      ),
    claim: (from, edition, bidId, to) =>
      later(() =>
        engine.tx("editionClaimWin", () =>
          claimEditionBid(
            engine,
            findEditionAuction(engine, edition),
            from,
            bidId,
            to
          )
        )
      ),
  };
}
