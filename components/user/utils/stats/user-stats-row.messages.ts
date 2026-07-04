import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

type UserStatsRowMessageKey = Extract<MessageKey, `user.statsRow.${string}`>;

type MessageParams = Record<string, string | number>;

export function getUserStatsRowMessage(
  key: UserStatsRowMessageKey,
  params: MessageParams = {}
): string {
  return t(DEFAULT_LOCALE, key, params);
}

export function formatUserStatsRowInteger(
  value: number | null | undefined
): string {
  return formatInteger(DEFAULT_LOCALE, value);
}
