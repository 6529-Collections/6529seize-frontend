"use client";

import WavePicture from "@/components/waves/WavePicture";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { usePrefetchWaveData } from "@/hooks/usePrefetchWaveData";
import { faBellSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
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
  readonly hasUnreadSubwaves?: boolean | undefined;
  readonly onToggleExpand?: ((waveId: string) => void) | undefined;
  readonly onPrefetchSubwaves?: ((waveId: string) => void) | undefined;
}

const getPresentNumber = (value: number | null): number | null => {
  if (value === null || value === 0 || !Number.isFinite(value)) {
    return null;
  }

  return value;
};

const BrainLeftSidebarWave: React.FC<BrainLeftSidebarWaveProps> = ({
  wave,
  onHover,
  showPin = true,
  isDirectMessage = false,
  depth = 0,
  canExpand = false,
  isExpanded = false,
  hasUnreadSubwaves = false,
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

  const formattedWaveName = useMemo(() => {
    if (wave.type === ApiWaveType.Chat) {
      const marker = "id-";
      const addressPrefix = `${marker}0x`;
      const markerIndex = wave.name.indexOf(addressPrefix);

      if (markerIndex !== -1) {
        const prefix = wave.name.slice(0, markerIndex + marker.length);
        const addressStart = markerIndex + marker.length;
        const candidateAddress = wave.name.slice(
          addressStart,
          addressStart + 42
        );

        if (isValidEthAddress(candidateAddress)) {
          const suffix = wave.name.slice(
            addressStart + candidateAddress.length
          );
          return `${prefix}${formatAddress(candidateAddress)}${suffix}`;
        }
      }
    }
    return wave.name;
  }, [wave.name, wave.type]);

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
  const subwavePrefetchTimerRef = useRef<
    ReturnType<typeof globalThis.setTimeout> | null
  >(null);
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

  useEffect(() => cancelSubwavePrefetch, [cancelSubwavePrefetch]);

  const handleWaveClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (event.defaultPrevented) return;
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button === 1
      ) {
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
    if (isActive)
      return "tw-ring-1 tw-ring-offset-2 tw-ring-offset-iron-900 tw-ring-primary-400";
    return "tw-ring-1 tw-ring-iron-700";
  };

  const rowPaddingClasses =
    depth === 1 ? "tw-pl-9 tw-pr-5" : "tw-px-5";
  const rowGapClasses = depth === 1 ? "tw-gap-x-2" : "tw-gap-x-4";
  const shouldShowExpandControl = canExpand && depth === 0;
  const expandButtonLabel = `${isExpanded ? "Collapse" : "Expand"} ${formattedWaveName} subwaves`;

  return (
    <div
      {...(!hasTouchScreen && {
        onMouseEnter: scheduleSubwavePrefetch,
        onMouseLeave: cancelSubwavePrefetch,
      })}
      className={`tw-group tw-relative tw-flex tw-items-start ${rowGapClasses} ${rowPaddingClasses} tw-py-2 tw-transition-all tw-duration-200 tw-ease-out ${
        isActive
          ? "tw-bg-iron-700/50 desktop-hover:hover:tw-bg-iron-700/70"
          : "desktop-hover:hover:tw-bg-iron-800/80"
      }`}
    >
      {shouldShowExpandControl ? (
        <button
          type="button"
          aria-label={expandButtonLabel}
          aria-expanded={isExpanded}
          onClick={handleToggleExpand}
          onFocus={scheduleSubwavePrefetch}
          onBlur={cancelSubwavePrefetch}
          className="tw-absolute tw-left-4 tw-top-8 tw-z-10 tw-flex tw-size-5 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-iron-950 tw-bg-iron-800 tw-p-0 tw-text-iron-200 tw-shadow-sm tw-transition-colors desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-text-white"
        >
          <ChevronRightIcon
            className={`tw-size-4 tw-transition-transform tw-duration-200 tw-ease-out ${
              isExpanded ? "tw-rotate-90" : ""
            }`}
            aria-hidden="true"
          />
          {hasUnreadSubwaves && (
            <span
              aria-hidden="true"
              className="tw-absolute tw-bottom-0 tw-right-0 tw-size-2 tw-rounded-full tw-bg-primary-400"
            />
          )}
        </button>
      ) : depth === 1 ? (
        <div className="tw-mt-2 tw-size-5 tw-flex-shrink-0" />
      ) : null}
      <Link
        href={href}
        prefetch={false}
        {...(!hasTouchScreen && { onMouseEnter: onWaveHover })}
        onClick={handleWaveClick}
        className={`tw-flex tw-flex-1 tw-space-x-3 tw-py-1 tw-no-underline tw-transition-all tw-duration-200 tw-ease-out ${
          isActive
            ? "tw-text-white desktop-hover:group-hover:tw-text-white"
            : "tw-text-iron-400 desktop-hover:group-hover:tw-text-iron-300"
        }`}
      >
        <div className="tw-relative">
          <div
            className={`tw-relative tw-size-8 tw-rounded-full tw-transition tw-duration-300 desktop-hover:group-hover:tw-brightness-110 ${getAvatarRingClasses()} ${
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
              <div className="tw-absolute tw-bottom-[-2px] tw-right-[-2px] tw-flex tw-size-3.5 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-950 tw-shadow-lg">
                <svg
                  className="tw-size-2.5 tw-flex-shrink-0 tw-text-[#E8D48A]"
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
              <div className="tw-absolute tw-right-[-4px] tw-top-[-4px] tw-flex tw-h-4 tw-min-w-4 tw-items-center tw-justify-center tw-rounded-full tw-bg-indigo-500 tw-px-1 tw-text-[10px] tw-font-medium tw-text-white tw-shadow-sm">
                {unreadCount > 99 ? "99+" : unreadCount}
              </div>
            )}
            {wave.isMuted && (
              <div className="tw-absolute tw-right-[-4px] tw-top-[-4px] tw-flex tw-size-4 tw-items-center tw-justify-center tw-rounded-full tw-bg-red tw-text-white tw-shadow-sm">
                <FontAwesomeIcon
                  icon={faBellSlash}
                  className="tw-size-2.5 tw-flex-shrink-0"
                />
              </div>
            )}
          </div>
        </div>
        <div className="tw-flex-1">
          <div className="tw-text-sm tw-font-medium">{formattedWaveName}</div>
          {latestDropTimestamp !== null && (
            <div className="tw-mt-0.5 tw-text-xs tw-text-iron-500">
              <span className="tw-pr-1">Last drop:</span>
              <BrainLeftSidebarWaveDropTime time={latestDropTimestamp} />
            </div>
          )}
        </div>
      </Link>
      {showPin && depth === 0 && (
        <BrainLeftSidebarWavePin waveId={wave.id} isPinned={!!wave.isPinned} />
      )}
    </div>
  );
};

export default BrainLeftSidebarWave;
