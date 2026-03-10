import {
  getCollectedStatsIdentityKey,
  getStatsPath,
} from "@/components/user/stats/userPageStats.helpers";
import type { ApiCollectedStats } from "@/generated/models/ApiCollectedStats";
import type { ApiCollectedStatsSeason } from "@/generated/models/ApiCollectedStatsSeason";
import type { ApiIdentity } from "@/generated/models/ObjectSerializer";
import { formatNumberWithCommasOrDash } from "@/helpers/Helpers";
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

const formatMetricValue = (value: number | undefined) =>
  `x${formatNumberWithCommasOrDash(value ?? 0)}`;

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

const buildMainMetrics = (
  collectedStats: ApiCollectedStats | undefined
): CollectedHeaderMetric[] => {
  if (!collectedStats) {
    return [];
  }

  const metrics: CollectedHeaderMetric[] = [];
  const validSeasonSets = collectedStats.seasons
    .filter((season) => {
      const seasonNumber = parseSeasonNumber(season.season);
      return seasonNumber !== null && season.total_cards_in_season > 0;
    })
    .map((season) => season.sets_held);
  const memeSets =
    validSeasonSets.length > 0 ? Math.min(...validSeasonSets) : 0;

  if (collectedStats.nextgen_balance) {
    metrics.push({
      id: "nextgen",
      label: "NextGen",
      val: formatMetricValue(collectedStats.nextgen_balance),
    });
  }

  if (memeSets > 0) {
    metrics.push({
      id: "memes_sets",
      label: "Meme Sets",
      val: formatMetricValue(memeSets),
    });
  }

  if (collectedStats.memes_balance) {
    const uniqueSub =
      collectedStats.unique_memes === collectedStats.memes_balance
        ? undefined
        : `unique x${formatNumberWithCommasOrDash(collectedStats.unique_memes)}`;

    metrics.push({
      id: "memes",
      label: "Memes",
      val: formatMetricValue(collectedStats.memes_balance),
      ...(uniqueSub ? { sub: uniqueSub } : {}),
    });
  }

  if (collectedStats.gradients_balance) {
    metrics.push({
      id: "gradients",
      label: "Gradients",
      val: formatMetricValue(collectedStats.gradients_balance),
    });
  }

  if (collectedStats.boost) {
    metrics.push({
      id: "boost",
      label: "Boost",
      val: formatMetricValue(
        Number.parseFloat(collectedStats.boost.toFixed(2))
      ),
    });
  }

  return metrics;
};

const buildDisplaySeason = (
  season: ApiCollectedStatsSeason
): DisplaySeason | null => {
  const seasonNumber = parseSeasonNumber(season.season);
  const totalCards = season.total_cards_in_season;
  if (seasonNumber === null || totalCards <= 0) {
    return null;
  }

  const setsHeld = season.sets_held;
  const nextSetCards = season.partial_set_unique_cards_held;
  const totalCardsHeld = season.total_cards_held;
  const isStarted = totalCardsHeld > 0;
  const isRestingComplete = setsHeld > 0 && nextSetCards === 0;
  const rawProgressPct =
    totalCards > 0 ? Math.min(nextSetCards / totalCards, 1) : 0;
  const progressPct = isRestingComplete ? 1 : rawProgressPct;

  let detailText: string | null = null;
  if (isStarted) {
    if (nextSetCards > 0) {
      detailText = `${formatNumberWithCommasOrDash(
        nextSetCards
      )}/${formatNumberWithCommasOrDash(totalCards)} to set ${setsHeld + 1}`;
    } else if (setsHeld > 0) {
      detailText = `Set ${formatNumberWithCommasOrDash(setsHeld)} complete`;
    }
  }

  return {
    id: season.season,
    label: `SZN${seasonNumber}`,
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
  collectedStats: ApiCollectedStats | undefined
): CollectedStatsViewModel => {
  const mainMetrics = buildMainMetrics(collectedStats);
  const allSeasons = (collectedStats?.seasons ?? []).flatMap((season) => {
    const displaySeason = buildDisplaySeason(season);
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
