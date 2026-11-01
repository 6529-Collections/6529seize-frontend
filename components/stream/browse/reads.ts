import type { StreamDataSource } from "@/lib/stream/dataSource";
import { acceptsBids } from "@/lib/stream/editionTiming";
import type {
  EditionAuction,
  OneOfOneAuction,
  StreamWork,
  UnixSeconds,
  Wei,
  WorkKey,
} from "@/lib/stream/types";

/**
 * Reads shared by the home, artist, dashboard and museum pages. Each composes
 * `StreamDataSource` calls (no new contract reads), so a chain data source
 * serves them unchanged.
 */

/** A work with the sales that mint it: its 1/1 auction and its edition auction. */
export interface WorkSales {
  readonly work: StreamWork;
  readonly oneOfOne: OneOfOneAuction | null;
  readonly edition: EditionAuction | null;
}

/** One live auction and when it closes. */
export interface LiveClose {
  readonly sales: WorkSales;
  readonly auction: "oneOfOne" | "edition";
  readonly closesAt: UnixSeconds;
}

/** Primary-sale money once a sale settled (zero before, and for unsold work). */
export interface SaleMoney {
  readonly raised: Wei;
  readonly artistSide: Wei;
  readonly network: Wei;
}

export const NO_MONEY: SaleMoney = { raised: 0n, artistSide: 0n, network: 0n };

/**
 * A work, its 1/1 auction and the edition auction of its editions. For an
 * edition token the edition auction is its own and there is no 1/1.
 */
async function readWorkSales(
  source: StreamDataSource,
  key: WorkKey
): Promise<WorkSales | null> {
  const work = await source.getWork(key);
  if (work === null) {
    return null;
  }
  if (work.standard === "ERC1155") {
    return {
      work,
      oneOfOne: null,
      edition: await source.getEditionAuction(work.key),
    };
  }
  const [oneOfOne, edition] = await Promise.all([
    source.auctionForWork(work.key),
    work.linked.edition === null
      ? Promise.resolve(null)
      : source.getEditionAuction(work.linked.edition),
  ]);
  return { work, oneOfOne, edition };
}

export async function readManyWorkSales(
  source: StreamDataSource,
  keys: readonly WorkKey[]
): Promise<WorkSales[]> {
  const unique = [...new Set(keys)];
  const rows = await Promise.all(
    unique.map((key) => readWorkSales(source, key))
  );
  return rows.filter((row): row is WorkSales => row !== null);
}

/** Bids are accepted now and the close is known (not paused for a dispute). */
function editionClosing(edition: EditionAuction | null): boolean {
  return (
    edition !== null &&
    acceptsBids(edition.phase) &&
    edition.phase !== "disputed"
  );
}

/** The live auctions of a work with a known close, soonest first. */
export function liveCloses(sales: WorkSales): LiveClose[] {
  const closes: LiveClose[] = [];
  if (sales.oneOfOne?.state === "ACTIVE") {
    closes.push({
      sales,
      auction: "oneOfOne",
      closesAt: sales.oneOfOne.endTime,
    });
  }
  if (sales.edition !== null && editionClosing(sales.edition)) {
    closes.push({
      sales,
      auction: "edition",
      closesAt: sales.edition.times.endTime,
    });
  }
  return closes.sort((left, right) => left.closesAt - right.closesAt);
}

/** A 1/1 or edition auction a collector can still bid in, or one paused for a dispute. */
export function isLive(sales: WorkSales): boolean {
  const oneOfOne = sales.oneOfOne?.state;
  return (
    oneOfOne === "ACTIVE" ||
    oneOfOne === "PAUSED" ||
    (sales.edition !== null && acceptsBids(sales.edition.phase))
  );
}

/** What a settled 1/1 sale paid: the price, the seller's part and the network's. */
export function oneOfOneMoney(auction: OneOfOneAuction | null): SaleMoney {
  const settlement = auction?.settlement;
  if (settlement?.outcome !== "collector") {
    return NO_MONEY;
  }
  return {
    raised: settlement.price,
    artistSide: settlement.sellerProceeds,
    network: settlement.fee,
  };
}

/** What a settled edition auction paid: k × price, split by its terms. */
export function editionMoney(auction: EditionAuction | null): SaleMoney {
  if (auction === null || !auction.settled || auction.clearing.count === 0) {
    return NO_MONEY;
  }
  return {
    raised: auction.clearing.revenue,
    artistSide: auction.clearing.sellerShare,
    network: auction.clearing.networkFee,
  };
}

export function addMoney(left: SaleMoney, right: SaleMoney): SaleMoney {
  return {
    raised: left.raised + right.raised,
    artistSide: left.artistSide + right.artistSide,
    network: left.network + right.network,
  };
}

/** The work's display name for its credited parties, lead artist first. */
export function partyNames(work: StreamWork): string {
  return work.parties.map((party) => party.displayName).join(", ");
}

/** The image a row or card shows: the primary image, else the generated preview. */
export function thumbnailOf(work: StreamWork): string | null {
  const primary = work.media.find((file) => file.role === "PRIMARY");
  if (primary?.kind === "image" && primary.displayUri !== null) {
    return primary.displayUri;
  }
  return work.media.find((file) => file.role === "PREVIEW")?.displayUri ?? null;
}
