import { createHash } from "node:crypto";
import bundledManifest from "@/lib/tdh/formal/bundledManifest.json";
import { parseFormalManifest } from "@/lib/tdh/formal/manifest";
import {
  parseVerificationDay,
  parseVerificationIndex,
} from "@/lib/tdh/verification/schema";
import { ENGINE } from "./engine";
import { RECORD, SITE, type FactInputs, type FeedDayInput } from "./factInputs";
import editions from "./fixtures/editions.json";
import { FIXTURE_DAY_TEXTS, FIXTURE_INDEX_TEXT } from "./fixtures/feedFixture";

/**
 * The facts inputs as of 09:40 UTC on 2026-10-18, the moment the final
 * mockups were built: the feed's five days, the manifest as served, and the
 * editions as read. The kit gallery and the tests render from these, so a
 * render can be compared with the mockups' renders number for number.
 */
export const FIXTURE_NOW = "2026-10-18T09:40:00Z";
const FIXTURE_FEED_BASE = "https://d379duzqnomz3w.cloudfront.net/";

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function dayInput(cycle: number): FeedDayInput {
  const text = FIXTURE_DAY_TEXTS[cycle];
  if (text === undefined) {
    throw new Error(`no fixture for day ${cycle}`);
  }
  const parsed = parseVerificationDay(JSON.parse(text) as unknown);
  if (!parsed.success) {
    throw new Error(`fixture day ${cycle} does not parse`);
  }
  return {
    day: parsed.data,
    sha256: sha256(text),
    url: `${FIXTURE_FEED_BASE}days/${cycle}.json`,
  };
}

/** The day file's exact text, for the receipt's in-browser hash. */
export function fixtureDayText(cycle: number): string | undefined {
  return FIXTURE_DAY_TEXTS[cycle];
}

export function fixtureFactInputs(now: string = FIXTURE_NOW): FactInputs {
  const index = parseVerificationIndex(
    JSON.parse(FIXTURE_INDEX_TEXT) as unknown
  );
  if (!index.success) {
    throw new Error("fixture index does not parse");
  }
  const cycles = index.data.days
    .map((day) => day.cycleDay)
    .sort((a, b) => a - b);
  const latestCycle = cycles.at(-1);
  if (latestCycle === undefined) {
    throw new Error("fixture index has no day");
  }
  const days = cycles.map(dayInput);
  const manifest = parseFormalManifest(bundledManifest);
  if (!manifest.success) {
    throw new Error("bundled manifest does not parse");
  }
  return {
    now,
    feed: {
      index: index.data,
      indexUrl: `${FIXTURE_FEED_BASE}index.json`,
      readAt: now,
      latest: dayInput(latestCycle),
      previous: cycles.includes(latestCycle - 1)
        ? dayInput(latestCycle - 1)
        : null,
      days,
    },
    manifest: { manifest: manifest.data, url: null, sha256: null, readAt: now },
    editions: {
      cards: editions.cards.map(([id, season, minted, firstMint]) => ({
        id: Number(id),
        season: Number(season),
        minted: Number(minted),
        firstMint: String(firstMint),
      })),
      readAt: editions.readAt,
      source: editions.source,
      claimLimits: SITE.claimLimits.values,
    },
    record: RECORD,
    site: SITE,
    engine: ENGINE,
  };
}
