import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

import { formatOffsetSuffix, type DstStatus } from "./timeZoneClock";
import type { TimeZoneRegionKey } from "./timeZoneRows";

const DST_LABEL_KEYS: Record<DstStatus, MessageKey> = {
  daylight: "tools.timeZones.dst.daylight",
  standard: "tools.timeZones.dst.standard",
  none: "tools.timeZones.dst.none",
};

const REGION_LABEL_KEYS: Record<TimeZoneRegionKey, MessageKey> = {
  africa: "tools.timeZones.regions.africa",
  america: "tools.timeZones.regions.america",
  antarctica: "tools.timeZones.regions.antarctica",
  arctic: "tools.timeZones.regions.arctic",
  asia: "tools.timeZones.regions.asia",
  atlantic: "tools.timeZones.regions.atlantic",
  australia: "tools.timeZones.regions.australia",
  europe: "tools.timeZones.regions.europe",
  indian: "tools.timeZones.regions.indian",
  pacific: "tools.timeZones.regions.pacific",
  other: "tools.timeZones.regions.other",
};

export function getDstLabel(locale: SupportedLocale, status: DstStatus) {
  return t(locale, DST_LABEL_KEYS[status]);
}

export function getRegionLabel(
  locale: SupportedLocale,
  region: TimeZoneRegionKey
) {
  return t(locale, REGION_LABEL_KEYS[region]);
}

// "UTC+05:30", "UTC-03:00", or "UTC" for a zero offset.
export function formatOffsetLabel(
  locale: SupportedLocale,
  offsetMinutes: number
) {
  return t(locale, "tools.timeZones.offset.value", {
    offset: formatOffsetSuffix(offsetMinutes),
  });
}
