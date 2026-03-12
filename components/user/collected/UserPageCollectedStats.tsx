"use client";

import type { UserPageStatsInitialData } from "@/components/user/stats/userPageStats.types";
import { SEARCH_PARAM_ACTIVITY } from "@/components/user/stats/activity/activity.helpers";
import type { CollectedCollectionType } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ObjectSerializer";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { buildCollectedStatsViewModel } from "./stats/helpers";
import { CollectedStatsDetailsPanel } from "./stats/subcomponents/CollectedStatsDetailsPanel";
import { CollectedStatsHeader } from "./stats/subcomponents/CollectedStatsHeader";
import { CollectedStatsSeasons } from "./stats/subcomponents/CollectedStatsSeasons";
import type { DisplaySeason } from "./stats/types";
import { useCollectedStatsData } from "./stats/useCollectedStatsData";
import { useDesktopSeasonRowCapacity } from "./stats/useDesktopSeasonRowCapacity";

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
  readonly activeCollection?: CollectedCollectionType | null | undefined;
  readonly activeSeasonNumber?: number | null | undefined;
  readonly onCollectionShortcut?:
    | ((collection: CollectedCollectionType) => void)
    | undefined;
  readonly onSeasonShortcut?: ((seasonNumber: number) => void) | undefined;
}

interface PreferredSeasonPreview {
  readonly seasonId: string;
  readonly activeSeasonFilterId: string | null;
}

export default function UserPageCollectedStats({
  profile,
  activeAddress,
  initialStatsData,
  activeCollection = null,
  activeSeasonNumber = null,
  onCollectionShortcut,
  onSeasonShortcut,
}: Readonly<UserPageCollectedStatsProps>) {
  const { hasTouchScreen } = useDeviceInfo();
  const searchParams = useSearchParams();
  const shouldAutoOpenDetails = Boolean(
    searchParams.get(SEARCH_PARAM_ACTIVITY)
  );
  const hasAutoOpenedDetailsRef = useRef(shouldAutoOpenDetails);
  const [isDetailsOpen, setIsDetailsOpen] = useState(shouldAutoOpenDetails);
  const [preferredSeasonPreview, setPreferredSeasonPreview] =
    useState<PreferredSeasonPreview | null>(null);
  const [isDesktopSeasonListExpanded, setIsDesktopSeasonListExpanded] =
    useState(false);
  const detailsId = useId();

  useEffect(() => {
    if (!shouldAutoOpenDetails || hasAutoOpenedDetailsRef.current) {
      return;
    }

    setIsDetailsOpen(true);
    hasAutoOpenedDetailsRef.current = true;
  }, [shouldAutoOpenDetails]);

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
      () => buildCollectedStatsViewModel(collectedStats),
      [collectedStats]
    );
  const {
    containerRef: desktopSeasonsRef,
    visibleSeasonCount: desktopVisibleSeasonCount,
    isDesktopLayout: isDesktopSeasonsLayout,
  } = useDesktopSeasonRowCapacity(startedSeasons.length);

  const hiddenStartedSeasonCount = Math.max(
    startedSeasons.length -
      (desktopVisibleSeasonCount ?? startedSeasons.length),
    0
  );
  const activeSeasonFilterId =
    startedSeasons.find((season) => season.seasonNumber === activeSeasonNumber)
      ?.id ?? null;
  const shouldShowAllStartedSeasons =
    !isDesktopSeasonsLayout ||
    isDesktopSeasonListExpanded ||
    hiddenStartedSeasonCount === 0;
  const visibleStartedSeasons = shouldShowAllStartedSeasons
    ? startedSeasons
    : getCollapsedStartedSeasons({
        startedSeasons,
        visibleSeasonCount: desktopVisibleSeasonCount,
        activeSeasonFilterId,
      });
  const defaultActiveSeasonId =
    activeSeasonFilterId ?? startedSeasons[0]?.id ?? null;
  const selectedActiveSeasonId =
    preferredSeasonPreview !== null &&
    preferredSeasonPreview.activeSeasonFilterId === activeSeasonFilterId &&
    startedSeasons.some(
      (season) => season.id === preferredSeasonPreview.seasonId
    )
      ? preferredSeasonPreview.seasonId
      : defaultActiveSeasonId;
  const fallbackVisibleActiveSeasonId =
    visibleStartedSeasons.find((season) => season.id === activeSeasonFilterId)
      ?.id ??
    visibleStartedSeasons[0]?.id ??
    selectedActiveSeasonId;
  const activeSeasonId =
    shouldShowAllStartedSeasons ||
    visibleStartedSeasons.some((season) => season.id === selectedActiveSeasonId)
      ? selectedActiveSeasonId
      : fallbackVisibleActiveSeasonId;

  return (
    <section className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-black">
      <div className="tw-p-4 sm:tw-p-5">
        <div className="tw-space-y-4">
          <CollectedStatsHeader
            metrics={mainMetrics}
            activeCollection={activeCollection}
            isDetailsOpen={isDetailsOpen}
            detailsId={detailsId}
            onToggleDetails={() => setIsDetailsOpen((current) => !current)}
            onCollectionShortcut={onCollectionShortcut}
          />

          <CollectedStatsSeasons
            allSeasonCount={allSeasons.length}
            startedSeasons={startedSeasons}
            visibleStartedSeasons={visibleStartedSeasons}
            hiddenStartedSeasonCount={hiddenStartedSeasonCount}
            notStartedSeasons={notStartedSeasons}
            activeSeasonId={activeSeasonId}
            activeSeasonNumber={activeSeasonNumber}
            hasTouchScreen={hasTouchScreen}
            isDesktopLayout={isDesktopSeasonsLayout}
            isDesktopSeasonListExpanded={isDesktopSeasonListExpanded}
            desktopSeasonsRef={desktopSeasonsRef}
            onActivateSeason={(seasonId) =>
              setPreferredSeasonPreview({
                seasonId,
                activeSeasonFilterId,
              })
            }
            onSeasonShortcut={onSeasonShortcut}
            onToggleExpanded={() =>
              setIsDesktopSeasonListExpanded((current) => !current)
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
      />
    </section>
  );
}
