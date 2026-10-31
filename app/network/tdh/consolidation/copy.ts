import { fill } from "@/components/explained/i18n";
import type { SupportedLocale } from "@/i18n/locales";
import type { MessageKey } from "@/i18n/messages";

/** A Your wallets string (`explained.tdh.wallets.*`), every placeholder filled. */
export type WalletsKey = Extract<MessageKey, `explained.tdh.wallets.${string}`>;

export function wt(
  locale: SupportedLocale,
  key: WalletsKey,
  params: Readonly<Record<string, string | number>> = {}
): string {
  return fill(locale, key, params);
}
