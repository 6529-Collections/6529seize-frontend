/**
 * Domain types for the 6529 Stream UI.
 *
 * Every type follows a contract view, struct or event in 6529 Works
 * (`src/interfaces/*`), or an indexer-style read built from those events. The
 * comment on each names its source, so the chain data source can fill it
 * mechanically. Amounts are wei as `bigint`; times are Unix seconds; shares and
 * rates are out of `SPLITS_DENOMINATOR` (100,000) unless named `Bps`.
 */

export type Address = `0x${string}`;
/** A 32-byte value: hashes, file IDs, entry hashes, package roots. */
export type Hex32 = `0x${string}`;
export type Wei = bigint;
export type UnixSeconds = number;

/**
 * A work's address in the UI and in URLs. A canonical 6529 Stream token is its
 * bare token ID ("12"); any other token is `<contract>-<tokenId>`. See
 * `lib/stream/workKey.ts`.
 */
export type WorkKey = string;

// ---------------------------------------------------------------------------
// Programs, contracts and variants
// ---------------------------------------------------------------------------

/** Curated by the network (6529 Stream, 6529 Stream Editions) or artist-owned. */
export type StreamProgram = "canonical" | "federated";

export type TokenStandard = "ERC721" | "ERC1155";

/**
 * What a token is, as one first-class field. Pages switch on this.
 * - `stream-1of1`: a 6529 Stream ERC-721 work (it may be an edition master).
 * - `stream-edition`: a 6529 Stream Editions ERC-1155 edition of a Stream master.
 * - `federated-721`: a work in a standalone federated ERC-721.
 * - `federated-1155`: an edition in a standalone federated ERC-1155.
 * - `federated-pair-master`: the ERC-721 half of a linked federated pair.
 * - `federated-pair-edition`: the ERC-1155 half of a linked federated pair.
 */
export type WorkVariant =
  | "stream-1of1"
  | "stream-edition"
  | "federated-721"
  | "federated-1155"
  | "federated-pair-master"
  | "federated-pair-edition";

/** `PackageTypes.ItemKind`. */
export type ItemKind = "ORIGINAL" | "EDITION_MASTER";

/** `PackageTypes.SeedPolicy`. */
export type SeedPolicy = "NONE" | "ARTIST" | "VRF";

/** The deployment the data comes from, for the status strip. */
export interface StreamSourceInfo {
  readonly kind: "mock" | "chain";
  readonly chainId: number;
  readonly network: "sepolia" | "mainnet";
  /** The deployment instance, for example "r4". */
  readonly instance: string;
  /** Federated is a v1.1 design with no contracts; always "design" until it ships. */
  readonly federated: "design" | "live";
  readonly contracts: StreamContracts;
}

/** Addresses the UI links to. From the deployment record (`deployments/<chainId>/*.json`). */
export interface StreamContracts {
  readonly stream: Address;
  readonly editions: Address;
  readonly workRecords: Address;
  readonly englishAuction: Address;
  readonly editionAuction: Address;
  readonly economics: Address;
  readonly statementLog: Address;
  readonly artistRegistry: Address;
  readonly packageRegistry: Address;
  readonly museum: Address;
  readonly networkFeeRecipient: Address;
  /** v1.1 only; the mock invents addresses so the UI can be built. */
  readonly federationRegistry: Address | null;
  readonly federationFactory: Address | null;
}

// ---------------------------------------------------------------------------
// Works: tokenURI, records, media, license, provenance
// ---------------------------------------------------------------------------

/** One `attributes` entry of the tokenURI JSON (renderer traits, then the record's). */
export interface TokenAttribute {
  readonly trait_type: string;
  readonly value: string | number;
  readonly display_type?: string;
  readonly max_value?: number;
}

/** `tokenURI` / `uri` decoded (docs/integrators/reading-a-work.md, "Field reference"). */
export interface TokenUriJson {
  readonly name: string;
  readonly description: string;
  readonly image?: string;
  readonly animation_url?: string;
  readonly media_url?: string;
  readonly content_type?: string;
  readonly content_hash?: Hex32;
  readonly license?: string;
  readonly license_url?: string;
  readonly license_text_file?: Hex32;
  /** Core-only form: the record is `not_open`, `incomplete` or `invalid`. */
  readonly record_status?: "not_open" | "incomplete" | "invalid";
  readonly attributes: readonly TokenAttribute[];
}

/** `IWorkRecords.RecordInfo`. Null on the work while `isOpen(tokenId)` is false. */
export interface WorkRecordInfo {
  readonly recordFileId: Hex32;
  readonly mediaHash: Hex32;
  readonly licenseKey: Hex32;
  readonly version: number;
  readonly finalized: boolean;
  readonly onChainComplete: boolean;
  readonly renderer: Address;
}

/** `ContentTypes.LocatorKind`. */
export type LocatorKind = "ARWEAVE" | "IPFS" | "ONCHAIN";

/** `ContentTypes.Locator`: `ar://<43 chars>`, `ipfs://<CIDv1>` or an on-chain copy (no URL). */
export interface MediaLocator {
  readonly kind: LocatorKind;
  readonly uri: string;
}

/** `ContentTypes.FileRole`. */
export type FileRole = "PRIMARY" | "PREVIEW" | "AUXILIARY";

/** How the browser shows a file. Derived from the MIME type. */
export type MediaKind =
  | "image"
  | "video"
  | "audio"
  | "html"
  | "script"
  | "other";

/**
 * A media file with its copies: `WorkRecords.mediaOf`, `locators`,
 * `preferredLocator` and `ContentStore.isComplete`.
 */
export interface MediaFileView {
  readonly fileId: Hex32;
  readonly sha256: Hex32;
  readonly role: FileRole;
  readonly contentType: string;
  readonly kind: MediaKind;
  readonly bytes: number;
  readonly locators: readonly MediaLocator[];
  /** Index into `locators` of the served copy (`preferredLocator`). */
  readonly preferred: number;
  /** Stored in full in the content store. */
  readonly onChain: boolean;
  /**
   * What the browser can load: a `data:` URI from the metadata, or a gateway
   * URL for the preferred copy. The mock fills generated content here.
   */
  readonly displayUri: string | null;
}

/** Where a work's files live, derived from the media list and the record. */
export type StorageStatus = "off-chain" | "partly-on-chain" | "on-chain";

/** `PackageTypes.License`, plus whether it can still change (CC0 is irrevocable, WS-12). */
export interface WorkLicense {
  readonly spdxId: string;
  readonly textFileId: Hex32 | null;
  readonly url: string | null;
  readonly irrevocable: boolean;
}

/** A credited party (`PackageTypes.Party`) with display data from the artist registry. */
export interface WorkParty {
  readonly artistId: string;
  readonly account: Address;
  readonly role: "ARTIST" | "COLLABORATOR";
  readonly displayName: string;
}

/** `WorkTerms`, locked at mint (`IStream.work`, `IEditions.edition`, federated registry entry). */
export interface WorkEconomics {
  /** The seller split wallet: artist and collaborators per the package payees. */
  readonly seller: Address;
  readonly feeRecipient: Address;
  readonly feeShare: number;
  readonly royaltyReceiver: Address;
  readonly royaltyRate: number;
}

/** One provenance line, from indexed events. */
export interface ProvenanceEvent {
  readonly kind:
    | "approved"
    | "minted"
    | "auction-started"
    | "bid"
    | "settled"
    | "to-museum"
    | "to-artist"
    | "delivery-pending"
    | "delivery-claimed"
    | "transfer"
    | "record-opened"
    | "record-finalized"
    | "on-chain-complete"
    | "locator-added"
    | "edition-created"
    | "editions-minted"
    | "dispute-paused"
    | "dispute-resumed"
    | "dispute-cancelled"
    | "statement"
    | "burned";
  readonly at: UnixSeconds;
  readonly actor: Address | null;
  readonly amount?: Wei;
  readonly txHash: Hex32;
  /** The contract event this line comes from, for the swap plan and for debugging. */
  readonly source: string;
}

/** A work, in every variant. */
export interface StreamWork {
  readonly key: WorkKey;
  readonly variant: WorkVariant;
  readonly program: StreamProgram;
  readonly standard: TokenStandard;
  readonly token: Address;
  /** uint256 on-chain; sequential from 1, so it fits a JS number. */
  readonly tokenId: number;
  readonly kind: ItemKind;
  readonly title: string;
  readonly artistId: string;
  readonly parties: readonly WorkParty[];
  readonly collection: {
    readonly id: number;
    readonly name: string;
    readonly serial: number;
  } | null;
  /** `tokenURI` (ERC-721) or `uri` (ERC-1155), decoded. */
  readonly metadata: TokenUriJson;
  readonly record: WorkRecordInfo | null;
  readonly media: readonly MediaFileView[];
  readonly storage: StorageStatus;
  readonly license: WorkLicense | null;
  readonly seed: { readonly policy: SeedPolicy; readonly seed: Hex32 | null };
  readonly economics: WorkEconomics;
  /** The other half of a master/edition link (Stream ⇄ Stream Editions, or a federated pair). */
  readonly linked: {
    readonly master: WorkKey | null;
    readonly edition: WorkKey | null;
  };
  /** ERC-721 owner (`ownerOf`), or null for an edition or a burned token. */
  readonly owner: Address | null;
  /** ERC-1155 supply minted so far (`IEditions.edition(id).minted`). */
  readonly editionSupply: number | null;
  /** The sale that mints this token, if any. Its kind is extensible (`SaleKindId`). */
  readonly sale: SaleRef | null;
  readonly primarySaleSettled: boolean;
  /** The latest dispute outcome (`StatementLog.latestDisputeOutcome`), and the pause state. */
  readonly dispute: WorkDisputeState;
  /** For federated tokens: the contract and its registry status. */
  readonly federated: {
    readonly contract: Address;
    readonly status: FederatedStatus;
  } | null;
  readonly packageRoot: Hex32;
  readonly itemHash: Hex32;
  readonly mintedAt: UnixSeconds | null;
  readonly burned: boolean;
}

/** A summary for lists and cards. */
export interface StreamWorkSummary {
  readonly key: WorkKey;
  readonly variant: WorkVariant;
  readonly title: string;
  readonly artistId: string;
  readonly artistName: string;
  readonly thumbnailUri: string | null;
  readonly storage: StorageStatus;
  readonly licenseSpdxId: string | null;
}

// ---------------------------------------------------------------------------
// Artists and identity
// ---------------------------------------------------------------------------

/** `IdentityTypes.ChangeKind`. */
type IdentityChangeKind = "STANDARD" | "CONTESTED" | "ESTATE" | "LOST_KEY";

/** `IArtistRegistry.pendingChange`, summarized. */
export interface PendingIdentityChange {
  readonly kind: IdentityChangeKind;
  readonly stagedAt: UnixSeconds;
  readonly executableAt: UnixSeconds;
  readonly contestedAt: UnixSeconds | null;
  readonly nextAuthority: Address;
  readonly nextPayout: Address;
}

/** `IArtistRegistry.artist`, `activeAuthorityOf`, `pendingChange`, `standingOf`, plus a profile. */
export interface StreamArtist {
  /** The artist ID as lowercase hex, as the renderer's `Artist ID` trait writes it. */
  readonly artistId: string;
  readonly displayName: string;
  readonly handle: string;
  readonly bio: string;
  readonly authority: Address;
  readonly payout: Address;
  /** Null while a pending override restrains the artist (IDENTITY-1). */
  readonly activeAuthority: Address | null;
  readonly pendingChange: PendingIdentityChange | null;
  readonly lastActivity: UnixSeconds;
  readonly consolidatedWallets: readonly Address[];
  /** `IArtistRegistry.listFederatedContract` entries. */
  readonly federatedContracts: readonly Address[];
  readonly programs: readonly StreamProgram[];
}

// ---------------------------------------------------------------------------
// Sale methods (extensible)
// ---------------------------------------------------------------------------

/**
 * Sale methods the UI knows, by the adapter's `saleKind()` label (on-chain the
 * value is keccak256 of the label, as in `SaleTypes.SaleKind`). Every contract
 * starts with the two auctions; governance can admit another adapter later.
 *
 * Adding a method (for example a fixed-price sale):
 * 1. add its label here and its view to `SaleViewByKind`;
 * 2. add its actions to `SaleActionsByKind` (`lib/stream/dataSource.ts`);
 * 3. add one mock adapter under `lib/stream/mock/sales/` and register it;
 * 4. add one panel to `components/stream/sales/salePanels.tsx`.
 */
export type KnownSaleKind = "ENGLISH_AUCTION" | "UNIFORM_EDITION_AUCTION";

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
  readonly UNIFORM_EDITION_AUCTION: EditionAuction;
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
  readonly tokenId: number;
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
  readonly highBidder: Address | null;
  readonly recipient: Address | null;
  /** The high bid; with no bidder, a withdrawn bid's reserve or zero. */
  readonly highBid: Wei;
  readonly minimumNextBid: Wei;
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
  | "settled"
  | "void"
  | "noBids";

/** Terms locked when the auction opens (interned terms word, PLAN Appendix A). */
export interface EditionAuctionTerms {
  readonly base: Wei;
  readonly perDecade: number;
  readonly steps: number;
  /** The breadth margin, out of 100,000. */
  readonly marginShare: number;
  readonly offset: number;
  readonly softWindow: number;
  readonly maxExtension: number;
  /** The creator cap; 0 means no cap. */
  readonly cap: number;
  readonly feeShare: number;
  readonly seller: Address;
  readonly feeRecipient: Address;
}

/** `endTimes`: the 1/1 end, the edition end, the soft end. */
export interface EditionAuctionTimes {
  readonly openedAt: UnixSeconds;
  /** The coupled 1/1's end, or the fixed anchor for a standalone federated 1155. */
  readonly anchorEnd: UnixSeconds;
  /** `anchorEnd + offset`: the close before any soft-close extension. */
  readonly baseEnd: UnixSeconds;
  /** `max(baseEnd, softEnd)`. */
  readonly editionEnd: UnixSeconds;
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
  readonly networkShare: Wei;
  /** The artist side: the seller split wallet's part. */
  readonly sellerShare: Wei;
  /** A cap binds inside the cut step, so the marginal bid is partly filled (FIFO). */
  readonly rationed: boolean;
  /** A: units the cut step wins. */
  readonly cutStepUnits: number;
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
  readonly qty: number;
  /** Queue position in entered units (capped auctions). */
  readonly pos: number;
  readonly escrow: Wei;
  readonly placedAt: UnixSeconds;
  /** in: all units win; partly: the marginal bid under a cap; out: none. */
  readonly status: "in" | "partly" | "out";
  readonly won: number;
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
  readonly qty: number;
  readonly cost: Wei;
  readonly after: EditionClearing;
  readonly won: number;
  /** Net existing winning units it would push out. */
  readonly pushedOut: number;
  /** Net existing units it would pull in (the breadth rule). */
  readonly pulledIn: number;
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
  readonly totalUnits: number;
  readonly bidCount: number;
  readonly lo: number | null;
  readonly hi: number | null;
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
}

// ---------------------------------------------------------------------------
// Editions, payouts, claims
// ---------------------------------------------------------------------------

/** ERC-1155 `balanceOf(account, id)` for an edition. */
export interface EditionBalance {
  readonly edition: WorkKey;
  readonly token: Address;
  readonly id: number;
  readonly balance: number;
}

/** `ISplitWallet.Payee` with `released` / `releasable` for ETH. */
export interface SplitPayeeView {
  readonly index: number;
  readonly artistId: string;
  readonly account: Address;
  readonly share: number;
  readonly released: Wei;
  readonly releasable: Wei;
}

/** A seller or royalty split wallet (`ISplitWallet`). */
export interface SplitWalletView {
  readonly address: Address;
  readonly payees: readonly SplitPayeeView[];
  /** Total ETH the wallet has received (`observed(ETH)`). */
  readonly received: Wei;
  readonly works: readonly WorkKey[];
}

/** Everything an account can claim or collect now. */
export type ClaimableItem =
  | {
      /** An outbid 1/1 bid, credited (`IEnglishAuction.claimable(account, ETH)`). */
      readonly kind: "auction-credit";
      readonly amount: Wei;
    }
  | {
      /** Edition-auction refunds and wins (`bidOutcome`), claimed per bid. */
      readonly kind: "edition-bid";
      readonly edition: WorkKey;
      readonly bidId: number;
      readonly editions: number;
      readonly refund: Wei;
    }
  | {
      /** A won 1/1 whose delivery failed (`pendingDelivery`). */
      readonly kind: "pending-delivery";
      readonly work: WorkKey;
      readonly saleId: string;
    }
  | {
      /** A seller or royalty split share (`ISplitWallet.releasable`). */
      readonly kind: "split-payout";
      readonly wallet: Address;
      readonly payeeIndex: number;
      readonly amount: Wei;
    };

/** A 1/1 bid the account placed, live or finished. */
export interface AccountOneOfOneBid {
  readonly saleId: string;
  readonly work: WorkKey;
  readonly amount: Wei;
  readonly at: UnixSeconds;
  readonly leading: boolean;
  readonly state: EnglishAuctionState;
}

/** The dashboard's one read for an account. */
export interface AccountOverview {
  readonly account: Address;
  readonly artist: StreamArtist | null;
  readonly oneOfOneBids: readonly AccountOneOfOneBid[];
  readonly editionBids: readonly (EditionBidView & {
    readonly edition: WorkKey;
  })[];
  readonly claimable: readonly ClaimableItem[];
  readonly owned: readonly WorkKey[];
  readonly editions: readonly EditionBalance[];
  readonly splitWallets: readonly SplitWalletView[];
}

// ---------------------------------------------------------------------------
// Museum, curation, disputes, statements
// ---------------------------------------------------------------------------

/** A work the 6529 Network Museum holds (`ownerOf == EconomicsResolver.museum()`). */
export interface MuseumHolding {
  readonly work: WorkKey;
  readonly arrivedAt: UnixSeconds;
  /** No bids (D140), or the 30-day currency-freeze exit (owner decision 10). */
  readonly reason: "no-bids" | "freeze-exit";
  readonly txHash: Hex32;
}

/** `IStatementLog.Role`. */
export type StatementRole = "ARTIST" | "OWNER" | "CURATOR" | "PLATFORM";

/** A `StatementAppended` event. */
export interface StatementView {
  readonly entryHash: Hex32;
  readonly role: StatementRole;
  /** The kind's label, for example "DISPUTE_OUTCOME" (on-chain: its keccak256). */
  readonly kind: string;
  readonly subject: { readonly token: Address; readonly id: number };
  readonly contentHash: Hex32;
  readonly uri: string | null;
  readonly summary: string;
  readonly supersedes: Hex32 | null;
  readonly at: UnixSeconds;
}

/** A work's dispute state for display. */
export interface WorkDisputeState {
  /** Live auction paused by a guardian, waiting for the TDH vote. */
  readonly paused: boolean;
  readonly pausedAt: UnixSeconds | null;
  /** When the guardians may resume or cancel (48 hours after the pause). */
  readonly decisionFrom: UnixSeconds | null;
  readonly expiresAt: UnixSeconds | null;
  /** `latestDisputeOutcome`: the entry hash the renderer shows as the `Dispute statement` trait. */
  readonly latestOutcome: Hex32 | null;
  readonly statements: readonly StatementView[];
}

/** A dispute for the disputes list. */
export interface DisputeView {
  readonly work: WorkKey;
  readonly state:
    | "paused"
    | "upheld"
    | "rejected"
    | "lapsed"
    | "statement-only";
  readonly openedAt: UnixSeconds;
  readonly outcomeRef: Hex32 | null;
  readonly statements: readonly StatementView[];
}

/** `IPackageRegistry` status of a package root. */
export type PackageStatus = "REGISTERED" | "REVOKED";

/** One approved item, and what it still needs before anyone can start its sale. */
export interface CurationItem {
  readonly itemHash: Hex32;
  readonly title: string;
  readonly artistId: string;
  readonly kind: ItemKind;
  readonly thumbnailUri: string | null;
  /** Parties that accepted the root (`acceptedAs`) out of all named parties. */
  readonly accepted: number;
  readonly parties: number;
  /** The lead artist signed "move to Stream". */
  readonly moveSigned: boolean;
  readonly consumed: boolean;
  /** Everything is in place: anyone can call `start`. */
  readonly startable: boolean;
  readonly editionCap: number | null;
  readonly licenseSpdxId: string;
}

/** A `PackageRegistered` root with its items (items from the published package file). */
export interface CurationPackage {
  readonly packageRoot: Hex32;
  readonly status: PackageStatus;
  readonly signer: Address;
  readonly evidenceHash: Hex32;
  readonly registeredAt: UnixSeconds;
  /** The wave vote the approval came from (off-chain). */
  readonly waveVote: string;
  readonly items: readonly CurationItem[];
}

// ---------------------------------------------------------------------------
// 6529 Stream Federated (v1.1 design; IFederationRegistry)
// ---------------------------------------------------------------------------

/** `IFederationRegistry.Form`. */
export type FederatedForm = "ERC721" | "ERC1155" | "PAIR";

/** `IFederationRegistry.Status`. */
export type FederatedStatus = "ACTIVE" | "DELISTED";

/** A delisting decided by TDH vote through the dispute process (`StatusSet`). */
export interface FederatedDelisting {
  readonly voteRef: Hex32;
  readonly statement: StatementView | null;
  readonly at: UnixSeconds;
  readonly reason: "fraud" | "impersonation" | "illegal-content";
}

/** `IFederationRegistry.Entry` for one contract, plus its token metadata. */
export interface FederatedContract {
  readonly address: Address;
  readonly form: FederatedForm;
  /** This half's standard (a pair has one entry per half). */
  readonly standard: TokenStandard;
  /** The other half of a linked pair, or null. */
  readonly partner: Address | null;
  readonly artistId: string;
  readonly templateVersion: number;
  readonly codeHash: Hex32;
  readonly feeShare: number;
  readonly status: FederatedStatus;
  /** `setArtistDelisted`: the whole identity is delisted. */
  readonly artistDelisted: boolean;
  readonly name: string;
  readonly symbol: string;
  readonly deployedAt: UnixSeconds;
  readonly deployTx: Hex32;
  readonly defaultLicense: string;
  readonly works: readonly WorkKey[];
  /**
   * Sale methods whose adapters may mint into this contract. Every contract
   * starts with the two auctions; which further methods federated contracts get
   * is an open owner question.
   */
  readonly saleKinds: readonly SaleKindId[];
  readonly delisting: FederatedDelisting | null;
}

/** The registry directory query. */
export interface FederatedDirectoryQuery {
  readonly form?: FederatedForm;
  readonly artistId?: string;
  readonly search?: string;
  /** Delisted contracts are hidden from 6529.io by default. */
  readonly includeDelisted?: boolean;
}

/** The launch wizard's input to the federation factory. */
export interface FederatedDeployRequest {
  readonly form: FederatedForm;
  readonly name: string;
  readonly symbol: string;
  /** SPDX ID or `LicenseRef-…`; any license (ADR 0001 section 16). */
  readonly defaultLicense: string;
  /** For a pair, the 1155 half's name and symbol. */
  readonly editionName?: string;
  readonly editionSymbol?: string;
}

// ---------------------------------------------------------------------------
// Listing queries
// ---------------------------------------------------------------------------

/** Home and browse lists. */
export interface StreamHomeFeed {
  readonly live: readonly WorkKey[];
  readonly endingSoon: readonly WorkKey[];
  readonly upcoming: readonly CurationItem[];
  readonly recentResults: readonly WorkKey[];
  readonly editionsLive: readonly WorkKey[];
}

export interface WorkQuery {
  readonly program?: StreamProgram;
  readonly variant?: WorkVariant;
  readonly artistId?: string;
  readonly federatedContract?: Address;
}
