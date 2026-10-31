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
import { createFactBook, type FactBook } from "./facts";

/**
 * The live loaders behind a page's facts (EXPLAINED.md §6.6 `feed.ts`). They
 * keep today's cache times: the feed's index and latest day 10 minutes, an
 * older day and the manifest an hour, the editions an hour. A source that
 * cannot be read leaves its facts unavailable; nothing falls back to a
 * number typed by hand.
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

interface EditionsPage {
  readonly next?: string | null;
  readonly data?: readonly {
    readonly id?: unknown;
    readonly season?: unknown;
    readonly edition_size?: unknown;
  }[];
}

interface NftsPage {
  readonly next?: string | null;
  readonly data?: readonly {
    readonly id?: unknown;
    readonly mint_date?: unknown;
  }[];
}

/** "2026-10-16T09:06:23Z": an instant as the facts layer writes it. */
function isoSeconds(value: string): string | null {
  const time = Date.parse(value);
  return Number.isNaN(time)
    ? null
    : new Date(time).toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * Each Meme's first mint (`meme.N.firstMint`), from 6529.io's `nfts` for
 * The Memes' contract. A page that cannot be read leaves the rest unknown:
 * those cards' first mints are unavailable, never guessed.
 */
export async function loadFirstMints(): Promise<ReadonlyMap<number, string>> {
  const mints = new Map<number, string>();
  try {
    for (let page = 1; page <= EDITIONS_MAX_PAGES; page += 1) {
      const url = `${publicEnv.API_ENDPOINT}/api/nfts?contract=${REGISTRY_V14.memes}&page_size=${EDITIONS_PAGE_SIZE}&page=${page}`;
      const response = await fetch(url, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        next: { revalidate: EDITIONS_REVALIDATE_SECONDS },
      } as RequestInit);
      if (!response.ok) {
        break;
      }
      const body = (await response.json()) as NftsPage;
      for (const row of body.data ?? []) {
        const at =
          typeof row.mint_date === "string" ? isoSeconds(row.mint_date) : null;
        if (typeof row.id === "number" && at !== null) {
          mints.set(row.id, at);
        }
      }
      if (!body.next) {
        break;
      }
    }
  } catch {
    // Whatever was read stands; the rest stays unknown.
  }
  return mints;
}

/** 6529.io's `memes_extended_data`, every page: each card's id, season and edition. */
async function loadEditions(now: string): Promise<EditionsInput | null> {
  const cards: EditionCard[] = [];
  const firstMints = loadFirstMints();
  try {
    for (let page = 1; page <= EDITIONS_MAX_PAGES; page += 1) {
      const url = `${publicEnv.API_ENDPOINT}/api/memes_extended_data?page_size=${EDITIONS_PAGE_SIZE}&page=${page}`;
      const response = await fetch(url, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        next: { revalidate: EDITIONS_REVALIDATE_SECONDS },
      } as RequestInit);
      if (!response.ok) {
        return null;
      }
      const body = (await response.json()) as EditionsPage;
      for (const row of body.data ?? []) {
        if (
          typeof row.id === "number" &&
          typeof row.season === "number" &&
          typeof row.edition_size === "number"
        ) {
          cards.push({
            id: row.id,
            season: row.season,
            minted: row.edition_size,
            firstMint: null,
          });
        }
      }
      if (!body.next) {
        break;
      }
    }
  } catch {
    return null;
  }
  if (cards.length === 0) {
    return null;
  }
  const mints = await firstMints;
  return {
    cards: cards
      .map((card) => ({ ...card, firstMint: mints.get(card.id) ?? null }))
      .sort((a, b) => a.id - b.id),
    readAt: now,
    source: "6529.io API memes_extended_data",
    claimLimits: SITE.claimLimits.values,
  };
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
