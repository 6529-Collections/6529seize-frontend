import type {
  Address,
  Hex32,
  ItemKind,
  SeedPolicy,
  StreamProgram,
  TokenStandard,
  UnixSeconds,
  Wei,
  WorkKey,
  WorkVariant,
} from "@/lib/stream/model/base";
import type { SaleKindId, SaleRef } from "@/lib/stream/model/sales";

/** Works, artists, statements and federated contracts. See `lib/stream/types.ts`. */

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
    | "bid-withdrawn"
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
// Statements and disputes
// ---------------------------------------------------------------------------

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
