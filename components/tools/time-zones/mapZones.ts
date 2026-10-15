import type { SupportedLocale } from "@/i18n/locales";

import type { WorldTimeZoneMapZone } from "./mapGeometry";
import {
  formatZoneDate,
  formatZoneTime,
  getDstStatus,
  getGenericZoneName,
  getOffsetMinutes,
  haveSameYearClock,
  isSameTimeZone,
  type DstStatus,
} from "./timeZoneClock";

export type MapZoneSnapshot = {
  readonly zone: WorldTimeZoneMapZone;
  // null when this browser's tz database does not know the zone.
  readonly offsetMinutes: number | null;
  readonly name: string;
  readonly time: string | null;
  readonly date: string | null;
  readonly dst: DstStatus | null;
};

function compareSnapshots(left: MapZoneSnapshot, right: MapZoneSnapshot) {
  if (left.offsetMinutes === null || right.offsetMinutes === null) {
    return (
      Number(left.offsetMinutes === null) -
        Number(right.offsetMinutes === null) ||
      left.zone.tzid.localeCompare(right.zone.tzid, "en")
    );
  }
  return (
    left.offsetMinutes - right.offsetMinutes ||
    left.zone.x - right.zone.x ||
    left.zone.tzid.localeCompare(right.zone.tzid, "en")
  );
}

// West to east by current offset, then by map position; zones the browser
// cannot resolve go last.
export function buildMapZoneSnapshots(
  zones: readonly WorldTimeZoneMapZone[],
  locale: SupportedLocale,
  date: Date
): MapZoneSnapshot[] {
  return zones
    .map((zone) => ({
      zone,
      offsetMinutes: getOffsetMinutes(zone.tzid, date),
      name: getGenericZoneName(locale, zone.tzid, date) ?? zone.tzid,
      time: formatZoneTime(locale, zone.tzid, date),
      date: formatZoneDate(locale, zone.tzid, date),
      dst: getDstStatus(zone.tzid, date),
    }))
    .sort(compareSnapshots);
}

function findAliasTarget(
  links: Readonly<Record<string, string>>,
  timeZone: string
): string | null {
  const direct = links[timeZone];
  if (direct !== undefined) {
    return direct;
  }
  const alias = Object.keys(links).find((candidate) =>
    isSameTimeZone(candidate, timeZone)
  );
  return alias === undefined ? null : (links[alias] ?? null);
}

// The map dot for a browser-reported zone. The browser may report the
// mapped zone itself, a tzdata alias such as "Europe/Amsterdam" (shown at
// "Europe/Brussels"), or a legacy name such as "Asia/Calcutta". As a last
// resort, pick a dot with the same current offset whose clock also matches
// across the year.
export function findMapZoneForTimeZone(
  zones: readonly WorldTimeZoneMapZone[],
  links: Readonly<Record<string, string>>,
  timeZone: string,
  date: Date
): string | null {
  const zoneIds = new Set(zones.map((zone) => zone.tzid));
  if (zoneIds.has(timeZone)) {
    return timeZone;
  }
  const aliasTarget = findAliasTarget(links, timeZone);
  if (aliasTarget !== null && zoneIds.has(aliasTarget)) {
    return aliasTarget;
  }
  const canonicalMatch = zones.find((zone) =>
    isSameTimeZone(zone.tzid, timeZone)
  );
  if (canonicalMatch) {
    return canonicalMatch.tzid;
  }
  const currentOffset = getOffsetMinutes(timeZone, date);
  if (currentOffset === null) {
    return null;
  }
  const year = date.getUTCFullYear();
  const match = zones.find(
    (zone) =>
      getOffsetMinutes(zone.tzid, date) === currentOffset &&
      haveSameYearClock(zone.tzid, timeZone, year)
  );
  return match?.tzid ?? null;
}
