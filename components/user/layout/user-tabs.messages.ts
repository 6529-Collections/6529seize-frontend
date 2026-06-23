import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

type UserProfileTabsMessageKey = Extract<
  MessageKey,
  `user.profile.tabs.${string}`
>;

type MessageParams = Record<string, string | number>;

export function getUserProfileTabsMessage(
  key: UserProfileTabsMessageKey,
  params: MessageParams = {}
): string {
  return t(DEFAULT_LOCALE, key, params);
}
