"use client";

import React, {
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip as ReactTooltip } from "react-tooltip";
import BrainLeftSidebarWave from "./BrainLeftSidebarWave";
import { SidebarWaveTreeRowTransition } from "./SidebarWaveTreeRowTransition";
import { SidebarWaveRowsSection } from "./SidebarWaveRowsSection";
import {
  buildHighlyRatedWavePreviewItems,
  getHighlyRatedPreviewWaves,
  HighlyRatedWavesToggle,
} from "./HighlyRatedWavesToggle";
import SectionHeader from "./SectionHeader";
import WavesFilterToggle from "./WavesFilterToggle";
import type { VirtualItem } from "@/hooks/useVirtualizedWaves";
import { useVirtualizedWaves } from "@/hooks/useVirtualizedWaves";
import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeSettingsOptional } from "@/contexts/SeizeSettingsContext";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { useShowFollowingWaves } from "@/hooks/useShowFollowingWaves";
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
const HIGHLY_RATED_INFO_TOOLTIP_ID = "waves-worth-checking-out-info";
const TOOLTIP_STYLE = {
  padding: "6px 10px",
  background: "#37373E",
  color: "white",
  fontSize: "12px",
  fontWeight: 500,
  borderRadius: "6px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
  zIndex: 10000,
} as const satisfies React.CSSProperties;

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

function SidebarCategoryHeader({
  label,
  rightContent,
}: {
  readonly label: string;
  readonly rightContent?: React.ReactNode | undefined;
}) {
  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-3 tw-px-4 tw-pb-1 tw-pt-2">
      <div className="tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
        {label}
      </div>
      {rightContent !== undefined && rightContent !== null && (
        <div className="tw-flex tw-items-center">{rightContent}</div>
      )}
    </div>
  );
}

function SidebarCategoryLabel({
  label,
  tooltipContent,
  tooltipId,
  showTooltipTrigger = true,
}: {
  readonly label: string;
  readonly tooltipContent?: string | undefined;
  readonly tooltipId?: string | undefined;
  readonly showTooltipTrigger?: boolean;
}) {
  return (
    <div className="tw-px-4 tw-pb-1.5 tw-pt-1 tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
      <span className="tw-inline-flex tw-items-center tw-gap-x-1.5">
        <span>{label}</span>
        {showTooltipTrigger && tooltipContent && tooltipId && (
          <button
            type="button"
            aria-label={tooltipContent}
            data-tooltip-id={tooltipId}
            data-tooltip-content={tooltipContent}
            className="tw-inline-flex tw-size-3 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-600 tw-transition-colors focus:tw-text-iron-300 focus:tw-outline-none desktop-hover:hover:tw-text-iron-400"
          >
            <FontAwesomeIcon icon={faInfoCircle} className="tw-size-3" />
          </button>
        )}
      </span>
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
    const prefetchWaveData = usePrefetchWaveData();
    const { topLevelWaves, getRows, toggleParent } = useSidebarWaveTree({
      waves,
      activeWaveId: activeWave.id,
      activeParentWaveId: activeWave.parentWaveId,
      loadingSubwaveParentIds: streamWaves.loadingSubwaveParentIds,
      onParentExpand: streamWaves.loadSubwavesForParent,
    });

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
    const animatedAnnouncementRows =
      useAnimatedSidebarWaveRows(announcementRows);
    const animatedHighlyRatedRows = useAnimatedSidebarWaveRows(highlyRatedRows);
    const animatedPinnedRows = useAnimatedSidebarWaveRows(pinnedRows);
    const animatedAllRows = useAnimatedSidebarWaveRows(allRows);
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
    const bottomListLabel = isJoinedFilterActive
      ? t(SIDEBAR_LOCALE, "waves.sidebar.filterJoined")
      : t(SIDEBAR_LOCALE, "waves.sidebar.all");
    const highlyRatedInfoTooltip = t(
      SIDEBAR_LOCALE,
      "waves.sidebar.highlyRatedInfoTooltip"
    );
    const shouldShowBottomHeader = !hideHeaders;
    let virtualizedKey = "unified-waves-all";
    if (isJoinedFilterActive) {
      virtualizedKey = "unified-waves-joined";
    }
    if (isDirectMessage) {
      virtualizedKey = "direct-message-conversations";
    }
    const shouldUseHighlyRatedToggle = !hideHeaders;
    const shouldShowHighlyRatedRows =
      highlyRatedRows.length > 0 && !shouldUseHighlyRatedToggle;
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
      key: virtualizedKey,
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
        {!hideHeaders && (
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
              renderWaveRow(row, !hidePin && row.wave.isPinned)
            }
            rows={animatedAnnouncementRows}
          />
        )}

        {!hideHeaders &&
          announcementRows.length > 0 &&
          (highlyRatedRows.length > 0 ||
            pinnedRows.length > 0 ||
            shouldShowBottomHeader) && (
            <div className="tw-mb-1 tw-mt-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-700" />
          )}

        {highlyRatedRows.length > 0 && (
          <>
            {shouldUseHighlyRatedToggle && (
              <>
                <SidebarCategoryLabel
                  label={t(SIDEBAR_LOCALE, "waves.sidebar.highlyRated")}
                  tooltipContent={highlyRatedInfoTooltip}
                  tooltipId={HIGHLY_RATED_INFO_TOOLTIP_ID}
                  showTooltipTrigger={!hasTouchScreen}
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
          (pinnedRows.length > 0 || shouldShowBottomHeader) && (
            <div className="tw-my-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-700" />
          )}

        {/* Conditionally show pinned section */}
        {!hideHeaders && pinnedRows.length > 0 && (
          <>
            <SidebarCategoryHeader
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

        {!hideHeaders && pinnedRows.length > 0 && shouldShowBottomHeader && (
          <div className="tw-my-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-700" />
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
        {!hasTouchScreen && (
          <ReactTooltip
            id={HIGHLY_RATED_INFO_TOOLTIP_ID}
            place="top"
            offset={8}
            opacity={1}
            style={TOOLTIP_STYLE}
            border="1px solid #4C4C55"
          />
        )}
      </div>
    );
  }
);

UnifiedWavesListWaves.displayName = "UnifiedWavesListWaves";
export default UnifiedWavesListWaves;
