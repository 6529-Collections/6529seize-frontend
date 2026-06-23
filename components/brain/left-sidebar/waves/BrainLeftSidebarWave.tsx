"use client";

import WavePicture from "@/components/waves/WavePicture";
import {
  hasWaveTrustSummaryScore,
  WaveTrustSignals,
} from "@/components/waves/WaveTrustSignals";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { usePrefetchWaveData } from "@/hooks/usePrefetchWaveData";
import { faBellSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { formatAddress, isValidEthAddress } from "../../../../helpers/Helpers";
import {
  getWaveHomeRoute,
  getWaveRoute,
} from "../../../../helpers/navigation.helpers";
import useDeviceInfo from "../../../../hooks/useDeviceInfo";
import BrainLeftSidebarWaveDropTime from "./BrainLeftSidebarWaveDropTime";
import BrainLeftSidebarWavePin from "./BrainLeftSidebarWavePin";
import { SidebarWaveExpandControl } from "./SidebarWaveExpandControl";
import { getSidebarWaveRowLayoutClasses } from "./sidebarWaveRowLayout";
import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";

const SUBWAVE_PREFETCH_HOVER_INTENT_MS = 150;

interface BrainLeftSidebarWaveProps {
  readonly wave: MinimalWave;
  readonly onHover: (waveId: string) => void;
  readonly showPin?: boolean | undefined;
  readonly isDirectMessage?: boolean | undefined;
  readonly depth?: 0 | 1 | undefined;
  readonly canExpand?: boolean | undefined;
  readonly isExpanded?: boolean | undefined;
  readonly isLoadingSubwaves?: boolean | undefined;
  readonly hasUnreadSubwaves?: boolean | undefined;
  readonly isLastSubwave?: boolean | undefined;
  readonly onToggleExpand?: ((waveId: string) => void) | undefined;
  readonly onPrefetchSubwaves?: ((waveId: string) => void) | undefined;
}

const getPresentNumber = (value: number | null): number | null => {
  if (value === null || value === 0 || !Number.isFinite(value)) {
    return null;
  }

  return value;
};

const DROP_ICON_CLASSES = "tw-size-2.5 tw-flex-shrink-0 tw-text-[#E8D48A]";
const UNREAD_BADGE_CLASSES =
  "tw-absolute tw-right-[-4px] tw-top-[-4px] tw-flex tw-h-4 tw-min-w-4 tw-items-center tw-justify-center tw-rounded-full tw-bg-indigo-600 tw-px-1 tw-text-[10px] tw-font-medium tw-text-white tw-shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_6px_14px_rgba(0,0,0,0.32)]";
const MUTED_BADGE_CLASSES =
  "tw-absolute tw-right-[-4px] tw-top-[-4px] tw-flex tw-size-4 tw-items-center tw-justify-center tw-rounded-full tw-bg-red tw-text-white tw-shadow-sm";
const MUTED_ICON_CLASSES = "tw-size-2.5 tw-flex-shrink-0";

const getFormattedWaveName = (wave: MinimalWave): string => {
  if (wave.type !== ApiWaveType.Chat) {
    return wave.name;
  }

  const marker = "id-";
  const addressPrefix = `${marker}0x`;
  const markerIndex = wave.name.indexOf(addressPrefix);

  if (markerIndex === -1) {
    return wave.name;
  }

  const prefix = wave.name.slice(0, markerIndex + marker.length);
  const addressStart = markerIndex + marker.length;
  const candidateAddress = wave.name.slice(addressStart, addressStart + 42);

  if (!isValidEthAddress(candidateAddress)) {
    return wave.name;
  }

  const suffix = wave.name.slice(addressStart + candidateAddress.length);
  return `${prefix}${formatAddress(candidateAddress)}${suffix}`;
};

const isModifiedAnchorClick = (event: React.MouseEvent<HTMLAnchorElement>) =>
  event.metaKey ||
  event.ctrlKey ||
  event.shiftKey ||
  event.altKey ||
  event.button === 1;

const BrainLeftSidebarWave: React.FC<BrainLeftSidebarWaveProps> = ({
  wave,
  onHover,
  showPin = true,
  isDirectMessage = false,
  depth = 0,
  canExpand = false,
  isExpanded = false,
  isLoadingSubwaves = false,
  hasUnreadSubwaves = false,
  isLastSubwave = false,
  onToggleExpand,
  onPrefetchSubwaves,
}) => {
  const { activeWave } = useMyStream();
  const { id: activeWaveId, set: setActiveWave } = activeWave;
  const prefetchWaveData = usePrefetchWaveData();
  const { isApp, hasTouchScreen } = useDeviceInfo();
  const isDropWave = wave.type !== ApiWaveType.Chat;
  const firstUnreadDropSerialNo = getPresentNumber(
    wave.firstUnreadDropSerialNo
  );
  const latestDropTimestamp = getPresentNumber(
    wave.newDropsCount.latestDropTimestamp
  );
  const hasSummaryScore = hasWaveTrustSummaryScore(wave.waveScore);
  const shouldShowDropTime = latestDropTimestamp !== null;

  const formattedWaveName = useMemo(() => getFormattedWaveName(wave), [wave]);

  const href = useMemo(() => {
    if (activeWaveId === wave.id) {
      return getWaveHomeRoute({ isDirectMessage, isApp });
    }
    return getWaveRoute({
      waveId: wave.id,
      extraParams:
        firstUnreadDropSerialNo !== null
          ? { divider: String(firstUnreadDropSerialNo) }
          : undefined,
      isDirectMessage,
      isApp,
    });
  }, [activeWaveId, isApp, isDirectMessage, wave.id, firstUnreadDropSerialNo]);

  const unreadCount = Math.max(wave.unreadDropsCount, wave.newDropsCount.count);
  const haveNewDrops = unreadCount > 0;

  const onWaveHover = useCallback(() => {
    if (wave.id !== activeWaveId) {
      onHover(wave.id);
      prefetchWaveData(wave.id);
    }
  }, [activeWaveId, onHover, prefetchWaveData, wave.id]);

  const isActive = wave.id === activeWaveId;
  const subwavePrefetchTimerRef = useRef<ReturnType<
    typeof globalThis.setTimeout
  > | null>(null);
  const shouldPrefetchSubwaves = Boolean(
    canExpand && depth === 0 && !hasTouchScreen && onPrefetchSubwaves
  );

  const cancelSubwavePrefetch = useCallback(() => {
    if (subwavePrefetchTimerRef.current === null) {
      return;
    }

    globalThis.clearTimeout(subwavePrefetchTimerRef.current);
    subwavePrefetchTimerRef.current = null;
  }, []);

  const scheduleSubwavePrefetch = useCallback(() => {
    if (!shouldPrefetchSubwaves) {
      return;
    }

    cancelSubwavePrefetch();
    subwavePrefetchTimerRef.current = globalThis.setTimeout(() => {
      subwavePrefetchTimerRef.current = null;
      onPrefetchSubwaves?.(wave.id);
    }, SUBWAVE_PREFETCH_HOVER_INTENT_MS);
  }, [
    cancelSubwavePrefetch,
    onPrefetchSubwaves,
    shouldPrefetchSubwaves,
    wave.id,
  ]);

  const handleRowMouseEnter = useCallback(() => {
    scheduleSubwavePrefetch();
    onWaveHover();
  }, [onWaveHover, scheduleSubwavePrefetch]);

  useEffect(() => cancelSubwavePrefetch, [cancelSubwavePrefetch]);

  const handleWaveClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (event.defaultPrevented) return;
      if (isModifiedAnchorClick(event)) {
        return;
      }
      event.preventDefault();
      onWaveHover();
      const nextWaveId = wave.id === activeWaveId ? null : wave.id;
      setActiveWave(nextWaveId, {
        isDirectMessage,
        divider: nextWaveId !== null ? firstUnreadDropSerialNo : null,
      });
    },
    [
      setActiveWave,
      activeWaveId,
      isDirectMessage,
      onWaveHover,
      wave.id,
      firstUnreadDropSerialNo,
    ]
  );

  const handleToggleExpand = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      onToggleExpand?.(wave.id);
    },
    [onToggleExpand, wave.id]
  );

  const getAvatarRingClasses = () => {
    if (isActive) return activeRingClasses;
    return "tw-ring-1 tw-ring-iron-700";
  };

  const isChildRow = depth === 1;
  const shouldShowExpandControl = canExpand && depth === 0;
  const shouldShowPinButton = showPin && depth === 0;
  const {
    rowPaddingClasses,
    rowGapClasses,
    linkGapClasses,
    rowHeightClasses,
  } =
    getSidebarWaveRowLayoutClasses({
      isChildRow,
      variant: "app",
    });
  const avatarSizeClasses = isChildRow ? "tw-size-7" : "tw-size-8";
  const activeRingClasses = isChildRow
    ? "tw-ring-1 tw-ring-offset-1 tw-ring-offset-iron-900 tw-ring-primary-400"
    : "tw-ring-1 tw-ring-offset-2 tw-ring-offset-iron-900 tw-ring-primary-400";
  const dropBadgeClasses = isChildRow
    ? "tw-absolute tw-bottom-[-1px] tw-right-[-1px] tw-flex tw-size-3.5 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-950 tw-shadow-lg"
    : "tw-absolute tw-bottom-[-2px] tw-right-[-2px] tw-flex tw-size-3.5 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-950 tw-shadow-lg";
  const rowVerticalPaddingClasses = isChildRow ? "tw-py-1.5" : "tw-py-2";

  return (
    <div
      {...(!hasTouchScreen && {
        onMouseEnter: handleRowMouseEnter,
        onMouseLeave: cancelSubwavePrefetch,
      })}
      className={`tw-group tw-relative tw-flex tw-items-start ${rowHeightClasses} ${rowGapClasses} ${rowPaddingClasses} ${rowVerticalPaddingClasses} tw-transition-all tw-duration-200 tw-ease-out ${
        isActive
          ? "tw-bg-iron-700/50 desktop-hover:hover:tw-bg-iron-700/70"
          : "desktop-hover:hover:tw-bg-iron-800/80"
      }`}
    >
      {isChildRow && (
        <span
          aria-hidden="true"
          className={`tw-absolute -tw-top-1 tw-left-14 tw-w-px tw-bg-iron-700/60 md:tw-left-[52px] ${
            isLastSubwave ? "tw-bottom-4" : "-tw-bottom-1"
          }`}
        />
      )}
      <div
        className={`tw-flex tw-min-w-0 tw-flex-1 ${linkGapClasses} tw-transition-all tw-duration-200 tw-ease-out ${
          isActive
            ? "tw-text-white desktop-hover:group-hover:tw-text-white"
            : "tw-text-iron-400 desktop-hover:group-hover:tw-text-iron-300"
        }`}
      >
        <div
          aria-hidden="true"
          data-testid="sidebar-wave-avatar"
          className="tw-relative tw-flex-shrink-0"
        >
          <div
            className={`tw-relative ${avatarSizeClasses} tw-rounded-full tw-transition tw-duration-300 desktop-hover:group-hover:tw-brightness-110 ${getAvatarRingClasses()} ${
              isActive
                ? "tw-opacity-100"
                : "tw-opacity-80 desktop-hover:group-hover:tw-opacity-100"
            }`}
          >
            <WavePicture
              name={wave.name}
              picture={wave.picture}
              contributors={wave.contributors}
            />
            {isDropWave && (
              <div className={dropBadgeClasses}>
                <svg
                  className={DROP_ICON_CLASSES}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 576 512"
                >
                  <path
                    fill="currentColor"
                    d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"
                  />
                </svg>
              </div>
            )}
            {!isActive && haveNewDrops && !wave.isMuted && (
              <div className={UNREAD_BADGE_CLASSES}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </div>
            )}
            {wave.isMuted && (
              <div className={MUTED_BADGE_CLASSES}>
                <FontAwesomeIcon
                  icon={faBellSlash}
                  className={MUTED_ICON_CLASSES}
                />
              </div>
            )}
          </div>
          {hasUnreadSubwaves && (
            <span
              aria-hidden="true"
              className="tw-absolute tw-right-[-3px] tw-top-[-3px] tw-size-2.5 tw-rounded-full tw-border tw-border-solid tw-border-iron-950 tw-bg-primary-400"
            />
          )}
        </div>
        <div className="tw-min-w-0 tw-flex-1">
          <div className="tw-flex tw-min-w-0 tw-items-start tw-gap-2">
            <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-y-0.5">
              <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-1.5">
                <Link
                  href={href}
                  prefetch={false}
                  onClick={handleWaveClick}
                  className={`tw-static tw-block tw-min-w-0 tw-flex-shrink tw-no-underline before:tw-absolute before:tw-inset-0 before:tw-z-[5] before:tw-content-[''] focus-visible:tw-outline-none focus-visible:before:tw-ring-2 focus-visible:before:tw-ring-inset focus-visible:before:tw-ring-primary-400 ${
                    isActive
                      ? "tw-text-white desktop-hover:group-hover:tw-text-white"
                      : "tw-text-iron-400 desktop-hover:group-hover:tw-text-iron-300"
                  }`}
                >
                  <span className="tw-relative tw-z-[6] tw-block tw-truncate tw-text-sm tw-font-medium tw-leading-tight">
                    {formattedWaveName}
                  </span>
                </Link>
                {shouldShowExpandControl && (
                  <span className="tw-relative tw-z-10 tw-inline-flex">
                    <SidebarWaveExpandControl
                      formattedWaveName={formattedWaveName}
                      isExpanded={isExpanded}
                      isLoading={isLoadingSubwaves}
                      onBlur={cancelSubwavePrefetch}
                      onClick={handleToggleExpand}
                      onFocus={scheduleSubwavePrefetch}
                      shouldShowButton={shouldShowExpandControl}
                    />
                  </span>
                )}
                {shouldShowPinButton && (
                  <BrainLeftSidebarWavePin
                    waveId={wave.id}
                    isPinned={!!wave.isPinned}
                    compact
                    className="tw-relative tw-z-10 tw-shrink-0"
                  />
                )}
              </div>
              {shouldShowDropTime && (
                <div className="tw-inline-flex tw-min-w-0 tw-items-center tw-whitespace-nowrap tw-text-xs tw-leading-none tw-text-iron-500 tw-transition-colors tw-duration-200 desktop-hover:group-hover:tw-text-iron-400">
                  <BrainLeftSidebarWaveDropTime time={latestDropTimestamp} />
                </div>
              )}
            </div>
            {hasSummaryScore && (
              <span className="tw-relative tw-z-10 tw-ml-auto tw-mt-[1px] tw-shrink-0">
                <WaveTrustSignals
                  waveRep={wave.waveRep}
                  waveScore={wave.waveScore}
                  variant="sidebar-inline"
                  mode="summary"
                />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrainLeftSidebarWave;
