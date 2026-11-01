import {
  ENGLISH_AUCTION_CONFIG,
  ETH_INCREMENT_FLOOR,
  ETH_OPENING_BID,
  MAX_DISPUTE_PAUSE,
  SPLITS_DENOMINATOR,
} from "@/lib/stream/constants";
import type { EnglishAuctionState, UnixSeconds, Wei } from "@/lib/stream/types";

/**
 * The 1/1 English auction's rules (`IEnglishAuction`, ADR 0001 sections 5 and
 * 12), as pure functions over the stored auction. The mock engine runs them;
 * the chain reads the same answers from `minimumBid`, `auction` and events.
 */

interface EnglishAuctionRules {
  readonly duration: number;
  readonly extensionWindow: number;
  readonly incrementShare: number;
  readonly incrementFloor: Wei;
  readonly openingBid: Wei;
}

export const LAUNCH_RULES: EnglishAuctionRules = {
  ...ENGLISH_AUCTION_CONFIG,
  incrementFloor: ETH_INCREMENT_FLOOR,
  openingBid: ETH_OPENING_BID,
};

/** The stored part of `IEnglishAuction.Auction` the rules need. */
interface StoredAuction {
  readonly bidder: string | null;
  /** The high bid, or with no bidder a withdrawn bid's reserve. */
  readonly bid: Wei;
  readonly endTime: UnixSeconds;
  readonly pausedAt: UnixSeconds | null;
  readonly stored: "ACTIVE" | "PAUSED" | "SETTLED" | "CANCELLED";
}

function ceilDiv(numerator: Wei, denominator: Wei): Wei {
  return (numerator + denominator - 1n) / denominator;
}

/**
 * `minimumBid(saleId)`. The first bid is at least the opening bid, a withdrawn
 * bid's reserve, and 1 wei. A later bid beats the high bid by
 * max(the increment share of it rounded up, the increment floor).
 */
export function minimumBid(
  auction: Pick<StoredAuction, "bidder" | "bid">,
  rules: EnglishAuctionRules = LAUNCH_RULES
): Wei {
  if (auction.bidder === null) {
    const floor =
      auction.bid > rules.openingBid ? auction.bid : rules.openingBid;
    return floor > 1n ? floor : 1n;
  }
  const share = ceilDiv(
    auction.bid * BigInt(rules.incrementShare),
    BigInt(SPLITS_DENOMINATOR)
  );
  const step = share > rules.incrementFloor ? share : rules.incrementFloor;
  return auction.bid + step;
}

/**
 * The end after a bid at `now`: a bid in the last `extensionWindow` seconds
 * moves the end to `extensionWindow` seconds after it.
 */
export function endAfterBid(
  endTime: UnixSeconds,
  now: UnixSeconds,
  rules: EnglishAuctionRules = LAUNCH_RULES
): UnixSeconds {
  const extended = now + rules.extensionWindow;
  return extended > endTime ? extended : endTime;
}

/**
 * Whether a bid at `now` moves the end: the contract extends when
 * `endTime - now < extensionWindow`, so a bid exactly 15 minutes out does not.
 */
export function isInAntiSnipeWindow(
  endTime: UnixSeconds,
  now: UnixSeconds,
  rules: EnglishAuctionRules = LAUNCH_RULES
): boolean {
  return now < endTime && endTime - now < rules.extensionWindow;
}

/**
 * The end a paused auction resumes to: its remaining time at the pause, the
 * governed duration or the anti-snipe window, whichever is longest.
 */
export function resumedEnd(
  auction: Pick<StoredAuction, "endTime" | "pausedAt">,
  now: UnixSeconds,
  rules: EnglishAuctionRules = LAUNCH_RULES
): UnixSeconds {
  const pausedAt = auction.pausedAt ?? now;
  const remaining = Math.max(0, auction.endTime - pausedAt);
  return now + Math.max(remaining, rules.duration, rules.extensionWindow);
}

/** When a pause ends by itself (`pausedAt + MAX_PAUSE`). */
export function pauseExpiry(pausedAt: UnixSeconds): UnixSeconds {
  return pausedAt + MAX_DISPUTE_PAUSE;
}

/** `auction(saleId).state`, with ENDED derived from the clock. */
export function deriveState(
  auction: StoredAuction,
  now: UnixSeconds
): EnglishAuctionState {
  if (auction.stored !== "ACTIVE") {
    return auction.stored;
  }
  return now >= auction.endTime ? "ENDED" : "ACTIVE";
}

/** The network fee and the seller's part of a price (`feeShare` out of 100,000). */
export function splitProceeds(
  price: Wei,
  feeShare: number
): { readonly fee: Wei; readonly seller: Wei } {
  const fee = (price * BigInt(feeShare)) / BigInt(SPLITS_DENOMINATOR);
  return { fee, seller: price - fee };
}

/** ERC-2981 `royaltyInfo(id, salePrice)` amount. */
export function royaltyAmount(salePrice: Wei, royaltyRate: number): Wei {
  return (salePrice * BigInt(royaltyRate)) / BigInt(SPLITS_DENOMINATOR);
}
