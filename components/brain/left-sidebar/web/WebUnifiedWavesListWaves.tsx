"use client";

import PrimaryButton from "@/components/utils/button/PrimaryButton";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import useCreateModalState from "@/hooks/useCreateModalState";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import React, { useMemo, useRef } from "react";
import { Tooltip as ReactTooltip } from "react-tooltip";
import type { VirtualItem } from "../../../../hooks/useVirtualizedWaves";
import { useVirtualizedWaves } from "../../../../hooks/useVirtualizedWaves";
import { useAuth } from "../../../auth/Auth";
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

function isValidWave(wave: unknown): wave is MinimalWave {
  if (wave === null || wave === undefined || typeof wave !== "object") {
    return false;
  }

  const w = wave as MinimalWave;
  return (
    typeof w.id === "string" &&
    w.id.length > 0 &&
    typeof w.name === "string" &&
    typeof w.isPinned === "boolean"
  );
}

const EMPTY_WAVES_PLACEHOLDER_HEIGHT = "48px" as const;

const WAVE_ROW_HEIGHT_DEFAULT = 62 as const;
const WAVE_ROW_HEIGHT_COLLAPSED = 52 as const;
const PROFILE_FEED_TOOLTIP_ID = "profile-feed-shortcut-tooltip";
const PROFILE_FEED_LABEL = "Profile Waves Feed";
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
    onParentExpand: streamWaves.loadSubwavesForParent,
  });

  const showCreateWaveButton = !isApp && !!connectedProfile;
  const shouldShowProfileFeedShortcut = !hideHeaders && showProfileFeedShortcut;

  const { announcementWaves, officialWaves, pinnedWaves, regularWaves } =
    useMemo(() => {
      const announcements: MinimalWave[] = [];
      const official: MinimalWave[] = [];
      const pinned: MinimalWave[] = [];
      const regular: MinimalWave[] = [];

      for (const wave of topLevelWaves) {
        if (seizeSettings?.isAnnouncementsWave(wave.id)) {
          announcements.push(wave);
        } else if (wave.isOfficial) {
          official.push(wave);
        } else if (wave.isPinned) {
          pinned.push(wave);
        } else {
          regular.push(wave);
        }
      }

      return {
        announcementWaves: announcements,
        officialWaves: official,
        pinnedWaves: pinned,
        regularWaves: regular,
      };
    }, [topLevelWaves, seizeSettings]);

  const announcementRows = useMemo(
    () => getRows(announcementWaves),
    [announcementWaves, getRows]
  );
  const officialRows = useMemo(
    () => getRows(officialWaves),
    [officialWaves, getRows]
  );
  const pinnedRows = useMemo(
    () => getRows(pinnedWaves),
    [pinnedWaves, getRows]
  );
  const regularRows = useMemo(
    () => getRows(regularWaves),
    [regularWaves, getRows]
  );
  const animatedAnnouncementRows =
    useAnimatedSidebarWaveRows(announcementRows);
  const animatedOfficialRows = useAnimatedSidebarWaveRows(officialRows);
  const animatedPinnedRows = useAnimatedSidebarWaveRows(pinnedRows);
  const animatedRegularRows = useAnimatedSidebarWaveRows(regularRows);

  const rowHeight = isCollapsed
    ? WAVE_ROW_HEIGHT_COLLAPSED
    : WAVE_ROW_HEIGHT_DEFAULT;

  const virtual = useVirtualizedWaves<SidebarWaveTreeRow>(
    animatedRegularRows,
    "web-unified-waves-regular",
    scrollContainerRef ?? listContainerRef,
    listContainerRef,
    rowHeight,
    5
  );

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
      hasUnreadSubwaves={row.hasUnreadSubwaves && !row.isExpanded}
      onToggleExpand={toggleParent}
      onPrefetchSubwaves={streamWaves.prefetchSubwavesForParent}
    />
  );

  return (
    <>
      <div className="tw-flex tw-flex-col">
        {!hideHeaders &&
          (isCollapsed ? (
            showCreateWaveButton && (
              <div className="tw-mb-3.5 tw-flex tw-justify-center tw-px-2">
                <div
                  data-tooltip-id="create-wave-tooltip"
                  data-tooltip-content="Create wave"
                >
                  <PrimaryButton
                    onClicked={openWave}
                    loading={false}
                    disabled={false}
                    padding="tw-p-2.5"
                  >
                    <FontAwesomeIcon
                      icon={faPlus}
                      className="tw-size-4 tw-flex-shrink-0"
                    />
                  </PrimaryButton>
                </div>
              </div>
            )
          ) : (
            <SectionHeader
              label="Waves"
              rightContent={
                showCreateWaveButton ? (
                  <div
                    data-tooltip-id="create-wave-tooltip"
                    data-tooltip-content="Create wave"
                  >
                    <PrimaryButton
                      onClicked={openWave}
                      loading={false}
                      disabled={false}
                      padding="tw-p-2.5"
                    >
                      <FontAwesomeIcon
                        icon={faPlus}
                        className="tw-size-4 tw-flex-shrink-0"
                      />
                    </PrimaryButton>
                  </div>
                ) : undefined
              }
            />
          ))}
        {!hideHeaders && !hideToggle && !isCollapsed && (
          <div className="tw-mt-4 tw-flex tw-px-4 tw-pb-3">
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
          {announcementRows.length > 0 && (
            <section
              className={`tw-flex tw-flex-col ${
                isCollapsed ? "tw-items-center tw-gap-y-2" : ""
              }`}
              aria-label="Announcement waves"
            >
              {animatedAnnouncementRows
                .filter((row) => {
                  const wave = row.wave;
                  if (!isValidWave(wave)) {
                    console.warn("Invalid announcement wave object", wave);
                    return false;
                  }
                  return true;
                })
                .map((row) => (
                  <SidebarWaveTreeRowTransition
                    key={row.key}
                    row={row}
                    rowHeight={rowHeight}
                    className="tw-w-full"
                  >
                    {renderWaveRow(
                      row,
                      !hidePin && !isCollapsed && row.wave.isPinned
                    )}
                  </SidebarWaveTreeRowTransition>
                ))}
            </section>
          )}
          {announcementRows.length > 0 &&
            !hideHeaders &&
            (officialRows.length > 0 ||
              pinnedRows.length > 0 ||
              regularRows.length > 0) && (
              <div className="tw-my-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-700" />
            )}
          {officialRows.length > 0 && (
            <section
              className={`tw-flex tw-flex-col ${
                isCollapsed ? "tw-items-center tw-gap-y-2" : ""
              }`}
              aria-label="Official waves"
            >
              {animatedOfficialRows
                .filter((row) => {
                  const wave = row.wave;
                  if (!isValidWave(wave)) {
                    console.warn("Invalid official wave object", wave);
                    return false;
                  }
                  return true;
                })
                .map((row) => (
                  <SidebarWaveTreeRowTransition
                    key={row.key}
                    row={row}
                    rowHeight={rowHeight}
                    className="tw-w-full"
                  >
                    {renderWaveRow(row, false)}
                  </SidebarWaveTreeRowTransition>
                ))}
            </section>
          )}
          {officialRows.length > 0 &&
            !hideHeaders &&
            (pinnedRows.length > 0 || regularRows.length > 0) && (
              <div className="tw-my-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-700" />
            )}
          {!hideHeaders && pinnedRows.length > 0 && (
            <section
              className={`tw-flex tw-flex-col ${
                isCollapsed ? "tw-items-center tw-gap-y-2" : ""
              }`}
              aria-label="Pinned waves"
            >
              {animatedPinnedRows
                .filter((row) => {
                  const wave = row.wave;
                  if (!isValidWave(wave)) {
                    console.warn("Invalid pinned wave object", wave);
                    return false;
                  }
                  return true;
                })
                .map((row) => (
                  <SidebarWaveTreeRowTransition
                    key={row.key}
                    row={row}
                    rowHeight={rowHeight}
                    className="tw-w-full"
                  >
                    {renderWaveRow(row, !hidePin && !isCollapsed)}
                  </SidebarWaveTreeRowTransition>
                ))}
            </section>
          )}
          {!hideHeaders &&
            pinnedRows.length > 0 &&
            regularRows.length > 0 && (
              <div className="tw-my-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-700" />
            )}
          {animatedRegularRows.length > 0 ? (
            <section
              ref={listContainerRef}
              style={{
                height: virtual.totalHeight,
                position: "relative",
              }}
              aria-label="Regular waves list"
            >
              {virtual.virtualItems.map((v: VirtualItem) => {
                if (v.index === animatedRegularRows.length) {
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
                const row = animatedRegularRows[v.index];
                const wave = row?.wave;
                if (!isValidWave(wave)) {
                  console.warn("Invalid wave object at index", v.index, wave);
                  return null;
                }
                return (
                  <SidebarWaveTreeRowTransition
                    key={row.key}
                    row={row}
                    rowHeight={rowHeight}
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
