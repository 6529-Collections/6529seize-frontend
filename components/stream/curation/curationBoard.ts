import type { StreamDataSource } from "@/lib/stream/dataSource";
import type {
  CurationItem,
  CurationPackage,
  Hex32,
  WorkKey,
} from "@/lib/stream/types";

/**
 * Where an approved item stands. Submission and the vote happen in the wave;
 * these are the states the package registry and 6529 Stream record.
 */
export type CurationItemState =
  | "signatures"
  | "move"
  | "ready"
  | "started"
  | "revoked";

/** Display order: what needs someone next comes first. */
const CURATION_STATES: readonly CurationItemState[] = [
  "ready",
  "move",
  "signatures",
  "started",
  "revoked",
];

export interface CurationRow {
  readonly item: CurationItem;
  readonly pkg: CurationPackage;
  readonly state: CurationItemState;
  readonly artistName: string;
  /** The minted work, once its auction started. */
  readonly work: WorkKey | null;
}

interface CurationBoard {
  readonly packages: readonly CurationPackage[];
  readonly rows: readonly CurationRow[];
}

function itemState(
  item: CurationItem,
  pkg: CurationPackage
): CurationItemState {
  if (item.consumed) {
    return "started";
  }
  if (pkg.status === "REVOKED") {
    return "revoked";
  }
  if (item.startable) {
    return "ready";
  }
  return item.accepted < item.parties ? "signatures" : "move";
}

/** The 6529 Stream work each consumed item minted (`IStream.work(id).itemHash`). */
async function startedWorks(
  source: StreamDataSource,
  itemHashes: ReadonlySet<Hex32>
): Promise<Map<Hex32, WorkKey>> {
  const found = new Map<Hex32, WorkKey>();
  if (itemHashes.size === 0) {
    return found;
  }
  const summaries = await source.listWorks({
    program: "canonical",
    variant: "stream-1of1",
  });
  const works = await Promise.all(
    summaries.map((summary) => source.getWork(summary.key))
  );
  for (const work of works) {
    if (work !== null && itemHashes.has(work.itemHash)) {
      found.set(work.itemHash, work.key);
    }
  }
  return found;
}

export async function readCurationBoard(
  source: StreamDataSource
): Promise<CurationBoard> {
  const [packages, artists] = await Promise.all([
    source.curationQueue(),
    source.listArtists(),
  ]);
  const names = new Map(
    artists.map((artist) => [artist.artistId, artist.displayName])
  );
  const consumed = new Set(
    packages.flatMap((pkg) =>
      pkg.items.filter((item) => item.consumed).map((item) => item.itemHash)
    )
  );
  const works = await startedWorks(source, consumed);
  const rows = packages.flatMap((pkg) =>
    pkg.items.map((item) => ({
      item,
      pkg,
      state: itemState(item, pkg),
      artistName: names.get(item.artistId) ?? item.artistId,
      work: works.get(item.itemHash) ?? null,
    }))
  );
  return {
    packages: [...packages].sort(
      (left, right) => right.registeredAt - left.registeredAt
    ),
    rows: rows.sort(
      (left, right) =>
        CURATION_STATES.indexOf(left.state) -
        CURATION_STATES.indexOf(right.state)
    ),
  };
}
