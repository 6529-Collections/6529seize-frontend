import { apiUrl } from "@/services/api/api-endpoints";
import { cache } from "react";
import { loadFormalManifest } from "@/lib/tdh/formal/loadFormalManifest.server";
import {
  LATEST_DAY_REVALIDATE_SECONDS,
  OLDER_DAY_REVALIDATE_SECONDS,
  loadVerificationDay,
  loadVerificationIndex,
} from "@/lib/tdh/verification/loadVerification.server";
import { REGISTRY_V14 } from "@/components/explained/engine/tdh";
import { ENGINE } from "./engine";
import {
  RECORD,
  SITE,
  type EditionCard,
  type EditionsInput,
  type FactInputs,
  type FeedDayInput,
  type FeedInput,
  type ManifestInput,
} from "./factInputs";
import editionsSnapshot from "./data/editionsSnapshot.json";
import { createFactBook, type FactBook } from "./facts";

/**
 * The live loaders behind a page's facts (EXPLAINED.md §6.6 `feed.ts`). They
 * keep today's cache times: the feed's index and latest day 10 minutes, an
 * older day and the manifest an hour, the editions an hour. A source that
 * cannot be read leaves its facts unavailable; nothing falls back to a
 * number typed by hand. The one exception is the editions, which every
 * model and formula reads: when 6529.io's API cannot be read, the facts use
 * this server's last good read, or else the snapshot the API gave at ship
 * time (`data/editionsSnapshot.json`), each with its own read time, which
 * the pages print wherever they name the editions' source.
 */

const EDITIONS_REVALIDATE_SECONDS = 3_600;
const EDITIONS_PAGE_SIZE = 100;
const EDITIONS_MAX_PAGES = 20;
const FETCH_TIMEOUT_MS = 8_000;

async function loadDay(
  cycle: number,
  revalidate: number
): Promise<FeedDayInput | null> {
  const load = await loadVerificationDay(cycle, revalidate);
  return load.status === "ok"
    ? { day: load.day, sha256: load.sha256, url: load.dayUrl }
    : null;
}

async function loadFeed(
  now: string,
  allDays: boolean
): Promise<FeedInput | null> {
  const index = await loadVerificationIndex();
  if (index.status !== "ok") {
    return null;
  }
  const cycles = index.index.days
    .map((day) => day.cycleDay)
    .sort((a, b) => a - b);
  const latestCycle = cycles.at(-1);
  if (latestCycle === undefined) {
    return null;
  }
  const latest = await loadDay(latestCycle, LATEST_DAY_REVALIDATE_SECONDS);
  if (!latest) {
    return null;
  }
  const previous = cycles.includes(latestCycle - 1)
    ? await loadDay(latestCycle - 1, OLDER_DAY_REVALIDATE_SECONDS)
    : null;
  const days = allDays
    ? (
        await Promise.all(
          cycles.map((cycle) =>
            cycle === latestCycle
              ? Promise.resolve(latest)
              : loadDay(cycle, OLDER_DAY_REVALIDATE_SECONDS)
          )
        )
      ).filter((day): day is FeedDayInput => day !== null)
    : undefined;
  return {
    index: index.index,
    indexUrl: index.indexUrl,
    readAt: now,
    latest,
    previous,
    ...(days === undefined ? {} : { days }),
  };
}

async function loadManifest(now: string): Promise<ManifestInput | null> {
  const load = await loadFormalManifest();
  return {
    manifest: load.manifest,
    url: load.status === "published" ? load.url : null,
    sha256: load.status === "published" ? load.sha256 : null,
    readAt: now,
  };
}

interface EditionsRow {
  readonly id?: unknown;
  readonly season?: unknown;
  readonly edition_size?: unknown;
  readonly edition_size_floor?: unknown;
}

interface NftsRow {
  readonly id?: unknown;
  readonly mint_date?: unknown;
  readonly thumbnail?: unknown;
  /** The original file: the card's art while no scaled image is listed. */
  readonly image?: unknown;
  readonly tdh?: unknown;
  readonly tdh__raw?: unknown;
}

/** 6529.io's own image host: the only one a card's art is taken from. */
const ART_HOST = "https://d3lqz0a4bldqgf.cloudfront.net/images/";

/**
 * Each Meme's first mint, its scaled art and the rate 6529.io's own TDH
 * applies to it (`tdh ÷ tdh__raw`: its TDH over its days held), from
 * 6529.io's `nfts`.
 */
interface CardMints {
  readonly mints: ReadonlyMap<number, string>;
  readonly art: ReadonlyMap<number, string>;
  readonly rates: ReadonlyMap<number, number>;
}

/** "2026-10-16T09:06:23Z": an instant as the facts layer writes it. */
function isoSeconds(value: string): string | null {
  const time = Date.parse(value);
  return Number.isNaN(time)
    ? null
    : new Date(time).toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * Every page of one of 6529.io's paged lists: the first page, then the rest
 * at once (its `count` says how many), so a slow API costs two round trips,
 * not one per page. Null when any page cannot be read.
 */
async function readAllPages<Row>(base: string): Promise<Row[] | null> {
  const read = async (page: number) => {
    const response = await fetch(
      `${base}page_size=${EDITIONS_PAGE_SIZE}&page=${page}`,
      {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        next: { revalidate: EDITIONS_REVALIDATE_SECONDS },
      } as RequestInit
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return (await response.json()) as {
      readonly count?: number;
      readonly next?: string | null;
      readonly data?: readonly Row[];
    };
  };
  try {
    const first = await read(1);
    const rows = [...(first.data ?? [])];
    if (!first.next) {
      return rows;
    }
    const total =
      typeof first.count === "number" ? first.count : EDITIONS_PAGE_SIZE * 2;
    const pageCount = Math.min(
      EDITIONS_MAX_PAGES,
      Math.max(2, Math.ceil(total / Math.max(1, rows.length)))
    );
    const rest = await Promise.all(
      Array.from({ length: pageCount - 1 }, (_, index) => read(index + 2))
    );
    for (const page of rest) {
      rows.push(...(page.data ?? []));
    }
    return rows;
  } catch {
    return null;
  }
}

/**
 * Each Meme's first mint (`meme.N.firstMint`) and scaled art
 * (`meme.N.art`), from 6529.io's `nfts` for The Memes' contract. When they
 * cannot be read, those cards' first mints are unavailable, never guessed,
 * and their art draws its frame.
 */
export async function loadFirstMints(): Promise<CardMints> {
  const mints = new Map<number, string>();
  const art = new Map<number, string>();
  const rates = new Map<number, number>();
  const rows = await readAllPages<NftsRow>(
    apiUrl(`/api/nfts?contract=${REGISTRY_V14.memes}&`)
  );
  for (const row of rows ?? []) {
    if (typeof row.id !== "number") {
      continue;
    }
    const at =
      typeof row.mint_date === "string" ? isoSeconds(row.mint_date) : null;
    if (at !== null) {
      mints.set(row.id, at);
    }
    if (
      typeof row.thumbnail === "string" &&
      row.thumbnail.startsWith(ART_HOST)
    ) {
      art.set(row.id, row.thumbnail);
    } else if (
      typeof row.image === "string" &&
      row.image.startsWith(ART_HOST)
    ) {
      art.set(row.id, row.image);
    }
    if (
      typeof row.tdh === "number" &&
      typeof row.tdh__raw === "number" &&
      row.tdh > 0 &&
      row.tdh__raw > 0
    ) {
      rates.set(row.id, row.tdh / row.tdh__raw);
    }
  }
  return { mints, art, rates };
}

/**
 * One card from 6529.io's `memes_extended_data`. `edition_size` sums the
 * copies 6529.io's owner table holds now; `edition_size_floor` is the minted
 * count 6529.io carried over for older cards, or a claim's floor (at most
 * 310) for newer ones. Below 300 the owner total is the minted count and the
 * floor is the claim's. From 300 on, P26 §5.2's E is the minted count, and
 * the two fields can disagree: the owner total sits one copy off the minted
 * count on some older cards (Meme #4: 301 held, 300 minted), and a claim's
 * floor sits below the minted count once a card passes it (Meme #508: floor
 * 310, 328 minted). Of the two, the facts layer takes the one whose rate
 * RATE(H, E) is nearer the rate 6529.io's own TDH applies to the card
 * (`appliedRate`), which the daily check finds equal to both programs'
 * every day; without that rate, the larger.
 */
function editionCard(
  id: number,
  season: number,
  size: number,
  floor: unknown,
  appliedRate: number | null = null,
  largest: number | null = null
): EditionCard {
  if (typeof floor !== "number" || !Number.isInteger(floor) || floor <= 0) {
    return { id, season, minted: size, firstMint: null };
  }
  const threshold = REGISTRY_V14.edition_floor_threshold;
  let minted = size < threshold && floor > size ? size : Math.max(size, floor);
  const other = minted === size ? floor : size;
  if (
    appliedRate !== null &&
    largest !== null &&
    other !== minted &&
    other >= threshold &&
    minted >= threshold &&
    Math.abs(largest / other - appliedRate) <
      Math.abs(largest / minted - appliedRate)
  ) {
    minted = other;
  }
  return { id, season, minted, firstMint: null, edition: floor };
}

/** H's stand-in for choosing a minted count: the largest count served. */
function largestServed(
  rows: readonly (readonly [number, number | null])[]
): number | null {
  let largest = 0;
  for (const [size, floor] of rows) {
    largest = Math.max(largest, size, floor ?? 0);
  }
  return largest > 0 ? largest : null;
}

/**
 * This server's last good read of the editions, for a read that fails. It
 * lives on the process, not the module: a dev server compiles each route
 * with its own copy of this module, and a reload replaces it, so a module
 * variable fell back to the ship-time snapshot on a page whose own copy had
 * never read the API, though another page had read it minutes before.
 */
const LAST_EDITIONS = Symbol.for("6529.explained.lastEditions");
type EditionsHolder = { [LAST_EDITIONS]?: EditionsInput };
function lastGoodEditions(): EditionsInput | null {
  return (globalThis as EditionsHolder)[LAST_EDITIONS] ?? null;
}
function keepEditions(read: EditionsInput): void {
  (globalThis as EditionsHolder)[LAST_EDITIONS] = read;
}

/** The editions as the API gave them at ship time (`data/editionsSnapshot.json`). */
function snapshotEditions(): EditionsInput {
  const rows = editionsSnapshot.cards as unknown as readonly (readonly [
    number,
    number,
    number,
    number | null,
    string | null,
    (number | null)?,
  ])[];
  const largest = largestServed(rows.map((row) => [row[2], row[3]]));
  const cards = rows.map((row) => {
    const [id, season, size, floor, firstMint, appliedRate] = row;
    return {
      ...editionCard(id, season, size, floor, appliedRate ?? null, largest),
      firstMint: firstMint ?? null,
    };
  });
  return {
    cards,
    readAt: editionsSnapshot.readAt,
    source: `${editionsSnapshot.source}, as read at ship time`,
    claimLimits: SITE.claimLimits.values,
  };
}

/** 6529.io's `memes_extended_data`, every page: each card's id, season and edition. */
async function loadEditions(now: string): Promise<EditionsInput | null> {
  const firstMints = loadFirstMints();
  const rows = await readAllPages<EditionsRow>(
    apiUrl("/api/memes_extended_data?")
  );
  const valid = (rows ?? []).filter(
    (
      row
    ): row is EditionsRow & {
      id: number;
      season: number;
      edition_size: number;
    } =>
      typeof row.id === "number" &&
      typeof row.season === "number" &&
      typeof row.edition_size === "number"
  );
  if (rows === null || valid.length === 0) {
    return lastGoodEditions() ?? snapshotEditions();
  }
  const { mints, art, rates } = await firstMints;
  const largest = largestServed(
    valid.map((row) => [
      row.edition_size,
      typeof row.edition_size_floor === "number"
        ? row.edition_size_floor
        : null,
    ])
  );
  const byId = new Map<number, EditionCard>();
  for (const row of valid) {
    byId.set(
      row.id,
      editionCard(
        row.id,
        row.season,
        row.edition_size,
        row.edition_size_floor,
        rates.get(row.id) ?? null,
        largest
      )
    );
  }
  const read: EditionsInput = {
    cards: [...byId.values()]
      .map((card) => ({
        ...card,
        firstMint: mints.get(card.id) ?? null,
        art: art.get(card.id) ?? null,
      }))
      .sort((a, b) => a.id - b.id),
    readAt: now,
    source: "6529.io API memes_extended_data",
    claimLimits: SITE.claimLimits.values,
  };
  // A first mint never changes, so a read whose first mints failed takes
  // them from the last good read, or else from the snapshot. Without the
  // applied rates, a card whose floor is unchanged keeps the minted count
  // that read chose, when it is still one of the two counts served.
  if (mints.size === 0) {
    const known = new Map(
      (lastGoodEditions() ?? snapshotEditions()).cards.map((card) => [
        card.id,
        card,
      ])
    );
    const served = new Map(
      valid.map((row) => [row.id, row.edition_size] as const)
    );
    return {
      ...read,
      cards: read.cards.map((card) => {
        const before = known.get(card.id);
        const keep =
          before !== undefined &&
          before.edition === card.edition &&
          (before.minted === card.edition ||
            before.minted === served.get(card.id));
        return {
          ...card,
          minted: keep ? before.minted : card.minted,
          firstMint: before?.firstMint ?? null,
        };
      }),
    };
  }
  keepEditions(read);
  return read;
}

/** Every source a page's facts read, now. */
export async function loadFactInputs(
  options: { readonly allDays?: boolean } = {}
): Promise<FactInputs> {
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const [feed, manifest, editions] = await Promise.all([
    loadFeed(now, options.allDays ?? false),
    loadManifest(now),
    loadEditions(now),
  ]);
  return {
    now,
    feed,
    manifest,
    editions,
    record: RECORD,
    site: SITE,
    engine: ENGINE,
  };
}

/** A page's facts, read once per server render. */
export const loadFactBook = cache(
  async (allDays: boolean = false): Promise<FactBook> =>
    createFactBook(await loadFactInputs({ allDays }))
);
