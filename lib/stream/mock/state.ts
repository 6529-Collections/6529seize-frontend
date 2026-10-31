import type { EditionBook, BookResult } from "@/lib/stream/editionBook";
import type { MockAccount } from "@/lib/stream/dataSource";
import type { ArtStyle } from "@/lib/stream/mock/art";
import type {
  Address,
  CurationPackage,
  EditionActivity,
  EditionAuctionStatus,
  EditionAuctionTerms,
  EnglishBid,
  FederatedContract,
  FederatedDelisting,
  Hex32,
  ItemKind,
  LocatorKind,
  MuseumHolding,
  OneOfOneOutcome,
  ProvenanceEvent,
  SaleRef,
  SeedPolicy,
  StatementView,
  StreamProgram,
  TokenStandard,
  WorkEconomics,
  WorkKey,
  WorkParty,
  WorkVariant,
  Wei,
} from "@/lib/stream/types";

/** The mock's in-memory "chain". Views are built from this on every read. */

export interface MockArtistState {
  readonly artistId: string;
  readonly displayName: string;
  readonly handle: string;
  readonly bio: string;
  authority: Address;
  payout: Address;
  restrainedUntil: number | null;
  lastActivity: number;
  readonly consolidatedWallets: Address[];
  readonly federatedContracts: Address[];
  readonly programs: StreamProgram[];
}

/** How the mock stores a work's files: which copies exist and what is on-chain. */
export interface MockStorage {
  readonly locators: readonly LocatorKind[];
  /** Index into `locators` the storage operator prefers. */
  readonly preferred: number;
  readonly onChainComplete: boolean;
  readonly recordOpen: boolean;
  readonly finalized: boolean;
}

export interface MockToken {
  readonly key: WorkKey;
  readonly variant: WorkVariant;
  readonly program: StreamProgram;
  readonly standard: TokenStandard;
  readonly token: Address;
  readonly tokenId: number;
  readonly kind: ItemKind;
  readonly title: string;
  readonly description: string;
  readonly artistId: string;
  readonly parties: readonly WorkParty[];
  readonly collection: {
    readonly id: number;
    readonly name: string;
    readonly serial: number;
  } | null;
  readonly year: number;
  readonly medium: string;
  readonly art: { readonly seed: number; readonly style: ArtStyle };
  storage: MockStorage;
  readonly licenseSpdxId: string;
  readonly seedPolicy: SeedPolicy;
  readonly economics: WorkEconomics;
  readonly linked: { master: WorkKey | null; edition: WorkKey | null };
  owner: Address | null;
  supply: number;
  /** An ERC-1155 edition exists (`createEdition` ran, or a federated edition was created). */
  created: boolean;
  sale: SaleRef | null;
  primarySaleSettled: boolean;
  burned: boolean;
  readonly mintedAt: number | null;
  readonly packageRoot: Hex32;
  readonly itemHash: Hex32;
  readonly federatedContract: Address | null;
}

export interface MockEnglishAuction {
  readonly saleId: string;
  readonly work: WorkKey;
  readonly program: StreamProgram;
  readonly startTime: number;
  endTime: number;
  bidder: Address | null;
  recipient: Address | null;
  bid: Wei;
  readonly bids: EnglishBid[];
  pausedAt: number | null;
  pausedTotal: number;
  pauseUsed: boolean;
  stored: "ACTIVE" | "PAUSED" | "SETTLED" | "CANCELLED";
  settlement: {
    readonly outcome: OneOfOneOutcome;
    readonly to: Address | null;
    readonly price: Wei;
    readonly fee: Wei;
    readonly sellerProceeds: Wei;
    readonly at: number;
  } | null;
  pendingDelivery: Address | null;
  /** A scenario flag: the winner's wallet refuses the token, so delivery goes pending. */
  readonly refusingRecipients: Address[];
}

export interface MockEditionAuction {
  readonly saleId: string;
  readonly edition: WorkKey;
  readonly master: WorkKey | null;
  readonly program: StreamProgram;
  status: EditionAuctionStatus;
  readonly terms: EditionAuctionTerms;
  openedAt: number;
  softEnd: number | null;
  /** A standalone federated 1155's fixed anchor; null when coupled to a 1/1. */
  readonly fixedAnchorEnd: number | null;
  readonly oneOfOneSaleId: string | null;
  readonly book: EditionBook;
  result: BookResult | null;
  /** The lowest and highest steps any bid has used (`Auction.lowStep`, `highStep`). */
  lowStep: number | null;
  highStep: number | null;
  /** A settlement in progress or done (rc.2 chunked settle); null before the first call. */
  settling: MockSettling | null;
  /** The sale's events, oldest first. */
  readonly events: EditionActivity[];
}

/** Where a chunked settlement stands (`ScanWord` and the result's sweep counters). */
export interface MockSettling {
  /** One past the next book word to scan (words are eight steps). */
  cursor: number;
  /** The lowest word: where the scan ends. */
  readonly low: number;
  cleared: boolean;
  departuresSwept: number;
  departures: number;
}

export interface MockSplitWallet {
  readonly address: Address;
  readonly kind: "seller" | "royalty";
  readonly payees: readonly {
    readonly artistId: string;
    readonly account: Address;
    readonly share: number;
  }[];
  received: Wei;
  readonly released: Wei[];
  readonly works: WorkKey[];
}

export interface MockFederatedState extends Omit<
  FederatedContract,
  "works" | "status" | "delisting"
> {
  status: FederatedContract["status"];
  delisting: FederatedDelisting | null;
  nextTokenId: number;
}

export interface PayeeSpec {
  readonly artistId: string;
  /** Share of the seller's part, out of 100,000. */
  readonly share: number;
}

export interface WorkSpec {
  readonly title: string;
  readonly description: string;
  readonly artistId: string;
  readonly payees?: readonly PayeeSpec[];
  readonly collaborators?: readonly string[];
  readonly year: number;
  readonly medium: string;
  readonly style: ArtStyle;
  readonly seed: number;
  readonly kind?: ItemKind;
  readonly license?: string;
  readonly seedPolicy?: SeedPolicy;
  readonly collection?: { readonly id: number; readonly name: string };
  readonly storage?: Partial<MockStorage>;
}

/** An approved item waiting in curation, with what `start` will mint. */
export interface MockPendingItem {
  readonly itemHash: Hex32;
  readonly spec: WorkSpec;
  readonly cap: number;
}

export interface MockState {
  txSequence: number;
  readonly devAccounts: Omit<MockAccount, "balance">[];
  readonly pendingItems: Map<Hex32, MockPendingItem>;
  readonly balances: Map<Address, Wei>;
  readonly artists: Map<string, MockArtistState>;
  readonly tokens: Map<WorkKey, MockToken>;
  readonly englishAuctions: Map<string, MockEnglishAuction>;
  readonly editionAuctions: Map<WorkKey, MockEditionAuction>;
  /** `IEnglishAuction.claimable(account, ETH)`: outbid credits. */
  readonly credits: Map<Address, Wei>;
  readonly splitWallets: Map<Address, MockSplitWallet>;
  /** ERC-1155 balances, keyed `<edition key>|<account>`. */
  readonly editionBalances: Map<string, number>;
  readonly statements: StatementView[];
  readonly packages: CurationPackage[];
  readonly federated: Map<Address, MockFederatedState>;
  readonly museum: MuseumHolding[];
  readonly provenance: Map<WorkKey, ProvenanceEvent[]>;
  networkFees: Wei;
  nextStreamTokenId: number;
  federatedDeployNonce: number;
}
