import type { SupportedLocale } from "@/i18n/locales";
import type { FactBook } from "@/lib/explained/facts";

/**
 * Main Stage's weekdays in words, from the schedule fact (0 is Sunday, as
 * JavaScript counts): "Monday, Wednesday and Friday". Null when the fact
 * cannot be read, so the copy never prints days typed by hand.
 */
export function mainStageDays(
  book: FactBook,
  locale: SupportedLocale
): string | null {
  const days = book.maybe<number[]>("site.mainStage.weekdays")?.value;
  if (!days || days.length === 0) {
    return null;
  }
  const name = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    timeZone: "UTC",
  });
  // 1970-01-04 was a Sunday, weekday 0.
  const names = days.map((day) =>
    name.format(new Date(Date.UTC(1970, 0, 4 + day)))
  );
  return new Intl.ListFormat(locale, {
    style: "long",
    type: "conjunction",
  }).format(names);
}
