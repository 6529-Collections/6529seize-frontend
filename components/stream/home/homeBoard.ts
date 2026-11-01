import {
  isLive,
  type LiveClose,
  liveCloses,
  readManyWorkSales,
  type WorkSales,
} from "@/components/stream/browse/reads";
import type { StreamDataSource } from "@/lib/stream/dataSource";
import type { UnixSeconds } from "@/lib/stream/types";

/** A close within this many seconds counts as "ending soon" (as in `homeFeed`). */
export const ENDING_SOON_SECONDS = 60 * 60;
const RESULT_ROWS = 8;

/** The collector's front page: what is live, and what just finished. */
interface HomeBoard {
  /** Works with a live 1/1 or edition auction, soonest close first. */
  readonly live: readonly WorkSales[];
  /** Settled 1/1s with their editions, newest first. */
  readonly results: readonly WorkSales[];
}

function soonestClose(sales: WorkSales): number {
  return liveCloses(sales)[0]?.closesAt ?? Number.POSITIVE_INFINITY;
}

/**
 * `homeFeed` (6529 Stream only), then each work's two auctions. A live edition
 * auction brings in its master, so a work whose 1/1 has ended or is paused for
 * a dispute still shows while its editions take bids.
 */
export async function readHomeBoard(
  source: StreamDataSource
): Promise<HomeBoard> {
  const feed = await source.homeFeed();
  const editionMasters = await Promise.all(
    feed.editionsLive.map(
      async (edition) => (await source.getEditionAuction(edition))?.master
    )
  );
  const liveKeys = [
    ...feed.live,
    ...editionMasters.filter(
      (master): master is string => typeof master === "string"
    ),
  ];
  const [live, results] = await Promise.all([
    readManyWorkSales(source, liveKeys),
    readManyWorkSales(source, feed.recentResults.slice(0, RESULT_ROWS)),
  ]);
  return {
    live: live
      .filter(isLive)
      .sort((left, right) => soonestClose(left) - soonestClose(right)),
    results,
  };
}

/** Live auctions that close within the hour, soonest first. */
export function endingSoon(
  live: readonly WorkSales[],
  now: UnixSeconds
): LiveClose[] {
  return live
    .flatMap(liveCloses)
    .filter(
      (close) =>
        close.closesAt > now && close.closesAt - now <= ENDING_SOON_SECONDS
    )
    .sort((left, right) => left.closesAt - right.closesAt);
}
