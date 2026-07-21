"use client";

import type { UserPageStatsInitialData } from "@/components/user/stats/userPageStats.types";
import { SEARCH_PARAM_ACTIVITY } from "@/components/user/stats/activity/activity.helpers";
import type { CollectedCollectionType } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { useSearchParams } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { COLLAPSED_SEASON_COUNT } from "./stats/constants";
import { buildCollectedStatsViewModel } from "./stats/helpers";
import { CollectedStatsDetailsPanel } from "./stats/subcomponents/CollectedStatsDetailsPanel";
import { CollectedStatsHeader } from "./stats/subcomponents/CollectedStatsHeader";
import { CollectedStatsSeasons } from "./stats/subcomponents/CollectedStatsSeasons";
import type { DisplaySeason } from "./stats/types";
import { useCollectedStatsData } from "./stats/useCollectedStatsData";

const getCollapsedStartedSeasons = ({
  startedSeasons,
  visibleSeasonCount,
  activeSeasonFilterId,
}: {
  readonly startedSeasons: readonly DisplaySeason[];
  readonly visibleSeasonCount: number | null;
  readonly activeSeasonFilterId: string | null;
}): DisplaySeason[] => {
  if (visibleSeasonCount === null) {
    return [...startedSeasons];
  }

  const collapsedStartedSeasons = startedSeasons.slice(0, visibleSeasonCount);
  if (
    activeSeasonFilterId === null ||
    collapsedStartedSeasons.some((season) => season.id === activeSeasonFilterId)
  ) {
    return collapsedStartedSeasons;
  }

  const activeSeason = startedSeasons.find(
    (season) => season.id === activeSeasonFilterId
  );
  if (activeSeason === undefined || visibleSeasonCount <= 0) {
    return collapsedStartedSeasons;
  }

  return [
    ...collapsedStartedSeasons.slice(0, visibleSeasonCount - 1),
    activeSeason,
  ];
};

interface UserPageCollectedStatsProps {
  readonly profile: ApiIdentity;
  readonly activeAddress: string | null;
  readonly initialStatsData: UserPageStatsInitialData;
  readonly locale?: SupportedLocale | undefined;
  readonly activeCollection?: CollectedCollectionType | null | undefined;
  readonly activeSeasonNumber?: number | null | undefined;
  readonly onCollectionShortcut?:
    | ((collection: CollectedCollectionType) => void)
    | undefined;
  readonly onSeasonShortcut?: ((seasonNumber: number) => void) | undefined;
}

export default function UserPageCollectedStats({
  profile,
  activeAddress,
  initialStatsData,
  locale = DEFAULT_LOCALE,
  activeCollection = null,
  activeSeasonNumber = null,
  onCollectionShortcut,
  onSeasonShortcut,
}: Readonly<UserPageCollectedStatsProps>) {
  const searchParams = useSearchParams();
  const shouldAutoOpenDetails = Boolean(
    searchParams.get(SEARCH_PARAM_ACTIVITY)
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(shouldAutoOpenDetails);
  const [isSeasonListExpanded, setIsSeasonListExpanded] = useState(false);
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

  const { mainMetrics, allSeasons, startedSeasons, notStartedSeasons } =
    useMemo(
      () => buildCollectedStatsViewModel(collectedStats, locale),
      [collectedStats, locale]
    );
  const hiddenStartedSeasonCount = Math.max(
    startedSeasons.length - COLLAPSED_SEASON_COUNT,
    0
  );
  const activeSeasonFilterId =
    startedSeasons.find((season) => season.seasonNumber === activeSeasonNumber)
      ?.id ?? null;
  const visibleStartedSeasons = isSeasonListExpanded
    ? startedSeasons
    : getCollapsedStartedSeasons({
        startedSeasons,
        visibleSeasonCount: COLLAPSED_SEASON_COUNT,
        activeSeasonFilterId,
      });

  return (
    <section className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-black">
      <div className="tw-p-4 sm:tw-p-5">
        <div className="tw-space-y-4">
          <CollectedStatsHeader
            metrics={mainMetrics}
            activeCollection={activeCollection}
            isDetailsOpen={isDetailsOpen}
            detailsId={detailsId}
            locale={locale}
            onToggleDetails={() => setIsDetailsOpen((current) => !current)}
            onCollectionShortcut={onCollectionShortcut}
          />

          <CollectedStatsSeasons
            allSeasonCount={allSeasons.length}
            startedSeasons={startedSeasons}
            visibleStartedSeasons={visibleStartedSeasons}
            hiddenStartedSeasonCount={hiddenStartedSeasonCount}
            notStartedSeasons={notStartedSeasons}
            activeSeasonNumber={activeSeasonNumber}
            locale={locale}
            isSeasonListExpanded={isSeasonListExpanded}
            onSeasonShortcut={onSeasonShortcut}
            onToggleExpanded={() =>
              setIsSeasonListExpanded((current) => !current)
            }
          />
        </div>
      </div>

      <CollectedStatsDetailsPanel
        isOpen={isDetailsOpen}
        detailsId={detailsId}
        statsPath={statsPath}
        profile={profile}
        activeAddress={activeAddress}
        seasons={seasons}
        tdh={tdh}
        ownerBalance={ownerBalance}
        balanceMemes={balanceMemes}
        locale={locale}
      />
    </section>
  );
}
