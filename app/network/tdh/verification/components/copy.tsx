import { fill } from "@/components/explained/i18n";
import type { SupportedLocale } from "@/i18n/locales";
import type { MessageKey } from "@/i18n/messages";

/**
 * The daily check's and a day's receipt's words (TDH-DESIGN.md §2): every
 * string a message key in its page's namespace, every number an argument
 * filled from a fact, never typed into the copy. Sentences with facts,
 * marks or links inside take the kit's `rich`.
 */
export type CheckKey = Extract<MessageKey, `explained.tdh.check.${string}`>;
export type DayKey = Extract<MessageKey, `explained.tdh.day.${string}`>;
type PageKey = CheckKey | DayKey;

type Params = Readonly<Record<string, string | number>>;

/** A page string with its placeholders filled. */
export function pt(
  locale: SupportedLocale,
  key: PageKey,
  params: Params = {}
): string {
  return fill(locale, key, params);
}
