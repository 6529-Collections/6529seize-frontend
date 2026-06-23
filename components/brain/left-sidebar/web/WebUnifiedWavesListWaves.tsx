"use client";

import PrimaryButton from "@/components/utils/button/PrimaryButton";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import useCreateModalState from "@/hooks/useCreateModalState";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import { usePrefetchWaveData } from "@/hooks/usePrefetchWaveData";
import { faInfoCircle, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
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
import { SidebarWaveRowsSection } from "../waves/SidebarWaveRowsSection";
import SectionHeader from "../waves/SectionHeader";
import WavesFilterToggle from "../waves/WavesFilterToggle";
import { SidebarWaveTreeRowTransition } from "../waves/SidebarWaveTreeRowTransition";
import WebBrainLeftSidebarWave from "./WebBrainLeftSidebarWave";
import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import { useSeizeSettingsOptional } from "@/contexts/SeizeSettingsContext";
import {
  useSidebarWaveTree,
  type SidebarWaveTreeRow,
} from "@/hooks/useSidebarWaveTree";
import { useAnimatedSidebarWaveRows } from "@/hooks/useAnimatedSidebarWaveRows";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import {
  groupSidebarWavesForView,
  isValidSidebarWave,
} from "../waves/sidebarWaveListUtils";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

const EMPTY_WAVES_PLACEHOLDER_HEIGHT = "48px" as const;

const WAVE_ROW_HEIGHT_DEFAULT = 62 as const;
const WAVE_ROW_HEIGHT_COLLAPSED = 52 as const;
const SUBWAVE_ROW_HEIGHT = 54 as const;
const PROFILE_FEED_TOOLTIP_ID = "profile-feed-shortcut-tooltip";
const PROFILE_FEED_LABEL = "Profile Waves Feed";
const HIGHLY_RATED_INFO_TOOLTIP_ID = "web-waves-worth-checking-out-info";
const SIDEBAR_LOCALE = DEFAULT_LOCALE;
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

function MasonryGridIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="tw-size-4 tw-flex-shrink-0"
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}

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

function SidebarCategoryLabel({
  label,
  tooltipContent,
  tooltipId,
}: {
  readonly label: string;
  readonly tooltipContent?: string | undefined;
  readonly tooltipId?: string | undefined;
}) {
  return (
    <div className="tw-px-5 tw-pb-1.5 tw-pt-1 tw-text-[10px] tw-font-semibold tw-uppercase tw-leading-none tw-tracking-wide tw-text-iron-500">
      <span className="tw-inline-flex tw-items-center tw-gap-x-1.5">
        <span>{label}</span>
        {tooltipContent && tooltipId && (
          <span className="tw-relative tw-inline-flex tw-size-3 tw-items-center tw-justify-center">
            <button
              type="button"
              aria-label={tooltipContent}
              data-tooltip-id={tooltipId}
              data-tooltip-content={tooltipContent}
              className="tw-absolute tw-left-1/2 tw-top-1/2 tw-inline-flex tw-size-6 -tw-translate-x-1/2 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-600 tw-transition-colors active:tw-text-iron-300 focus:tw-text-iron-300 focus:tw-outline-none desktop-hover:hover:tw-text-iron-400"
            >
              <FontAwesomeIcon icon={faInfoCircle} className="tw-size-3" />
            </button>
          </span>
        )}
      </span>
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

function ProfileFeedAvatar({ isActive }: { readonly isActive: boolean }) {
  return (
    <div
      className={`tw-relative tw-size-8 tw-rounded-full tw-border tw-border-solid tw-transition tw-duration-200 desktop-hover:group-hover:tw-brightness-110 ${
        isActive
          ? "tw-border-primary-300/75 tw-opacity-100"
          : "tw-border-iron-700/80 tw-opacity-90 desktop-hover:group-hover:tw-border-iron-500/80 desktop-hover:group-hover:tw-opacity-100"
      }`}
    >
      <div
        className={`tw-h-full tw-w-full tw-rounded-full ${
          isActive ? "tw-bg-primary-500/90" : "tw-bg-iron-900"
        }`}
      />
      <div
        className={`tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center ${
          isActive ? "tw-text-primary-50" : "tw-text-iron-400"
        }`}
      >
        <MasonryGridIcon />
      </div>
    </div>
  );
}

function isModifiedClick(event: React.MouseEvent<HTMLAnchorElement>) {
  return (
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button === 1 ||
    event.button === 2
  );
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
        showCreateWaveButton ? (
          <CreateWaveButton onClick={onCreateWave} />
        ) : undefined
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

function WebProfileFeedShortcut({
  basePath,
  isCollapsed,
}: {
  readonly basePath: string;
  readonly isCollapsed: boolean;
}) {
  const { activeWave } = useMyStream();
  const isActive = activeWave.id === null;

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || isModifiedClick(event)) {
      return;
    }

    event.preventDefault();
    activeWave.set(null, { isDirectMessage: false });
  };

  if (isCollapsed) {
    return (
      <div
        className={`tw-group tw-flex tw-items-center tw-justify-center tw-py-2 tw-transition-all tw-duration-200 tw-ease-out ${
          isActive
            ? "tw-bg-iron-700/60 desktop-hover:hover:tw-bg-iron-700/70"
            : "desktop-hover:hover:tw-bg-iron-800/70"
        }`}
      >
        <Link
          href={basePath}
          prefetch={false}
          onClick={handleClick}
          aria-label={PROFILE_FEED_LABEL}
          aria-current={isActive ? "page" : undefined}
          className="tw-flex tw-items-center tw-justify-center tw-no-underline"
          data-tooltip-id={PROFILE_FEED_TOOLTIP_ID}
          data-tooltip-content={PROFILE_FEED_LABEL}
        >
          <ProfileFeedAvatar isActive={isActive} />
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`tw-group tw-flex tw-items-center tw-gap-x-4 tw-px-5 tw-py-2 tw-transition-all tw-duration-200 tw-ease-out ${
        isActive
          ? "tw-bg-iron-700/60 desktop-hover:hover:tw-bg-iron-700/70"
          : "desktop-hover:hover:tw-bg-iron-800/80"
      }`}
    >
      <Link
        href={basePath}
        prefetch={false}
        onClick={handleClick}
        aria-current={isActive ? "page" : undefined}
        className={`tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-space-x-3 tw-py-1 tw-no-underline tw-transition-all tw-duration-200 tw-ease-out ${
          isActive
            ? "tw-font-medium tw-text-white desktop-hover:group-hover:tw-text-white"
            : "tw-font-normal tw-text-iron-400 desktop-hover:group-hover:tw-text-iron-300"
        }`}
      >
        <ProfileFeedAvatar isActive={isActive} />
        <div className="tw-min-w-0 tw-flex-1">
          <div className="tw-truncate tw-text-sm">{PROFILE_FEED_LABEL}</div>
        </div>
      </Link>
    </div>
  );
}

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
  const { topLevelWaves, getRows, toggleParent } = useSidebarWaveTree({
    waves,
    activeWaveId: activeWave.id,
    activeParentWaveId: activeWave.parentWaveId,
    loadingSubwaveParentIds: streamWaves.loadingSubwaveParentIds,
    onParentExpand: streamWaves.loadSubwavesForParent,
    showExpandedSubwaves: !isCollapsed,
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
  const hasAnnouncementRows = animatedAnnouncementRows.length > 0;
  const hasHighlyRatedRows = animatedHighlyRatedRows.length > 0;
  const hasPinnedRows = animatedPinnedRows.length > 0;
  const virtualizedRows = animatedAllRows;
  const virtualizedAriaLabel = getVirtualizedAriaLabel({
    isDirectMessage,
    isJoinedFilterActive,
  });
  const bottomListLabel = getBottomListLabel(isJoinedFilterActive);
  const highlyRatedInfoTooltip = t(
    SIDEBAR_LOCALE,
    "waves.sidebar.highlyRatedInfoTooltip"
  );
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
    (row: SidebarWaveTreeRow) =>
      row.depth === 1 ? SUBWAVE_ROW_HEIGHT : rowHeight,
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

  const virtual = useVirtualizedWaves<SidebarWaveTreeRow>({
    items: virtualizedRows,
    key: virtualizedKey,
    scrollContainerRef: scrollContainerRef ?? listContainerRef,
    listContainerRef,
    rowHeight: getSidebarRowHeight,
    overscan: 5,
  });

  const renderWaveRow = (row: SidebarWaveTreeRow, showPin: boolean) => (
    <WebBrainLeftSidebarWave
      wave={row.wave}
      onHover={onHover}
      showPin={showPin && row.depth === 0}
      basePath={basePath}
      collapsed={isCollapsed}
      depth={row.depth}
      canExpand={row.canExpand && !isCollapsed}
      isExpanded={row.isExpanded}
      isLoadingSubwaves={row.isLoadingSubwaves}
      hasUnreadSubwaves={row.hasUnreadSubwaves && !row.isExpanded}
      isLastSubwave={row.isLastSubwave}
      onToggleExpand={toggleParent}
      onPrefetchSubwaves={streamWaves.prefetchSubwavesForParent}
    />
  );

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
                  !hidePin && !isCollapsed && row.wave.isPinned
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
                    tooltipContent={highlyRatedInfoTooltip}
                    tooltipId={HIGHLY_RATED_INFO_TOOLTIP_ID}
                  />
                  <HighlyRatedWavesToggle
                    paddingClassName="tw-px-5"
                    previewItems={highlyRatedPreviewItems}
                  />
                </>
              ) : (
                !hideHeaders &&
                !isCollapsed && (
                  <SidebarCategoryLabel
                    label={t(SIDEBAR_LOCALE, "waves.sidebar.highlyRated")}
                    tooltipContent={highlyRatedInfoTooltip}
                    tooltipId={HIGHLY_RATED_INFO_TOOLTIP_ID}
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
                  renderRow={(row) => renderWaveRow(row, false)}
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
                  renderWaveRow(row, !hidePin && !isCollapsed)
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
                    {renderWaveRow(row, !hidePin && !isCollapsed)}
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
            border="1px solid #4C4C55"
          />
          {shouldShowProfileFeedShortcut && (
            <ReactTooltip
              id={PROFILE_FEED_TOOLTIP_ID}
              place="right"
              offset={8}
              opacity={1}
              style={TOOLTIP_STYLE}
              border="1px solid #4C4C55"
            />
          )}
        </>
      )}
      <ReactTooltip
        id={HIGHLY_RATED_INFO_TOOLTIP_ID}
        place="top"
        offset={8}
        opacity={1}
        openOnClick
        closeOnScroll
        openEvents={{ mouseover: true, focus: true, click: true }}
        closeEvents={{ mouseout: true, blur: true }}
        globalCloseEvents={{
          escape: true,
          scroll: true,
          resize: true,
          clickOutsideAnchor: true,
        }}
        style={TOOLTIP_STYLE}
        border="1px solid #4C4C55"
      />
    </>
  );
};

WebUnifiedWavesListWaves.displayName = "WebUnifiedWavesListWaves";
export default WebUnifiedWavesListWaves;
