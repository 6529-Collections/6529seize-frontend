"use client";
import { SidebarDiscovery } from "@/components/brain/left-sidebar/waves/SidebarDiscovery";
import {
  SidebarWaveNavigationControls,
  SidebarWaveSearchResults,
} from "@/components/brain/left-sidebar/waves/SidebarWaveNavigation";
import { useSidebarWaveNavigation } from "@/hooks/useSidebarWaveNavigation";

import React, {
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import BrainLeftSidebarWave from "./BrainLeftSidebarWave";
import { SidebarWaveTreeRowTransition } from "./SidebarWaveTreeRowTransition";
import { SidebarWaveRowsSection } from "./SidebarWaveRowsSection";
import { SidebarSubwavesToggle } from "./SidebarSubwavesToggle";
import {
  buildHighlyRatedWavePreviewItems,
  getHighlyRatedPreviewWaves,
} from "./HighlyRatedWavesToggle";
import SectionHeader from "./SectionHeader";
import { WebProfileFeedShortcut } from "../web/WebProfileFeedShortcut";
import type { VirtualItem } from "@/hooks/useVirtualizedWaves";
import { useVirtualizedWaves } from "@/hooks/useVirtualizedWaves";
import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeSettingsOptional } from "@/contexts/SeizeSettingsContext";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { useShowFollowingWaves } from "@/hooks/useShowFollowingWaves";
import { usePrefetchWaveData } from "@/hooks/usePrefetchWaveData";
import { useLoadActiveSidebarParentSubwaves } from "@/hooks/useLoadActiveSidebarParentSubwaves";
import { useLoadPersistedExpandedSubwaves } from "@/hooks/useLoadPersistedExpandedSubwaves";
import { useActiveSubwaveParentHint } from "@/hooks/useActiveSubwaveParentHint";
import { useRevealActiveSidebarWave } from "@/hooks/useRevealActiveSidebarWave";
import { getWaveHomeRoute, getWaveRoute } from "@/helpers/navigation.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import {
  useSidebarWaveTree,
  type SidebarWaveTreeRow,
} from "@/hooks/useSidebarWaveTree";
import {
  useAnimatedSidebarWaveRows,
  getParentIdsWithVisibleSubwaveRows,
  type AnimatedSidebarWaveTreeRow,
} from "@/hooks/useAnimatedSidebarWaveRows";
import {
  groupSidebarWavesForView,
  isValidSidebarWave,
  prioritizeActiveWaveContainer,
  validateSidebarWaveDetailed,
} from "./sidebarWaveListUtils";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

// Height for empty waves placeholder to maintain consistent layout (matches UnifiedWavesListEmpty)
const EMPTY_WAVES_PLACEHOLDER_HEIGHT = "48px" as const;

// Virtualization constants
const WAVE_ROW_HEIGHT = 62 as const; // Height of each wave row in pixels
const SUBWAVE_ROW_HEIGHT = 48 as const;
const COLLAPSING_SUBWAVE_ROW_HEIGHT = 1 as const;
const SUBWAVE_TOGGLE_ROW_HEIGHT = 38 as const;
const COLLAPSED_SUBWAVE_TOGGLE_ROW_HEIGHT = 42 as const;
const VIRTUALIZATION_OVERSCAN = 5 as const; // Number of extra items to render outside viewport
const SIDEBAR_LOCALE = DEFAULT_LOCALE;

const APP_SECTION_DIVIDER_STYLES = {
  colorClass: "tw-border-iron-800",
  firstSpacingClass: "tw-mt-3",
} as const;

const DESKTOP_SECTION_DIVIDER_STYLES = {
  colorClass: "tw-border-iron-700",
  firstSpacingClass: "tw-mt-2",
} as const;

const getSectionDividerStyles = (isApp: boolean) =>
  isApp ? APP_SECTION_DIVIDER_STYLES : DESKTOP_SECTION_DIVIDER_STYLES;

// Common styles for positioned elements
const listContainerStyle = {
  position: "relative",
} as const satisfies React.CSSProperties;

const absolutePositionedStyle = {
  position: "absolute",
  width: "100%",
} as const satisfies React.CSSProperties;

const emptyPlaceholderStyle = {
  minHeight: EMPTY_WAVES_PLACEHOLDER_HEIGHT,
} as const satisfies React.CSSProperties;

const isVisibleStaticRow = ({
  detailedLabel,
  row,
  sectionName,
}: {
  readonly detailedLabel: string;
  readonly row: SidebarWaveTreeRow;
  readonly sectionName: string;
}) => {
  const wave = row.wave;

  if (isValidSidebarWave(wave)) {
    return true;
  }

  console.warn(`Invalid ${sectionName} wave object`, wave);
  if (!validateSidebarWaveDetailed(wave)) {
    console.warn(`${detailedLabel} wave failed detailed validation:`, wave);
  }

  return false;
};

/**
 * Props for the UnifiedWavesListWaves component.
 */
interface UnifiedWavesListWavesProps {
  /** Array of waves to display in the list */
  readonly isLoading?: boolean;
  readonly waves: MinimalWave[];
  /** Callback function called when a wave is hovered */
  readonly onHover: (waveId: string) => void;
  /** Whether to hide the joined waves toggle. When true, toggle is not rendered */
  readonly hideToggle?: boolean | undefined;
  /** Whether to hide the pin functionality for waves */
  readonly hidePin?: boolean | undefined;
  /** Whether to hide section headers */
  readonly hideHeaders?: boolean | undefined;
  /** Reference to the scroll container for virtualization */
  readonly scrollContainerRef: React.RefObject<HTMLElement | null>;
  /** Whether the waves are direct messages (affects navigation route) */
  readonly isDirectMessage?: boolean | undefined;
}

/**
 * Handle interface for UnifiedWavesListWaves component refs.
 * Used for accessing internal container and sentinel refs for virtualization.
 */
export interface UnifiedWavesListWavesHandle {
  /** Reference to the main container element for virtualization */
  readonly containerRef: React.RefObject<HTMLElement | null>;
  /** Reference to the sentinel element used for intersection observation */
  readonly sentinelRef: React.RefObject<HTMLDivElement | null>;
}

const UnifiedWavesListWaves = forwardRef<
  UnifiedWavesListWavesHandle,
  UnifiedWavesListWavesProps
>(
  (
    {
      isLoading = false,
      waves,
      onHover,
      scrollContainerRef,
      hideToggle,
      hidePin,
      hideHeaders,
      isDirectMessage = false,
    },
    ref
  ) => {
    const locale = useBrowserLocale();
    const listContainerRef = useRef<HTMLDivElement>(null);
    const [following] = useShowFollowingWaves();
    const { connectedProfile, activeProfileProxy } = useAuth();
    const seizeSettings = useSeizeSettingsOptional();
    const { activeWave, waves: streamWaves } = useMyStream();
    const isJoinedFilterActive =
      following && !!connectedProfile?.handle && !activeProfileProxy;
    const {
      id: activeWaveId,
      parentWaveId: activeParentWaveId,
      set: setActiveWave,
    } = activeWave;
    const { isApp, hasTouchScreen } = useDeviceInfo();
    const {
      colorClass: sectionDividerColorClass,
      firstSpacingClass: firstSectionDividerSpacingClass,
    } = getSectionDividerStyles(isApp);
    const prefetchWaveData = usePrefetchWaveData();
    // Persisted-hint fallback so the active subwave expands/highlights
    // immediately after a cold reload (see useActiveSubwaveParentHint).
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
    });
    useLoadActiveSidebarParentSubwaves({
      activeParentWaveId: effectiveActiveParentWaveId,
      waves,
    });
    useLoadPersistedExpandedSubwaves({ waves });

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
      scrollContainerRef,
      enabled: !isDirectMessage,
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
    const allRows = useMemo(
      () =>
        getRows(
          prioritizeActiveWaveContainer(
            navigation.visibleWaves,
            isDirectMessage ? null : effectiveActiveParentWaveId
          )
        ),
      [
        navigation.visibleWaves,
        effectiveActiveParentWaveId,
        getRows,
        isDirectMessage,
      ]
    );
    const animatedAnnouncementRows =
      useAnimatedSidebarWaveRows(announcementRows);
    const animatedAllRows = useAnimatedSidebarWaveRows(allRows);
    const announcementParentsWithVisibleSubwaves = useMemo(
      () => getParentIdsWithVisibleSubwaveRows(animatedAnnouncementRows),
      [animatedAnnouncementRows]
    );
    const virtualizedParentsWithVisibleSubwaves = useMemo(
      () => getParentIdsWithVisibleSubwaveRows(animatedAllRows),
      [animatedAllRows]
    );
    const virtualizedRows = animatedAllRows;
    let virtualizedAriaLabel = t(
      SIDEBAR_LOCALE,
      "waves.sidebar.allRecentActivityAriaLabel"
    );
    if (isJoinedFilterActive) {
      virtualizedAriaLabel = t(
        SIDEBAR_LOCALE,
        "waves.sidebar.followingListAriaLabel"
      );
    }
    if (isDirectMessage) {
      virtualizedAriaLabel = t(
        SIDEBAR_LOCALE,
        "waves.sidebar.directMessagesAriaLabel"
      );
    }
    const shouldShowBottomHeader = !hideHeaders;
    const virtualizedKey = isDirectMessage
      ? "direct-message-conversations"
      : "unified-waves";
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
          return getWaveHomeRoute({ isDirectMessage, isApp });
        }

        return getWaveRoute({
          waveId: wave.id,
          extraParams:
            typeof wave.firstUnreadDropSerialNo === "number"
              ? { divider: String(wave.firstUnreadDropSerialNo) }
              : undefined,
          isDirectMessage,
          isApp,
        });
      },
      [activeWaveId, isApp, isDirectMessage]
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
          hasTouchScreen,
          isDirectMessage,
          setActiveWave,
          waves: highlyRatedPreviewWaves,
        }),
      [
        activeWaveId,
        activeParentWaveId,
        getHighlyRatedPreviewHref,
        handleHighlyRatedPreviewHover,
        hasTouchScreen,
        highlyRatedPreviewWaves,
        isDirectMessage,
        setActiveWave,
      ]
    );
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

        return row.depth === 1 ? SUBWAVE_ROW_HEIGHT : WAVE_ROW_HEIGHT;
      },
      []
    );

    const virtual = useVirtualizedWaves<AnimatedSidebarWaveTreeRow>({
      items: virtualizedRows,
      key: virtualizedKey,
      scrollContainerRef,
      listContainerRef,
      rowHeight: getSidebarRowHeight,
      overscan: VIRTUALIZATION_OVERSCAN,
    });
    const revealStaticRows = useMemo(
      () => [animatedAnnouncementRows],
      [animatedAnnouncementRows]
    );
    useRevealActiveSidebarWave({
      activeParentWaveId: effectiveActiveParentWaveId,
      activeWaveId: navigation.searching ? null : activeWaveId,
      filterKey: navigation.scrollKey,
      scrollContainerRef,
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
            layoutVariant="app"
            onClick={() => toggleParent(row.wave.id)}
            parentWaveName={row.wave.name}
            showConnector={showConnectedSubwaves}
            unreadDropsCount={row.unreadSubwaveDropsCount}
          />
        );
      }

      return (
        <BrainLeftSidebarWave
          isAnnouncement={isAnnouncement}
          wave={row.wave}
          onHover={onHover}
          showPin={showPin && row.depth === 0}
          isDirectMessage={isDirectMessage}
          depth={row.depth}
          canExpand={row.canExpand}
          hasUnreadSubwaves={row.hasUnreadSubwaves && !row.isExpanded}
          isLastSubwave={row.isLastSubwave}
          showSubwaveConnector={row.depth === 0 && showConnectedSubwaves}
          onPrefetchSubwaves={streamWaves.prefetchSubwavesForParent}
        />
      );
    };

    useImperativeHandle(ref, () => ({
      containerRef: virtual.containerRef,
      sentinelRef: virtual.sentinelRef,
    }));

    return (
      <div className="tw-flex tw-flex-col">
        {!hideHeaders && !isDirectMessage && (
          <div className="tw-flex tw-items-center tw-justify-between tw-px-4">
            <h2 className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-50">
              {t(locale, "navigation.primary.waves")}
            </h2>
            <div className="tw-flex tw-items-center tw-gap-1.5">
              <WebProfileFeedShortcut
                basePath="/waves"
                isCollapsed={false}
                mobile
              />
            </div>
          </div>
        )}
        {!hideHeaders && isDirectMessage && (
          <SectionHeader
            label={t(SIDEBAR_LOCALE, "waves.sidebar.allWaves")}
            paddingClassName="tw-px-4"
          />
        )}

        {announcementRows.length > 0 && (
          <SidebarWaveRowsSection
            ariaLabel={t(
              SIDEBAR_LOCALE,
              "waves.sidebar.announcementWavesAriaLabel"
            )}
            className="tw-flex tw-flex-col"
            getRowHeight={getSidebarRowHeight}
            isRowVisible={(row) =>
              isVisibleStaticRow({
                detailedLabel: "Announcement",
                row,
                sectionName: "announcement",
              })
            }
            renderRow={(row) =>
              renderWaveRow(
                row,
                !hidePin && row.wave.isPinned,
                announcementParentsWithVisibleSubwaves,
                true
              )
            }
            rows={animatedAnnouncementRows}
          />
        )}

        {!hideHeaders &&
          announcementRows.length > 0 &&
          shouldShowBottomHeader && (
            <div
              className={`${firstSectionDividerSpacingClass} tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid ${sectionDividerColorClass}`}
            />
          )}

        {!isDirectMessage && !hideHeaders && (
          <SidebarDiscovery
            previewItems={highlyRatedPreviewItems}
            isTouchPreview={hasTouchScreen}
          />
        )}
        {!isDirectMessage && !hideToggle && (
          <SidebarWaveNavigationControls
            navigation={navigation}
            isCollectionLoading={
              collectionLoading && navigation.visibleWaves.length === 0
            }
          />
        )}
        {navigation.searching ? (
          <SidebarWaveSearchResults navigation={navigation} />
        ) : (
          <>
            {virtualizedRows.length > 0 ? (
              <section
                ref={listContainerRef}
                style={{
                  height: virtual.totalHeight,
                  ...listContainerStyle,
                }}
                aria-label={
                  navigation.collection === "pinned" && !isDirectMessage
                    ? t(locale, "waves.sidebar.pinned")
                    : virtualizedAriaLabel
                }
              >
                {virtual.virtualItems.map((v: VirtualItem) => {
                  if (v.index === virtualizedRows.length) {
                    return (
                      <div
                        key="sentinel"
                        ref={virtual.sentinelRef}
                        style={{
                          ...absolutePositionedStyle,
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
                    if (!validateSidebarWaveDetailed(row?.wave)) {
                      console.warn(
                        "Wave failed detailed validation:",
                        row?.wave
                      );
                    }
                    return null;
                  }
                  // TypeScript now knows wave is definitely MinimalWave
                  return (
                    <SidebarWaveTreeRowTransition
                      key={row.key}
                      row={row}
                      rowHeight={getSidebarRowHeight(row)}
                      style={{
                        ...absolutePositionedStyle,
                        top: v.start,
                        height: v.size,
                      }}
                    >
                      {renderWaveRow(
                        row,
                        !hidePin,
                        virtualizedParentsWithVisibleSubwaves
                      )}
                    </SidebarWaveTreeRowTransition>
                  );
                })}
              </section>
            ) : (
              <div ref={listContainerRef} style={emptyPlaceholderStyle}>
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
    );
  }
);

UnifiedWavesListWaves.displayName = "UnifiedWavesListWaves";
export default UnifiedWavesListWaves;
