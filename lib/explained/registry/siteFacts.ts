import type { FactInputs } from "../factInputs";
import { RECORD_REFRESH, RENDER_REFRESH, source } from "./helpers";
import { defineFact } from "./types";

/**
 * Values read from 6529.io and from records outside the feed
 * (`lib/explained/data/site.json`), each with its source and read time,
 * and the constructed examples the pages label Example.
 */

const SITE_REFRESH =
  "6529.io, re-read at the fact gate (1 h when wired to the API)";
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

/** The next Main Stage decision after `now`: Mon, Wed, Fri at 16:00 UTC. */
export function nextDecisionAfter(
  now: string,
  weekdays: readonly number[],
  hourUtc: number
): string {
  const start = Date.parse(now);
  const midnight = Math.floor(start / DAY_MS) * DAY_MS;
  for (let day = 0; day < 8; day += 1) {
    const at = midnight + day * DAY_MS + hourUtc * HOUR_MS;
    if (at > start && weekdays.includes(new Date(at).getUTCDay())) {
      return new Date(at).toISOString().replace(".000Z", "Z");
    }
  }
  throw new Error("no Main Stage decision within a week");
}

const mainStage = (inputs: FactInputs) => inputs.site.mainStage;
const mainStageSource = (inputs: FactInputs) =>
  source("site", mainStage(inputs).source, {
    readAt: mainStage(inputs).readAt,
  });
const proofSource = (inputs: FactInputs) =>
  source("site", inputs.site.proofA.source);
/** The two totals of 2026-10-11: P26 §13's replay gives both; proof A holds only the second. */
const totalsSource = (inputs: FactInputs) =>
  source("spec", inputs.site.proofA.totalsSource);

/**
 * The first-card example: a copy arrives at 19:05 UTC on the evening before
 * the latest result, so that result finds less than a whole day and the next
 * one counts it. It moves with the feed, so "just bought" stays true; with no
 * feed it is the evening before today. With the fixture feed (latest result
 * Oct 18) it is Oct 17, 19:05, the design's example.
 */
const DAY_SECONDS = 86_400;
const ARRIVAL_SECONDS_INTO_DAY = 19 * 3_600 + 5 * 60;

function firstCardArrival(inputs: FactInputs): string {
  const latest =
    inputs.feed?.latest.day.cycleDay ??
    Math.floor(Date.parse(inputs.now) / 1_000 / DAY_SECONDS);
  const seconds = (latest - 1) * DAY_SECONDS + ARRIVAL_SECONDS_INTO_DAY;
  return new Date(seconds * 1_000).toISOString().replace(/\.\d{3}Z$/, "Z");
}

export const SITE_FACTS = {
  "site.mainStage.decisions": defineFact<number>({
    format: "count",
    unit: "decisions",
    refresh: SITE_REFRESH,
    source: mainStageSource,
    maturity: "live",
    value: (inputs) => mainStage(inputs).decisions,
  }),
  "site.mainStage.through": defineFact<string>({
    format: "day",
    refresh: SITE_REFRESH,
    source: mainStageSource,
    value: (inputs) => mainStage(inputs).through,
  }),
  "site.mainStage.perWeek": defineFact<number>({
    format: "count",
    refresh: SITE_REFRESH,
    source: (inputs) =>
      source("site", mainStage(inputs).scheduleSource, {
        readAt: mainStage(inputs).readAt,
      }),
    value: (inputs) => mainStage(inputs).weekdaysUtc.length,
  }),
  "site.mainStage.weekdays": defineFact<number[]>({
    format: "list",
    refresh: SITE_REFRESH,
    source: (inputs) =>
      source("site", mainStage(inputs).scheduleSource, {
        readAt: mainStage(inputs).readAt,
      }),
    value: (inputs) => [...mainStage(inputs).weekdaysUtc],
  }),
  "site.mainStage.hourUtc": defineFact<number>({
    format: "count",
    refresh: SITE_REFRESH,
    source: (inputs) =>
      source("site", mainStage(inputs).scheduleSource, {
        readAt: mainStage(inputs).readAt,
      }),
    value: (inputs) => mainStage(inputs).hourUtc,
  }),
  "site.mainStage.next": defineFact<string>({
    format: "instant",
    unit: "UTC",
    refresh: RENDER_REFRESH,
    source: (inputs) =>
      source("site", mainStage(inputs).scheduleSource, { readAt: inputs.now }),
    value: (inputs) =>
      nextDecisionAfter(
        inputs.now,
        mainStage(inputs).weekdaysUtc,
        mainStage(inputs).hourUtc
      ),
  }),
  "site.memes.mintPriceEth": defineFact<string>({
    format: "text",
    unit: "ETH",
    refresh: SITE_REFRESH,
    source: (inputs) =>
      source("site", inputs.site.memes.source, {
        readAt: inputs.site.memes.readAt,
      }),
    value: (inputs) => inputs.site.memes.mintPriceEth,
  }),
  "site.memes.since": defineFact<string>({
    format: "day",
    refresh: SITE_REFRESH,
    source: (inputs) =>
      source("site", inputs.site.memes.source, {
        readAt: inputs.site.memes.readAt,
      }),
    value: (inputs) => inputs.site.memes.since,
  }),
  "site.proofA.cycle": defineFact<number>({
    format: "count",
    refresh: RECORD_REFRESH,
    source: proofSource,
    evidence: "proved",
    value: (inputs) => inputs.site.proofA.cycle,
  }),
  "site.proofA.provedHours": defineFact<number>({
    format: "count",
    refresh: RECORD_REFRESH,
    source: proofSource,
    value: (inputs) => inputs.site.proofA.provedHours,
  }),
  "site.proofA.provedMinutes": defineFact<number>({
    format: "count",
    refresh: RECORD_REFRESH,
    source: proofSource,
    value: (inputs) => inputs.site.proofA.provedMinutes,
  }),
  "site.proofA.totalWithoutBurn": defineFact<number>({
    format: "count",
    unit: "TDH",
    refresh: RECORD_REFRESH,
    source: totalsSource,
    value: (inputs) => inputs.site.proofA.totalWithoutBurn,
  }),
  "site.proofA.totalWithBurn": defineFact<number>({
    format: "count",
    unit: "TDH",
    refresh: RECORD_REFRESH,
    source: totalsSource,
    value: (inputs) => inputs.site.proofA.totalWithBurn,
  }),
  "site.proofA.ethCallBlock": defineFact<number>({
    format: "count",
    refresh: RECORD_REFRESH,
    source: proofSource,
    value: (inputs) => inputs.site.proofA.ethCallBlock,
  }),
  "tdh.cutover.checkedAt": defineFact<string>({
    format: "day",
    refresh: RECORD_REFRESH,
    source: (inputs) => source("site", inputs.site.cutover.statusSource),
    // Only once the planned date has passed with no cutover: before it the
    // pages say "planned for about", after it "as of <date>, not made".
    value: (inputs) =>
      !inputs.site.cutover.made &&
      Date.parse(inputs.site.cutover.about) < Date.parse(inputs.now)
        ? inputs.site.cutover.checkedAt
        : undefined,
  }),
  "site.validator.version": defineFact<string>({
    format: "text",
    refresh: RECORD_REFRESH,
    source: (inputs) => source("decision", inputs.site.validator.source),
    standing: { kind: "decided", ref: "D137" },
    maturity: "built",
    value: (inputs) => inputs.site.validator.version,
  }),
  "example.firstCard.arrivedAt": defineFact<string>({
    format: "instant",
    unit: "UTC",
    refresh: RECORD_REFRESH,
    source: () =>
      source(
        "example",
        "a constructed example: a card bought at 19:05 UTC the evening before the latest result"
      ),
    value: firstCardArrival,
  }),
} as const;
