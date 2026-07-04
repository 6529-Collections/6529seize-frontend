import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

type UserStatsRowMessageKey = Extract<MessageKey, `user.statsRow.${string}`>;

type MessageParams = Record<string, string | number>;

export function getUserStatsRowMessage(
  key: UserStatsRowMessageKey,
  params: MessageParams = {},
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  return t(locale, key, params);
}

export function formatUserStatsRowInteger(
  value: number | null | undefined,
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  return formatInteger(locale, value);
}

export function formatUserStatsRowStatFloor(
  value: number | null | undefined,
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  const floored =
    typeof value === "number" && Number.isFinite(value)
      ? Math.floor(value)
      : value;
  return formatInteger(locale, floored);
}
