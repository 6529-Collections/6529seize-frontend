import type { SupportedLocale } from "@/i18n/locales";

import type { WorldTimeZoneMapZone } from "./mapGeometry";
import {
  formatZoneDate,
  formatZoneTime,
  getDstStatus,
  getGenericZoneName,
  getOffsetMinutes,
  parseSignedClock,
  type DstStatus,
} from "./timeZoneClock";

export const TIME_ZONE_REGION_KEYS = [
  "africa",
  "america",
  "antarctica",
  "arctic",
  "asia",
  "atlantic",
  "australia",
  "europe",
  "indian",
  "pacific",
  "other",
] as const;

export type TimeZoneRegionKey = (typeof TIME_ZONE_REGION_KEYS)[number];

export type TimeZoneRowBase = {
  readonly id: string;
  readonly city: string;
  readonly regionKey: TimeZoneRegionKey;
  // The merged map zone that contains this IANA zone, when known.
  readonly mapZoneId: string | null;
};

export type TimeZoneRow = TimeZoneRowBase & {
  readonly regionLabel: string;
  readonly genericName: string;
  readonly offsetMinutes: number;
  readonly time: string;
  readonly date: string;
  readonly dst: DstStatus;
};

export type TimeZoneSortKey = "zone" | "region" | "offset";
export type TimeZoneSortDirection = "ascending" | "descending";

const KNOWN_REGION_KEYS = new Set<string>(TIME_ZONE_REGION_KEYS);
// Etc/* zones are fixed-offset nautical zones; the UTC clock covers UTC.
const NAUTICAL_ZONE_PREFIX = "Etc/";
const OFFSET_TERM_PREFIXES = ["utc", "gmt"] as const;
const UTC_TERMS = new Set(["utc", "gmt", "z"]);
const MINUTES_PER_HOUR = 60;

function isRegionKey(value: string): value is TimeZoneRegionKey {
  return KNOWN_REGION_KEYS.has(value);
}

export function getRegionKey(timeZone: string): TimeZoneRegionKey {
  const area = timeZone.split("/")[0]?.toLowerCase() ?? "";
  return isRegionKey(area) ? area : "other";
}

// IANA location names use underscores for spaces ("America/Sao_Paulo").
export function getCityName(timeZone: string): string {
  return (timeZone.split("/").at(-1) ?? timeZone).replaceAll("_", " ");
}

function toRowBase(id: string, mapZoneId: string | null): TimeZoneRowBase {
  return { id, city: getCityName(id), regionKey: getRegionKey(id), mapZoneId };
}

export function buildRowBasesFromMapZones(
  zones: readonly WorldTimeZoneMapZone[]
): TimeZoneRowBase[] {
  return zones.flatMap((zone) =>
    zone.members
      .filter((member) => !member.startsWith(NAUTICAL_ZONE_PREFIX))
      .map((member) => toRowBase(member, zone.tzid))
  );
}

// Fallback when the map data cannot load: the browser's own zone list.
export function buildRowBasesFromIds(
  ids: readonly string[]
): TimeZoneRowBase[] {
  return ids
    .filter((id) => !id.startsWith(NAUTICAL_ZONE_PREFIX) && id !== "UTC")
    .map((id) => toRowBase(id, null));
}

export function getBrowserTimeZoneIds(): string[] {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return [];
  }
}

// Returns null for zones this browser's tz database does not know.
export function buildTimeZoneRow(
  base: TimeZoneRowBase,
  locale: SupportedLocale,
  date: Date,
  regionLabel: string
): TimeZoneRow | null {
  const offsetMinutes = getOffsetMinutes(base.id, date);
  const time = formatZoneTime(locale, base.id, date);
  const dst = getDstStatus(base.id, date);
  if (offsetMinutes === null || time === null || dst === null) {
    return null;
  }
  return {
    ...base,
    regionLabel,
    genericName: getGenericZoneName(locale, base.id, date) ?? base.city,
    offsetMinutes,
    time,
    date: formatZoneDate(locale, base.id, date) ?? "",
    dst,
  };
}

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replaceAll(/\p{M}/gu, "")
    .replaceAll("−", "-")
    .replaceAll("_", " ")
    .toLowerCase()
    .trim();
}

type OffsetTerm = {
  readonly sign: 1 | -1;
  readonly hours: number;
  readonly minutes: number | null;
};

function parseOffsetTerm(term: string): OffsetTerm | null {
  if (UTC_TERMS.has(term)) {
    return { sign: 1, hours: 0, minutes: 0 };
  }
  const prefix =
    OFFSET_TERM_PREFIXES.find((candidate) => term.startsWith(candidate)) ?? "";
  const clock = parseSignedClock(term.slice(prefix.length));
  return clock === null || clock.seconds !== null
    ? null
    : { sign: clock.sign, hours: clock.hours, minutes: clock.minutes };
}

// "+5" matches +05:00, +05:30 and +05:45; "+5:30" matches only +05:30.
function matchesOffsetTerm(offsetMinutes: number, term: OffsetTerm): boolean {
  const absolute = Math.abs(offsetMinutes);
  const sign = offsetMinutes < 0 ? -1 : 1;
  const hours = Math.floor(absolute / MINUTES_PER_HOUR);
  if (offsetMinutes !== 0 && sign !== term.sign) {
    return false;
  }
  if (term.minutes === null) {
    return hours === term.hours;
  }
  return absolute === term.hours * MINUTES_PER_HOUR + term.minutes;
}

function getRowSearchText(row: TimeZoneRow): string {
  return normalizeSearchText(
    [row.id, row.city, row.regionLabel, row.genericName].join(" ")
  );
}

export function filterTimeZoneRows(
  rows: readonly TimeZoneRow[],
  query: string
): readonly TimeZoneRow[] {
  const terms = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) {
    return rows;
  }
  return rows.filter((row) => {
    const searchText = getRowSearchText(row);
    return terms.every((term) => {
      const offsetTerm = parseOffsetTerm(term);
      return offsetTerm === null
        ? searchText.includes(term)
        : matchesOffsetTerm(row.offsetMinutes, offsetTerm);
    });
  });
}

export function sortTimeZoneRows(
  rows: readonly TimeZoneRow[],
  key: TimeZoneSortKey,
  direction: TimeZoneSortDirection,
  locale: SupportedLocale
): TimeZoneRow[] {
  const collator = new Intl.Collator(locale, {
    sensitivity: "base",
    numeric: true,
  });
  const byCity = (left: TimeZoneRow, right: TimeZoneRow) =>
    collator.compare(left.city, right.city) ||
    collator.compare(left.id, right.id);
  const comparators: Record<
    TimeZoneSortKey,
    (left: TimeZoneRow, right: TimeZoneRow) => number
  > = {
    zone: byCity,
    region: (left, right) =>
      collator.compare(left.regionLabel, right.regionLabel) ||
      byCity(left, right),
    offset: (left, right) =>
      left.offsetMinutes - right.offsetMinutes || byCity(left, right),
  };
  const factor = direction === "ascending" ? 1 : -1;
  const compare = comparators[key];
  return [...rows].sort((left, right) => factor * compare(left, right));
}
