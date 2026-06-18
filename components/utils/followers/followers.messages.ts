import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

type FollowersMessageKey = Extract<MessageKey, `followers.${string}`>;

type MessageParams = Record<string, string | number>;

export function getFollowersMessage(
  key: FollowersMessageKey,
  params: MessageParams = {}
): string {
  return t(DEFAULT_LOCALE, key, params);
}
