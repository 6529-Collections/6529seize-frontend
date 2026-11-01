import { clearBook } from "@/lib/stream/editionBook";
import { type MockStreamEngine, revert } from "@/lib/stream/mock/engine";
import {
  auctionPrices,
  auctionTimes,
  clearingView,
  logEvent,
  oneOfOneState,
} from "@/lib/stream/mock/sales/editionAuction";
import type { MockEditionAuction, MockSettling } from "@/lib/stream/mock/state";

/**
 * The rc.2 settle bounds (`UniformEditionAuction`): a call scans at most 24
 * book words (eight steps each); the call that finishes the scan sweeps at
 * most 16 departures, and each later call at most 96.
 */
const SCAN_WORDS = 24;
const SWEEP_FIRST = 16;
const SWEEP_CHUNK = 96;
const STEPS_PER_WORD_SHIFT = 3;

/**
 * The word where a cap ends the scan: it stops at the first used step whose
 * units above already reach the cap. Null without a cap, or when it never does.
 */
function capStopWord(auction: MockEditionAuction): number | null {
  const { cap, live } = auction.book;
  if (cap === 0) {
    return null;
  }
  let demand = 0;
  for (let step = live.length - 1; step >= 0; step -= 1) {
    const units = live[step] ?? 0;
    if (units > 0) {
      if (demand >= cap) {
        return step >> STEPS_PER_WORD_SHIFT;
      }
      demand += units;
    }
  }
  return null;
}

/** The first settle call: voids after a 1/1 cancel, or starts the scan. */
function beginSettlement(
  engine: MockStreamEngine,
  auction: MockEditionAuction
): MockSettling | null {
  const times = auctionTimes(engine, auction);
  const state = oneOfOneState(engine, auction);
  if (state === "CANCELLED") {
    auction.status = "VOID";
    logEvent(engine, auction, { kind: "voided", source: "AuctionVoided" });
    return null;
  }
  if (
    engine.now() < times.editionEnd ||
    (state !== null && state !== "SETTLED")
  ) {
    revert("SettlementNotReady", { saleId: auction.saleId });
  }
  const settling: MockSettling = {
    cursor: ((auction.highStep ?? 0) >> STEPS_PER_WORD_SHIFT) + 1,
    low: (auction.lowStep ?? 0) >> STEPS_PER_WORD_SHIFT,
    cleared: false,
    departuresSwept: 0,
    departures: 0,
  };
  auction.status = "SETTLING";
  auction.settling = settling;
  return settling;
}

/** Stores and pays the clearing, and counts the departures left to sweep. */
function finishClearing(
  engine: MockStreamEngine,
  auction: MockEditionAuction,
  settling: MockSettling
): void {
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
    logEvent(engine, auction, {
      kind: "cleared",
      count: result.count,
      step: result.step ?? 0,
      price: clearing.price,
      revenue: clearing.revenue,
      networkFee: clearing.networkShare,
      source: "AuctionCleared",
    });
  }
  auction.result = result;
  settling.cleared = true;
  settling.departures =
    result.rationed && result.step !== null
      ? (auction.book.departures.get(result.step)?.length ?? 0)
      : 0;
}

/** Scans up to `SCAN_WORDS` words; returns whether the scan finished (and cleared). */
function scanChunk(
  engine: MockStreamEngine,
  auction: MockEditionAuction,
  settling: MockSettling
): boolean {
  const next =
    settling.cursor > settling.low + SCAN_WORDS
      ? settling.cursor - SCAN_WORDS
      : settling.low;
  const stop = capStopWord(auction);
  const capEnded = stop !== null && stop >= next;
  if (!capEnded && next > settling.low) {
    settling.cursor = next;
    logEvent(engine, auction, {
      kind: "scanned",
      wordsLeft: next - settling.low,
      source: "SettlementScanned",
    });
    return false;
  }
  finishClearing(engine, auction, settling);
  return true;
}

/** Sweeps up to `chunk` departures; SETTLED, and claims open, once all are swept. */
function sweepChunk(
  engine: MockStreamEngine,
  auction: MockEditionAuction,
  settling: MockSettling,
  chunk: number
): boolean {
  settling.departuresSwept = Math.min(
    settling.departures,
    settling.departuresSwept + chunk
  );
  if (settling.departuresSwept < settling.departures) {
    logEvent(engine, auction, {
      kind: "swept",
      swept: settling.departuresSwept,
      total: settling.departures,
      source: "DeparturesSwept",
    });
    return false;
  }
  auction.status = "SETTLED";
  logEvent(engine, auction, {
    kind: "settled",
    count: auction.result?.count ?? 0,
    source: "AuctionSettled",
  });
  return true;
}

/**
 * One settle call (rc.2: settlement in calls of bounded gas). Returns whether
 * the sale is now SETTLED or VOID; while it is not, the sale is SETTLING and
 * refuses bids, withdrawals and claims.
 */
export function settleEditionAuction(
  engine: MockStreamEngine,
  auction: MockEditionAuction
): boolean {
  let settling = auction.settling;
  if (auction.status === "OPEN") {
    settling = beginSettlement(engine, auction);
    if (settling === null) {
      return true;
    }
  } else if (auction.status !== "SETTLING" || settling === null) {
    revert("InvalidAuctionState", { status: auction.status });
  }
  if (settling.cleared) {
    return sweepChunk(engine, auction, settling, SWEEP_CHUNK);
  }
  if (!scanChunk(engine, auction, settling)) {
    return false;
  }
  return sweepChunk(engine, auction, settling, SWEEP_FIRST);
}
