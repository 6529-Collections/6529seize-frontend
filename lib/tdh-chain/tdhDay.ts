import type { ApiBlockItem } from "@/generated/models/ApiBlockItem";
import { formatUtcDate } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

/** "24 Nov 2026": a UTC day, day first, as the identity move notices write it. */
function formatUtcDay(locale: SupportedLocale, ms: number): string {
  return t(locale, "tdh.day.date", {
    day: formatUtcDate(locale, ms, { day: "numeric" }),
    month: formatUtcDate(locale, ms, { month: "short" }),
    year: formatUtcDate(locale, ms, { year: "numeric" }),
  });
}

interface ChainTdhDayText {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
}

/**
 * The newest TDH day as the API reports it: when it came from the 6529
 * chain, the line "TDH day {date}, from the 6529 Network" and its detail.
 * Null for a day 6529.io computed itself, so pages read as before until
 * the switch, and again after a rollback.
 */
export function chainTdhDayText(
  locale: SupportedLocale,
  block: Pick<ApiBlockItem, "block_number" | "source" | "cycle_day">
): ChainTdhDayText | null {
  if (block.source !== "CHAIN" || block.cycle_day === undefined) {
    return null;
  }
  const date = formatUtcDay(locale, block.cycle_day * 86_400_000);
  return {
    label: t(locale, "tdh.day.label"),
    value: t(locale, "tdh.day.chain", { date }),
    detail: t(locale, "tdh.day.chainDetail", {
      block: block.block_number,
      date,
    }),
  };
}
