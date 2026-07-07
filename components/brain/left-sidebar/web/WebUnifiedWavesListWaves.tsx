"use client";

import PrimaryButton from "@/components/utils/button/PrimaryButton";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import useCreateModalState from "@/hooks/useCreateModalState";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import { useLoadActiveSidebarParentSubwaves } from "@/hooks/useLoadActiveSidebarParentSubwaves";
import { useActiveSubwaveParentHint } from "@/hooks/useActiveSubwaveParentHint";
import { usePrefetchWaveData } from "@/hooks/usePrefetchWaveData";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useCallback, useMemo, useRef } from "react";
import { Tooltip as ReactTooltip } from "react-tooltip";
import type { VirtualItem } from "../../../../hooks/useVirtualizedWaves";
import { useVirtualizedWaves } from "../../../../hooks/useVirtualizedWaves";
import { useAuth } from "../../../auth/Auth";
import { useShowFollowingWaves } from "@/hooks/useShowFollowingWaves";
import {
  buildHighlyRatedWavePreviewItems,
  getHighlyRatedPreviewWaves,
  HighlyRatedWavesToggle,
} from "../waves/HighlyRatedWavesToggle";
import {
  SIDEBAR_TOOLTIP_BORDER,
  SIDEBAR_TOOLTIP_STYLE,
  SidebarCategoryLabel,
} from "../waves/SidebarCategoryLabel";
import { SidebarWaveRowsSection } from "../waves/SidebarWaveRowsSection";
import { SidebarSubwavesToggle } from "../waves/SidebarSubwavesToggle";
import SectionHeader from "../waves/SectionHeader";
import WavesFilterToggle from "../waves/WavesFilterToggle";
import { SidebarWaveTreeRowTransition } from "../waves/SidebarWaveTreeRowTransition";
import WebBrainLeftSidebarWave from "./WebBrainLeftSidebarWave";
import {
  PROFILE_FEED_TOOLTIP_ID,
  WebProfileFeedShortcut,
} from "./WebProfileFeedShortcut";
import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import { useSeizeSettingsOptional } from "@/contexts/SeizeSettingsContext";
import {
  useSidebarWaveTree,
  type SidebarWaveTreeRow,
} from "@/hooks/useSidebarWaveTree";
import {
  useAnimatedSidebarWaveRows,
  getParentIdsWithVisibleSubwaveRows,
  type AnimatedSidebarWaveTreeRow,
} from "@/hooks/useAnimatedSidebarWaveRows";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import {
  groupSidebarWavesForView,
  isValidSidebarWave,
} from "../waves/sidebarWaveListUtils";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import Link from "next/link";

const EMPTY_WAVES_PLACEHOLDER_HEIGHT = "48px" as const;

const WAVE_ROW_HEIGHT_DEFAULT = 62 as const;
const WAVE_ROW_HEIGHT_COLLAPSED = 52 as const;
const SUBWAVE_ROW_HEIGHT = 48 as const;
const COLLAPSING_SUBWAVE_ROW_HEIGHT = 1 as const;
const SUBWAVE_TOGGLE_ROW_HEIGHT = 38 as const;
const COLLAPSED_SUBWAVE_TOGGLE_ROW_HEIGHT = 42 as const;
const SIDEBAR_LOCALE = DEFAULT_LOCALE;
const TOOLTIP_STYLE = {
  ...SIDEBAR_TOOLTIP_STYLE,
  zIndex: 10000,
} as const satisfies React.CSSProperties;

function SidebarCategoryHeader({
  label,
  rightContent,
}: {
  readonly label: string;
  readonly rightContent?: React.ReactNode | undefined;
}) {
  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-3 tw-px-5 tw-pb-1 tw-pt-2">
      <div className="tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
        {label}
      </div>
      {rightContent !== undefined && rightContent !== null && (
        <div className="tw-flex tw-items-center">{rightContent}</div>
      )}
    </div>
  );
}

function getVirtualizedAriaLabel({
  isDirectMessage,
  isJoinedFilterActive,
}: {
  readonly isDirectMessage: boolean;
  readonly isJoinedFilterActive: boolean;
}) {
  if (isDirectMessage) {
    return t(SIDEBAR_LOCALE, "waves.sidebar.directMessagesAriaLabel");
  }

  if (isJoinedFilterActive) {
    return t(SIDEBAR_LOCALE, "waves.sidebar.followingListAriaLabel");
  }

  return t(SIDEBAR_LOCALE, "waves.sidebar.allRecentActivityAriaLabel");
}

function getVirtualizedKey({
  isDirectMessage,
  isJoinedFilterActive,
}: {
  readonly isDirectMessage: boolean;
  readonly isJoinedFilterActive: boolean;
}) {
  if (isDirectMessage) {
    return "web-direct-message-conversations";
  }

  if (isJoinedFilterActive) {
    return "web-unified-waves-joined";
  }

  return "web-unified-waves-all";
}

function getBottomListLabel(isJoinedFilterActive: boolean) {
  return isJoinedFilterActive
    ? t(SIDEBAR_LOCALE, "waves.sidebar.filterJoined")
    : t(SIDEBAR_LOCALE, "waves.sidebar.all");
}

function getSectionClassName(isCollapsed: boolean) {
  return isCollapsed
    ? "tw-flex tw-flex-col tw-items-center tw-gap-y-2"
    : "tw-flex tw-flex-col";
}

function getBaseRowHeight(isCollapsed: boolean) {
  return isCollapsed ? WAVE_ROW_HEIGHT_COLLAPSED : WAVE_ROW_HEIGHT_DEFAULT;
}

interface WebUnifiedWavesListWavesProps {
  readonly waves: MinimalWave[];
  readonly onHover: (waveId: string) => void;
  readonly hideHeaders?: boolean | undefined;
  readonly hideToggle?: boolean | undefined;
  readonly hidePin?: boolean | undefined;
  readonly scrollContainerRef?: React.RefObject<HTMLElement | null> | undefined;
  readonly basePath?: string | undefined;
  readonly isCollapsed?: boolean | undefined;
  readonly showProfileFeedShortcut?: boolean | undefined;
  readonly isDirectMessage?: boolean | undefined;
  readonly sentinelRef: React.RefObject<HTMLDivElement | null>;
}

function CreateWaveButton({ onClick }: { readonly onClick: () => void }) {
  return (
    <div
      data-tooltip-id="create-wave-tooltip"
      data-tooltip-content="Create wave"
    >
      <PrimaryButton
        onClicked={onClick}
        loading={false}
        disabled={false}
        padding="tw-p-2.5"
      >
        <FontAwesomeIcon icon={faPlus} className="tw-size-4 tw-flex-shrink-0" />
      </PrimaryButton>
    </div>
  );
}

function DiscoverWavesLink() {
  const label = t(SIDEBAR_LOCALE, "navigation.waves.discover");

  return (
    <Link
      href="/discover"
      className="desktop-hover:hover:tw-text-primary-200 tw-rounded-lg tw-px-2.5 tw-py-2 tw-text-sm tw-font-semibold tw-leading-none tw-text-primary-300 tw-no-underline tw-transition-colors tw-duration-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black motion-reduce:tw-transition-none"
      aria-label={label}
    >
      {label}
    </Link>
  );
}

function WebWavesListHeader({
  headerPaddingClassName,
  isCollapsed,
  onCreateWave,
  showCreateWaveButton,
}: {
  readonly headerPaddingClassName: string;
  readonly isCollapsed: boolean;
  readonly onCreateWave: () => void;
  readonly showCreateWaveButton: boolean;
}) {
  if (isCollapsed) {
    if (!showCreateWaveButton) {
      return null;
    }

    return (
      <div className="tw-mb-3.5 tw-flex tw-justify-center tw-px-2">
        <CreateWaveButton onClick={onCreateWave} />
      </div>
    );
  }

  return (
    <SectionHeader
      label="Waves"
      paddingClassName={headerPaddingClassName}
      rightContent={
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <DiscoverWavesLink />
          {showCreateWaveButton && <CreateWaveButton onClick={onCreateWave} />}
        </div>
      }
    />
  );
}

const isVisibleSectionRow = ({
  row,
  sectionName,
}: {
  readonly row: SidebarWaveTreeRow;
  readonly sectionName: string;
}) => {
  const wave = row.wave;

  if (isValidSidebarWave(wave)) {
    return true;
  }

  console.warn(`Invalid ${sectionName} wave object`, wave);
  return false;
};

const WebUnifiedWavesListWaves: React.FC<WebUnifiedWavesListWavesProps> = ({
  waves,
  onHover,
  hideHeaders = false,
  hideToggle = false,
  hidePin = false,
  scrollContainerRef,
  basePath = "/waves",
  isCollapsed = false,
  showProfileFeedShortcut = true,
  isDirectMessage = false,
  sentinelRef,
}) => {
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [following] = useShowFollowingWaves();
  const { connectedProfile, activeProfileProxy } = useAuth();
  const { openWave, isApp } = useCreateModalState();
  const isTouchDevice = useIsTouchDevice();
  const prefetchWaveData = usePrefetchWaveData();
  const seizeSettings = useSeizeSettingsOptional();
  const { activeWave, waves: streamWaves } = useMyStream();
  const {
    id: activeWaveId,
    parentWaveId: activeParentWaveId,
    set: setActiveWave,
  } = activeWave;
  // Falls back to the persisted hint while the live parent is still loading
  // after a cold reload, so the active subwave expands/highlights without the
  // fetch-waterfall flicker.
  const effectiveActiveParentWaveId = useActiveSubwaveParentHint(
    activeWaveId,
    activeParentWaveId
  );
  const { topLevelWaves, getRows, toggleParent } = useSidebarWaveTree({
    waves,
    activeWaveId: activeWave.id,
    activeParentWaveId: effectiveActiveParentWaveId,
    loadingSubwaveParentIds: streamWaves.loadingSubwaveParentIds,
    onParentExpand: streamWaves.loadSubwavesForParent,
    showExpandedSubwaves: !isCollapsed,
  });
  useLoadActiveSidebarParentSubwaves({
    activeParentWaveId: effectiveActiveParentWaveId,
    waves,
  });

  const showCreateWaveButton = !isApp && !!connectedProfile;
  const shouldShowProfileFeedShortcut = !hideHeaders && showProfileFeedShortcut;
  const isJoinedFilterActive =
    following && !!connectedProfile?.handle && !activeProfileProxy;

  const { announcementWaves, highlyRatedWaves, pinnedWaves, allWaves } =
    useMemo(
      () =>
        groupSidebarWavesForView({
          isAnnouncementsWave:
            seizeSettings === null
              ? undefined
              : (waveId) => seizeSettings.isAnnouncementsWave(waveId),
          isDirectMessage,
          waves: topLevelWaves,
        }),
      [topLevelWaves, seizeSettings, isDirectMessage]
    );

  const announcementRows = useMemo(
    () => getRows(announcementWaves),
    [announcementWaves, getRows]
  );
  const highlyRatedRows = useMemo(
    () => getRows(highlyRatedWaves),
    [highlyRatedWaves, getRows]
  );
  const pinnedRows = useMemo(
    () => getRows(pinnedWaves),
    [pinnedWaves, getRows]
  );
  const allRows = useMemo(() => getRows(allWaves), [allWaves, getRows]);
  const rowAnimationOptions = useMemo(
    () => ({ keepExitingRows: !isCollapsed }),
    [isCollapsed]
  );
  const animatedAnnouncementRows = useAnimatedSidebarWaveRows(
    announcementRows,
    rowAnimationOptions
  );
  const animatedHighlyRatedRows = useAnimatedSidebarWaveRows(
    highlyRatedRows,
    rowAnimationOptions
  );
  const animatedPinnedRows = useAnimatedSidebarWaveRows(
    pinnedRows,
    rowAnimationOptions
  );
  const animatedAllRows = useAnimatedSidebarWaveRows(
    allRows,
    rowAnimationOptions
  );
  const announcementParentsWithVisibleSubwaves = useMemo(
    () => getParentIdsWithVisibleSubwaveRows(animatedAnnouncementRows),
    [animatedAnnouncementRows]
  );
  const highlyRatedParentsWithVisibleSubwaves = useMemo(
    () => getParentIdsWithVisibleSubwaveRows(animatedHighlyRatedRows),
    [animatedHighlyRatedRows]
  );
  const pinnedParentsWithVisibleSubwaves = useMemo(
    () => getParentIdsWithVisibleSubwaveRows(animatedPinnedRows),
    [animatedPinnedRows]
  );
  const virtualizedParentsWithVisibleSubwaves = useMemo(
    () => getParentIdsWithVisibleSubwaveRows(animatedAllRows),
    [animatedAllRows]
  );
  const hasAnnouncementRows = animatedAnnouncementRows.length > 0;
  const hasHighlyRatedRows = animatedHighlyRatedRows.length > 0;
  const hasPinnedRows = animatedPinnedRows.length > 0;
  const virtualizedRows = animatedAllRows;
  const virtualizedAriaLabel = getVirtualizedAriaLabel({
    isDirectMessage,
    isJoinedFilterActive,
  });
  const bottomListLabel = getBottomListLabel(isJoinedFilterActive);
  const highlyRatedInfoTooltip = connectedProfile?.handle
    ? t(SIDEBAR_LOCALE, "waves.sidebar.highlyRatedInfoTooltip")
    : undefined;
  const shouldUseHighlyRatedToggle = !hideHeaders && !isCollapsed;
  const shouldShowHighlyRatedRows =
    hasHighlyRatedRows && !shouldUseHighlyRatedToggle;
  const headerPaddingClassName = "tw-px-4";
  const shouldShowBottomHeader = !hideHeaders && !isCollapsed;
  const virtualizedKey = getVirtualizedKey({
    isDirectMessage,
    isJoinedFilterActive,
  });
  const sectionClassName = getSectionClassName(isCollapsed);
  const rowHeight = getBaseRowHeight(isCollapsed);
  const isMessageBasePath = basePath === "/messages";
  const getSidebarRowHeight = useCallback(
    (row: AnimatedSidebarWaveTreeRow) => {
      if (row.rowType === "subwaves-toggle") {
        return row.isExpanded
          ? SUBWAVE_TOGGLE_ROW_HEIGHT
          : COLLAPSED_SUBWAVE_TOGGLE_ROW_HEIGHT;
      }

      if (row.depth === 1 && row.animationState === "exiting") {
        return COLLAPSING_SUBWAVE_ROW_HEIGHT;
      }

      return row.depth === 1 ? SUBWAVE_ROW_HEIGHT : rowHeight;
    },
    [rowHeight]
  );
  const handleHighlyRatedPreviewHover = useCallback(
    (waveId: string) => {
      if (waveId === activeWaveId) {
        return;
      }

      onHover(waveId);
      prefetchWaveData(waveId);
    },
    [activeWaveId, onHover, prefetchWaveData]
  );
  const getHighlyRatedPreviewHref = useCallback(
    (wave: MinimalWave) => {
      if (activeWaveId === wave.id) {
        return basePath;
      }

      return getWaveRoute({
        waveId: wave.id,
        extraParams:
          typeof wave.firstUnreadDropSerialNo === "number"
            ? { divider: String(wave.firstUnreadDropSerialNo) }
            : undefined,
        isDirectMessage: isMessageBasePath,
        isApp: false,
      });
    },
    [activeWaveId, basePath, isMessageBasePath]
  );
  const highlyRatedPreviewWaves = useMemo(
    () =>
      getHighlyRatedPreviewWaves({
        activeWaveLookupWaves: topLevelWaves,
        activeParentWaveId,
        activeWaveId,
        highlyRatedWaves,
      }),
    [activeParentWaveId, activeWaveId, highlyRatedWaves, topLevelWaves]
  );
  const highlyRatedPreviewItems = useMemo(
    () =>
      buildHighlyRatedWavePreviewItems({
        activeParentWaveId,
        activeWaveId,
        getHref: getHighlyRatedPreviewHref,
        handleHover: handleHighlyRatedPreviewHover,
        hasTouchScreen: isTouchDevice,
        isDirectMessage: isMessageBasePath,
        setActiveWave,
        waves: highlyRatedPreviewWaves,
      }),
    [
      activeParentWaveId,
      activeWaveId,
      getHighlyRatedPreviewHref,
      handleHighlyRatedPreviewHover,
      highlyRatedPreviewWaves,
      isMessageBasePath,
      isTouchDevice,
      setActiveWave,
    ]
  );

  const virtual = useVirtualizedWaves<AnimatedSidebarWaveTreeRow>({
    items: virtualizedRows,
    key: virtualizedKey,
    scrollContainerRef: scrollContainerRef ?? listContainerRef,
    listContainerRef,
    rowHeight: getSidebarRowHeight,
    overscan: 5,
  });

  const renderWaveRow = (
    row: AnimatedSidebarWaveTreeRow,
    showPin: boolean,
    parentsWithVisibleSubwaves: ReadonlySet<string>
  ) => {
    const showConnectedSubwaves = parentsWithVisibleSubwaves.has(row.wave.id);

    if (row.rowType === "subwaves-toggle") {
      return (
        <SidebarSubwavesToggle
          isExpanded={row.isExpanded}
          isLoading={row.isLoadingSubwaves}
          knownSubwavesCount={row.knownSubwavesCount}
          layoutVariant="web"
          onClick={() => toggleParent(row.wave.id)}
          parentWaveName={row.wave.name}
          showConnector={showConnectedSubwaves}
          unreadDropsCount={row.unreadSubwaveDropsCount}
        />
      );
    }

    return (
      <WebBrainLeftSidebarWave
        wave={row.wave}
        onHover={onHover}
        showPin={showPin && row.depth === 0}
        basePath={basePath}
        collapsed={isCollapsed}
        depth={row.depth}
        canExpand={row.canExpand && !isCollapsed}
        hasUnreadSubwaves={row.hasUnreadSubwaves && !row.isExpanded}
        isLastSubwave={row.isLastSubwave}
        showSubwaveConnector={
          row.depth === 0 && showConnectedSubwaves && !isCollapsed
        }
        onPrefetchSubwaves={streamWaves.prefetchSubwavesForParent}
      />
    );
  };

  return (
    <>
      <div className="tw-flex tw-flex-col">
        {!hideHeaders && (
          <WebWavesListHeader
            headerPaddingClassName={headerPaddingClassName}
            isCollapsed={isCollapsed}
            onCreateWave={openWave}
            showCreateWaveButton={showCreateWaveButton}
          />
        )}
        {shouldShowProfileFeedShortcut && (
          <WebProfileFeedShortcut
            basePath={basePath}
            isCollapsed={isCollapsed}
          />
        )}

        <div>
          {hasAnnouncementRows && (
            <SidebarWaveRowsSection
              ariaLabel={t(
                SIDEBAR_LOCALE,
                "waves.sidebar.announcementWavesAriaLabel"
              )}
              className={sectionClassName}
              getRowHeight={getSidebarRowHeight}
              isRowVisible={(row) =>
                isVisibleSectionRow({ row, sectionName: "announcement" })
              }
              renderRow={(row) =>
                renderWaveRow(
                  row,
                  !hidePin && !isCollapsed && row.wave.isPinned,
                  announcementParentsWithVisibleSubwaves
                )
              }
              rows={animatedAnnouncementRows}
              transitionClassName="tw-w-full"
            />
          )}
          {hasAnnouncementRows &&
            !hideHeaders &&
            (hasHighlyRatedRows || hasPinnedRows || shouldShowBottomHeader) && (
              <div className="tw-mb-1 tw-mt-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-700" />
            )}

          {hasHighlyRatedRows && (
            <>
              {shouldUseHighlyRatedToggle ? (
                <>
                  <SidebarCategoryLabel
                    label={t(SIDEBAR_LOCALE, "waves.sidebar.highlyRated")}
                    paddingClassName="tw-px-5"
                    tooltipContent={highlyRatedInfoTooltip}
                  />
                  <HighlyRatedWavesToggle
                    isTouchPreview={isTouchDevice}
                    paddingClassName="tw-px-5"
                    previewItems={highlyRatedPreviewItems}
                  />
                </>
              ) : (
                !hideHeaders &&
                !isCollapsed && (
                  <SidebarCategoryLabel
                    label={t(SIDEBAR_LOCALE, "waves.sidebar.highlyRated")}
                    paddingClassName="tw-px-5"
                    tooltipContent={highlyRatedInfoTooltip}
                  />
                )
              )}
              {shouldShowHighlyRatedRows && (
                <SidebarWaveRowsSection
                  ariaLabel={t(
                    SIDEBAR_LOCALE,
                    "waves.sidebar.highlyRatedAriaLabel"
                  )}
                  className={sectionClassName}
                  getRowHeight={getSidebarRowHeight}
                  isRowVisible={(row) =>
                    isVisibleSectionRow({ row, sectionName: "highly rated" })
                  }
                  renderRow={(row) =>
                    renderWaveRow(
                      row,
                      false,
                      highlyRatedParentsWithVisibleSubwaves
                    )
                  }
                  rows={animatedHighlyRatedRows}
                  transitionClassName="tw-w-full"
                />
              )}
            </>
          )}
          {hasHighlyRatedRows &&
            !hideHeaders &&
            (hasPinnedRows || shouldShowBottomHeader) && (
              <div className="tw-my-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-700" />
            )}
          {!hideHeaders && hasPinnedRows && (
            <>
              {!isCollapsed && (
                <SidebarCategoryHeader
                  label={t(SIDEBAR_LOCALE, "waves.sidebar.pinned")}
                />
              )}
              <SidebarWaveRowsSection
                ariaLabel={t(SIDEBAR_LOCALE, "waves.sidebar.pinnedAriaLabel")}
                className={sectionClassName}
                getRowHeight={getSidebarRowHeight}
                isRowVisible={(row) =>
                  isVisibleSectionRow({ row, sectionName: "pinned" })
                }
                renderRow={(row) =>
                  renderWaveRow(
                    row,
                    !hidePin && !isCollapsed,
                    pinnedParentsWithVisibleSubwaves
                  )
                }
                rows={animatedPinnedRows}
                transitionClassName="tw-w-full"
              />
            </>
          )}
          {!hideHeaders && hasPinnedRows && shouldShowBottomHeader && (
            <div className="tw-my-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-700" />
          )}
          {shouldShowBottomHeader && (
            <SidebarCategoryHeader
              label={bottomListLabel}
              rightContent={hideToggle ? undefined : <WavesFilterToggle />}
            />
          )}
          {virtualizedRows.length > 0 ? (
            <section
              ref={listContainerRef}
              style={{
                height: virtual.totalHeight,
                position: "relative",
              }}
              aria-label={virtualizedAriaLabel}
            >
              {virtual.virtualItems.map((v: VirtualItem) => {
                if (v.index === virtualizedRows.length) {
                  return (
                    <div
                      key="sentinel"
                      ref={sentinelRef}
                      style={{
                        position: "absolute",
                        width: "100%",
                        top: v.start,
                        height: v.size,
                      }}
                    />
                  );
                }
                const row = virtualizedRows[v.index];
                if (!row || !isValidSidebarWave(row.wave)) {
                  console.warn(
                    "Invalid wave object at index",
                    v.index,
                    row?.wave
                  );
                  return null;
                }
                return (
                  <SidebarWaveTreeRowTransition
                    key={row.key}
                    row={row}
                    rowHeight={getSidebarRowHeight(row)}
                    style={{
                      position: "absolute",
                      width: "100%",
                      top: v.start,
                      height: v.size,
                    }}
                  >
                    {renderWaveRow(
                      row,
                      !hidePin && !isCollapsed,
                      virtualizedParentsWithVisibleSubwaves
                    )}
                  </SidebarWaveTreeRowTransition>
                );
              })}
            </section>
          ) : (
            <div
              ref={listContainerRef}
              style={{ minHeight: EMPTY_WAVES_PLACEHOLDER_HEIGHT }}
            />
          )}
        </div>
      </div>

      {!isTouchDevice && (
        <>
          <ReactTooltip
            id="create-wave-tooltip"
            place="bottom"
            offset={8}
            opacity={1}
            style={TOOLTIP_STYLE}
            border={SIDEBAR_TOOLTIP_BORDER}
          />
          {shouldShowProfileFeedShortcut && (
            <ReactTooltip
              id={PROFILE_FEED_TOOLTIP_ID}
              place="right"
              offset={8}
              opacity={1}
              style={TOOLTIP_STYLE}
              border={SIDEBAR_TOOLTIP_BORDER}
            />
          )}
        </>
      )}
    </>
  );
};

WebUnifiedWavesListWaves.displayName = "WebUnifiedWavesListWaves";
export default WebUnifiedWavesListWaves;
