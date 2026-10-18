import type { FactInputs, FeedDayInput } from "../factInputs";
import type { FactSourceKind, FactSourceRead } from "./types";

/** A source line without undefined fields (exactOptionalPropertyTypes). */
export function source(
  kind: FactSourceKind,
  ref: string,
  extra: {
    readonly url?: string | null | undefined;
    readonly readAt?: string | null | undefined;
    readonly writtenAt?: string | null | undefined;
  } = {}
): FactSourceRead {
  return {
    kind,
    ref,
    ...(extra.url ? { url: extra.url } : {}),
    ...(extra.readAt ? { readAt: extra.readAt } : {}),
    ...(extra.writtenAt ? { writtenAt: extra.writtenAt } : {}),
  };
}

export const FEED_REFRESH = "feed cache (10 min)";
export const MANIFEST_REFRESH = "manifest cache (1 h)";
export const EDITIONS_REFRESH = "6529.io API cache (1 h)";
export const RECORD_REFRESH =
  "the fact gate, at ship time (the drift check runs in CI)";
export const BUILD_REFRESH = "build";
export const RENDER_REFRESH = "every render";

export function indexSource(inputs: FactInputs): FactSourceRead {
  return source("feed", "the public TDH feed, index.json", {
    url: inputs.feed?.indexUrl,
    readAt: inputs.feed?.readAt ?? inputs.now,
    writtenAt: inputs.feed?.index.generatedAt,
  });
}

function daySource(
  inputs: FactInputs,
  day: FeedDayInput | null | undefined,
  fallbackRef: string
): FactSourceRead {
  if (!day) {
    return source("feed", fallbackRef, { readAt: inputs.now });
  }
  return source("feed", `the public TDH feed, days/${day.day.cycleDay}.json`, {
    url: day.url,
    readAt: inputs.feed?.readAt ?? inputs.now,
    writtenAt: day.day.generatedAt,
  });
}

export function latestSource(inputs: FactInputs): FactSourceRead {
  return daySource(
    inputs,
    inputs.feed?.latest,
    "the public TDH feed, the latest day"
  );
}

/** The latest day and the one before it, for a change between the two. */
export function deltaSource(inputs: FactInputs): FactSourceRead {
  const latest = inputs.feed?.latest.day.cycleDay;
  const previous = inputs.feed?.previous?.day.cycleDay;
  const ref =
    latest !== undefined && previous !== undefined
      ? `the public TDH feed, days/${previous}.json and days/${latest}.json`
      : "the public TDH feed, the latest two days";
  return source("feed", ref, {
    readAt: inputs.feed?.readAt ?? inputs.now,
    writtenAt: inputs.feed?.latest.day.generatedAt,
  });
}

export function manifestSource(inputs: FactInputs): FactSourceRead {
  const manifest = inputs.manifest;
  return source(
    "manifest",
    manifest?.url
      ? "the public TDH feed, formal/manifest.json"
      : "formal/manifest.json, the copy bundled with 6529.io",
    {
      url: manifest?.url,
      readAt: manifest?.readAt ?? inputs.now,
      writtenAt: manifest?.manifest.generatedAt,
    }
  );
}

export function p26Source(inputs: FactInputs, section: string): FactSourceRead {
  return source(
    "spec",
    `P26 ${section}, at 6529chain ${inputs.record.p26.commit.slice(0, 7)}`,
    { writtenAt: inputs.record.p26.date }
  );
}

export function recordSource(inputs: FactInputs, what: string): FactSourceRead {
  return source(
    "decision",
    `${what}, 6529's design record at ${inputs.record.head.commit.slice(0, 7)}`,
    { writtenAt: inputs.record.head.date }
  );
}

export function editionsSource(inputs: FactInputs): FactSourceRead {
  return source(
    "api",
    inputs.editions?.source ?? "6529.io API memes_extended_data",
    {
      readAt: inputs.editions?.readAt ?? inputs.now,
    }
  );
}

export function engineSource(inputs: FactInputs, rule: string): FactSourceRead {
  return source(
    "engine",
    `${rule}, computed by ${inputs.engine.name} on the real editions`,
    { readAt: inputs.editions?.readAt ?? inputs.now }
  );
}

/** The cycle of a UTC day: whole days since 1970-01-01 (P26 §4). */
export function cycleOf(date: string): number {
  return Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
}

/** The UTC day of a cycle. */
export function dateOfCycle(cycle: number): string {
  return new Date(cycle * 86_400_000).toISOString().slice(0, 10);
}
