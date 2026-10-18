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

/** The first-card example: a copy of the newest card arrives Oct 17 at 19:05 UTC. */
const FIRST_CARD_ARRIVAL = "2026-10-17T19:05:00Z";

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
    source: proofSource,
    value: (inputs) => inputs.site.proofA.totalWithoutBurn,
  }),
  "site.proofA.totalWithBurn": defineFact<number>({
    format: "count",
    unit: "TDH",
    refresh: RECORD_REFRESH,
    source: proofSource,
    value: (inputs) => inputs.site.proofA.totalWithBurn,
  }),
  "site.proofA.ethCallBlock": defineFact<number>({
    format: "count",
    refresh: RECORD_REFRESH,
    source: proofSource,
    value: (inputs) => inputs.site.proofA.ethCallBlock,
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
      source("example", "a constructed example: a first card bought on Oct 17"),
    value: () => FIRST_CARD_ARRIVAL,
  }),
} as const;
