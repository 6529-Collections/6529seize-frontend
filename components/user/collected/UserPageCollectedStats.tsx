"use client";

import type { UserPageStatsInitialData } from "@/components/user/stats/userPageStats.types";
import { SEARCH_PARAM_ACTIVITY } from "@/components/user/stats/activity/activity.helpers";
import type { CollectedCollectionType } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { buildCollectedStatsViewModel } from "./stats/helpers";
import { CollectedStatsDetailsPanel } from "./stats/subcomponents/CollectedStatsDetailsPanel";
import { CollectedStatsHeader } from "./stats/subcomponents/CollectedStatsHeader";
import { CollectedStatsSeasons } from "./stats/subcomponents/CollectedStatsSeasons";
import type { DisplaySeason } from "./stats/types";
import { useCollectedStatsData } from "./stats/useCollectedStatsData";
import { useDesktopSeasonRowCapacity } from "./stats/useDesktopSeasonRowCapacity";
import CollectEntryLink from "@/components/collect/CollectEntryLink";
import ButtonLink from "@/components/utils/button/ButtonLink";
import ProfileCollectedActivityLink from "./ProfileCollectedActivityLink";
import { getButtonClasses } from "@/components/utils/button/buttonStyles";
import { t } from "@/i18n/messages";

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
  readonly autoScrollDetailsOnOpen?: boolean | undefined;
  readonly locale?: SupportedLocale | undefined;
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
  autoScrollDetailsOnOpen = false,
  locale = DEFAULT_LOCALE,
  activeCollection = null,
  activeSeasonNumber = null,
  onCollectionShortcut,
  onSeasonShortcut,
}: Readonly<UserPageCollectedStatsProps>) {
  const { hasTouchScreen, isApp } = useDeviceInfo();
  const searchParams = useSearchParams();
  const details = searchParams.get("details");
  const isDetailsOpen =
    details === "open" ||
    (details !== "closed" && Boolean(searchParams.get(SEARCH_PARAM_ACTIVITY)));
  const [preferredSeasonPreview, setPreferredSeasonPreview] =
    useState<PreferredSeasonPreview | null>(null);
  const [isDesktopSeasonListExpanded, setIsDesktopSeasonListExpanded] =
    useState(false);
  const detailsId = useId();
  const detailsScrollTargetRef = useRef<HTMLDivElement>(null);
  const scrollOnOpenRef = useRef(false);

  const handleToggleDetails = () => {
    // Read the live URL so rapid clicks cannot toggle a stale render's value.
    const url = new URL(globalThis.location.href);
    const liveDetails = url.searchParams.get("details");
    const wasOpen =
      liveDetails === "open" ||
      (liveDetails !== "closed" &&
        Boolean(url.searchParams.get(SEARCH_PARAM_ACTIVITY)));
    url.searchParams.set("details", wasOpen ? "closed" : "open");
    scrollOnOpenRef.current = !wasOpen && autoScrollDetailsOnOpen;
    // Next preserves its internal history state and synchronizes useSearchParams.
    globalThis.history.replaceState(null, "", url);
  };

  useEffect(() => {
    if (!isDetailsOpen || !scrollOnOpenRef.current) return;
    scrollOnOpenRef.current = false;
    const prefersReducedMotion =
      typeof globalThis.matchMedia === "function" &&
      globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;
    detailsScrollTargetRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [isDetailsOpen]);

  const {
    statsPath,
    collectedStats,
    seasons,
    tdh,
    ownerBalance,
    balanceMemes,
    isDetailsLoading,
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
    <section
      data-profile-section="Collection summary"
      className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-black"
    >
      <div
        data-profile-section-anchor={
          mainMetrics.length > 0 ? "Collection summary" : undefined
        }
        className="tw-px-3 tw-py-2 md:tw-p-5"
      >
        <CollectedStatsHeader
          metrics={mainMetrics}
          activeCollection={activeCollection}
          isDetailsOpen={isDetailsOpen}
          detailsId={detailsId}
          locale={locale}
          onToggleDetails={handleToggleDetails}
          onCollectionShortcut={onCollectionShortcut}
        />
      </div>

      <CollectedStatsSeasons
        allSeasonCount={allSeasons.length}
        startedSeasons={startedSeasons}
        visibleStartedSeasons={visibleStartedSeasons}
        hiddenStartedSeasonCount={hiddenStartedSeasonCount}
        notStartedSeasons={notStartedSeasons}
        activeSeasonId={activeSeasonId}
        activeSeasonNumber={activeSeasonNumber}
        locale={locale}
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

      <div ref={detailsScrollTargetRef} className="tw-scroll-mt-24">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2 tw-px-3 tw-py-2 md:tw-px-5 md:tw-py-4">
          <span data-profile-action="Complete my set" className="tw-contents">
            <CollectEntryLink
              collection="memes"
              intent={activeSeasonNumber === null ? "full_set" : "season"}
              definitionId={
                activeSeasonNumber === null
                  ? undefined
                  : String(activeSeasonNumber)
              }
              locale={locale}
              complete
              profileActivityKey={isApp ? "complete-set" : undefined}
            />
          </span>
          {isApp ? (
            <ProfileCollectedActivityLink
              data-profile-action="Manage orders"
              href="/collect/orders"
              activityKey="manage-orders"
              className={getButtonClasses({
                variant: "tertiary",
                size: "sm",
                className: "tw-no-underline hover:tw-no-underline",
              })}
            >
              {t(locale, "collect.entry.manage")}
            </ProfileCollectedActivityLink>
          ) : (
            <ButtonLink
              data-profile-action="Manage orders"
              href="/collect/orders"
              variant="tertiary"
              size="sm"
            >
              {t(locale, "collect.entry.manage")}
            </ButtonLink>
          )}
        </div>
        <CollectedStatsDetailsPanel
          isOpen={isDetailsOpen}
          isLoading={isDetailsLoading}
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
      </div>
    </section>
  );
}
