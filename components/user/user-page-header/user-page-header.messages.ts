import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { formatDate } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";

type UserProfileHeaderMessageKey = Extract<
  MessageKey,
  `user.profileHeader.${string}`
>;

type MessageParams = Record<string, string | number>;

const MONTH_YEAR_FORMAT = {
  month: "long",
  year: "numeric",
} satisfies Intl.DateTimeFormatOptions;

export function getUserProfileHeaderMessage(
  key: UserProfileHeaderMessageKey,
  params: MessageParams = {}
): string {
  return t(DEFAULT_LOCALE, key, params);
}

export function formatUserProfileHeaderMonthYear(
  value: Date | string | number | null | undefined
): string {
  return formatDate(DEFAULT_LOCALE, value, MONTH_YEAR_FORMAT);
}

export function getUserProfileHeaderDisplayName(
  profile: ApiIdentity,
  fallback: string
): string {
  return (
    profile.handle || profile.display || profile.primary_wallet || fallback
  );
}
