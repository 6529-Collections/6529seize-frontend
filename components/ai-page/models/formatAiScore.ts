import { formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import type { AiScore } from "@/lib/ai-page/models";

/** A score as the page prints it: one decimal for a percent, "8.5 /10". */
export function formatAiScore(locale: SupportedLocale, score: AiScore): string {
  switch (score.kind) {
    case "percent":
      return `${formatNumber(locale, score.value, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}%`;
    case "outOf":
      return `${formatNumber(locale, score.value, {
        maximumFractionDigits: 2,
      })} /${formatNumber(locale, score.max)}`;
    case "number":
      return formatNumber(locale, score.value, {
        maximumFractionDigits: score.digits,
      });
    case "text":
      return score.text;
  }
}
