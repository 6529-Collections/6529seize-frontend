"use client";

import type { UserPageStatsInitialData } from "@/components/user/stats/userPageStats.types";
import type { ApiIdentity } from "@/generated/models/ObjectSerializer";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useId, useMemo, useState } from "react";
import { buildCollectedStatsViewModel } from "./stats/helpers";
import { CollectedStatsDetailsPanel } from "./stats/subcomponents/CollectedStatsDetailsPanel";
import { CollectedStatsHeader } from "./stats/subcomponents/CollectedStatsHeader";
import { CollectedStatsSeasons } from "./stats/subcomponents/CollectedStatsSeasons";
import { useCollectedStatsData } from "./stats/useCollectedStatsData";
import { useDesktopSeasonRowCapacity } from "./stats/useDesktopSeasonRowCapacity";

interface UserPageCollectedStatsProps {
  readonly profile: ApiIdentity;
  readonly activeAddress: string | null;
  readonly initialStatsData: UserPageStatsInitialData;
}

export default function UserPageCollectedStats({
  profile,
  activeAddress,
  initialStatsData,
}: Readonly<UserPageCollectedStatsProps>) {
  const { hasTouchScreen } = useDeviceInfo();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [preferredActiveSeasonId, setPreferredActiveSeasonId] = useState<
    string | null
  >(null);
  const [isDesktopSeasonListExpanded, setIsDesktopSeasonListExpanded] =
    useState(false);
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
  const shouldShowAllStartedSeasons =
    !isDesktopSeasonsLayout ||
    isDesktopSeasonListExpanded ||
    hiddenStartedSeasonCount === 0;
  const visibleStartedSeasons = shouldShowAllStartedSeasons
    ? startedSeasons
    : startedSeasons.slice(0, desktopVisibleSeasonCount ?? 0);

  const defaultActiveSeasonId = startedSeasons[0]?.id ?? null;
  const selectedActiveSeasonId = startedSeasons.some(
    (season) => season.id === preferredActiveSeasonId
  )
    ? preferredActiveSeasonId
    : defaultActiveSeasonId;
  const activeSeasonId =
    shouldShowAllStartedSeasons ||
    visibleStartedSeasons.some((season) => season.id === selectedActiveSeasonId)
      ? selectedActiveSeasonId
      : (visibleStartedSeasons[0]?.id ?? selectedActiveSeasonId);

  return (
    <section className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-black">
      <div className="tw-p-4 sm:tw-p-5">
        <div className="tw-space-y-4">
          <CollectedStatsHeader
            metrics={mainMetrics}
            isDetailsOpen={isDetailsOpen}
            detailsId={detailsId}
            onToggleDetails={() => setIsDetailsOpen((current) => !current)}
          />

          <CollectedStatsSeasons
            allSeasonCount={allSeasons.length}
            startedSeasons={startedSeasons}
            visibleStartedSeasons={visibleStartedSeasons}
            hiddenStartedSeasonCount={hiddenStartedSeasonCount}
            notStartedSeasons={notStartedSeasons}
            activeSeasonId={activeSeasonId}
            hasTouchScreen={hasTouchScreen}
            isDesktopLayout={isDesktopSeasonsLayout}
            isDesktopSeasonListExpanded={isDesktopSeasonListExpanded}
            desktopSeasonsRef={desktopSeasonsRef}
            onActivateSeason={setPreferredActiveSeasonId}
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
