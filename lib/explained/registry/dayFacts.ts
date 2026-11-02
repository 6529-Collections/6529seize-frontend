import type { FactInputs, FeedDayInput, FeedInput } from "../factInputs";
import { FEED_FACTS } from "./feedFacts";
import { RENDER_REFRESH, source } from "./helpers";
import type { FactDef, FactFamily } from "./types";

/**
 * One published day's facts, by its cycle: `tdh.day.20742.total`. Each is
 * the latest day's fact of the same name (`tdh.latest.total`), read from
 * that day's own file instead, with the day before it for a change, so a
 * receipt of any day prints its numbers through facts that name the day
 * (TDH-DESIGN.md §3, §4.5). The day's file must be one the page read
 * (`feed.days`, or the latest two); otherwise its facts are unavailable.
 */
type LatestId = Extract<keyof typeof FEED_FACTS, `tdh.latest.${string}`>;

/** A day's field: what follows `tdh.latest.` in the latest day's facts. */
export type DayField = LatestId extends `tdh.latest.${infer Field}`
  ? Field
  : never;

const LATEST_PREFIX = "tdh.latest.";

const DAY_FIELDS: readonly string[] = Object.keys(FEED_FACTS)
  .filter((id) => id.startsWith(LATEST_PREFIX))
  .map((id) => id.slice(LATEST_PREFIX.length));

/** The files a page read: every day it asked for, or the latest two. */
function feedFiles(feed: FeedInput): readonly FeedDayInput[] {
  return feed.days ?? [feed.latest, ...(feed.previous ? [feed.previous] : [])];
}

/**
 * The inputs as if `cycle` were the latest day: its file, and the file of
 * the day before it when the page read it. Null when the page did not read
 * the day's file.
 */
function inputsForDay(inputs: FactInputs, cycle: number): FactInputs | null {
  const feed = inputs.feed;
  if (!feed) {
    return null;
  }
  const files = feedFiles(feed);
  const day = files.find((file) => file.day.cycleDay === cycle);
  if (!day) {
    return null;
  }
  const previous =
    files.find((file) => file.day.cycleDay === cycle - 1) ?? null;
  return { ...inputs, feed: { ...feed, latest: day, previous } };
}

function dayDef(key: string): FactDef {
  const dot = key.indexOf(".");
  const cycle = Number(key.slice(0, dot));
  const field = key.slice(dot + 1);
  const latest = (FEED_FACTS as Readonly<Record<string, FactDef>>)[
    `${LATEST_PREFIX}${field}`
  ];
  if (!latest) {
    // As for a card or a decision the registry does not have: the typecheck
    // catches a literal id, and the render fails on any other.
    return {
      format: "text",
      refresh: RENDER_REFRESH,
      source: (inputs) =>
        source("feed", `the public TDH feed, days/${cycle}.json`, {
          readAt: inputs.now,
        }),
      value: () => {
        throw new Error(
          `Unknown fact "tdh.day.${key}": a day has the latest day's fields.`
        );
      },
    };
  }
  const unread = (inputs: FactInputs) =>
    source("feed", `the public TDH feed, days/${cycle}.json`, {
      readAt: inputs.now,
    });
  const { drift } = latest;
  return {
    ...latest,
    source: (inputs) => {
      const day = inputsForDay(inputs, cycle);
      return day ? latest.source(day) : unread(inputs);
    },
    value: (inputs) => {
      const day = inputsForDay(inputs, cycle);
      return day ? latest.value(day) : undefined;
    },
    ...(drift === undefined
      ? {}
      : {
          drift: (inputs: FactInputs) => {
            const day = inputsForDay(inputs, cycle);
            return day ? drift(day) : undefined;
          },
        }),
  };
}

/**
 * Every fact of one day, for a page to resolve before it hands its facts
 * to the browser (a family's facts are resolved when first asked for).
 */
export function dayFactIds(cycle: number): `tdh.day.${number}.${DayField}`[] {
  return DAY_FIELDS.map(
    (field) => `tdh.day.${cycle}.${field}` as `tdh.day.${number}.${DayField}`
  );
}

/** `tdh.day.{cycle}.{field}`: a published day's facts, read from its own file. */
export const DAY_FAMILY: FactFamily = {
  pattern: /^tdh\.day\.([1-9]\d{0,6}\.[a-z][A-Za-z0-9.]*)$/,
  def: dayDef,
};
