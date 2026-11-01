import type {
  Address,
  Hex32,
  StreamProgram,
  UnixSeconds,
  Wei,
  WorkKey,
} from "@/lib/stream/model/base";

/** Sale methods and the two auctions' read models. See `lib/stream/types.ts`. */

// ---------------------------------------------------------------------------
// Sale methods (extensible)
// ---------------------------------------------------------------------------

/**
 * Sale methods the UI knows, by the adapter's `saleKind()` label (on-chain the
 * value is keccak256 of the label, as in `SaleTypes.SaleKind`: `ENGLISH_AUCTION`
 * and `UNIFORM_AUCTION`, so a label must match the library's exactly). Every
 * contract starts with the two auctions; governance can admit another adapter
 * later.
 *
 * Adding a method (for example a fixed-price sale):
 * 1. add its label here and its view to `SaleViewByKind`;
 * 2. add its actions to `SaleActionsByKind` (`lib/stream/dataSource.ts`);
 * 3. add one mock adapter under `lib/stream/mock/sales/` and register it;
 * 4. add one panel to `components/stream/sales/salePanels.tsx`.
 */
export type KnownSaleKind = "ENGLISH_AUCTION" | "UNIFORM_AUCTION";

/** A sale kind as read from a contract: known, or one this UI version does not render. */
export type SaleKindId = KnownSaleKind | (string & Record<never, never>);

/** Which adapter sells a token, and the sale's ID there. */
export interface SaleRef {
  readonly kind: SaleKindId;
  readonly adapter: Address;
  readonly saleId: string;
}

/** The read model per sale kind. */
export interface SaleViewByKind {
  readonly ENGLISH_AUCTION: OneOfOneAuction;
  readonly UNIFORM_AUCTION: EditionAuction;
}

/** A sale of any kind, or one this UI version cannot render. */
export type SaleView =
  | {
      [K in KnownSaleKind]: {
        readonly kind: K;
        readonly ref: SaleRef;
        readonly sale: SaleViewByKind[K];
      };
    }[KnownSaleKind]
  | { readonly kind: "unsupported"; readonly ref: SaleRef };

// ---------------------------------------------------------------------------
// The 1/1 English auction
// ---------------------------------------------------------------------------

/** `IEnglishAuction.AuctionState`; ENDED is derived (ACTIVE past `endTime`). */
export type EnglishAuctionState =
  | "NONE"
  | "ACTIVE"
  | "PAUSED"
  | "ENDED"
  | "SETTLED"
  | "CANCELLED";

/** A `BidPlaced` event. */
export interface EnglishBid {
  readonly bidder: Address;
  readonly recipient: Address;
  readonly amount: Wei;
  /** The auction's end after this bid. */
  readonly endTime: UnixSeconds;
  readonly at: UnixSeconds;
  /** The bid moved the end (it landed inside the anti-snipe window). */
  readonly extended: boolean;
  readonly txHash: Hex32;
}

/** Where a settled 1/1 went. */
export type OneOfOneOutcome =
  | "collector"
  /** No bids on a canonical work: the 6529 Network Museum (D140). */
  | "museum"
  /** No bids on a federated work: back to its artist. */
  | "artist"
  /** An upheld dispute cancelled the sale and burned the token. */
  | "burned";

/** `IEnglishAuction.auction(saleId)`, `minimumBid`, `lockedTerms`, `pendingDelivery`, plus events. */
export interface OneOfOneAuction {
  readonly saleId: string;
  readonly work: WorkKey;
  readonly token: Address;
  readonly tokenId: bigint;
  readonly program: StreamProgram;
  /** ETH is the zero address. */
  readonly currency: Address;
  readonly state: EnglishAuctionState;
  readonly startTime: UnixSeconds;
  /** Includes anti-snipe extensions and pause resumptions. */
  readonly endTime: UnixSeconds;
  /** `startTime + duration`: the end before any extension. */
  readonly scheduledEnd: UnixSeconds;
  readonly config: {
    readonly duration: number;
    readonly extensionWindow: number;
    readonly incrementShare: number;
    readonly incrementFloor: Wei;
  };
  readonly bidder: Address | null;
  readonly recipient: Address | null;
  /** The high bid; with no bidder, a withdrawn bid's reserve or zero. */
  readonly bid: Wei;
  readonly minimumBid: Wei;
  readonly bids: readonly EnglishBid[];
  readonly pause: {
    readonly pausedAt: UnixSeconds | null;
    readonly pausedTotal: number;
    readonly used: boolean;
    /** When the pause ends by itself (`pausedAt + MAX_PAUSE`). */
    readonly expiresAt: UnixSeconds | null;
  };
  readonly terms: {
    readonly seller: Address;
    readonly feeRecipient: Address;
    readonly feeShare: number;
  };
  readonly settlement: {
    readonly outcome: OneOfOneOutcome;
    readonly to: Address | null;
    readonly price: Wei;
    readonly fee: Wei;
    readonly sellerProceeds: Wei;
    readonly at: UnixSeconds;
  } | null;
  /** `pendingDelivery(saleId)`: a winner whose delivery failed, who may claim it. */
  readonly pendingDelivery: Address | null;
}

// ---------------------------------------------------------------------------
// The uniform-price edition auction (D138-D141; IUniformEditionAuction)
// ---------------------------------------------------------------------------

/**
 * `IUniformEditionAuction.AuctionStatus`. CLOSED is derived (OPEN past its
 * end); SETTLING is cleared and paid with the departure sweep unfinished.
 */
export type EditionAuctionStatus =
  | "NONE"
  | "OPEN"
  | "CLOSED"
  | "SETTLING"
  | "SETTLED"
  | "VOID";

/** The UX state (PLAN section 6 "States"), derived from status, clocks and the 1/1. */
export type EditionAuctionPhase =
  | "opening"
  | "open"
  | "oneOfOneEnded"
  | "extended"
  | "disputed"
  | "closed"
  /** SETTLING: settle runs in calls of bounded gas and has more to do. */
  | "settling"
  | "settled"
  | "void"
  | "noBids";

/** Terms locked when the auction opens (interned terms word, PLAN Appendix A). */
export interface EditionAuctionTerms {
  readonly basePrice: Wei;
  readonly stepsPerDecade: number;
  readonly stepCount: number;
  /** The breadth margin, out of 100,000. */
  readonly marginShare: number;
  readonly closeOffset: number;
  readonly softWindow: number;
  readonly maxExtension: number;
  /** The creator cap; 0 means no cap. */
  readonly maxCount: number;
  readonly feeShare: number;
  readonly seller: Address;
  readonly feeRecipient: Address;
}

/** `endTimes`: the 1/1 end, the edition end, the soft end. */
export interface EditionAuctionTimes {
  readonly openedAt: UnixSeconds;
  /** The coupled 1/1's end, or the fixed anchor for a standalone federated 1155. */
  readonly oneOfOneEnd: UnixSeconds;
  /** `anchorEnd + offset`: the close before any soft-close extension. */
  readonly closeAt: UnixSeconds;
  /** `max(baseEnd, softEnd)`. */
  readonly endTime: UnixSeconds;
  readonly softEnd: UnixSeconds | null;
  /** The latest the soft close may extend to: `anchorEnd + offset + maxExtension`. */
  readonly backstop: UnixSeconds;
}

/** `result`: the live clearing (D138), or the stored result after settle. */
export interface EditionClearing {
  /** k: how many editions mint. */
  readonly count: number;
  /** The clearing step s*, or null with no bids. */
  readonly step: number | null;
  /** Everyone pays this: the lowest winning step's price. */
  readonly price: Wei;
  readonly revenue: Wei;
  /** The network's part (25% canonical, 10% federated). */
  readonly networkFee: Wei;
  /** The artist side: the seller split wallet's part. */
  readonly sellerShare: Wei;
  /** A cap binds inside the cut step, so the marginal bid is partly filled (FIFO). */
  readonly rationed: boolean;
  /** A: units the cut step wins. */
  readonly cutUnits: number;
  /** X: the swept cutoff at the cut step (PLAN section 1.6). */
  readonly cutoff: number;
  /** The best revenue R* and the 90% threshold the result clears. */
  readonly bestRevenue: Wei;
  readonly threshold: Wei;
}

/** `stepTotals`: live units per used step, for the order-book table. */
export interface EditionStepTotal {
  readonly step: number;
  readonly price: Wei;
  readonly units: number;
  /** The running total: units at or above this step. */
  readonly cumulative: number;
  /** min(cumulative, cap) × price. */
  readonly revenue: Wei;
  /** Against the price line: above it "in", a rationed cut step "part", below it "out". */
  readonly status: "in" | "part" | "out";
  /** Units at this step that win (all, the cut step's A, or none). */
  readonly won: number;
}

/**
 * One possible result ("why this many"): count × price = revenue, one per
 * used step from the top, as the clearing scan sees them.
 */
export interface EditionCandidate {
  readonly step: number;
  readonly price: Wei;
  readonly count: number;
  readonly revenue: Wei;
  /** Revenue as a share of the best, in basis points (10,000 = the best). */
  readonly shareOfBestBps: number;
  /** This candidate is the result. */
  readonly chosen: boolean;
  /** This candidate raises the most. */
  readonly best: boolean;
  /** It reaches the breadth threshold (90% of the best). */
  readonly qualifies: boolean;
}

/** A bidder's position (`bidOutcome`). */
export interface EditionBidView {
  readonly bidId: number;
  readonly bidder: Address;
  readonly step: number;
  readonly price: Wei;
  readonly quantity: number;
  /** Queue position in entered units (capped auctions). */
  readonly position: number;
  readonly escrow: Wei;
  readonly placedAt: UnixSeconds;
  /** in: all units win; partly: the marginal bid under a cap; out: none. */
  readonly status: "in" | "partly" | "out";
  readonly unitsWon: number;
  /** escrow − won × clearing price. */
  readonly refund: Wei;
  /** Units ahead of this bid in its step's queue, under a cap. */
  readonly unitsAhead: number;
  /**
   * For a bid not fully in, while bidding is open: the lowest step a raise
   * would get every unit in at (it rejoins the back of that step), or null.
   */
  readonly raiseToGetIn: number | null;
  readonly withdrawn: boolean;
  readonly claimed: boolean;
}

/** `quote(step, qty)`: a what-if for a new bid. */
export interface EditionQuote {
  readonly step: number;
  readonly quantity: number;
  readonly escrow: Wei;
  readonly result: EditionClearing;
  readonly unitsWon: number;
  /** Net existing winning units it would push out. */
  readonly unitsPushedOut: number;
  /** Net existing units it would pull in (the breadth rule). */
  readonly unitsPulledIn: number;
}

/**
 * Settlement progress: `settlement(saleId)` and the latest `SettlementScanned`.
 * Settle is permissionless and runs in calls of bounded gas (rc.2): the first
 * call checks the close and starts scanning the book, each call scans up to 24
 * of its words (eight steps each), the call that finishes the scan clears and
 * pays (`AuctionCleared`), and later calls sweep the clearing step's
 * departures (`DeparturesSwept`). Each settler sweeps on its own
 * (`EditionSweep`); the first to sweep every departure settles the sale.
 * Typical sales settle in one call.
 */
export interface EditionSettlement {
  /** The scan finished: the result is stored and paid. */
  readonly cleared: boolean;
  /** `SettlementScanned.wordsLeft`: book words still to scan; 0 once cleared. */
  readonly wordsLeft: number;
  /** `cutUnits`: the clearing step's winning units. */
  readonly cutUnits: number;
  /** `cutUnits` until a settler's sweep completes, then the final cutoff. */
  readonly cutoff: number;
  /** Zero until a settler's sweep completes, then `departures`. */
  readonly departuresSwept: number;
  /** Departures logged at the clearing step (zero unless rationed). */
  readonly departures: number;
}

/**
 * `IUniformEditionAuctionLens.sweepOf(saleId, settler)`: one settler's own
 * departure sweep in progress. All zero when it has none (it never swept, or
 * it finished).
 */
export interface EditionSweep {
  readonly swept: number;
  /** The least position its next departure may have. */
  readonly nextPosition: number;
  /** Its cutoff so far. */
  readonly cutoff: number;
}

/** The edition auction of one master (or one standalone federated 1155 edition). */
export interface EditionAuction {
  readonly saleId: string;
  /** The edition (ERC-1155) token. */
  readonly edition: WorkKey;
  /** The master, or null for a standalone federated 1155. */
  readonly master: WorkKey | null;
  readonly program: StreamProgram;
  readonly status: EditionAuctionStatus;
  readonly phase: EditionAuctionPhase;
  readonly terms: EditionAuctionTerms;
  readonly times: EditionAuctionTimes;
  readonly liveUnits: number;
  readonly bidCount: number;
  readonly lowStep: number | null;
  readonly highStep: number | null;
  readonly clearing: EditionClearing;
  /** The 1/1 the auction follows (state drives disputed/void). */
  readonly oneOfOne: {
    readonly saleId: string;
    readonly state: EnglishAuctionState;
  } | null;
  /** True once `settle` stored the result. */
  readonly settled: boolean;
  /** `EndTimes.biddingOpen`: a bid would be accepted now. */
  readonly biddingOpen: boolean;
  /** `EndTimes.withdrawalsOpen`: bidders may withdraw now (the 1/1 is paused). */
  readonly withdrawalsOpen: boolean;
  /** Settlement needs `Editions.createEdition` first when k > 0. */
  readonly editionCreated: boolean;
  /** Null before the first settle call, and for a void sale. */
  readonly settlement: EditionSettlement | null;
}

interface EditionActivityBase {
  readonly at: UnixSeconds;
  readonly txHash: Hex32;
  /** The contract event the line comes from. */
  readonly source: string;
}

/**
 * One line of an edition auction's history, from `IUniformEditionAuction`
 * events (indexed per sale). `extended` is derived: the bid's `endTime` is
 * later than the end before it.
 */
export type EditionActivity = EditionActivityBase &
  (
    | { readonly kind: "opened" }
    | {
        readonly kind: "bid";
        readonly bidder: Address;
        readonly bidId: number;
        readonly step: number;
        readonly quantity: number;
        readonly endTime: UnixSeconds;
        readonly extended: boolean;
      }
    | {
        readonly kind: "raised";
        readonly bidder: Address;
        readonly bidId: number;
        readonly fromStep: number;
        readonly step: number;
        readonly quantity: number;
        readonly paid: Wei;
        readonly endTime: UnixSeconds;
        readonly extended: boolean;
      }
    | {
        readonly kind: "withdrawn";
        readonly bidder: Address;
        readonly bidId: number;
        readonly amount: Wei;
      }
    | { readonly kind: "scanned"; readonly wordsLeft: number }
    | {
        readonly kind: "cleared";
        readonly count: number;
        readonly step: number;
        readonly price: Wei;
        readonly revenue: Wei;
        readonly networkFee: Wei;
      }
    | {
        readonly kind: "swept";
        readonly swept: number;
        readonly total: number;
      }
    | { readonly kind: "settled"; readonly count: number }
    | { readonly kind: "voided" }
    | {
        readonly kind: "claimed";
        readonly bidder: Address;
        readonly bidId: number;
        readonly to: Address;
        readonly unitsWon: number;
        readonly refund: Wei;
      }
  );
