import { getTimeZoneCityName } from "@/lib/display-time-zone/displayTimeZone";

const FALLBACK_TIME_ZONES: readonly string[] = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Lisbon",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Athens",
  "Africa/Lagos",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

let cachedTimeZones: readonly string[] | null = null;

/** IANA zones from the runtime, or a short list when it cannot enumerate them. */
export function getSupportedTimeZones(): readonly string[] {
  if (cachedTimeZones) return cachedTimeZones;
  try {
    const zones = Intl.supportedValuesOf("timeZone");
    cachedTimeZones = zones.length > 0 ? zones : FALLBACK_TIME_ZONES;
  } catch {
    cachedTimeZones = FALLBACK_TIME_ZONES;
  }
  return cachedTimeZones;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replaceAll(/[̀-ͯ]/g, "")
    .replaceAll("_", " ")
    .toLowerCase()
    .trim();
}

/**
 * Zones whose city or full name matches the query. City-name prefixes rank
 * first ("ber" finds Berlin and Bermuda before Cumberland), then any other
 * match in the zone name.
 */
export function searchTimeZones(
  query: string,
  zones: readonly string[] = getSupportedTimeZones(),
  limit = 8
): string[] {
  const needle = normalize(query);
  if (needle.length === 0) return [];
  const cityPrefix: string[] = [];
  const other: string[] = [];
  for (const zone of zones) {
    const city = normalize(getTimeZoneCityName(zone));
    if (city.startsWith(needle)) {
      cityPrefix.push(zone);
    } else if (normalize(zone).includes(needle)) {
      other.push(zone);
    }
  }
  return [...cityPrefix, ...other].slice(0, limit);
}
