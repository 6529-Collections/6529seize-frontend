import type { StreamDataSource } from "@/lib/stream/dataSource";
import type {
  Address,
  MuseumHolding,
  OneOfOneAuction,
  StreamWork,
} from "@/lib/stream/types";

/** A museum holding with its work (title, artists, image). */
export interface MuseumRow {
  readonly holding: MuseumHolding;
  readonly work: StreamWork | null;
}

/** A 6529 Stream 1/1 that ended with no bids: settling sends it to the museum. */
export interface MuseumIncoming {
  readonly work: StreamWork;
  readonly auction: OneOfOneAuction;
}

export interface MuseumBoard {
  /** `EconomicsResolver.museum()`. */
  readonly address: Address;
  readonly holdings: readonly MuseumRow[];
  readonly incoming: readonly MuseumIncoming[];
}

/** Ended, unbid 6529 Stream 1/1s that anyone may settle now. */
async function readIncoming(
  source: StreamDataSource
): Promise<MuseumIncoming[]> {
  const summaries = await source.listWorks({
    program: "canonical",
    variant: "stream-1of1",
  });
  const rows = await Promise.all(
    summaries.map(async (summary) => {
      const auction = await source.auctionForWork(summary.key);
      if (auction?.state !== "ENDED" || auction.highBidder !== null) {
        return null;
      }
      const work = await source.getWork(summary.key);
      return work === null ? null : { work, auction };
    })
  );
  return rows.filter((row): row is MuseumIncoming => row !== null);
}

export async function readMuseumBoard(
  source: StreamDataSource
): Promise<MuseumBoard> {
  const [holdings, incoming] = await Promise.all([
    source.museumHoldings(),
    readIncoming(source),
  ]);
  return {
    address: source.source().contracts.museum,
    holdings: await Promise.all(
      holdings.map(async (holding) => ({
        holding,
        work: await source.getWork(holding.work),
      }))
    ),
    incoming,
  };
}
