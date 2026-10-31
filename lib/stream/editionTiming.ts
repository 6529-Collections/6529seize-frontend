import type {
  EditionAuctionPhase,
  EditionAuctionStatus,
  EditionAuctionTerms,
  EditionAuctionTimes,
  EnglishAuctionState,
  UnixSeconds,
} from "@/lib/stream/types";

/**
 * Edition-auction clocks (D140, D141; PLAN section 1.2). The edition close is
 * `max(1/1 final end + offset, softEnd)`; a bid in the last `softWindow`
 * seconds sets `softEnd = bid + softWindow`, never past the backstop
 * `1/1 end + offset + maxExtension`.
 */

type Timing = Pick<
  EditionAuctionTerms,
  "offset" | "softWindow" | "maxExtension"
>;

export function editionTimes(
  openedAt: UnixSeconds,
  anchorEnd: UnixSeconds,
  softEnd: UnixSeconds | null,
  terms: Timing
): EditionAuctionTimes {
  const base = anchorEnd + terms.offset;
  return {
    openedAt,
    anchorEnd,
    baseEnd: base,
    editionEnd: Math.max(base, softEnd ?? 0),
    softEnd,
    backstop: base + terms.maxExtension,
  };
}

/** The soft end after a bid or raise at `now`, or the current one if the bid is early. */
export function softEndAfterBid(
  times: EditionAuctionTimes,
  now: UnixSeconds,
  terms: Timing
): UnixSeconds | null {
  if (now < times.editionEnd - terms.softWindow) {
    return times.softEnd;
  }
  const next = Math.min(now + terms.softWindow, times.backstop);
  return Math.max(next, times.softEnd ?? 0);
}

interface PhaseInput {
  readonly status: EditionAuctionStatus;
  readonly times: EditionAuctionTimes;
  readonly totalUnits: number;
  readonly settledCount: number | null;
  readonly oneOfOneState: EnglishAuctionState | null;
  readonly now: UnixSeconds;
}

function settledPhase(settledCount: number | null): EditionAuctionPhase {
  return (settledCount ?? 0) > 0 ? "settled" : "noBids";
}

function openPhase(input: PhaseInput): EditionAuctionPhase {
  const { times, now, oneOfOneState } = input;
  if (oneOfOneState === "CANCELLED") {
    return "void";
  }
  if (oneOfOneState === "PAUSED") {
    return "disputed";
  }
  if (now >= times.editionEnd) {
    return input.totalUnits === 0 ? "noBids" : "closed";
  }
  if (times.softEnd !== null && times.softEnd > times.baseEnd) {
    return "extended";
  }
  return now >= times.anchorEnd ? "oneOfOneEnded" : "open";
}

/** The UX state (PLAN section 6 "States"). */
export function editionPhase(input: PhaseInput): EditionAuctionPhase {
  switch (input.status) {
    case "NONE":
      return "opening";
    case "VOID":
      return "void";
    case "SETTLED":
      return settledPhase(input.settledCount);
    case "SETTLING":
      return "settling";
    case "OPEN":
    case "CLOSED":
      return openPhase(input);
  }
}

/** Bids and raises are accepted until the edition end (and while the 1/1 is paused). */
export function acceptsBids(phase: EditionAuctionPhase): boolean {
  return (
    phase === "open" ||
    phase === "oneOfOneEnded" ||
    phase === "extended" ||
    phase === "disputed"
  );
}
