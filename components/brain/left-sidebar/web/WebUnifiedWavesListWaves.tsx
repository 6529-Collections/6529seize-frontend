"use client";

import PrimaryButton from "@/components/utils/button/PrimaryButton";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import useCreateModalState from "@/hooks/useCreateModalState";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import React, { useCallback, useMemo, useRef } from "react";
import { Tooltip as ReactTooltip } from "react-tooltip";
import type { VirtualItem } from "../../../../hooks/useVirtualizedWaves";
import { useVirtualizedWaves } from "../../../../hooks/useVirtualizedWaves";
import { useAuth } from "../../../auth/Auth";
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
import {
  groupSidebarWaves,
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

function SidebarCategoryLabel({ label }: { readonly label: string }) {
  return (
    <div className="tw-px-5 tw-pb-1 tw-pt-2 tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
      {label}
    </div>
  );
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
  const { connectedProfile } = useAuth();
  const { openWave, isApp } = useCreateModalState();
  const isTouchDevice = useIsTouchDevice();
  const seizeSettings = useSeizeSettingsOptional();
  const { activeWave, waves: streamWaves } = useMyStream();
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

  const {
    announcementWaves,
    highlyRatedWaves,
    pinnedWaves,
    followingWaves,
    allWaves,
  } = useMemo(
    () => {
      if (isDirectMessage) {
        return {
          announcementWaves: [],
          highlyRatedWaves: [],
          pinnedWaves: [],
          followingWaves: [],
          allWaves: topLevelWaves,
        };
      }

      return groupSidebarWaves({
        isAnnouncementsWave:
          seizeSettings === null
            ? undefined
            : (waveId) => seizeSettings.isAnnouncementsWave(waveId),
        waves: topLevelWaves,
      });
    },
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
  const animatedFollowingRows = useAnimatedSidebarWaveRows(
    followingRows,
    rowAnimationOptions
  );
  const animatedAllRows = useAnimatedSidebarWaveRows(
    allRows,
    rowAnimationOptions
  );
  const hasAnnouncementRows = animatedAnnouncementRows.length > 0;
  const hasHighlyRatedRows = animatedHighlyRatedRows.length > 0;
  const hasPinnedRows = animatedPinnedRows.length > 0;
  const hasFollowingRows = animatedFollowingRows.length > 0;
  const hasAllRows = animatedAllRows.length > 0;
  const virtualizedRows = hasAllRows ? animatedAllRows : animatedFollowingRows;
  const staticFollowingRows = hasAllRows ? animatedFollowingRows : [];
  const hasVirtualizedFollowingRows = !hasAllRows && hasFollowingRows;
  const virtualizedAriaLabel = hasAllRows
    ? isDirectMessage
      ? t(SIDEBAR_LOCALE, "waves.sidebar.directMessagesAriaLabel")
      : t(SIDEBAR_LOCALE, "waves.sidebar.allQualityRankedAriaLabel")
    : t(SIDEBAR_LOCALE, "waves.sidebar.followingListAriaLabel");
  const headerPaddingClassName = "tw-px-4";
  const filterPaddingClassName = "tw-px-4";
  const sectionClassName = isCollapsed
    ? "tw-flex tw-flex-col tw-items-center tw-gap-y-2"
    : "tw-flex tw-flex-col";

  const rowHeight = isCollapsed
    ? WAVE_ROW_HEIGHT_COLLAPSED
    : WAVE_ROW_HEIGHT_DEFAULT;
  const getSidebarRowHeight = useCallback(
    (row: SidebarWaveTreeRow) =>
      row.depth === 1 ? SUBWAVE_ROW_HEIGHT : rowHeight,
    [rowHeight]
  );

  const virtual = useVirtualizedWaves<SidebarWaveTreeRow>({
    items: virtualizedRows,
    key: isDirectMessage
      ? "web-direct-message-conversations"
      : hasAllRows
        ? "web-unified-waves-all"
        : "web-unified-waves-following",
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
        {!hideHeaders && !hideToggle && !isCollapsed && (
          <div className={`tw-mt-4 tw-flex tw-pb-3 ${filterPaddingClassName}`}>
            <WavesFilterToggle />
          </div>
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
            (hasHighlyRatedRows ||
              hasPinnedRows ||
              hasFollowingRows ||
              hasAllRows) && (
              <div className="tw-my-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-700" />
            )}

          {hasHighlyRatedRows && (
            <>
              {!hideHeaders && !isCollapsed && (
                <SidebarCategoryLabel
                  label={t(SIDEBAR_LOCALE, "waves.sidebar.highlyRated")}
                />
              )}
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
            </>
          )}
          {hasHighlyRatedRows &&
            !hideHeaders &&
            (hasPinnedRows || hasFollowingRows || hasAllRows) && (
              <div className="tw-my-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-700" />
            )}
          {!hideHeaders && hasPinnedRows && (
            <>
              {!isCollapsed && (
                <SidebarCategoryLabel
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
          {!hideHeaders &&
            hasPinnedRows &&
            (hasFollowingRows || hasAllRows) && (
              <div className="tw-my-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-700" />
            )}
          {staticFollowingRows.length > 0 && (
            <>
              {!hideHeaders && !isCollapsed && (
                <SidebarCategoryLabel
                  label={t(SIDEBAR_LOCALE, "waves.sidebar.following")}
                />
              )}
              <SidebarWaveRowsSection
                ariaLabel={t(
                  SIDEBAR_LOCALE,
                  "waves.sidebar.followingAriaLabel"
                )}
                className={sectionClassName}
                getRowHeight={getSidebarRowHeight}
                isRowVisible={(row) =>
                  isVisibleSectionRow({ row, sectionName: "following" })
                }
                renderRow={(row) =>
                  renderWaveRow(row, !hidePin && !isCollapsed)
                }
                rows={staticFollowingRows}
                transitionClassName="tw-w-full"
              />
            </>
          )}
          {!hideHeaders && staticFollowingRows.length > 0 && hasAllRows && (
            <div className="tw-my-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-700" />
          )}
          {!hideHeaders && !isCollapsed && hasAllRows && (
            <SidebarCategoryLabel
              label={t(SIDEBAR_LOCALE, "waves.sidebar.all")}
            />
          )}
          {!hideHeaders && !isCollapsed && hasVirtualizedFollowingRows && (
            <SidebarCategoryLabel
              label={t(SIDEBAR_LOCALE, "waves.sidebar.following")}
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
    </>
  );
};

WebUnifiedWavesListWaves.displayName = "WebUnifiedWavesListWaves";
export default WebUnifiedWavesListWaves;
