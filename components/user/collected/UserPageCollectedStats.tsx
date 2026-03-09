"use client";

import UserPageStatsDetailsContent from "@/components/user/stats/UserPageStatsDetailsContent";
import {
  getCollectedStatsIdentityKey,
  getStatsPath,
} from "@/components/user/stats/userPageStats.helpers";
import type { UserPageStatsInitialData } from "@/components/user/stats/userPageStats.types";
import type { OwnerBalance, OwnerBalanceMemes } from "@/entities/IBalances";
import type { MemeSeason } from "@/entities/ISeason";
import type { ConsolidatedTDH, TDH } from "@/entities/ITDH";
import type { ApiCollectedStats } from "@/generated/models/ApiCollectedStats";
import type { ApiCollectedStatsSeason } from "@/generated/models/ApiCollectedStatsSeason";
import type { ApiIdentity } from "@/generated/models/ObjectSerializer";
import { formatNumberWithCommasOrDash } from "@/helpers/Helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { commonApiFetch } from "@/services/api/common-api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChartBarIcon } from "@heroicons/react/24/outline";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const isAbortError = (error: unknown): boolean =>
  error instanceof Error && error.name === "AbortError";
const STATS_QUERY_KEY = "user-page-collected-stats";
const DETAILS_OPEN_DURATION_MS = 350;
const DETAILS_OPEN_EASING = "cubic-bezier(0.04, 0.62, 0.23, 0.98)";

type CollectedHeaderMetric = {
  readonly id: string;
  readonly label: string;
  readonly val: string;
  readonly sub?: string;
};

type DisplaySeason = {
  readonly id: string;
  readonly label: string;
  readonly totalCards: number;
  readonly setsHeld: number;
  readonly nextSetCards: number;
  readonly totalCardsHeld: number;
  readonly isStarted: boolean;
  readonly isRestingComplete: boolean;
  readonly progressPct: number;
  readonly detailText: string | null;
};

const getSafeStatsPath = (
  profile: ApiIdentity,
  activeAddress: string | null
): string | null => {
  try {
    return getStatsPath(profile, activeAddress);
  } catch {
    return null;
  }
};

const getSafeCollectedStatsIdentityKey = (
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

  const numberMatch = trimmed.match(/^season\s+(\d+)$/i);
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
      return seasonNumber !== null && (season.total_cards_in_season ?? 0) > 0;
    })
    .map((season) => season.sets_held ?? 0);
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
  const totalCards = season.total_cards_in_season ?? 0;
  if (seasonNumber === null || totalCards <= 0) {
    return null;
  }

  const setsHeld = season.sets_held ?? 0;
  const nextSetCards = season.partial_set_unique_cards_held ?? 0;
  const totalCardsHeld = season.total_cards_held ?? 0;
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

function useCollectedStatsData({
  profile,
  activeAddress,
  initialStatsData,
  isDetailsOpen,
}: {
  readonly profile: ApiIdentity;
  readonly activeAddress: string | null;
  readonly initialStatsData: UserPageStatsInitialData;
  readonly isDetailsOpen: boolean;
}) {
  const statsPath = useMemo(
    () => getSafeStatsPath(profile, activeAddress),
    [activeAddress, profile]
  );
  const collectedStatsIdentityKey = useMemo(
    () => getSafeCollectedStatsIdentityKey(profile, activeAddress),
    [activeAddress, profile]
  );

  const isInitialAddress =
    activeAddress === initialStatsData.initialActiveAddress;

  const shouldFetchCollectedStats =
    collectedStatsIdentityKey !== null &&
    !(isInitialAddress && initialStatsData.initialCollectedStats !== undefined);

  const shouldFetchSeasons =
    isDetailsOpen && initialStatsData.initialSeasons.length === 0;
  const shouldFetchTdh =
    isDetailsOpen &&
    statsPath !== null &&
    !(isInitialAddress && initialStatsData.initialTdh !== undefined);
  const shouldFetchOwnerBalance =
    isDetailsOpen &&
    statsPath !== null &&
    !(isInitialAddress && initialStatsData.initialOwnerBalance !== undefined);
  const shouldFetchBalanceMemes =
    isDetailsOpen &&
    statsPath !== null &&
    !(isInitialAddress && initialStatsData.initialBalanceMemes.length > 0);

  const { data: fetchedCollectedStats } = useQuery<
    ApiCollectedStats | undefined
  >({
    queryKey: [STATS_QUERY_KEY, "collected-stats", collectedStatsIdentityKey],
    enabled: shouldFetchCollectedStats,
    retry: false,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      if (collectedStatsIdentityKey === null) {
        return undefined;
      }

      try {
        return await commonApiFetch<ApiCollectedStats>({
          endpoint: `collected-stats/${encodeURIComponent(
            collectedStatsIdentityKey
          )}`,
          signal,
        });
      } catch (error: unknown) {
        if (isAbortError(error)) {
          throw error;
        }
        return undefined;
      }
    },
  });

  const { data: fetchedSeasons } = useQuery<MemeSeason[]>({
    queryKey: [STATS_QUERY_KEY, "seasons"],
    enabled: shouldFetchSeasons,
    retry: false,
    queryFn: async ({ signal }) => {
      try {
        return await commonApiFetch<MemeSeason[]>({
          endpoint: "new_memes_seasons",
          signal,
        });
      } catch (error: unknown) {
        if (isAbortError(error)) {
          throw error;
        }
        return [];
      }
    },
  });

  const { data: fetchedTdh } = useQuery<ConsolidatedTDH | TDH | undefined>({
    queryKey: [STATS_QUERY_KEY, "tdh", statsPath],
    enabled: shouldFetchTdh,
    retry: false,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      if (statsPath === null) {
        return undefined;
      }

      try {
        return await commonApiFetch<ConsolidatedTDH | TDH>({
          endpoint: `tdh/${statsPath}`,
          signal,
        });
      } catch (error: unknown) {
        if (isAbortError(error)) {
          throw error;
        }
        return undefined;
      }
    },
  });

  const { data: fetchedOwnerBalance } = useQuery<OwnerBalance | undefined>({
    queryKey: [STATS_QUERY_KEY, "owner-balance", statsPath],
    enabled: shouldFetchOwnerBalance,
    retry: false,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      if (statsPath === null) {
        return undefined;
      }

      try {
        return await commonApiFetch<OwnerBalance>({
          endpoint: `owners-balances/${statsPath}`,
          signal,
        });
      } catch (error: unknown) {
        if (isAbortError(error)) {
          throw error;
        }
        return undefined;
      }
    },
  });

  const { data: fetchedBalanceMemes } = useQuery<OwnerBalanceMemes[]>({
    queryKey: [STATS_QUERY_KEY, "balance-memes", statsPath],
    enabled: shouldFetchBalanceMemes,
    retry: false,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      if (statsPath === null) {
        return [];
      }

      try {
        return await commonApiFetch<OwnerBalanceMemes[]>({
          endpoint: `owners-balances/${statsPath}/memes`,
          signal,
        });
      } catch (error: unknown) {
        if (isAbortError(error)) {
          throw error;
        }
        return [];
      }
    },
  });

  return {
    statsPath,
    collectedStats: shouldFetchCollectedStats
      ? fetchedCollectedStats
      : initialStatsData.initialCollectedStats,
    seasons: shouldFetchSeasons
      ? (fetchedSeasons ?? [])
      : initialStatsData.initialSeasons,
    tdh: shouldFetchTdh ? fetchedTdh : initialStatsData.initialTdh,
    ownerBalance: shouldFetchOwnerBalance
      ? fetchedOwnerBalance
      : initialStatsData.initialOwnerBalance,
    balanceMemes: shouldFetchBalanceMemes
      ? (fetchedBalanceMemes ?? [])
      : initialStatsData.initialBalanceMemes,
  };
}

function SeasonSetTile({
  season,
  isActive,
  showDetailText,
  hasTouchScreen,
  onActivate,
}: {
  readonly season: DisplaySeason;
  readonly isActive: boolean;
  readonly showDetailText: boolean;
  readonly hasTouchScreen: boolean;
  readonly onActivate: () => void;
}) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - season.progressPct * circumference;
  const progressVisible = season.progressPct > 0;
  const baseTrackClass = season.isStarted
    ? isActive
      ? "tw-text-white/[0.12]"
      : "tw-text-white/[0.06]"
    : "tw-text-white/[0.04]";
  const progressStrokeClass =
    season.progressPct >= 1
      ? "tw-text-white"
      : isActive
        ? "tw-text-white/60"
        : "tw-text-white/40";

  return (
    <button
      type="button"
      aria-pressed={isActive}
      onMouseEnter={hasTouchScreen ? undefined : onActivate}
      onFocus={onActivate}
      onClick={onActivate}
      className={[
        "tw-flex tw-w-[72px] tw-flex-none tw-cursor-pointer tw-flex-col tw-items-center tw-gap-1 tw-rounded-lg tw-border-none tw-bg-transparent tw-p-0 tw-text-center tw-transition-transform tw-duration-200",
        isActive
          ? "tw-scale-[1.03]"
          : "hover:tw-scale-[1.01] focus-visible:tw-scale-[1.01]",
        "focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/20",
      ].join(" ")}
    >
      <div className="tw-relative tw-flex tw-h-[56px] tw-w-[56px] tw-items-center tw-justify-center">
        <svg
          className="tw-h-full tw-w-full tw--rotate-90"
          viewBox="0 0 56 56"
          aria-hidden="true"
        >
          <circle
            cx="28"
            cy="28"
            r={radius}
            stroke="currentColor"
            strokeWidth="2"
            fill="transparent"
            className={baseTrackClass}
          />
          {progressVisible && (
            <circle
              cx="28"
              cy="28"
              r={radius}
              stroke="currentColor"
              strokeWidth="2.5"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                transition: "stroke-dashoffset 300ms ease, color 300ms ease",
              }}
              className={progressStrokeClass}
            />
          )}
        </svg>

        <span
          className={[
            "tw-absolute tw-text-[10px] tw-font-semibold tw-tracking-tight",
            season.isStarted
              ? isActive
                ? "tw-text-white"
                : "tw-text-white/80"
              : "tw-text-white/25",
          ].join(" ")}
        >
          {season.label}
        </span>
      </div>

      <span
        className={[
          "tw-text-[9px] tw-font-semibold tw-tracking-tight",
          season.setsHeld >= 2
            ? "tw-text-white/90"
            : season.setsHeld === 1
              ? "tw-text-white/70"
              : season.isStarted
                ? "tw-text-white/25"
                : "tw-text-white/[0.15]",
        ].join(" ")}
      >
        {season.setsHeld > 0
          ? `${season.setsHeld} set${season.setsHeld > 1 ? "s" : ""}`
          : "0 sets"}
      </span>

      <span className="tw-flex tw-h-[14px] tw-items-center tw-justify-center tw-text-[8px] tw-font-medium tw-text-white/50">
        {showDetailText ? season.detailText : null}
      </span>
    </button>
  );
}

function UserPageCollectedStatsDetailsPanel({
  isOpen,
  detailsId,
  statsPath,
  profile,
  activeAddress,
  seasons,
  tdh,
  ownerBalance,
  balanceMemes,
}: {
  readonly isOpen: boolean;
  readonly detailsId: string;
  readonly statsPath: string | null;
  readonly profile: ApiIdentity;
  readonly activeAddress: string | null;
  readonly seasons: MemeSeason[];
  readonly tdh: ConsolidatedTDH | TDH | undefined;
  readonly ownerBalance: OwnerBalance | undefined;
  readonly balanceMemes: OwnerBalanceMemes[];
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      return;
    }

    setShouldRender(false);
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen || !shouldRender) {
      return;
    }

    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    panel.style.transition = "none";
    panel.style.height = "0px";
    panel.style.opacity = "0";

    const frameId = requestAnimationFrame(() => {
      const targetHeight = panel.scrollHeight;
      panel.style.transition = [
        `height ${DETAILS_OPEN_DURATION_MS}ms ${DETAILS_OPEN_EASING}`,
        `opacity 220ms ease-out`,
      ].join(", ");
      panel.style.height = `${targetHeight}px`;
      panel.style.opacity = "1";
    });

    return () => cancelAnimationFrame(frameId);
  }, [isOpen, shouldRender]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      id={detailsId}
      ref={panelRef}
      onTransitionEnd={(event) => {
        if (
          event.target === event.currentTarget &&
          event.propertyName === "height" &&
          isOpen
        ) {
          event.currentTarget.style.height = "auto";
        }
      }}
      className="tw-overflow-hidden"
    >
      <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800/90 tw-bg-gradient-to-b tw-from-iron-900/30 tw-to-transparent tw-px-4 tw-pb-5 sm:tw-px-6 sm:tw-pb-6">
        {statsPath === null ? (
          <div className="tw-py-2 tw-text-sm tw-text-iron-400">
            Stats are unavailable for this profile.
          </div>
        ) : (
          <UserPageStatsDetailsContent
            profile={profile}
            activeAddress={activeAddress}
            seasons={seasons}
            tdh={tdh}
            ownerBalance={ownerBalance}
            balanceMemes={balanceMemes}
          />
        )}
      </div>
    </div>
  );
}

export default function UserPageCollectedStats({
  profile,
  activeAddress,
  initialStatsData,
}: {
  readonly profile: ApiIdentity;
  readonly activeAddress: string | null;
  readonly initialStatsData: UserPageStatsInitialData;
}) {
  const { hasTouchScreen } = useDeviceInfo();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [activeSeasonId, setActiveSeasonId] = useState<string | null>(null);
  const detailsId = useId();
  const {
    statsPath,
    collectedStats,
    seasons,
    tdh,
    ownerBalance,
    balanceMemes,
  } = useCollectedStatsData({
    profile,
    activeAddress,
    initialStatsData,
    isDetailsOpen,
  });

  const mainMetrics = useMemo(
    () => buildMainMetrics(collectedStats),
    [collectedStats]
  );
  const allSeasons = useMemo(
    () =>
      (collectedStats?.seasons ?? []).flatMap((season) => {
        const displaySeason = buildDisplaySeason(season);
        return displaySeason ? [displaySeason] : [];
      }),
    [collectedStats]
  );
  const startedSeasons = useMemo(
    () => allSeasons.filter((season) => season.isStarted),
    [allSeasons]
  );
  const notStartedSeasons = useMemo(
    () => allSeasons.filter((season) => !season.isStarted),
    [allSeasons]
  );

  useEffect(() => {
    if (startedSeasons.length === 0) {
      setActiveSeasonId(null);
      return;
    }

    if (
      !activeSeasonId ||
      !startedSeasons.some((s) => s.id === activeSeasonId)
    ) {
      setActiveSeasonId(startedSeasons[0]!.id);
    }
  }, [activeSeasonId, startedSeasons]);

  return (
    <section className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-black">
      <div className="tw-p-4 sm:tw-p-5">
        <div className="tw-space-y-4">
          <div className="tw-flex tw-flex-col tw-gap-4 lg:tw-flex-row lg:tw-items-start lg:tw-justify-between">
            <div className="tw-min-w-0 tw-flex-1">
              {mainMetrics.length > 0 && (
                <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4 md:tw-gap-6">
                  {mainMetrics.map((metric, index) => (
                    <div
                      key={metric.id}
                      className="tw-flex tw-items-center tw-gap-4 md:tw-gap-6"
                    >
                      <div className="tw-flex tw-flex-col">
                        <span className="tw-mb-0.5 tw-text-[10px] tw-font-bold tw-uppercase tw-tracking-wider tw-text-white/30">
                          {metric.label}
                        </span>
                        <div className="tw-flex tw-items-baseline tw-gap-1.5">
                          <span className="tw-text-[15px] tw-font-semibold tw-text-white/90">
                            {metric.val}
                          </span>
                          {metric.sub && (
                            <span className="tw-text-[10px] tw-font-medium tw-text-white/30">
                              {metric.sub}
                            </span>
                          )}
                        </div>
                      </div>
                      {index < mainMetrics.length - 1 && (
                        <div className="tw-hidden tw-h-6 tw-w-px tw-bg-white/10 sm:tw-block" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              aria-expanded={isDetailsOpen}
              aria-controls={detailsId}
              onClick={() => setIsDetailsOpen((current) => !current)}
              className={[
                "tw-group tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-transition-all tw-duration-300 tw-ease-out focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-white/30",
                isDetailsOpen
                  ? "tw-border-white tw-bg-white tw-text-black"
                  : "tw-border-white/10 tw-bg-white/5 tw-text-white hover:tw-border-white/20 hover:tw-bg-white/10",
              ].join(" ")}
            >
              <span className="-tw-ml-1 tw-inline-flex tw-h-3.5 tw-w-3.5 tw-flex-shrink-0">
                <ChartBarIcon className="tw-h-full tw-w-full" />
              </span>
              <span>{isDetailsOpen ? "Hide Details" : "Details"}</span>
            </button>
          </div>

          {startedSeasons.length > 0 && (
            <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-4">
              <div className="tw-flex tw-items-baseline tw-gap-2 tw-px-1">
                <span className="tw-text-[11px] tw-font-semibold tw-tracking-tight tw-text-white/50">
                  Seasons
                </span>
                <span className="tw-ml-auto tw-text-[9px] tw-font-medium tw-text-white/[0.35]">
                  {startedSeasons.length}/{allSeasons.length} started
                </span>
              </div>

              <div className="tw-overflow-x-auto tw-overflow-y-hidden tw-pb-2 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300 md:tw-overflow-visible md:tw-pb-0">
                <div className="tw-flex tw-w-max tw-flex-nowrap tw-items-start tw-gap-x-3 tw-gap-y-0 tw-pt-3 md:tw-w-full md:tw-flex-wrap md:tw-gap-y-3 md:tw-pb-1">
                  {startedSeasons.map((season) => (
                    <SeasonSetTile
                      key={season.id}
                      season={season}
                      isActive={season.id === activeSeasonId}
                      showDetailText={
                        hasTouchScreen || season.id === activeSeasonId
                      }
                      hasTouchScreen={hasTouchScreen}
                      onActivate={() => setActiveSeasonId(season.id)}
                    />
                  ))}
                </div>
              </div>

              {notStartedSeasons.length > 0 && (
                <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-1.5 tw-px-1 tw-pt-2">
                  <span className="tw-mr-0.5 tw-text-[8px] tw-font-medium tw-text-white/25">
                    Unseized
                  </span>
                  {notStartedSeasons.map((season) => (
                    <span
                      key={season.id}
                      className="tw-rounded tw-border tw-border-solid tw-border-white/[0.12] tw-px-1.5 tw-py-0.5 tw-text-[8px] tw-font-medium tw-text-white/[0.35]"
                    >
                      {season.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <UserPageCollectedStatsDetailsPanel
        isOpen={isDetailsOpen}
        detailsId={detailsId}
        statsPath={statsPath}
        profile={profile}
        activeAddress={activeAddress}
        seasons={seasons}
        tdh={tdh}
        ownerBalance={ownerBalance}
        balanceMemes={balanceMemes}
      />
    </section>
  );
}
