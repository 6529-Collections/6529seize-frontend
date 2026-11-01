import { publicEnv } from "@/config/env";
import snapshot from "@/lib/explained/data/networkSnapshot.json";

/**
 * Everyone's TDH, read from 6529.io's public API (`tdh/consolidated_metrics`,
 * every identity sorted by boosted TDH), and summed by rank: the top ten,
 * the next ninety, the next nine hundred, and everyone else with any TDH.
 * Only the numbers are kept; no identity, wallet or name leaves this file.
 * Read only when the figure is on (flags.ts), at most hourly; the API's own
 * Date header says when the numbers were read.
 */
export interface RankGroup {
  readonly key: "top" | "next" | "next2" | "rest";
  /** Identities in the group. */
  readonly count: number;
  /** Their TDH together. */
  readonly tdh: number;
}

export interface NetworkDistribution {
  readonly total: number;
  readonly identities: number;
  readonly groups: readonly RankGroup[];
  readonly source: string;
  /** When 6529.io answered (its Date header, ISO 8601 UTC), if it said. */
  readonly readAt: string | null;
  /** The figure is the snapshot kept with the page, not today's read. */
  readonly fromSnapshot?: boolean;
}

/**
 * The owner wants this figure on ("spread important"), so it does not
 * vanish when the API is slow: the sums kept at ship time stand in, with
 * the date they were read (`data/networkSnapshot.json`).
 */
function fromSnapshot(): NetworkDistribution {
  return {
    total: snapshot.total,
    identities: snapshot.identities,
    groups: snapshot.groups.map((group) => ({
      key: group.key as RankGroup["key"],
      count: group.count,
      tdh: group.tdh,
    })),
    source: snapshot.source,
    readAt: snapshot.readAt,
    fromSnapshot: true,
  };
}

const PAGE_SIZE = 1000;
const MAX_PAGES = 30;
const REVALIDATE_SECONDS = 3_600;
const TIMEOUT_MS = 8_000;
/** The rank where each group ends: 10, 100, 1,000, then everyone. */
const BOUNDS = [10, 100, 1000] as const;

interface MetricsPage {
  readonly next?: unknown;
  readonly data?: readonly { readonly boosted_tdh?: unknown }[];
}

interface ReadPage {
  readonly body: MetricsPage;
  readonly date: string | null;
}

function isoDate(header: string | null): string | null {
  const time = header === null ? Number.NaN : Date.parse(header);
  return Number.isNaN(time)
    ? null
    : new Date(time).toISOString().replace(".000Z", "Z");
}

async function readPage(page: number): Promise<ReadPage | null> {
  const url = `${publicEnv.API_ENDPOINT}/api/tdh/consolidated_metrics?page_size=${PAGE_SIZE}&page=${page}&sort=boosted_tdh&sort_direction=DESC`;
  try {
    const response = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: REVALIDATE_SECONDS },
    } as RequestInit);
    if (!response.ok) {
      return null;
    }
    return {
      body: (await response.json()) as MetricsPage,
      date: isoDate(response.headers.get("date")),
    };
  } catch {
    return null;
  }
}

interface ReadValues {
  readonly values: number[];
  /** When the first page was read. */
  readonly readAt: string | null;
}

/** Every identity's TDH above zero, largest first, or null if the API fails. */
async function readValues(): Promise<ReadValues | null> {
  const values: number[] = [];
  let readAt: string | null = null;
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const read = await readPage(page);
    if (read === null) {
      return null;
    }
    const body = read.body;
    readAt ??= read.date;
    const rows = (body.data ?? []).map((row) =>
      typeof row.boosted_tdh === "number" ? row.boosted_tdh : 0
    );
    values.push(...rows.filter((value) => value > 0));
    const more = typeof body.next === "string" && body.next.length > 0;
    if (!more || rows.length === 0 || (rows.at(-1) ?? 0) <= 0) {
      return { values: values.sort((a, b) => b - a), readAt };
    }
  }
  return null;
}

/** Sums sorted values into the rank groups. */
export function rankGroups(sorted: readonly number[]): RankGroup[] {
  const keys = ["top", "next", "next2", "rest"] as const;
  const edges = [0, ...BOUNDS, sorted.length];
  return keys
    .map((key, index) => {
      const from = Math.min(edges[index] ?? 0, sorted.length);
      const to = Math.min(edges[index + 1] ?? sorted.length, sorted.length);
      const slice = sorted.slice(from, Math.max(from, to));
      return {
        key,
        count: slice.length,
        tdh: slice.reduce((sum, value) => sum + value, 0),
      };
    })
    .filter((group) => group.count > 0);
}

export async function loadNetworkDistribution(): Promise<NetworkDistribution | null> {
  const read = await readValues();
  if (read === null || read.values.length === 0) {
    return fromSnapshot();
  }
  const { values, readAt } = read;
  return {
    total: values.reduce((sum, value) => sum + value, 0),
    identities: values.length,
    groups: rankGroups(values),
    source: "6529.io API tdh/consolidated_metrics",
    readAt,
  };
}
