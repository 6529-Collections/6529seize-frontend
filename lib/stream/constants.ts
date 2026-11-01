/**
 * Protocol parameters the 6529 Stream UI shows and the mock engine enforces.
 *
 * Every value mirrors a governed or fixed value in the 6529 Works contracts
 * (v1.0.0-rc.2 design). The chain data source reads the governed ones live
 * (`EnglishAuction.config()`, `EconomicsResolver.economics(product)`, the edition
 * auction's locked terms); these are the launch defaults.
 */

/** `Splits.DENOMINATOR`: every share and rate is out of 100,000. */
export const SPLITS_DENOMINATOR = 100_000;

/** `PRODUCT_STREAM` and `PRODUCT_EDITIONS` network fee share: 75/25. */
export const CANONICAL_FEE_SHARE = 25_000;

/** `PRODUCT_FEDERATED` network fee share: 90/10 (ADR 0001 section 16). */
export const FEDERATED_FEE_SHARE = 10_000;

/** `DEFAULT_ROYALTY_RATE`: 6.529%, out of 100,000. */
export const DEFAULT_ROYALTY_RATE = 6_529;

/** The default license every canonical work starts with (irrevocable). */
export const CC0_SPDX_ID = "CC0-1.0";

export const WEI_PER_ETH = 10n ** 18n;

/** The zero address: ETH as a currency, and "no bidder". */
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const SECONDS_PER_MINUTE = 60;
export const SECONDS_PER_HOUR = 3_600;
export const SECONDS_PER_DAY = 86_400;

/** `IEnglishAuction.AuctionConfig` at launch. */
export const ENGLISH_AUCTION_CONFIG = {
  /** Seconds from start to end: 24 hours. */
  duration: SECONDS_PER_DAY,
  /** The anti-snipe window and extension: 15 minutes. */
  extensionWindow: 15 * SECONDS_PER_MINUTE,
  /** Minimum relative increment, out of 100,000: 5%. */
  incrementShare: 5_000,
} as const;

/** The ETH increment floor on the asset allowlist: 0.001 ETH. */
export const ETH_INCREMENT_FLOOR = 10n ** 15n;

/** The ETH opening bid at launch (`openingBid(ETH)`); the first bid is still at least 1 wei. */
export const ETH_OPENING_BID = 0n;

/** `MAX_PAUSE`: a dispute pause ends by itself after 7 days. */
export const MAX_DISPUTE_PAUSE = 7 * SECONDS_PER_DAY;

/** `Roles.STANDARD`: resume and cancel wait 48 hours after a pause. */
export const DISPUTE_DECISION_DELAY = 2 * SECONDS_PER_DAY;

/** Governed edition-auction parameters (D86, PLAN section 1.10), launch defaults. */
export const EDITION_AUCTION_CONFIG = {
  /** Breadth margin (D138): 10%, out of 100,000 (`marginShare`). */
  marginShare: 10_000,
  /** Steps per decade: 48 (about 4.9% apart). */
  perDecade: 48,
  /** Base price: 0.0001 ETH. */
  base: 10n ** 14n,
  /** Number of steps: 336, reaching 953 ETH. */
  steps: 336,
  /** The edition close follows the 1/1's final end by 15 minutes (D140). */
  offset: 15 * SECONDS_PER_MINUTE,
  /** Soft close (D141): a bid in the last 5 minutes extends to 5 minutes after it. */
  softWindow: 5 * SECONDS_PER_MINUTE,
  /** Total soft-close extension is capped at 24 hours (owner decision 5). */
  maxExtension: SECONDS_PER_DAY,
} as const;

/**
 * PROVISIONAL. A standalone federated ERC-1155 edition auction has no 1/1 to
 * follow, and the contracts don't define its close yet. The mock closes it a
 * fixed 24 hours after opening (PLAN section 1.12, "a fixed-duration anchor"),
 * with no 15-minute offset, then the usual 5-minute soft close and its 24-hour
 * backstop. Federated contracts start with the two auctions (owner decision 14).
 */
export const STANDALONE_EDITION_DURATION = 24 * SECONDS_PER_HOUR;

/** Upper bound on one edition bid's quantity (`qty < 2^32`). */
export const MAX_EDITION_BID_QTY = 2 ** 32 - 1;
