import { formatDate, formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

type TdhHistoryMessageKey = Extract<
  MessageKey,
  `user.collected.stats.tdhHistory.${string}`
>;

type MessageParams = Record<string, string | number>;

export function getTdhHistoryMessage(
  key: TdhHistoryMessageKey,
  params?: MessageParams,
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  return t(locale, key, params);
}

export function formatTdhHistoryDate(
  date: Date | string | number,
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  return formatDate(locale, date);
}

export function formatTdhHistoryValue(
  value: number | null | undefined,
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  return formatInteger(locale, value);
}
