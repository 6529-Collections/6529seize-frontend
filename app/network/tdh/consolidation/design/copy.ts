import { fill } from "@/components/explained/i18n";
import type { SupportedLocale } from "@/i18n/locales";
import type { MessageKey } from "@/i18n/messages";

/** A Consolidation design string (`explained.tdh.design.*`), every placeholder filled. */
type DesignKey = Extract<MessageKey, `explained.tdh.design.${string}`>;

export function dt(
  locale: SupportedLocale,
  key: DesignKey,
  params: Readonly<Record<string, string | number>> = {}
): string {
  return fill(locale, key, params);
}
