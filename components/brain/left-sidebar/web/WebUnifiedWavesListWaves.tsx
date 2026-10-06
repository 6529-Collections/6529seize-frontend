"use client";
import { SidebarDiscovery } from "@/components/brain/left-sidebar/waves/SidebarDiscovery";
import {
  SidebarWaveNavigationControls,
  SidebarWaveSearchResults,
} from "@/components/brain/left-sidebar/waves/SidebarWaveNavigation";
import { useSidebarWaveNavigation } from "@/hooks/useSidebarWaveNavigation";

import Button from "@/components/utils/button/Button";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import useCreateModalState from "@/hooks/useCreateModalState";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import { useLoadActiveSidebarParentSubwaves } from "@/hooks/useLoadActiveSidebarParentSubwaves";
import { useLoadPersistedExpandedSubwaves } from "@/hooks/useLoadPersistedExpandedSubwaves";
import { useActiveSubwaveParentHint } from "@/hooks/useActiveSubwaveParentHint";
import { useRevealActiveSidebarWave } from "@/hooks/useRevealActiveSidebarWave";
import { usePrefetchWaveData } from "@/hooks/usePrefetchWaveData";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useCallback, useMemo, useRef } from "react";
import { Tooltip as ReactTooltip } from "react-tooltip";
import type { VirtualItem } from "../../../../hooks/useVirtualizedWaves";
import { useVirtualizedWaves } from "../../../../hooks/useVirtualizedWaves";
import {
  buildHighlyRatedWavePreviewItems,
  getHighlyRatedPreviewWaves,
} from "../waves/HighlyRatedWavesToggle";
import {
  SIDEBAR_TOOLTIP_BORDER,
  SIDEBAR_TOOLTIP_STYLE,
} from "../waves/SidebarCategoryLabel";
import { SidebarWaveRowsSection } from "../waves/SidebarWaveRowsSection";
import { SidebarSubwavesToggle } from "../waves/SidebarSubwavesToggle";
import SectionHeader from "../waves/SectionHeader";
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
  prioritizeActiveWaveContainer,
} from "../waves/sidebarWaveListUtils";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

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
}: {
  readonly isDirectMessage: boolean;
}) {
  if (isDirectMessage) {
    return "web-direct-message-conversations";
  }

  return "web-unified-waves";
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
  readonly isLoading?: boolean;
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

function CreateWaveButton({
  onClick,
  compact = false,
}: {
  readonly onClick: () => void;
  readonly compact?: boolean;
}) {
  const locale = useBrowserLocale();
  const label = t(locale, "waves.sidebar.createWave");
  return (
    <Button
      variant="primary"
      size={null}
      onClick={onClick}
      aria-label={label}
      data-tooltip-id="create-wave-tooltip"
      data-tooltip-content={label}
      className={
        compact
          ? "tw-size-8 tw-rounded-lg tw-p-0 touch-only:tw-size-11"
          : "tw-h-8 tw-gap-2 tw-rounded-lg tw-px-3 tw-py-0 tw-text-xs touch-only:tw-h-11"
      }
    >
      <FontAwesomeIcon icon={faPlus} className="tw-size-4" aria-hidden="true" />
      {!compact && <span>{label}</span>}
    </Button>
  );
}

function WebWavesListHeader({
  basePath,
  showProfileFeedShortcut,
  headerPaddingClassName,
  isCollapsed,
  onCreateWave,
  showCreateWaveButton,
}: {
  readonly basePath: string;
  readonly showProfileFeedShortcut: boolean;
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
      <div className="tw-mb-3.5 tw-mt-2 tw-flex tw-justify-center tw-px-2">
        <CreateWaveButton onClick={onCreateWave} compact />
      </div>
    );
  }

  return (
    <SectionHeader
      label="Waves"
      paddingClassName={`${headerPaddingClassName} tw-pb-2`}
      rightContent={
        <div className="tw-flex tw-items-center tw-gap-x-1.5">
          {showProfileFeedShortcut && (
            <WebProfileFeedShortcut basePath={basePath} isCollapsed={false} />
          )}
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
  isLoading = false,
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
  const locale = useBrowserLocale();
  const listContainerRef = useRef<HTMLDivElement>(null);
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
  useLoadPersistedExpandedSubwaves({ waves });

  const showCreateWaveButton = !isApp;
  const shouldShowProfileFeedShortcut = !hideHeaders && showProfileFeedShortcut;

  const { announcementWaves, highlyRatedWaves } = useMemo(
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

  const collectionWaves = useMemo(
    () =>
      topLevelWaves.filter(
        (wave) => !announcementWaves.some((item) => item.id === wave.id)
      ),
    [topLevelWaves, announcementWaves]
  );
  const navigation = useSidebarWaveNavigation({
    waves: collectionWaves,
    scrollContainerRef: scrollContainerRef ?? listContainerRef,
    enabled: !isDirectMessage && !isCollapsed,
    activeContainerId: effectiveActiveParentWaveId ?? activeWaveId,
  });
  const collectionLoading =
    isLoading ||
    (navigation.collection === "pinned" &&
      streamWaves.isPinnedWavesLoading === true);
  const announcementRows = useMemo(
    () => getRows(announcementWaves),
    [announcementWaves, getRows]
  );
  const activeContainerWaveId = isDirectMessage
    ? null
    : effectiveActiveParentWaveId;
  const prioritizedAllWaves = useMemo(
    () =>
      prioritizeActiveWaveContainer(
        navigation.visibleWaves,
        activeContainerWaveId
      ),
    [activeContainerWaveId, navigation.visibleWaves]
  );
  const allRows = useMemo(
    () => getRows(prioritizedAllWaves),
    [getRows, prioritizedAllWaves]
  );
  const rowAnimationOptions = useMemo(
    () => ({ keepExitingRows: !isCollapsed }),
    [isCollapsed]
  );
  const animatedAnnouncementRows = useAnimatedSidebarWaveRows(
    announcementRows,
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
  const virtualizedParentsWithVisibleSubwaves = useMemo(
    () => getParentIdsWithVisibleSubwaveRows(animatedAllRows),
    [animatedAllRows]
  );
  const hasAnnouncementRows = animatedAnnouncementRows.length > 0;
  const virtualizedRows = animatedAllRows;
  const virtualizedAriaLabel = getVirtualizedAriaLabel({
    isDirectMessage,
    isJoinedFilterActive: !isCollapsed && navigation.collection === "joined",
  });
  const headerPaddingClassName = "tw-px-4";
  const shouldShowBottomHeader = !hideHeaders && !isCollapsed;
  const virtualizedKey = getVirtualizedKey({
    isDirectMessage,
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
  const revealStaticRows = useMemo(
    () => [animatedAnnouncementRows],
    [animatedAnnouncementRows]
  );
  useRevealActiveSidebarWave({
    activeParentWaveId: effectiveActiveParentWaveId,
    activeWaveId: navigation.searching ? null : activeWaveId,
    filterKey: navigation.scrollKey,
    scrollContainerRef: scrollContainerRef ?? listContainerRef,
    scrollToVirtualIndex: virtual.scrollToIndex,
    staticRows: revealStaticRows,
    virtualRows: virtualizedRows,
  });

  const renderWaveRow = (
    row: AnimatedSidebarWaveTreeRow,
    showPin: boolean,
    parentsWithVisibleSubwaves: ReadonlySet<string>,
    isAnnouncement = false
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
        scoreDetailsDisabled={navigation.searchOpen}
        isAnnouncement={isAnnouncement}
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
            basePath={basePath}
            showProfileFeedShortcut={shouldShowProfileFeedShortcut}
            headerPaddingClassName={headerPaddingClassName}
            isCollapsed={isCollapsed}
            onCreateWave={openWave}
            showCreateWaveButton={showCreateWaveButton}
          />
        )}
        {shouldShowProfileFeedShortcut && isCollapsed && (
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
                  announcementParentsWithVisibleSubwaves,
                  true
                )
              }
              rows={animatedAnnouncementRows}
              transitionClassName="tw-w-full"
            />
          )}
          {hasAnnouncementRows && !hideHeaders && shouldShowBottomHeader && (
            <div className="tw-mb-1 tw-mt-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-700" />
          )}

          {!isDirectMessage && !hideHeaders && !isCollapsed && (
            <SidebarDiscovery
              scoreDetailsDisabled={navigation.searchOpen}
              previewItems={highlyRatedPreviewItems}
              isTouchPreview={isTouchDevice}
            />
          )}
          {!isDirectMessage && !hideToggle && !isCollapsed && (
            <SidebarWaveNavigationControls
              navigation={navigation}
              isCollectionLoading={
                collectionLoading && navigation.visibleWaves.length === 0
              }
            />
          )}
          {navigation.searching && !isCollapsed ? (
            <SidebarWaveSearchResults navigation={navigation} />
          ) : (
            <>
              {virtualizedRows.length > 0 ? (
                <section
                  ref={listContainerRef}
                  style={{
                    height: virtual.totalHeight,
                    position: "relative",
                  }}
                  aria-label={
                    navigation.collection === "pinned" &&
                    !isDirectMessage &&
                    !isCollapsed
                      ? t(locale, "waves.sidebar.pinned")
                      : virtualizedAriaLabel
                  }
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
                >
                  {!isDirectMessage && !collectionLoading && (
                    <output className="tw-block tw-px-4 tw-py-3 tw-text-sm tw-text-iron-400">
                      {t(locale, "waves.sidebar.collectionEmpty")}
                    </output>
                  )}
                </div>
              )}
            </>
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
              place={isCollapsed ? "right" : "bottom"}
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
