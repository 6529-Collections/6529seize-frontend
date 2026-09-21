import { formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";

export function formatVideoTime(
  seconds: number,
  duration: number,
  locale: SupportedLocale
): string {
  const totalSeconds = Number.isFinite(seconds)
    ? Math.max(0, Math.floor(seconds + 1e-7))
    : 0;
  const hasHours = duration >= 3600;
  const parts = [Math.floor(totalSeconds / 60), totalSeconds % 60];
  if (hasHours) {
    parts[0] = Math.floor(totalSeconds / 60) % 60;
    parts.unshift(Math.floor(totalSeconds / 3600));
  }
  return parts
    .map((part, index) =>
      formatNumber(locale, part, {
        useGrouping: false,
        minimumIntegerDigits: index === 0 ? 1 : 2,
        maximumFractionDigits: 0,
      })
    )
    .join(":");
}
