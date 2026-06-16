import { formatDate, formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

type TdhHistoryMessageKey = Extract<
  MessageKey,
  `user.collected.stats.tdhHistory.${string}`
>;

type MessageParams = Record<string, string | number>;

export function getTdhHistoryMessage(
  key: TdhHistoryMessageKey,
  params: MessageParams = {}
): string {
  return t(DEFAULT_LOCALE, key, params);
}

export function formatTdhHistoryDate(date: Date | string | number): string {
  return formatDate(DEFAULT_LOCALE, date);
}

export function formatTdhHistoryValue(
  value: number | null | undefined
): string {
  return formatInteger(DEFAULT_LOCALE, value);
}
