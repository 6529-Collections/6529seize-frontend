import type { ApiContentModerationQueueItem } from "@/generated/models/ApiContentModerationQueueItem";
import { formatPercent } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export const formatContentModerationEnum = (value: string): string =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const clampConfidence = (value: number): number =>
  Math.min(1, Math.max(0, value));

export const getAiRecommendationText = (
  item: ApiContentModerationQueueItem,
  locale: SupportedLocale
): string => {
  const rawRecommendation = item.ai_recommendation?.trim();
  if (!rawRecommendation) {
    return t(locale, "contentModeration.moderator.noAiRecommendation");
  }
  const recommendation = formatContentModerationEnum(rawRecommendation);
  if (
    typeof item.ai_confidence !== "number" ||
    !Number.isFinite(item.ai_confidence)
  ) {
    return t(locale, "contentModeration.moderator.aiRecommendation", {
      value: recommendation,
    });
  }
  return t(locale, "contentModeration.moderator.aiRecommendation", {
    value: `${recommendation} (${formatPercent(
      locale,
      clampConfidence(item.ai_confidence),
      0
    )})`,
  });
};
