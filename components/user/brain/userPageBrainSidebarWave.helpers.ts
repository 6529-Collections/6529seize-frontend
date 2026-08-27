import { getScaledImageUri } from "@/helpers/image.helpers";
import type { ImageScale } from "@/helpers/image.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { formatRelativeTime } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import type { ProfileWaveActivitySidebarItem } from "@/types/profile-wave-activity.types";

export const getSidebarWaveHref = (
  wave: ProfileWaveActivitySidebarItem
): string =>
  getWaveRoute({
    waveId: wave.id,
    isDirectMessage: false,
    isApp: false,
  });

export const getSidebarWaveImageSrc = (
  wave: ProfileWaveActivitySidebarItem,
  scale: ImageScale
): string | null =>
  wave.picture ? getScaledImageUri(wave.picture, scale) : null;

export const formatSidebarWaveActivityTime = (
  locale: SupportedLocale,
  timestamp: number,
  referenceTime = Date.now()
): string => {
  const difference = timestamp - referenceTime;
  const absoluteDifference = Math.abs(difference);
  const units = [
    { unit: "year", milliseconds: 365 * 24 * 60 * 60 * 1000 },
    { unit: "month", milliseconds: 30 * 24 * 60 * 60 * 1000 },
    { unit: "day", milliseconds: 24 * 60 * 60 * 1000 },
    { unit: "hour", milliseconds: 60 * 60 * 1000 },
    { unit: "minute", milliseconds: 60 * 1000 },
  ] as const;
  const matchingUnit = units.find(
    ({ milliseconds }) => absoluteDifference >= milliseconds
  );

  if (!matchingUnit) {
    return formatRelativeTime(locale, 0, "second", {
      numeric: "auto",
      style: "narrow",
    });
  }

  return formatRelativeTime(
    locale,
    Math.trunc(difference / matchingUnit.milliseconds),
    matchingUnit.unit,
    { numeric: "auto", style: "narrow" }
  );
};
