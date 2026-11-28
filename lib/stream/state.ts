import type { Address } from "viem";

/** EnglishAuction.AuctionState. */
export const AUCTION_STATE = {
  NONE: 0,
  ACTIVE: 1,
  PAUSED: 2,
  ENDED: 3,
  SETTLED: 4,
  CANCELLED: 5,
} as const;

/** IUniformEditionAuction.AuctionStatus. */
export const EDITION_STATUS = {
  NONE: 0,
  OPEN: 1,
  CLOSED: 2,
  SETTLING: 3,
  SETTLED: 4,
  VOID: 5,
} as const;

const ZERO: Address = "0x0000000000000000000000000000000000000000";

export function isZeroAddress(address: string | undefined | null): boolean {
  return !address || /^0x0{40}$/i.test(address);
}

export function sameAddress(a: string | undefined | null, b: string | undefined | null): boolean {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}

export interface OneOfOneInput {
  /** Derived state from EnglishAuction.auction(saleId). */
  readonly state: number;
  readonly bidder: Address;
  readonly bid: bigint;
  /** Unix seconds. */
  readonly endTime: bigint;
  readonly pausedAt: bigint;
  /** Unix seconds of the last restart, or 0. */
  readonly restartedAt: bigint;
  /** Unix seconds, now. */
  readonly now: number;
  /** Seconds: the anti-snipe window (a bid inside it moves the end). */
  readonly extensionWindow: number;
  /** Seconds after the end before an unsold Independent Stream work can be offered again. */
  readonly restartDelay: number;
  /** An Independent Stream work (an artist's own contract) rather than a curated 6529 Stream work. */
  readonly independent: boolean;
  /** The auction contract's pause: it stops new starts and restarts only. */
  readonly contractPaused: boolean;
  /** Who may claim a pending delivery, or zero. */
  readonly pendingDelivery: Address;
  /** Unix seconds from which settleOrRefund is accepted, or 0. */
  readonly refusableAt: bigint;
  /** The connected wallet, if any. */
  readonly viewer?: Address | undefined;
}

export type OneOfOneScreen =
  | "not_started"
  | "live"
  | "closing"
  | "ended"
  | "sold"
  | "unsold_museum"
  | "unsold_waiting"
  | "unsold_restartable"
  | "paused"
  | "cancelled";

export interface OneOfOneView {
  readonly screen: OneOfOneScreen;
  readonly hasBid: boolean;
  /** The connected wallet holds the top bid. */
  readonly viewerLeads: boolean;
  /** Seconds until the end (0 once ended). */
  readonly secondsLeft: number;
  readonly canBid: boolean;
  readonly canSettle: boolean;
  readonly canSettleOrRefund: boolean;
  readonly canRestart: boolean;
  /** Unix seconds from which the work can be offered again, when unsold and waiting. */
  readonly restartAt: number | null;
  readonly canWithdrawBid: boolean;
  readonly canClaimDelivery: boolean;
  /**
   * New sales are paused (the contract's pause). Only starting and offering
   * again are blocked; bids, settling, claims and take-backs still work.
   */
  readonly halted: boolean;
}

export function oneOfOneView(input: OneOfOneInput): OneOfOneView {
  const end = Number(input.endTime);
  const hasBid = !isZeroAddress(input.bidder);
  const viewerLeads = hasBid && sameAddress(input.bidder, input.viewer);
  const secondsLeft = Math.max(0, end - input.now);
  const halted = input.contractPaused;
  const base: ViewBase = {
    hasBid,
    viewerLeads,
    secondsLeft,
    canBid: false,
    canSettle: false,
    canSettleOrRefund: false,
    canRestart: false,
    restartAt: null,
    canWithdrawBid: false,
    canClaimDelivery:
      !isZeroAddress(input.pendingDelivery) &&
      sameAddress(input.pendingDelivery, input.viewer),
    halted,
  };

  switch (input.state) {
    case AUCTION_STATE.NONE:
      return { ...base, screen: "not_started" };
    case AUCTION_STATE.ACTIVE: {
      // The derived state stays ACTIVE until the end; guard against a stale read.
      if (secondsLeft === 0) {
        return { ...base, screen: "ended", canSettle: true };
      }
      return {
        ...base,
        screen: secondsLeft <= input.extensionWindow ? "closing" : "live",
        canBid: true,
      };
    }
    case AUCTION_STATE.PAUSED:
      return { ...base, screen: "paused", canWithdrawBid: viewerLeads };
    case AUCTION_STATE.ENDED:
      return endedView(input, base);
    case AUCTION_STATE.SETTLED:
      return settledView(input, base, hasBid, end);
    case AUCTION_STATE.CANCELLED:
      return { ...base, screen: "cancelled" };
    default:
      return { ...base, screen: "not_started" };
  }
}

type ViewBase = Omit<OneOfOneView, "screen">;

function endedView(input: OneOfOneInput, base: ViewBase): OneOfOneView {
  const refusable =
    input.independent && input.refusableAt > 0n && input.now >= Number(input.refusableAt);
  return {
    ...base,
    screen: "ended",
    canSettle: true,
    canSettleOrRefund: refusable,
  };
}

/** A settled sale: sold, or unsold (a curated work goes to the museum; an Independent one can be offered again). */
function settledView(
  input: OneOfOneInput,
  base: ViewBase,
  hasBid: boolean,
  end: number
): OneOfOneView {
  if (hasBid) return { ...base, screen: "sold" };
  if (!input.independent) return { ...base, screen: "unsold_museum" };
  const restartAt = end + input.restartDelay;
  if (input.now >= restartAt) {
    return { ...base, screen: "unsold_restartable", canRestart: !base.halted, restartAt };
  }
  return { ...base, screen: "unsold_waiting", restartAt };
}

export interface EditionInput {
  readonly status: number;
  readonly bidCount: number;
  /** EndTimes.endTime: bids are accepted before it. */
  readonly endTime: bigint;
  readonly biddingOpen: boolean;
  /** The 1/1's state as the edition sale reads it. */
  readonly oneOfOneState: number;
  readonly now: number;
  /** Seconds: the edition soft-close window. */
  readonly softWindow: number;
  readonly contractPaused: boolean;
  /** abandonable(saleId).ok */
  readonly abandonable: boolean;
  /** The 1/1 is open now and the work is an edition master, so an edition sale may be opened. */
  readonly masterOpenForEditions: boolean;
}

export type EditionScreen =
  | "not_open"
  | "openable"
  | "open"
  | "closing"
  | "closed"
  | "settling"
  | "settled"
  | "void";

export interface EditionView {
  readonly screen: EditionScreen;
  readonly secondsLeft: number;
  readonly canOpen: boolean;
  readonly canBid: boolean;
  readonly canSettle: boolean;
  readonly canAbandon: boolean;
  readonly canClaim: boolean;
  readonly halted: boolean;
}

export function editionView(input: EditionInput): EditionView {
  const halted = input.contractPaused;
  const secondsLeft = Math.max(0, Number(input.endTime) - input.now);
  const base = {
    secondsLeft,
    canOpen: false,
    canBid: false,
    canSettle: false,
    canAbandon: input.abandonable,
    canClaim: false,
    halted,
  };
  switch (input.status) {
    case EDITION_STATUS.NONE:
      return input.masterOpenForEditions
        ? { ...base, screen: "openable", canOpen: !halted }
        : { ...base, screen: "not_open" };
    case EDITION_STATUS.OPEN:
      // The contract's own answer decides: while the 1/1 is paused, bids stay open past the clock.
      if (!input.biddingOpen) {
        return { ...base, screen: "closed", canSettle: settleable(input) };
      }
      return {
        ...base,
        screen: secondsLeft > 0 && secondsLeft <= input.softWindow ? "closing" : "open",
        canBid: true,
      };
    case EDITION_STATUS.CLOSED:
      return { ...base, screen: "closed", canSettle: settleable(input) };
    case EDITION_STATUS.SETTLING:
      return { ...base, screen: "settling", canSettle: true };
    case EDITION_STATUS.SETTLED:
      return { ...base, screen: "settled", canClaim: true };
    case EDITION_STATUS.VOID:
      return { ...base, screen: "void", canClaim: true };
    default:
      return { ...base, screen: "not_open" };
  }
}

/**
 * An edition sale settles after its 1/1 settles or is cancelled. The sale
 * reads the 1/1 it was opened beside, so a later restart does not hold it.
 */
function settleable(input: EditionInput): boolean {
  return (
    input.oneOfOneState === AUCTION_STATE.SETTLED ||
    input.oneOfOneState === AUCTION_STATE.CANCELLED
  );
}

export { ZERO as ZERO_ADDRESS };
