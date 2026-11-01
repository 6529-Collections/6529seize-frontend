import type {
  Address,
  Hex32,
  ItemKind,
  StreamProgram,
  UnixSeconds,
  Wei,
  WorkKey,
  WorkVariant,
} from "@/lib/stream/model/base";
import type {
  EditionBidView,
  EnglishAuctionState,
} from "@/lib/stream/model/sales";
import type { StatementView, StreamArtist } from "@/lib/stream/model/records";

/** Editions, payouts, claims, museum, curation and listing queries. See `lib/stream/types.ts`. */

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

/** An edition's holder: ERC-1155 balances from `TransferSingle` (and batch) events. */
export interface EditionHolder {
  readonly account: Address;
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

// ---------------------------------------------------------------------------
// Curation
// ---------------------------------------------------------------------------

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
  /**
   * The curator's `CURATION_EVIDENCE` statement for this root (subject
   * `(address(0), uint256(packageRoot))`): the published vote record that
   * `evidenceHash` commits to. Null until the curator publishes it.
   */
  readonly voteRecord: StatementView | null;
  /** `PackageRevoked`: a guardian revoked the approval, so unconsumed items cannot mint. */
  readonly revocation: {
    readonly at: UnixSeconds;
    readonly reasonHash: Hex32;
    readonly txHash: Hex32;
  } | null;
  readonly items: readonly CurationItem[];
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
