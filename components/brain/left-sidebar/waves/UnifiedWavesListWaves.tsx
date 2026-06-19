"use client";

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
import {
  buildHighlyRatedWavePreviewItems,
  getHighlyRatedPreviewWaves,
  HighlyRatedWavesToggle,
} from "./HighlyRatedWavesToggle";
import SectionHeader from "./SectionHeader";
import JoinedToggle from "./JoinedToggle";
import type { VirtualItem } from "@/hooks/useVirtualizedWaves";
import { useVirtualizedWaves } from "@/hooks/useVirtualizedWaves";
import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import { useSeizeSettingsOptional } from "@/contexts/SeizeSettingsContext";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { usePrefetchWaveData } from "@/hooks/usePrefetchWaveData";
import { getWaveHomeRoute, getWaveRoute } from "@/helpers/navigation.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import {
  useSidebarWaveTree,
  type SidebarWaveTreeRow,
} from "@/hooks/useSidebarWaveTree";
import { useAnimatedSidebarWaveRows } from "@/hooks/useAnimatedSidebarWaveRows";
import {
  groupSidebarWavesForView,
  isValidSidebarWave,
  validateSidebarWaveDetailed,
} from "./sidebarWaveListUtils";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

// Height for empty waves placeholder to maintain consistent layout (matches UnifiedWavesListEmpty)
const EMPTY_WAVES_PLACEHOLDER_HEIGHT = "48px" as const;

// Virtualization constants
const WAVE_ROW_HEIGHT = 62 as const; // Height of each wave row in pixels
const SUBWAVE_ROW_HEIGHT = 54 as const;
const VIRTUALIZATION_OVERSCAN = 5 as const; // Number of extra items to render outside viewport
const SIDEBAR_LOCALE = DEFAULT_LOCALE;

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

function SidebarCategoryLabel({ label }: { readonly label: string }) {
  return (
    <div className="tw-px-4 tw-pb-1 tw-pt-2 tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
      {label}
    </div>
  );
}

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
  readonly waves: MinimalWave[];
  /** Callback function called when a wave is hovered */
  readonly onHover: (waveId: string) => void;
  /** Whether to hide the joined waves toggle. When true, toggle is not rendered */
  readonly hideToggle?: boolean | undefined;
  /** Whether to hide the pin functionality for waves */
  readonly hidePin?: boolean | undefined;
  /** Whether to hide section headers (All Waves, Pinned) */
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
    const listContainerRef = useRef<HTMLDivElement>(null);
    const seizeSettings = useSeizeSettingsOptional();
    const { activeWave, waves: streamWaves } = useMyStream();
    const {
      id: activeWaveId,
      parentWaveId: activeParentWaveId,
      set: setActiveWave,
    } = activeWave;
    const { isApp, hasTouchScreen } = useDeviceInfo();
    const prefetchWaveData = usePrefetchWaveData();
    const { topLevelWaves, getRows, toggleParent } = useSidebarWaveTree({
      waves,
      activeWaveId: activeWave.id,
      activeParentWaveId: activeWave.parentWaveId,
      loadingSubwaveParentIds: streamWaves.loadingSubwaveParentIds,
      onParentExpand: streamWaves.loadSubwavesForParent,
    });

    const {
      announcementWaves,
      highlyRatedWaves,
      pinnedWaves,
      followingWaves,
      allWaves,
    } = useMemo(
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
    const followingRows = useMemo(
      () => getRows(followingWaves),
      [followingWaves, getRows]
    );
    const allRows = useMemo(() => getRows(allWaves), [allWaves, getRows]);
    const animatedAnnouncementRows =
      useAnimatedSidebarWaveRows(announcementRows);
    const animatedHighlyRatedRows = useAnimatedSidebarWaveRows(highlyRatedRows);
    const animatedPinnedRows = useAnimatedSidebarWaveRows(pinnedRows);
    const animatedFollowingRows = useAnimatedSidebarWaveRows(followingRows);
    const animatedAllRows = useAnimatedSidebarWaveRows(allRows);
    const virtualizedRows =
      animatedAllRows.length > 0 ? animatedAllRows : animatedFollowingRows;
    const staticFollowingRows =
      animatedAllRows.length > 0 ? animatedFollowingRows : [];
    const hasVirtualizedFollowingRows =
      animatedAllRows.length === 0 && animatedFollowingRows.length > 0;
    const shouldUseHighlyRatedToggle = !hideHeaders;
    const shouldShowHighlyRatedRows =
      highlyRatedRows.length > 0 && !shouldUseHighlyRatedToggle;
    const virtualizedAriaLabel =
      isDirectMessage
        ? t(SIDEBAR_LOCALE, "waves.sidebar.directMessagesAriaLabel")
        : animatedAllRows.length > 0
        ? t(SIDEBAR_LOCALE, "waves.sidebar.allQualityRankedAriaLabel")
        : t(SIDEBAR_LOCALE, "waves.sidebar.followingListAriaLabel");
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
      (row: SidebarWaveTreeRow) =>
        row.depth === 1 ? SUBWAVE_ROW_HEIGHT : WAVE_ROW_HEIGHT,
      []
    );

    const virtual = useVirtualizedWaves<SidebarWaveTreeRow>({
      items: virtualizedRows,
      key:
        isDirectMessage
          ? "direct-message-conversations"
          : animatedAllRows.length > 0
          ? "unified-waves-all"
          : "unified-waves-following",
      scrollContainerRef,
      listContainerRef,
      rowHeight: getSidebarRowHeight,
      overscan: VIRTUALIZATION_OVERSCAN,
    });

    const renderWaveRow = (row: SidebarWaveTreeRow, showPin: boolean) => (
      <BrainLeftSidebarWave
        wave={row.wave}
        onHover={onHover}
        showPin={showPin && row.depth === 0}
        isDirectMessage={isDirectMessage}
        depth={row.depth}
        canExpand={row.canExpand}
        isExpanded={row.isExpanded}
        isLoadingSubwaves={row.isLoadingSubwaves}
        hasUnreadSubwaves={row.hasUnreadSubwaves && !row.isExpanded}
        isLastSubwave={row.isLastSubwave}
        onToggleExpand={toggleParent}
        onPrefetchSubwaves={streamWaves.prefetchSubwavesForParent}
      />
    );

    useImperativeHandle(ref, () => ({
      containerRef: virtual.containerRef,
      sentinelRef: virtual.sentinelRef,
    }));

    return (
      <div className="tw-flex tw-flex-col">
        {/* Always show "All Waves" header with toggle when not hidden */}
        {!hideHeaders && (
          <SectionHeader
            label="All Waves"
            paddingClassName="tw-px-4"
            rightContent={hideToggle ? undefined : <JoinedToggle />}
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
              renderWaveRow(row, !hidePin && row.wave.isPinned)
            }
            rows={animatedAnnouncementRows}
          />
        )}

        {!hideHeaders &&
          announcementRows.length > 0 &&
          (highlyRatedRows.length > 0 ||
            pinnedRows.length > 0 ||
            followingRows.length > 0 ||
            allRows.length > 0) && (
            <div className="tw-my-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-700" />
          )}

        {highlyRatedRows.length > 0 && (
          <>
            {shouldUseHighlyRatedToggle && (
              <>
                <SidebarCategoryLabel
                  label={t(SIDEBAR_LOCALE, "waves.sidebar.highlyRated")}
                />
                <HighlyRatedWavesToggle
                  paddingClassName="tw-px-4"
                  previewItems={highlyRatedPreviewItems}
                />
              </>
            )}
            {shouldShowHighlyRatedRows && (
              <SidebarWaveRowsSection
                ariaLabel={t(
                  SIDEBAR_LOCALE,
                  "waves.sidebar.highlyRatedAriaLabel"
                )}
                className="tw-flex tw-flex-col"
                getRowHeight={getSidebarRowHeight}
                isRowVisible={(row) =>
                  isVisibleStaticRow({
                    detailedLabel: "Highly rated",
                    row,
                    sectionName: "highly rated",
                  })
                }
                renderRow={(row) => renderWaveRow(row, false)}
                rows={animatedHighlyRatedRows}
              />
            )}
          </>
        )}

        {!hideHeaders &&
          highlyRatedRows.length > 0 &&
          (pinnedRows.length > 0 ||
            followingRows.length > 0 ||
            allRows.length > 0) && (
            <div className="tw-my-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-700" />
          )}

        {/* Conditionally show pinned section */}
        {!hideHeaders && pinnedRows.length > 0 && (
          <>
            <SidebarCategoryLabel
              label={t(SIDEBAR_LOCALE, "waves.sidebar.pinned")}
            />
            <SidebarWaveRowsSection
              ariaLabel={t(SIDEBAR_LOCALE, "waves.sidebar.pinnedAriaLabel")}
              className="tw-flex tw-flex-col"
              getRowHeight={getSidebarRowHeight}
              isRowVisible={(row) =>
                isVisibleStaticRow({
                  detailedLabel: "Pinned",
                  row,
                  sectionName: "pinned",
                })
              }
              renderRow={(row) => renderWaveRow(row, !hidePin)}
              rows={animatedPinnedRows}
            />
          </>
        )}

        {!hideHeaders &&
          pinnedRows.length > 0 &&
          (followingRows.length > 0 || allRows.length > 0) && (
            <div className="tw-my-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-700" />
          )}

        {staticFollowingRows.length > 0 && (
          <>
            {!hideHeaders && (
              <SidebarCategoryLabel
                label={t(SIDEBAR_LOCALE, "waves.sidebar.following")}
              />
            )}
            <SidebarWaveRowsSection
              ariaLabel={t(SIDEBAR_LOCALE, "waves.sidebar.followingAriaLabel")}
              className="tw-flex tw-flex-col"
              getRowHeight={getSidebarRowHeight}
              isRowVisible={(row) =>
                isVisibleStaticRow({
                  detailedLabel: "Following",
                  row,
                  sectionName: "following",
                })
              }
              renderRow={(row) => renderWaveRow(row, !hidePin)}
              rows={staticFollowingRows}
            />
          </>
        )}

        {!hideHeaders &&
          staticFollowingRows.length > 0 &&
          animatedAllRows.length > 0 && (
            <div className="tw-my-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-700" />
          )}

        {!hideHeaders && animatedAllRows.length > 0 && (
          <SidebarCategoryLabel
            label={t(SIDEBAR_LOCALE, "waves.sidebar.all")}
          />
        )}

        {!hideHeaders && hasVirtualizedFollowingRows && (
          <SidebarCategoryLabel
            label={t(SIDEBAR_LOCALE, "waves.sidebar.following")}
          />
        )}

        {virtualizedRows.length > 0 ? (
          <section
            ref={listContainerRef}
            style={{
              height: virtual.totalHeight,
              ...listContainerStyle,
            }}
            aria-label={virtualizedAriaLabel}
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
                  console.warn("Wave failed detailed validation:", row?.wave);
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
                  {renderWaveRow(row, !hidePin)}
                </SidebarWaveTreeRowTransition>
              );
            })}
          </section>
        ) : (
          <div ref={listContainerRef} style={emptyPlaceholderStyle} />
        )}
      </div>
    );
  }
);

UnifiedWavesListWaves.displayName = "UnifiedWavesListWaves";
export default UnifiedWavesListWaves;
