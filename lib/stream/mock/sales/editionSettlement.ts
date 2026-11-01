import { clearBook } from "@/lib/stream/editionBook";
import { type MockStreamEngine, revert } from "@/lib/stream/mock/engine";
import {
  auctionPrices,
  auctionTimes,
  clearingView,
  logEvent,
  oneOfOneState,
} from "@/lib/stream/mock/sales/editionAuction";
import type {
  MockEditionAuction,
  MockSettling,
  MockSweep,
} from "@/lib/stream/mock/state";
import type { Address, EditionSweep } from "@/lib/stream/types";

/**
 * The rc.2 settle bounds (`UniformEditionAuction`): a call scans at most 24
 * book words (eight steps each); the call that finishes the scan sweeps at
 * most 16 departures, and each later call at most 96.
 */
const SCAN_WORDS = 24;
const SWEEP_FIRST = 16;
const SWEEP_CHUNK = 96;
const STEPS_PER_WORD_SHIFT = 3;

const NO_SWEEP: EditionSweep = { swept: 0, nextPosition: 0, cutoff: 0 };

const settlerKey = (settler: Address) => settler.toLowerCase();

/**
 * The word where a cap ends the scan: it stops at the first used step whose
 * units above already reach the cap. Null without a cap, or when it never does.
 */
function capStopWord(auction: MockEditionAuction): number | null {
  const { maxCount, live } = auction.book;
  if (maxCount === 0) {
    return null;
  }
  let demand = 0;
  for (let step = live.length - 1; step >= 0; step -= 1) {
    const units = live[step] ?? 0;
    if (units > 0) {
      if (demand >= maxCount) {
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
  if (engine.now() < times.endTime || (state !== null && state !== "SETTLED")) {
    revert("SettlementNotReady", { saleId: auction.saleId });
  }
  const settling: MockSettling = {
    cursor: ((auction.highStep ?? 0) >> STEPS_PER_WORD_SHIFT) + 1,
    low: (auction.lowStep ?? 0) >> STEPS_PER_WORD_SHIFT,
    cleared: false,
    cutUnits: 0,
    cutoff: 0,
    departuresSwept: 0,
    departures: 0,
    sweeps: new Map(),
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
      networkFee: clearing.networkFee,
      source: "AuctionCleared",
    });
  }
  auction.result = result;
  settling.cleared = true;
  settling.cutUnits = result.cutUnits;
  settling.cutoff = result.cutUnits;
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

/** The clearing step's departure log, in the order logged (`departures(saleId, step)`). */
function clearingDepartures(auction: MockEditionAuction) {
  const step = auction.result?.step ?? null;
  return step === null ? [] : (auction.book.departures.get(step) ?? []);
}

/**
 * `UniformClearing.sweep`: a departure must lie strictly after the one before
 * it; it moves the cutoff past it when it starts below the cutoff.
 */
function sweepOne(
  state: { cutoff: number; nextPosition: number },
  departure:
    | { readonly position: number; readonly quantity: number }
    | undefined,
  index: number
): void {
  if (departure === undefined || departure.position < state.nextPosition) {
    revert("InvalidSettlementOrder", { index });
  }
  if (departure.position < state.cutoff) {
    state.cutoff += departure.quantity;
  }
  state.nextPosition = departure.position + 1;
}

/**
 * The caller's sweep: `order` is the rest of its own sweep (positions strictly
 * increasing from its progress), of which a call takes at most `limit`. The
 * first settler to sweep every departure fixes the cutoff and settles the
 * sale; an order that skips one strands only its caller's progress.
 */
function sweepChunk(
  engine: MockStreamEngine,
  auction: MockEditionAuction,
  settling: MockSettling,
  settler: Address,
  order: readonly number[],
  limit: number
): boolean {
  const key = settlerKey(settler);
  // The clearing call starts every sweep, so no settler has progress yet.
  const progress = limit === SWEEP_FIRST ? undefined : settling.sweeps.get(key);
  const total = settling.departures;
  const log = clearingDepartures(auction);
  let swept = progress?.swept ?? 0;
  const n = Math.min(order.length, limit, total - swept);
  const state = {
    cutoff: progress?.cutoff ?? settling.cutUnits,
    nextPosition: progress?.nextPosition ?? 0,
  };
  for (let i = 0; i < n; i += 1) {
    const index = order[i] ?? -1;
    sweepOne(state, index < total ? log[index] : undefined, i);
  }
  swept += n;
  if (total > 0) {
    logEvent(engine, auction, {
      kind: "swept",
      swept,
      total,
      source: "DeparturesSwept",
    });
  }
  if (swept < total) {
    // A call that swept nothing leaves no progress behind.
    if (n !== 0) {
      const next: MockSweep = { swept, ...state };
      settling.sweeps.set(key, next);
    }
    return false;
  }
  settling.sweeps.delete(key);
  settling.departuresSwept = swept;
  settling.cutoff = state.cutoff;
  auction.status = "SETTLED";
  logEvent(engine, auction, {
    kind: "settled",
    count: auction.result?.count ?? 0,
    source: "AuctionSettled",
  });
  return true;
}

/**
 * One settle call (rc.2: settlement in calls of bounded gas), from `settler`
 * with its remaining slice of the sweep. Returns whether the sale is now
 * SETTLED or VOID; while it is not, the sale is SETTLING and refuses bids,
 * withdrawals and claims. A call on a SETTLED sale returns true; on a VOID
 * sale it reverts.
 */
export function settleEditionAuction(
  engine: MockStreamEngine,
  auction: MockEditionAuction,
  settler: Address,
  order: readonly number[]
): boolean {
  let settling = auction.settling;
  if (auction.status === "OPEN") {
    settling = beginSettlement(engine, auction);
    if (settling === null) {
      return true;
    }
  } else if (auction.status === "SETTLED") {
    // Another settler finished first: nothing left to do.
    return true;
  } else if (auction.status !== "SETTLING" || settling === null) {
    revert("InvalidAuctionState", { status: auction.status });
  }
  if (settling.cleared) {
    return sweepChunk(engine, auction, settling, settler, order, SWEEP_CHUNK);
  }
  if (!scanChunk(engine, auction, settling)) {
    return false;
  }
  return sweepChunk(engine, auction, settling, settler, order, SWEEP_FIRST);
}

/** `sweepOf(saleId, settler)`: all zero when the settler has no sweep in progress. */
export function sweepOf(
  auction: MockEditionAuction,
  settler: Address
): EditionSweep {
  return auction.settling?.sweeps.get(settlerKey(settler)) ?? NO_SWEEP;
}

/**
 * `settlementOrder(saleId)` from a position on: the clearing step's departure
 * indexes sorted by position. Before the scan clears, the live clearing's step.
 */
function sortedOrder(
  auction: MockEditionAuction,
  step: number | null,
  rationed: boolean,
  from: number
): number[] {
  if (step === null || !rationed) {
    return [];
  }
  const log = auction.book.departures.get(step) ?? [];
  return log
    .map((departure, index) => ({ position: departure.position, index }))
    .filter((entry) => entry.position >= from)
    .sort((left, right) => left.position - right.position)
    .map((entry) => entry.index);
}

/**
 * `settlementOrderFor(saleId, settler)`: while the sale is cleared and
 * sweeping, the departures from the settler's next position on; otherwise
 * `settlementOrder`: the full order for the result, empty once SETTLED or VOID.
 */
export function settlementOrderFor(
  auction: MockEditionAuction,
  settler: Address
): number[] {
  if (auction.status === "SETTLED" || auction.status === "VOID") {
    return [];
  }
  const settling = auction.settling;
  if (auction.status === "SETTLING" && settling?.cleared === true) {
    const result = auction.result;
    return sortedOrder(
      auction,
      result?.step ?? null,
      result?.rationed ?? false,
      sweepOf(auction, settler).nextPosition
    );
  }
  const live = clearBook(
    auction.book,
    auctionPrices(auction),
    auction.terms.marginShare
  );
  return sortedOrder(auction, live.step, live.rationed, 0);
}

/** The mock keeper's settle: one call with its own remaining order. */
export function keeperSettle(
  engine: MockStreamEngine,
  auction: MockEditionAuction,
  keeper: Address
): boolean {
  return settleEditionAuction(
    engine,
    auction,
    keeper,
    settlementOrderFor(auction, keeper)
  );
}
