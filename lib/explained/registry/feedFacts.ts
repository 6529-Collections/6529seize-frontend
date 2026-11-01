import type { FactInputs } from "../factInputs";
import {
  BUILD_REFRESH,
  FEED_REFRESH,
  RENDER_REFRESH,
  cycleOf,
  dateOfCycle,
  deltaSource,
  indexSource,
  latestSource,
  source,
} from "./helpers";
import { defineFact, type FactDef } from "./types";

/**
 * Facts read from the public TDH feed (TDH-DESIGN.md §3): every total,
 * identity and wallet count, agreement count, verdict, hash, root, rule
 * version and write time. Each is unavailable when the feed is.
 */

const latest = (inputs: FactInputs) => inputs.feed?.latest.day;
const rust = (inputs: FactInputs) => latest(inputs)?.implementations.rust;

/** A file written later than 2 h 40 min after its day began was rewritten. */
const REWRITE_AFTER_MS = (2 * 60 + 40) * 60_000;
/** The next result is published about 50 minutes after its snapshot. */
const PUBLISH_AFTER_MS = 50 * 60_000;
const DAY_MS = 86_400_000;

function latestCount(
  pick: (inputs: FactInputs) => number | null | undefined,
  unit: "TDH" | "identities" | "wallets"
): FactDef<number> {
  return defineFact<number>({
    format: "count",
    unit,
    refresh: FEED_REFRESH,
    source: latestSource,
    value: (inputs) => pick(inputs) ?? undefined,
  });
}

function latestHash(
  pick: (inputs: FactInputs) => string | null | undefined
): FactDef<string> {
  return defineFact<string>({
    format: "hash",
    refresh: FEED_REFRESH,
    source: latestSource,
    value: (inputs) => pick(inputs) ?? undefined,
  });
}

export interface DaySummary {
  readonly cycle: number;
  readonly date: string;
  readonly verdict: string;
  readonly identitiesEqual: number | null;
  readonly identitiesTotal: number | null;
  readonly total: number;
  readonly sha256: string | null;
  /** When the day's file was written, if known. */
  readonly writtenAt: string | null;
  /** Written more than 2 h 40 min after its day began: rewritten (↻). */
  readonly rewritten: boolean;
  readonly [key: string]: string | number | boolean | null;
}

function daySummaries(inputs: FactInputs): DaySummary[] | undefined {
  const feed = inputs.feed;
  if (!feed) {
    return undefined;
  }
  const files = new Map(
    (feed.days ?? [feed.latest, ...(feed.previous ? [feed.previous] : [])]).map(
      (d) => [d.day.cycleDay, d.day]
    )
  );
  return [...feed.index.days]
    .sort((a, b) => a.cycleDay - b.cycleDay)
    .map((day) => {
      const writtenAt =
        files.get(day.cycleDay)?.generatedAt ?? day.generatedAt ?? null;
      const rewritten =
        writtenAt !== null &&
        Date.parse(writtenAt) - Date.parse(`${day.date}T00:00:00Z`) >
          REWRITE_AFTER_MS;
      return {
        cycle: day.cycleDay,
        date: day.date,
        verdict: day.verdict,
        identitiesEqual: day.identitiesEqual,
        identitiesTotal: day.identitiesTotal,
        total: day.totalTdh.rust,
        sha256: day.sha256,
        writtenAt,
        rewritten,
      };
    });
}

function openCycle(inputs: FactInputs): number | undefined {
  const day = latest(inputs);
  return day ? day.cycleDay + 1 : undefined;
}

export const FEED_FACTS = {
  "feed.writtenAt": defineFact<string>({
    format: "clock",
    unit: "UTC",
    refresh: FEED_REFRESH,
    source: indexSource,
    value: (inputs) => inputs.feed?.index.generatedAt ?? undefined,
  }),
  "feed.readAt": defineFact<string>({
    format: "clock",
    unit: "UTC",
    refresh: RENDER_REFRESH,
    source: indexSource,
    value: (inputs) => inputs.feed?.readAt,
  }),
  "tdh.latest.cycle": defineFact<number>({
    format: "count",
    refresh: FEED_REFRESH,
    source: latestSource,
    value: (inputs) => latest(inputs)?.cycleDay,
  }),
  "tdh.latest.date": defineFact<string>({
    format: "day",
    refresh: FEED_REFRESH,
    source: latestSource,
    value: (inputs) => latest(inputs)?.date,
  }),
  "tdh.latest.writtenAt": defineFact<string>({
    format: "clock",
    unit: "UTC",
    refresh: FEED_REFRESH,
    source: latestSource,
    value: (inputs) => latest(inputs)?.generatedAt ?? undefined,
  }),
  "tdh.latest.verdict": defineFact<string>({
    format: "text",
    refresh: FEED_REFRESH,
    source: latestSource,
    value: (inputs) => latest(inputs)?.verdict,
  }),
  "tdh.latest.total": defineFact<number>({
    format: "count",
    unit: "TDH",
    refresh: FEED_REFRESH,
    source: latestSource,
    evidence: "tested",
    limit: "unchecked-history",
    value: (inputs) => rust(inputs)?.totalTdh,
  }),
  "tdh.latest.total.python": latestCount(
    (inputs) => latest(inputs)?.implementations.python?.totalTdh,
    "TDH"
  ),
  "tdh.latest.total.live": latestCount(
    (inputs) => latest(inputs)?.implementations.live?.totalTdh,
    "TDH"
  ),
  "tdh.latest.delta": defineFact<number>({
    format: "signedCount",
    unit: "TDH",
    refresh: FEED_REFRESH,
    source: deltaSource,
    value: (inputs) => {
      const now = rust(inputs)?.totalTdh;
      const before = inputs.feed?.previous?.day.implementations.rust.totalTdh;
      return now === undefined || before === undefined
        ? undefined
        : now - before;
    },
  }),
  "tdh.latest.identities": latestCount(
    (inputs) => rust(inputs)?.identities,
    "identities"
  ),
  "tdh.latest.wallets": latestCount(
    (inputs) => rust(inputs)?.wallets,
    "wallets"
  ),
  "tdh.latest.agree.live.identities.equal": latestCount(
    (inputs) => latest(inputs)?.agreement.rustVsLive?.identitiesEqual,
    "identities"
  ),
  "tdh.latest.agree.live.identities.total": latestCount(
    (inputs) => latest(inputs)?.agreement.rustVsLive?.identitiesTotal,
    "identities"
  ),
  "tdh.latest.agree.live.wallets.equal": latestCount(
    (inputs) => latest(inputs)?.agreement.rustVsLive?.walletsEqual,
    "wallets"
  ),
  "tdh.latest.agree.live.wallets.total": latestCount(
    (inputs) => latest(inputs)?.agreement.rustVsLive?.walletsTotal,
    "wallets"
  ),
  "tdh.latest.agree.python.identities.equal": latestCount(
    (inputs) => latest(inputs)?.agreement.rustVsPython?.identitiesEqual,
    "identities"
  ),
  "tdh.latest.agree.python.identities.total": latestCount(
    (inputs) => latest(inputs)?.agreement.rustVsPython?.identitiesTotal,
    "identities"
  ),
  "tdh.latest.agree.python.wallets.equal": latestCount(
    (inputs) => latest(inputs)?.agreement.rustVsPython?.walletsEqual,
    "wallets"
  ),
  "tdh.latest.agree.python.wallets.total": latestCount(
    (inputs) => latest(inputs)?.agreement.rustVsPython?.walletsTotal,
    "wallets"
  ),
  "tdh.latest.differences.identities": latestCount(
    (inputs) => latest(inputs)?.differenceSummary?.identities,
    "identities"
  ),
  "tdh.latest.differences.wallets": latestCount(
    (inputs) => latest(inputs)?.differenceSummary?.wallets,
    "wallets"
  ),
  "tdh.latest.cutoff": defineFact<number>({
    format: "count",
    refresh: FEED_REFRESH,
    source: latestSource,
    value: (inputs) => latest(inputs)?.cutoffBlock,
  }),
  "tdh.latest.mode": defineFact<string>({
    format: "text",
    refresh: FEED_REFRESH,
    source: latestSource,
    value: (inputs) => latest(inputs)?.mode,
  }),
  "tdh.latest.ruleVersion": defineFact<string>({
    format: "text",
    refresh: FEED_REFRESH,
    source: latestSource,
    value: (inputs) =>
      rust(inputs)?.ruleVersion ?? latest(inputs)?.ruleVersion ?? undefined,
    drift: (inputs) => {
      const reported = rust(inputs)?.ruleVersion ?? latest(inputs)?.ruleVersion;
      return reported && reported !== inputs.record.p26.ruleVersion
        ? { by: "D137", says: "rules.version" }
        : undefined;
    },
  }),
  "tdh.latest.ruleId": defineFact<string>({
    format: "hash",
    refresh: FEED_REFRESH,
    source: latestSource,
    value: (inputs) => rust(inputs)?.ruleId ?? undefined,
    drift: (inputs) => {
      const reported = rust(inputs)?.ruleId;
      return reported && reported !== inputs.record.p26.ruleId
        ? { by: "D137", says: "rules.ruleId" }
        : undefined;
    },
  }),
  "tdh.latest.registry": defineFact<string>({
    format: "hash",
    refresh: FEED_REFRESH,
    source: latestSource,
    value: (inputs) =>
      rust(inputs)?.registryHash ?? latest(inputs)?.registryHash ?? undefined,
    drift: (inputs) => {
      const reported =
        rust(inputs)?.registryHash ?? latest(inputs)?.registryHash;
      return reported && reported !== inputs.record.p26.registryHash
        ? { by: "D136", says: "rules.registry" }
        : undefined;
    },
  }),
  "tdh.latest.roots.cycle": latestHash((inputs) => rust(inputs)?.cycleRoot),
  "tdh.latest.roots.wallet": latestHash((inputs) => rust(inputs)?.walletRoot),
  "tdh.latest.roots.history": latestHash((inputs) => rust(inputs)?.historyRoot),
  "tdh.latest.inputSha": latestHash(
    (inputs) => latest(inputs)?.sources?.rust?.canonicalInputSha256
  ),
  "tdh.latest.recordsSha": latestHash(
    (inputs) => latest(inputs)?.sources?.rust?.identitiesSha256
  ),
  "tdh.latest.recordsSha.python": latestHash(
    (inputs) => latest(inputs)?.sources?.python?.identitiesSha256
  ),
  "tdh.latest.walletsSha": latestHash(
    (inputs) => latest(inputs)?.sources?.rust?.walletsSha256
  ),
  "tdh.latest.liveSha": latestHash(
    (inputs) =>
      latest(inputs)?.sources?.live?.identity?.sha256 ??
      latest(inputs)?.implementations.live?.sha256
  ),
  "tdh.latest.builds.rust.commit": defineFact<string>({
    format: "commit",
    refresh: FEED_REFRESH,
    source: latestSource,
    value: (inputs) => rust(inputs)?.commit ?? undefined,
  }),
  "tdh.latest.builds.rust.binary": latestHash(
    (inputs) => rust(inputs)?.binarySha256
  ),
  "tdh.latest.builds.rust.runtime": defineFact<number>({
    format: "runtime",
    refresh: FEED_REFRESH,
    source: latestSource,
    value: (inputs) => rust(inputs)?.runtimeMs ?? undefined,
  }),
  "tdh.latest.builds.python.commit": defineFact<string>({
    format: "commit",
    refresh: FEED_REFRESH,
    source: latestSource,
    value: (inputs) =>
      latest(inputs)?.implementations.python?.commit ?? undefined,
  }),
  "tdh.latest.builds.python.runtime": defineFact<number>({
    format: "runtime",
    refresh: FEED_REFRESH,
    source: latestSource,
    value: (inputs) =>
      latest(inputs)?.implementations.python?.runtimeMs ?? undefined,
  }),
  "tdh.latest.file.sha256": defineFact<string>({
    format: "hash",
    refresh: FEED_REFRESH,
    source: indexSource,
    value: (inputs) => {
      const cycle = latest(inputs)?.cycleDay;
      return (
        inputs.feed?.index.days.find((day) => day.cycleDay === cycle)?.sha256 ??
        undefined
      );
    },
  }),
  "tdh.latest.file.sha256Read": latestHash(
    (inputs) => inputs.feed?.latest.sha256
  ),
  "tdh.latest.file.url": defineFact<string>({
    format: "text",
    refresh: FEED_REFRESH,
    source: latestSource,
    value: (inputs) => inputs.feed?.latest.url,
  }),
  "tdh.days": defineFact<DaySummary[]>({
    format: "list",
    refresh: FEED_REFRESH,
    source: indexSource,
    value: daySummaries,
  }),
  "tdh.days.compared": defineFact<number>({
    format: "count",
    unit: "days",
    refresh: FEED_REFRESH,
    source: indexSource,
    value: (inputs) => inputs.feed?.index.days.length,
  }),
  "tdh.days.equal": defineFact<number>({
    format: "count",
    unit: "days",
    refresh: FEED_REFRESH,
    source: indexSource,
    evidence: "tested",
    value: (inputs) =>
      inputs.feed?.index.days.filter((day) => day.verdict === "OK").length,
  }),
  /**
   * Results written late or re-run (↻): known only when every day file the
   * index lists was read, since only a file says when it was written.
   */
  "tdh.days.late": defineFact<number>({
    format: "count",
    unit: "days",
    refresh: FEED_REFRESH,
    source: indexSource,
    value: (inputs) => {
      const days = daySummaries(inputs);
      if (days === undefined || days.some((day) => day.writtenAt === null)) {
        return undefined;
      }
      return days.filter((day) => day.rewritten).length;
    },
  }),
  "tdh.days.first": defineFact<string>({
    format: "day",
    refresh: FEED_REFRESH,
    source: indexSource,
    value: (inputs) => {
      const days = inputs.feed?.index.days;
      if (days === undefined || days.length === 0) {
        return undefined;
      }
      return dateOfCycle(Math.min(...days.map((day) => day.cycleDay)));
    },
  }),
  "tdh.open.cycle": defineFact<number>({
    format: "count",
    refresh: RENDER_REFRESH,
    source: latestSource,
    value: openCycle,
  }),
  "tdh.open.date": defineFact<string>({
    format: "day",
    refresh: RENDER_REFRESH,
    source: latestSource,
    value: (inputs) => {
      const cycle = openCycle(inputs);
      return cycle === undefined ? undefined : dateOfCycle(cycle);
    },
  }),
  "tdh.open.minutesLeft": defineFact<number>({
    format: "count",
    unit: "minutes",
    refresh: RENDER_REFRESH,
    source: (inputs) =>
      source("feed", "the open day: from now to its 00:00 UTC snapshot", {
        readAt: inputs.now,
      }),
    value: (inputs) => {
      const cycle = openCycle(inputs);
      if (cycle === undefined) {
        return undefined;
      }
      return Math.max(
        0,
        Math.round((cycle * DAY_MS - Date.parse(inputs.now)) / 60_000)
      );
    },
  }),
  "tdh.open.progress": defineFact<number>({
    format: "cents",
    refresh: RENDER_REFRESH,
    source: (inputs) =>
      source("feed", "the open day: the share of its 24 hours gone", {
        readAt: inputs.now,
      }),
    value: (inputs) => {
      const cycle = openCycle(inputs);
      if (cycle === undefined) {
        return undefined;
      }
      const gone = Date.parse(inputs.now) - (cycle - 1) * DAY_MS;
      return Math.round(Math.min(1, Math.max(0, gone / DAY_MS)) * 1000) / 10;
    },
  }),
  "tdh.nextResultAt": defineFact<string>({
    format: "instant",
    unit: "UTC",
    refresh: FEED_REFRESH,
    source: (inputs) =>
      source(
        "feed",
        "the open day's snapshot plus about 50 minutes, until the feed states nextExpectedAt",
        {
          readAt: inputs.now,
        }
      ),
    value: (inputs) => {
      const cycle = openCycle(inputs);
      return cycle === undefined
        ? undefined
        : new Date(cycle * DAY_MS + PUBLISH_AFTER_MS)
            .toISOString()
            .replace(".000Z", "Z");
    },
  }),
  "tdh.cutover.about": defineFact<string>({
    format: "day",
    refresh: FEED_REFRESH,
    source: (inputs) =>
      inputs.feed?.index.cutover
        ? indexSource(inputs)
        : source("decision", inputs.site.cutover.source),
    standing: { kind: "decided", ref: "D132" },
    value: (inputs) =>
      inputs.feed?.index.cutover?.plannedDate ?? inputs.site.cutover.about,
  }),
  "tdh.cutover.cycle": defineFact<number>({
    format: "count",
    refresh: BUILD_REFRESH,
    source: (inputs) => source("decision", inputs.site.cutover.source),
    value: (inputs) =>
      cycleOf(
        inputs.feed?.index.cutover?.plannedDate ?? inputs.site.cutover.about
      ),
  }),
} as const;
