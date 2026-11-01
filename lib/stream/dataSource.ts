import type { GasEstimate, GasOperation } from "@/lib/stream/gas";
import type {
  AccountOverview,
  Address,
  CurationPackage,
  DisputeView,
  EditionActivity,
  EditionAuction,
  EditionBalance,
  EditionBidView,
  EditionCandidate,
  EditionHolder,
  EditionQuote,
  EditionStepTotal,
  FederatedContract,
  FederatedDeployRequest,
  FederatedDirectoryQuery,
  FederationFactoryInfo,
  Hex32,
  KnownSaleKind,
  MuseumHolding,
  OneOfOneAuction,
  ProvenanceEvent,
  SaleRef,
  SaleView,
  SplitWalletView,
  StreamArtist,
  StreamHomeFeed,
  StreamSourceInfo,
  StreamWork,
  StreamWorkSummary,
  UnixSeconds,
  Wei,
  WorkKey,
  WorkQuery,
} from "@/lib/stream/types";

/**
 * The 6529 Stream data layer. Pages read only through `StreamDataSource` and
 * write only through `StreamActions`, so swapping `MockStreamDataSource` for a
 * chain implementation changes no page. `lib/stream/README.md` maps every
 * method to the contract view or event that backs it.
 */
export interface StreamDataSource {
  /** Which deployment the data comes from (status strip, explorer links). */
  source(): StreamSourceInfo;
  /** The time the data is "as of": simulated in the mock, the latest block on chain. */
  now(): UnixSeconds;
  /**
   * Called whenever any read may have changed (a new block, an event, a mock
   * action, the mock clock). Returns an unsubscribe function.
   */
  subscribe(listener: () => void): () => void;
  /** Increments on every change; React keys reads on it. */
  version(): number;

  // Works and records
  homeFeed(): Promise<StreamHomeFeed>;
  listWorks(query?: WorkQuery): Promise<readonly StreamWorkSummary[]>;
  getWork(key: WorkKey): Promise<StreamWork | null>;
  provenance(key: WorkKey): Promise<readonly ProvenanceEvent[]>;

  // Artists and identity
  listArtists(): Promise<readonly StreamArtist[]>;
  getArtist(artistId: string): Promise<StreamArtist | null>;
  artistOf(account: Address): Promise<StreamArtist | null>;

  // Sales of any kind
  getSale(ref: SaleRef): Promise<SaleView>;

  // The 1/1 English auction
  getOneOfOneAuction(saleId: string): Promise<OneOfOneAuction | null>;
  auctionForWork(key: WorkKey): Promise<OneOfOneAuction | null>;
  /** `claimable(account, ETH)`: outbid and refunded 1/1 bids, waiting to be claimed. */
  claimableCredits(account: Address): Promise<Wei>;

  // The uniform-price edition auction
  listEditionAuctions(): Promise<readonly EditionAuction[]>;
  getEditionAuction(edition: WorkKey): Promise<EditionAuction | null>;
  stepTotals(edition: WorkKey): Promise<readonly EditionStepTotal[]>;
  /** The candidate results behind the clearing ("why this many"). */
  candidates(edition: WorkKey): Promise<readonly EditionCandidate[]>;
  editionBids(
    edition: WorkKey,
    bidder?: Address
  ): Promise<readonly EditionBidView[]>;
  quoteEditionBid(
    edition: WorkKey,
    step: number,
    qty: number
  ): Promise<EditionQuote | null>;
  /** `lowestWinningStep(qty)`: the lowest step where a new bid wins at least one copy. */
  lowestWinningStep(edition: WorkKey, qty: number): Promise<number | null>;
  /** The lowest step where a new bid of `qty` gets every unit in (client-side search). */
  lowestStepFullyIn(edition: WorkKey, qty: number): Promise<number | null>;
  /**
   * What raising bid `bidId` to `newStep` would do (client-side, like
   * `lowestStepFullyIn`): it rejoins the back of `newStep`, leaving a hole.
   */
  quoteEditionRaise(
    edition: WorkKey,
    bidId: number,
    newStep: number
  ): Promise<EditionQuote | null>;
  /** The sale's history from its events, oldest first. */
  editionActivity(edition: WorkKey): Promise<readonly EditionActivity[]>;
  /** The edition's holders, largest first. */
  editionHolders(edition: WorkKey): Promise<readonly EditionHolder[]>;
  /** Every step's price for an auction's locked ladder. */
  ladder(edition: WorkKey): Promise<readonly Wei[]>;

  // Editions, payouts, claims
  editionBalances(account: Address): Promise<readonly EditionBalance[]>;
  splitWallet(address: Address): Promise<SplitWalletView | null>;
  accountOverview(account: Address): Promise<AccountOverview>;

  // Museum, curation, disputes
  museumHoldings(): Promise<readonly MuseumHolding[]>;
  curationQueue(): Promise<readonly CurationPackage[]>;
  disputes(): Promise<readonly DisputeView[]>;

  // 6529 Stream Federated (v1.1 design)
  federatedDirectory(
    query?: FederatedDirectoryQuery
  ): Promise<readonly FederatedContract[]>;
  getFederatedContract(address: Address): Promise<FederatedContract | null>;
  /** The factory, its registry and the templates a new deployment gets. */
  federationFactory(): Promise<FederationFactoryInfo>;
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/** A transaction's outcome: the hash and gas, or the contract's custom error. */
export type TxResult<T = void> =
  | {
      readonly ok: true;
      readonly hash: Hex32;
      readonly gas: GasEstimate | null;
      readonly operation: GasOperation | null;
      readonly value: T;
    }
  | {
      readonly ok: false;
      readonly error: TxError;
    };

/** A revert, named after the contract's custom error (`BidTooLow`, `InvalidAuctionState`, …). */
export interface TxError {
  readonly code: string;
  readonly args?: Readonly<Record<string, string | number | boolean>>;
}

/** `IEnglishAuction` writes. `from` is the connected account. */
export interface EnglishAuctionActions {
  bid(
    from: Address,
    saleId: string,
    amount: Wei,
    recipient?: Address
  ): Promise<TxResult>;
  settle(from: Address, saleId: string): Promise<TxResult>;
  claimDelivery(from: Address, saleId: string, to: Address): Promise<TxResult>;
  /** While the auction is paused for a dispute, the high bidder may withdraw. */
  withdrawBid(from: Address, saleId: string): Promise<TxResult>;
  /** `claim(ETH, to)`: outbid credits, pulled. */
  claimCredits(from: Address, to: Address): Promise<TxResult<Wei>>;
}

/**
 * `IUniformEditionAuction` writes (6529-works ADR 0005). The chain source maps
 * the edition key to `saleIdOf(token, id)`; `settle` sends one call with the
 * remaining departure order from `settlementOrder(saleId)`, and the UI offers
 * the next call while it returns false.
 */
export interface EditionAuctionActions {
  /** Permissionless from the 1/1's start; the keeper batches it with `start`. */
  open(from: Address, edition: WorkKey): Promise<TxResult>;
  bid(
    from: Address,
    edition: WorkKey,
    step: number,
    qty: number
  ): Promise<TxResult<{ readonly bidId: number }>>;
  /** Moves the whole bid up and pays exactly the difference. */
  raise(
    from: Address,
    edition: WorkKey,
    bidId: number,
    newStep: number
  ): Promise<TxResult>;
  /** `withdrawBid(saleId, bidId, to)`: only while the coupled 1/1 is paused for a dispute. */
  withdraw(from: Address, edition: WorkKey, bidId: number): Promise<TxResult>;
  /**
   * One permissionless settle call, after the edition end once the 1/1 is
   * settled or cancelled. Settlement runs in calls of bounded gas: `settled`
   * is false while more calls are needed (the sale stays SETTLING).
   */
  settle(
    from: Address,
    edition: WorkKey
  ): Promise<TxResult<{ readonly settled: boolean }>>;
  /** `claimBid(saleId, bidId, to)`: mints the editions won and sends the refund. */
  claim(
    from: Address,
    edition: WorkKey,
    bidId: number,
    to: Address
  ): Promise<TxResult<{ readonly editions: number; readonly refund: Wei }>>;
}

/** Writes per sale kind; a new adapter adds one entry. */
export interface SaleActionsByKind {
  readonly ENGLISH_AUCTION: EnglishAuctionActions;
  readonly UNIFORM_AUCTION: EditionAuctionActions;
}

export interface FederatedDeployResult {
  /** The deployed contract, or both halves of a pair (721 first). */
  readonly contracts: readonly Address[];
  readonly artistId: string;
}

export interface StreamActions {
  /** The writes of one sale kind. */
  sale<K extends KnownSaleKind>(kind: K): SaleActionsByKind[K];
  /** `EnglishAuction.start`: mints an approved, moved item and starts its 24-hour auction. */
  startAuction(from: Address, itemHash: Hex32): Promise<TxResult<WorkKey>>;
  /** `Editions.createEdition`: anyone, once the master's auction settled. */
  createEdition(from: Address, master: WorkKey): Promise<TxResult<WorkKey>>;
  /** `ISplitWallet.release(ETH, index)`: pull a payee's share. */
  releaseSplit(
    from: Address,
    wallet: Address,
    payeeIndex: number
  ): Promise<TxResult<Wei>>;
  /** The federation factory: deploys a template and registers it (v1.1 design). */
  deployFederated(
    from: Address,
    request: FederatedDeployRequest
  ): Promise<TxResult<FederatedDeployResult>>;
  /** Mints a new federated 1/1 into the shared English auction. */
  mintViaAuction(
    from: Address,
    contract: Address,
    title: string
  ): Promise<TxResult<WorkKey>>;
  /** Creates a federated edition and opens its uniform-price auction. */
  openFederatedEditionAuction(
    from: Address,
    contract: Address,
    title: string,
    cap: number
  ): Promise<TxResult<WorkKey>>;
}

// ---------------------------------------------------------------------------
// Mock-only controls
// ---------------------------------------------------------------------------

/** A dev account in the mock's account switcher. */
export interface MockAccount {
  readonly address: Address;
  readonly role:
    | "collectorA"
    | "collectorB"
    | "artist"
    | "federatedArtist"
    | "museum"
    | "guardian";
  readonly label: string;
  readonly balance: Wei;
}

/**
 * Controls the mock exposes to the dev panel: the simulated clock, the
 * accounts, network-side actors (guardian, TDH vote outcomes) and scenarios.
 * A chain data source has none of these.
 */
export interface StreamDevControls {
  accounts(): readonly MockAccount[];
  clockSpeed(): number;
  setClockSpeed(multiplier: number): void;
  isClockPaused(): boolean;
  setClockPaused(paused: boolean): void;
  advance(seconds: number): void;
  /** Jumps to just before the next scheduled end (1/1 or edition). */
  jumpToNextEnd(): UnixSeconds | null;
  /** The guardian pauses a live 1/1 for a dispute (once per auction). */
  pauseForDispute(work: WorkKey): TxResult;
  /** The TDH vote outcome: upheld cancels and burns; rejected resumes. */
  resolveDispute(work: WorkKey, upheld: boolean): TxResult;
  /** Other bidders bid near the current price, `count` times (edition auctions). */
  simulateEditionBids(edition: WorkKey, count: number): TxResult;
  /** A TDH vote delists or relists a federated contract. */
  setFederatedStatus(contract: Address, delisted: boolean): TxResult;
  reset(): void;
}
