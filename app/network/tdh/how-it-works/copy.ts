import { fill } from "@/components/explained/i18n";
import type { SupportedLocale } from "@/i18n/locales";
import type { MessageKey } from "@/i18n/messages";

/** A How it works string (`explained.tdh.how.*`), every placeholder filled. */
export type HowKey = Extract<MessageKey, `explained.tdh.how.${string}`>;

export function ht(
  locale: SupportedLocale,
  key: HowKey,
  params: Readonly<Record<string, string | number>> = {}
): string {
  return fill(locale, key, params);
}
