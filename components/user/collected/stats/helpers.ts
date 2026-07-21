import {
  getCollectedStatsIdentityKey,
  getStatsPath,
} from "@/components/user/stats/userPageStats.helpers";
import { CollectedCollectionType } from "@/entities/IProfile";
import type { ApiCollectedStats } from "@/generated/models/ApiCollectedStats";
import type { ApiCollectedStatsSeason } from "@/generated/models/ApiCollectedStatsSeason";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { formatInteger, formatNumber } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t as translate } from "@/i18n/messages";
import type {
  CollectedHeaderMetric,
  CollectedStatsViewModel,
  DisplaySeason,
} from "./types";

export const isAbortError = (error: unknown): boolean =>
  error instanceof Error && error.name === "AbortError";

export const getSafeStatsPath = (
  profile: ApiIdentity,
  activeAddress: string | null
): string | null => {
  try {
    return getStatsPath(profile, activeAddress);
  } catch {
    return null;
  }
};

export const getSafeCollectedStatsIdentityKey = (
  profile: ApiIdentity,
  activeAddress: string | null
): string | null => {
  try {
    return getCollectedStatsIdentityKey(profile, activeAddress);
  } catch {
    return null;
  }
};

const METRIC_NUMBER_FORMAT_OPTIONS = {
  maximumFractionDigits: 2,
} satisfies Intl.NumberFormatOptions;

const formatMetricValue = (
  value: number | undefined,
  locale: SupportedLocale
) =>
  translate(locale, "user.collected.stats.metric.value", {
    value: formatInteger(locale, value ?? 0),
  });

const parseSeasonNumber = (season: string) => {
  const trimmed = season.trim();
  if (/^szn\d+$/i.test(trimmed)) {
    const seasonNumber = Number.parseInt(trimmed.replace(/^szn/i, ""), 10);
    return seasonNumber > 0 ? seasonNumber : null;
  }

  const numberMatch = /^season\s+(\d+)$/i.exec(trimmed);
  if (numberMatch) {
    const seasonNumber = Number.parseInt(numberMatch[1]!, 10);
    return seasonNumber > 0 ? seasonNumber : null;
  }

  return null;
};

/** Normalizes API count values for safe display and progress calculations. */
const toNonNegativeInteger = (value: number | null | undefined): number =>
  typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.trunc(value)
    : 0;

/** Builds the compact collection metrics shown above the details panel. */
const buildMainMetrics = (
  collectedStats: ApiCollectedStats | undefined,
  locale: SupportedLocale
): CollectedHeaderMetric[] => {
  if (!collectedStats) {
    return [];
  }

  const metrics: CollectedHeaderMetric[] = [];
  const validSeasonSets = collectedStats.seasons
    .filter((season) => {
      const seasonNumber = parseSeasonNumber(season.season);
      return (
        seasonNumber !== null &&
        toNonNegativeInteger(season.total_cards_in_season) > 0
      );
    })
    .map((season) => toNonNegativeInteger(season.sets_held));
  const memeSets =
    validSeasonSets.length > 0 ? Math.min(...validSeasonSets) : 0;

  if (collectedStats.nextgen_balance) {
    metrics.push({
      id: "nextgen",
      label: translate(locale, "user.collected.stats.metrics.nextGen"),
      val: formatMetricValue(collectedStats.nextgen_balance, locale),
      collection: CollectedCollectionType.NEXTGEN,
    });
  }

  if (memeSets > 0) {
    metrics.push({
      id: "memes_sets",
      label: translate(locale, "user.collected.stats.metrics.memeSets"),
      val: formatMetricValue(memeSets, locale),
      collection: CollectedCollectionType.MEMES,
    });
  }

  if (collectedStats.memes_balance) {
    const uniqueSub =
      collectedStats.unique_memes === collectedStats.memes_balance
        ? undefined
        : translate(locale, "user.collected.stats.metrics.unique", {
            value: formatInteger(locale, collectedStats.unique_memes),
          });

    metrics.push({
      id: "memes",
      label: translate(locale, "user.collected.stats.metrics.memes"),
      val: formatMetricValue(collectedStats.memes_balance, locale),
      collection: CollectedCollectionType.MEMES,
      ...(uniqueSub ? { sub: uniqueSub } : {}),
    });
  }

  if (collectedStats.gradients_balance) {
    metrics.push({
      id: "gradients",
      label: translate(locale, "user.collected.stats.metrics.gradients"),
      val: formatMetricValue(collectedStats.gradients_balance, locale),
      collection: CollectedCollectionType.GRADIENTS,
    });
  }

  if (collectedStats.boost) {
    metrics.push({
      id: "boost",
      label: translate(locale, "user.collected.stats.metrics.boost"),
      val: translate(locale, "user.collected.stats.metric.value", {
        value: formatNumber(
          locale,
          Number.parseFloat(collectedStats.boost.toFixed(2)),
          METRIC_NUMBER_FORMAT_OPTIONS
        ),
      }),
    });
  }

  return metrics;
};

/** Converts one API season into the normalized table-row view model. */
const buildDisplaySeason = (
  season: ApiCollectedStatsSeason,
  locale: SupportedLocale
): DisplaySeason | null => {
  const seasonNumber = parseSeasonNumber(season.season);
  const totalCards = toNonNegativeInteger(season.total_cards_in_season);
  if (seasonNumber === null || totalCards <= 0) {
    return null;
  }

  const setsHeld = toNonNegativeInteger(season.sets_held);
  const nextSetCards = toNonNegativeInteger(
    season.partial_set_unique_cards_held
  );
  const totalCardsHeld = toNonNegativeInteger(season.total_cards_held);
  const isStarted = totalCardsHeld > 0;
  const isRestingComplete = setsHeld > 0 && nextSetCards === 0;
  const rawProgressPct =
    totalCards > 0 ? Math.min(nextSetCards / totalCards, 1) : 0;
  const progressPct = isRestingComplete ? 1 : rawProgressPct;

  let detailText: string | null = null;
  if (isStarted) {
    if (nextSetCards > 0) {
      detailText = translate(
        locale,
        "user.collected.stats.seasonRow.toNextSet",
        {
          held: formatInteger(locale, nextSetCards),
          total: formatInteger(locale, totalCards),
          setNumber: setsHeld + 1,
        }
      );
    } else if (setsHeld > 0) {
      detailText = translate(
        locale,
        "user.collected.stats.seasonRow.setComplete",
        { count: formatInteger(locale, setsHeld) }
      );
    }
  }

  return {
    id: season.season,
    label: translate(locale, "user.collected.stats.seasonRow.label", {
      seasonNumber,
    }),
    seasonNumber,
    totalCards,
    setsHeld,
    nextSetCards,
    totalCardsHeld,
    isStarted,
    isRestingComplete,
    progressPct,
    detailText,
  };
};

export const buildCollectedStatsViewModel = (
  collectedStats: ApiCollectedStats | undefined,
  locale: SupportedLocale = DEFAULT_LOCALE
): CollectedStatsViewModel => {
  const mainMetrics = buildMainMetrics(collectedStats, locale);
  const allSeasons = (collectedStats?.seasons ?? []).flatMap((season) => {
    const displaySeason = buildDisplaySeason(season, locale);
    return displaySeason ? [displaySeason] : [];
  });
  const startedSeasons = allSeasons.filter((season) => season.isStarted);
  const notStartedSeasons = allSeasons.filter((season) => !season.isStarted);

  return {
    mainMetrics,
    allSeasons,
    startedSeasons,
    notStartedSeasons,
  };
};
