import type { SaleSummary } from "./reads";
import { AUCTION_STATE, isZeroAddress } from "./state";

/**
 * How the works page arranges sales: by what a visitor cares about, not by the
 * auction's state machine. Live sales first, then sold works, then works that
 * ended without a buyer, then ended sales anyone can finish.
 */

/** Names operators gave flow and probe runs ("r1 flows #3", "Copy Test"). */
const TEST_NAME = /(?:^r\d+\b)|(?:\b(?:test|tests|flow|flows|probe|smoke)\b)/i;

/** A work kept out of the main grids: no art, or a name from an operator's test run. */
export function isTestWork(work: { readonly name: string | null; readonly hasArt: boolean }): boolean {
  return !work.hasArt || (work.name !== null && TEST_NAME.test(work.name));
}

type ShelfName = "live" | "sold" | "unsold" | "finish";

const SOLD_SHOWN = 12;
const UNSOLD_SHOWN = 8;

function isLive(sale: SaleSummary, now: number): boolean {
  return sale.state === AUCTION_STATE.ACTIVE && Number(sale.endTime) > now;
}

function shelfOf(sale: SaleSummary, now: number): ShelfName {
  if (isLive(sale, now)) return "live";
  if (sale.state === AUCTION_STATE.SETTLED) return isZeroAddress(sale.bidder) ? "unsold" : "sold";
  if (sale.state === AUCTION_STATE.CANCELLED) return "unsold";
  // Ended (or past its end, or paused): waiting for someone to finish it.
  return "finish";
}

export function arrangeShelves(sales: readonly SaleSummary[], now: number): Record<ShelfName, SaleSummary[]> {
  const shelves: Record<ShelfName, SaleSummary[]> = { live: [], sold: [], unsold: [], finish: [] };
  for (const sale of sales) shelves[shelfOf(sale, now)].push(sale);
  const newestEnd = (a: SaleSummary, b: SaleSummary) => Number(b.endTime - a.endTime);
  return {
    // Ending soonest first: the sale a visitor can still lose.
    live: shelves.live.sort((a, b) => Number(a.endTime - b.endTime)),
    sold: shelves.sold.sort(newestEnd).slice(0, SOLD_SHOWN),
    unsold: shelves.unsold.sort(newestEnd).slice(0, UNSOLD_SHOWN),
    finish: shelves.finish.sort((a, b) => Number(a.endTime - b.endTime)),
  };
}

/** The work to show large: the live sale with the highest bid, else the most recently sold work. */
export function pickFeatured(sales: readonly SaleSummary[], now: number): SaleSummary | null {
  const live = sales.filter((sale) => isLive(sale, now));
  if (live.length > 0) {
    return [...live].sort((a, b) => {
      if (a.bid !== b.bid) return a.bid > b.bid ? -1 : 1;
      return Number(a.endTime - b.endTime);
    })[0]!;
  }
  const sold = sales.filter((sale) => shelfOf(sale, now) === "sold");
  return sold.sort((a, b) => Number(b.endTime - a.endTime))[0] ?? null;
}
