"use client";

import UserPageStatsDetailsContent from "@/components/user/stats/UserPageStatsDetailsContent";
import UserPageStatsTags from "@/components/user/stats/tags/UserPageStatsTags";
import { getStatsPath } from "@/components/user/stats/userPageStats.helpers";
import type { UserPageStatsInitialData } from "@/components/user/stats/userPageStats.types";
import { commonApiFetch } from "@/services/api/common-api";
import type { OwnerBalance, OwnerBalanceMemes } from "@/entities/IBalances";
import type { MemeSeason } from "@/entities/ISeason";
import type { ConsolidatedTDH, TDH } from "@/entities/ITDH";
import type { ApiIdentity } from "@/generated/models/ObjectSerializer";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useId, useMemo, useState } from "react";

const isAbortError = (error: unknown): boolean =>
  error instanceof Error && error.name === "AbortError";
const STATS_QUERY_KEY = "user-page-collected-stats";
const DETAILS_TRANSITION = {
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1],
} as const;
const NO_MOTION_TRANSITION = { duration: 0 } as const;

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

function useCollectedStatsData({
  profile,
  activeAddress,
  initialStatsData,
}: {
  readonly profile: ApiIdentity;
  readonly activeAddress: string | null;
  readonly initialStatsData: UserPageStatsInitialData;
}) {
  const statsPath = useMemo(
    () => getSafeStatsPath(profile, activeAddress),
    [activeAddress, profile]
  );

  const isInitialAddress =
    activeAddress === initialStatsData.initialActiveAddress;
  const shouldFetchSeasons = initialStatsData.initialSeasons.length === 0;
  const shouldFetchTdh =
    statsPath !== null &&
    !(isInitialAddress && initialStatsData.initialTdh !== undefined);
  const shouldFetchOwnerBalance =
    statsPath !== null &&
    !(isInitialAddress && initialStatsData.initialOwnerBalance !== undefined);
  const shouldFetchBalanceMemes = statsPath !== null && !isInitialAddress;

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

function UserPageCollectedStatsDetailsPanel({
  isOpen,
  detailsId,
  shouldReduceMotion,
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
  readonly shouldReduceMotion: boolean;
  readonly statsPath: string | null;
  readonly profile: ApiIdentity;
  readonly activeAddress: string | null;
  readonly seasons: MemeSeason[];
  readonly tdh: ConsolidatedTDH | TDH | undefined;
  readonly ownerBalance: OwnerBalance | undefined;
  readonly balanceMemes: OwnerBalanceMemes[];
}) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          id={detailsId}
          key="stats-details"
          initial={
            shouldReduceMotion
              ? { opacity: 1 }
              : { opacity: 0, y: -10, scaleY: 0.985 }
          }
          animate={
            shouldReduceMotion
              ? { opacity: 1 }
              : { opacity: 1, y: 0, scaleY: 1 }
          }
          exit={
            shouldReduceMotion
              ? { opacity: 0 }
              : { opacity: 0, y: -8, scaleY: 0.99 }
          }
          transition={
            shouldReduceMotion ? NO_MOTION_TRANSITION : DETAILS_TRANSITION
          }
          className="tw-origin-top tw-transform-gpu tw-will-change-transform"
        >
          <div className="tw-border-t tw-border-solid tw-border-iron-800/90 tw-bg-gradient-to-b tw-from-iron-900/30 tw-to-transparent tw-px-4 tw-pb-5 tw-pt-4 sm:tw-px-6 sm:tw-pb-6 sm:tw-pt-5">
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
        </motion.div>
      )}
    </AnimatePresence>
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
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion() ?? false;
  const detailsId = useId();
  const expandedChevronRotate = isDetailsOpen ? 180 : 0;
  const detailsChevronRotate = shouldReduceMotion ? 0 : expandedChevronRotate;
  const { statsPath, seasons, tdh, ownerBalance, balanceMemes } =
    useCollectedStatsData({
      profile,
      activeAddress,
      initialStatsData,
    });

  return (
    <motion.section
      layout
      transition={shouldReduceMotion ? { duration: 0 } : DETAILS_TRANSITION}
      className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950/80"
    >
      <div className="tw-p-4 sm:tw-p-5">
        <div className="tw-flex tw-items-start tw-justify-between tw-gap-4">
          <div className="tw-min-w-0 tw-flex-1">
            <UserPageStatsTags
              ownerBalance={ownerBalance}
              balanceMemes={balanceMemes}
            />
          </div>
          <button
            type="button"
            aria-expanded={isDetailsOpen}
            aria-controls={detailsId}
            onClick={() => setIsDetailsOpen((current) => !current)}
            className="tw-inline-flex tw-shrink-0 tw-items-center tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-text-iron-100 tw-transition tw-duration-300 tw-ease-out hover:tw-border-iron-500 hover:tw-text-white"
          >
            Details
            <motion.span
              animate={{ rotate: detailsChevronRotate }}
              transition={
                shouldReduceMotion ? { duration: 0 } : DETAILS_TRANSITION
              }
              className="tw-ml-1.5 tw-inline-flex tw-transform-gpu"
            >
              <ChevronDownIcon className="tw-h-4 tw-w-4" />
            </motion.span>
          </button>
        </div>
      </div>

      <UserPageCollectedStatsDetailsPanel
        isOpen={isDetailsOpen}
        detailsId={detailsId}
        shouldReduceMotion={shouldReduceMotion}
        statsPath={statsPath}
        profile={profile}
        activeAddress={activeAddress}
        seasons={seasons}
        tdh={tdh}
        ownerBalance={ownerBalance}
        balanceMemes={balanceMemes}
      />
    </motion.section>
  );
}
