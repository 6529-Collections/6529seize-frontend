import { cache } from "react";
import { publicEnv } from "@/config/env";
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
}

/** 6529.io's own image host: the only one a card's art is taken from. */
const ART_HOST = "https://d3lqz0a4bldqgf.cloudfront.net/images/";

/** Each Meme's first mint and its scaled art, from 6529.io's `nfts`. */
interface CardMints {
  readonly mints: ReadonlyMap<number, string>;
  readonly art: ReadonlyMap<number, string>;
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
  const rows = await readAllPages<NftsRow>(
    `${publicEnv.API_ENDPOINT}/api/nfts?contract=${REGISTRY_V14.memes}&`
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
    }
  }
  return { mints, art };
}

/**
 * One card from 6529.io's `memes_extended_data`. `edition_size` counts the
 * copies that exist now; `edition_size_floor` is the edition 6529.io's TDH
 * counts (P26 §5.2's E): the minted count, burns included, or the claim's
 * floor while fewer than 300 are minted. So from 300 on the floor field is
 * the minted count, and below 300 the size is.
 */
function editionCard(
  id: number,
  season: number,
  size: number,
  floor: unknown
): EditionCard {
  if (typeof floor !== "number" || !Number.isInteger(floor) || floor <= 0) {
    return { id, season, minted: size, firstMint: null };
  }
  const minted =
    size < REGISTRY_V14.edition_floor_threshold && floor > size
      ? size
      : Math.max(size, floor);
  return { id, season, minted, firstMint: null, edition: floor };
}

/** This server's last good read of the editions, for a read that fails. */
let lastEditions: EditionsInput | null = null;

/** The editions as the API gave them at ship time (`data/editionsSnapshot.json`). */
function snapshotEditions(): EditionsInput {
  const cards = editionsSnapshot.cards.map((row) => {
    const [id, season, size, floor, firstMint] = row as [
      number,
      number,
      number,
      number | null,
      string | null,
    ];
    return {
      ...editionCard(id, season, size, floor),
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
    `${publicEnv.API_ENDPOINT}/api/memes_extended_data?`
  );
  const byId = new Map<number, EditionCard>();
  for (const row of rows ?? []) {
    if (
      typeof row.id === "number" &&
      typeof row.season === "number" &&
      typeof row.edition_size === "number"
    ) {
      byId.set(
        row.id,
        editionCard(
          row.id,
          row.season,
          row.edition_size,
          row.edition_size_floor
        )
      );
    }
  }
  if (rows === null || byId.size === 0) {
    return lastEditions ?? snapshotEditions();
  }
  const { mints, art } = await firstMints;
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
  // them from the last good read, or else from the snapshot.
  if (mints.size === 0) {
    const known = new Map(
      (lastEditions ?? snapshotEditions()).cards.map((card) => [
        card.id,
        card.firstMint,
      ])
    );
    return {
      ...read,
      cards: read.cards.map((card) => ({
        ...card,
        firstMint: known.get(card.id) ?? null,
      })),
    };
  }
  lastEditions = read;
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
