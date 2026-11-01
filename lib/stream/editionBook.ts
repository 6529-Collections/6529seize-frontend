import {
  clear,
  type ClearOutcome,
  type QueueDeparture,
  sweepCutoff,
  unitsWon,
} from "@/lib/stream/clearing";
import type { Address, Wei } from "@/lib/stream/types";

/**
 * The edition auction's bid book (PLAN section 1.3 and Appendix A): live units
 * per step, a queue counter per step and a departure log for capped auctions,
 * and one record per bid. The mock engine stores one of these per auction; a
 * chain client can rebuild the same book from `Bid`, `Raise` and `Withdraw`
 * events and get the same answers as the contract's views.
 */

export interface BookBid {
  readonly id: number;
  readonly bidder: Address;
  step: number;
  readonly qty: number;
  /** Position in entered units at its step (capped auctions; 0 otherwise). */
  pos: number;
  readonly placedAt: number;
  withdrawn: boolean;
  claimed: boolean;
}

export interface EditionBook {
  readonly steps: number;
  /** The creator cap; 0 means no cap. */
  readonly cap: number;
  readonly live: number[];
  readonly entered: number[];
  readonly departures: Map<number, QueueDeparture[]>;
  readonly bids: BookBid[];
}

export function createBook(steps: number, cap: number): EditionBook {
  return {
    steps,
    cap,
    live: new Array<number>(steps).fill(0),
    entered: new Array<number>(steps).fill(0),
    departures: new Map(),
    bids: [],
  };
}

/** A deep copy, for what-if questions. */
export function cloneBook(book: EditionBook): EditionBook {
  return {
    steps: book.steps,
    cap: book.cap,
    live: [...book.live],
    entered: [...book.entered],
    departures: new Map(
      [...book.departures].map(([step, list]) => [step, [...list]])
    ),
    bids: book.bids.map((bid) => ({ ...bid })),
  };
}

function enqueue(book: EditionBook, step: number, qty: number): number {
  book.live[step] = (book.live[step] ?? 0) + qty;
  if (book.cap === 0) {
    return 0;
  }
  const pos = book.entered[step] ?? 0;
  book.entered[step] = pos + qty;
  return pos;
}

function leave(book: EditionBook, bid: BookBid): void {
  book.live[bid.step] = (book.live[bid.step] ?? 0) - bid.qty;
  if (book.cap > 0) {
    const list = book.departures.get(bid.step) ?? [];
    list.push({ pos: bid.pos, qty: bid.qty });
    book.departures.set(bid.step, list);
  }
}

/** `bid(step, qty)`: joins the back of the step's queue. */
export function addBid(
  book: EditionBook,
  bid: {
    readonly bidder: Address;
    readonly step: number;
    readonly qty: number;
    readonly at: number;
  }
): BookBid {
  const pos = enqueue(book, bid.step, bid.qty);
  const record: BookBid = {
    id: book.bids.length + 1,
    bidder: bid.bidder,
    step: bid.step,
    qty: bid.qty,
    pos,
    placedAt: bid.at,
    withdrawn: false,
    claimed: false,
  };
  book.bids.push(record);
  return record;
}

/** `raise(bidId, newStep)`: moves the whole bid up and rejoins at the back. */
export function moveBid(
  book: EditionBook,
  bid: BookBid,
  newStep: number
): void {
  leave(book, bid);
  bid.pos = enqueue(book, newStep, bid.qty);
  bid.step = newStep;
}

/** A withdrawal while the 1/1 is paused for a dispute: leaves a hole. */
export function removeBid(book: EditionBook, bid: BookBid): void {
  leave(book, bid);
  bid.withdrawn = true;
}

export function findBid(book: EditionBook, bidId: number): BookBid | undefined {
  return book.bids.find((bid) => bid.id === bidId);
}

/** The live clearing and the cut step's swept cutoff X. */
export interface BookResult extends ClearOutcome {
  readonly cutoff: number;
}

export function clearBook(
  book: EditionBook,
  prices: readonly Wei[],
  marginShare: number
): BookResult {
  const outcome = clear(book.live, prices, book.cap, marginShare);
  if (outcome.step === null || !outcome.rationed) {
    return { ...outcome, cutoff: outcome.cutStepUnits };
  }
  const departures = book.departures.get(outcome.step) ?? [];
  return {
    ...outcome,
    cutoff: sweepCutoff(outcome.cutStepUnits, departures),
  };
}

export function wonBy(bid: BookBid, result: BookResult): number {
  return bid.withdrawn ? 0 : unitsWon(bid, result, result.cutoff);
}

/** Live units queued ahead of a bid at its step (capped auctions). */
export function unitsAhead(book: EditionBook, bid: BookBid): number {
  if (book.cap === 0) {
    return 0;
  }
  return book.bids
    .filter(
      (other) =>
        !other.withdrawn && other.step === bid.step && other.pos < bid.pos
    )
    .reduce((sum, other) => sum + other.qty, 0);
}

/** Units each live bid wins, by bid ID. */
export function allocation(
  book: EditionBook,
  result: BookResult
): Map<number, number> {
  return new Map(book.bids.map((bid) => [bid.id, wonBy(bid, result)]));
}

/**
 * The lowest step in `[from, to)` where `wins(step)` holds, by binary search.
 * Winning is monotone in the step (0 violations in the D138 model's 4,000
 * trials, with and without a cap); the clearing tests check the search
 * against a linear scan on random books.
 */
function lowestStepWhere(
  from: number,
  to: number,
  wins: (step: number) => boolean
): number | null {
  let low = from;
  let high = to;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (wins(middle)) {
      high = middle;
    } else {
      low = middle + 1;
    }
  }
  return low < to ? low : null;
}

/**
 * The lowest raise that gets every unit of `bid` in, or null. The raise
 * rejoins the back of its new step's queue.
 */
export function raiseToGetIn(
  book: EditionBook,
  bid: BookBid,
  prices: readonly Wei[],
  marginShare: number
): number | null {
  return lowestStepWhere(bid.step + 1, book.steps, (step) => {
    const copy = cloneBook(book);
    const moved = findBid(copy, bid.id);
    if (moved === undefined) {
      return false;
    }
    moveBid(copy, moved, step);
    return wonBy(moved, clearBook(copy, prices, marginShare)) >= moved.qty;
  });
}

interface WhatIf {
  readonly result: BookResult;
  readonly won: number;
  readonly pushedOut: number;
  readonly pulledIn: number;
}

/** `quote(step, qty)`: what a new bid would do to the book. */
export function whatIfBid(
  book: EditionBook,
  step: number,
  qty: number,
  prices: readonly Wei[],
  marginShare: number
): WhatIf {
  const before = allocation(book, clearBook(book, prices, marginShare));
  const copy = cloneBook(book);
  const added = addBid(copy, {
    bidder: "0x0000000000000000000000000000000000000000",
    step,
    qty,
    at: 0,
  });
  const result = clearBook(copy, prices, marginShare);
  let pushedOut = 0;
  let pulledIn = 0;
  for (const bid of copy.bids) {
    if (bid.id !== added.id) {
      const change = wonBy(bid, result) - (before.get(bid.id) ?? 0);
      pushedOut += Math.max(0, -change);
      pulledIn += Math.max(0, change);
    }
  }
  return { result, won: wonBy(added, result), pushedOut, pulledIn };
}

/**
 * What raising `bid` to `newStep` would do (client-side; the contract has no
 * raise quote): it rejoins the back of `newStep` and leaves a hole behind.
 */
export function whatIfRaise(
  book: EditionBook,
  bid: BookBid,
  newStep: number,
  prices: readonly Wei[],
  marginShare: number
): WhatIf {
  const before = allocation(book, clearBook(book, prices, marginShare));
  const copy = cloneBook(book);
  const moved = findBid(copy, bid.id);
  if (moved === undefined) {
    throw new RangeError(`no bid ${bid.id}`);
  }
  moveBid(copy, moved, newStep);
  const result = clearBook(copy, prices, marginShare);
  let pushedOut = 0;
  let pulledIn = 0;
  for (const other of copy.bids) {
    if (other.id !== moved.id) {
      const change = wonBy(other, result) - (before.get(other.id) ?? 0);
      pushedOut += Math.max(0, -change);
      pulledIn += Math.max(0, change);
    }
  }
  return { result, won: wonBy(moved, result), pushedOut, pulledIn };
}

/**
 * `lowestWinningStep(qty)`, as the contract defines it: the lowest step where
 * a new bid of `qty` wins at least one copy if the sale closed now.
 */
export function lowestWinningStep(
  book: EditionBook,
  qty: number,
  prices: readonly Wei[],
  marginShare: number
): number | null {
  return lowestStepWhere(
    0,
    book.steps,
    (step) => whatIfBid(book, step, qty, prices, marginShare).won > 0
  );
}

/**
 * The lowest step where a new bid of `qty` gets every unit in. It can sit
 * below the current price: under the breadth rule a bid there lowers
 * everyone's price.
 */
export function lowestStepFullyIn(
  book: EditionBook,
  qty: number,
  prices: readonly Wei[],
  marginShare: number
): number | null {
  return lowestStepWhere(
    0,
    book.steps,
    (step) => whatIfBid(book, step, qty, prices, marginShare).won >= qty
  );
}
