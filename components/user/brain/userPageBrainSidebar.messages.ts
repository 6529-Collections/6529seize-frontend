import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

type UserPageBrainSidebarMessageKey = Extract<
  MessageKey,
  `user.brain.sidebar.${string}`
>;

type MessageParams = Record<string, string | number>;

export function getUserPageBrainSidebarMessage(
  locale: SupportedLocale,
  key: UserPageBrainSidebarMessageKey,
  params: MessageParams = {}
): string {
  return t(locale, key, params);
}
