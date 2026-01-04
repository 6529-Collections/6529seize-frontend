"use client";

import WavePicture from "@/components/waves/WavePicture";
import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesList";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { usePrefetchWaveData } from "@/hooks/usePrefetchWaveData";
import { faBellSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import React, { useCallback, useMemo } from "react";
import { formatAddress, isValidEthAddress } from "../../../../helpers/Helpers";
import {
  getWaveHomeRoute,
  getWaveRoute,
} from "../../../../helpers/navigation.helpers";
import useDeviceInfo from "../../../../hooks/useDeviceInfo";
import BrainLeftSidebarWaveDropTime from "./BrainLeftSidebarWaveDropTime";
import BrainLeftSidebarWavePin from "./BrainLeftSidebarWavePin";

interface BrainLeftSidebarWaveProps {
  readonly wave: MinimalWave;
  readonly onHover: (waveId: string) => void;
  readonly showPin?: boolean | undefined;
  readonly isDirectMessage?: boolean | undefined;
}

const BrainLeftSidebarWave: React.FC<BrainLeftSidebarWaveProps> = ({
  wave,
  onHover,
  showPin = true,
  isDirectMessage = false,
}) => {
  const { activeWave } = useMyStream();
  const { id: activeWaveId, set: setActiveWave } = activeWave;
  const prefetchWaveData = usePrefetchWaveData();
  const { isApp, hasTouchScreen } = useDeviceInfo();
  const isDropWave = wave.type !== ApiWaveType.Chat;

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
      serialNo: wave.firstUnreadDropSerialNo ?? undefined,
      extraParams: wave.firstUnreadDropSerialNo
        ? { divider: String(wave.firstUnreadDropSerialNo) }
        : undefined,
      isDirectMessage,
      isApp,
    });
  }, [
    activeWaveId,
    isApp,
    isDirectMessage,
    wave.id,
    wave.firstUnreadDropSerialNo,
  ]);

  const unreadCount = Math.max(wave.unreadDropsCount, wave.newDropsCount.count);
  const haveNewDrops = unreadCount > 0;

  const onWaveHover = useCallback(() => {
    if (wave.id !== activeWaveId) {
      onHover(wave.id);
      prefetchWaveData(wave.id);
    }
  }, [activeWaveId, onHover, prefetchWaveData, wave.id]);

  const isActive = wave.id === activeWaveId;

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
        serialNo: nextWaveId ? wave.firstUnreadDropSerialNo : null,
        divider: nextWaveId ? wave.firstUnreadDropSerialNo : null,
      });
    },
    [
      setActiveWave,
      activeWaveId,
      isDirectMessage,
      onWaveHover,
      wave.id,
      wave.firstUnreadDropSerialNo,
    ]
  );

  const getAvatarRingClasses = () => {
    if (isActive)
      return "tw-ring-1 tw-ring-offset-2 tw-ring-offset-iron-900 tw-ring-primary-400";
    return "tw-ring-1 tw-ring-iron-700";
  };

  return (
    <div
      className={`tw-group tw-flex tw-items-start tw-gap-x-4 tw-px-5 tw-py-2 tw-transition-all tw-duration-200 tw-ease-out ${
        isActive
          ? "tw-bg-iron-700/50 desktop-hover:hover:tw-bg-iron-700/70"
          : "desktop-hover:hover:tw-bg-iron-800/80"
      }`}>
      <Link
        href={href}
         {...(!hasTouchScreen && { onMouseEnter: onWaveHover })}
        onClick={handleWaveClick}
        className={`tw-flex tw-flex-1 tw-space-x-3 tw-no-underline tw-py-1 tw-transition-all tw-duration-200 tw-ease-out ${
          isActive
            ? "tw-text-white desktop-hover:group-hover:tw-text-white"
            : "tw-text-iron-400 desktop-hover:group-hover:tw-text-iron-300"
        }`}>
        <div className="tw-relative">
          <div
            className={`tw-relative tw-size-8 tw-rounded-full tw-transition tw-duration-300 desktop-hover:group-hover:tw-brightness-110 ${getAvatarRingClasses()} ${
              isActive
                ? "tw-opacity-100"
                : "tw-opacity-80 desktop-hover:group-hover:tw-opacity-100"
            }`}>
            <WavePicture
              name={wave.name}
              picture={wave.picture}
              contributors={wave.contributors}
            />
            {isDropWave && (
              <div className="tw-absolute tw-bottom-[-2px] tw-right-[-2px] tw-size-3.5 tw-flex tw-items-center tw-justify-center tw-bg-iron-950 tw-rounded-full tw-shadow-lg">
                <svg
                  className="tw-size-2.5 tw-flex-shrink-0 tw-text-[#E8D48A]"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 576 512">
                  <path
                    fill="currentColor"
                    d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"
                  />
                </svg>
              </div>
            )}
            {!isActive && haveNewDrops && !wave.isMuted && (
              <div className="tw-absolute tw-top-[-4px] tw-right-[-4px] tw-bg-indigo-500 tw-text-white tw-rounded-full tw-h-4 tw-min-w-4 tw-flex tw-items-center tw-justify-center tw-text-[10px] tw-font-medium tw-px-1 tw-shadow-sm">
                {unreadCount > 99 ? "99+" : unreadCount}
              </div>
            )}
            {wave.isMuted && (
              <div className="tw-absolute tw-top-[-4px] tw-right-[-4px] tw-bg-red tw-text-white tw-rounded-full tw-size-4 tw-flex tw-items-center tw-justify-center tw-shadow-sm">
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
          {!!wave.newDropsCount.latestDropTimestamp && (
            <div className="tw-mt-0.5 tw-text-xs tw-text-iron-500">
              <span className="tw-pr-1">Last drop:</span>
              <BrainLeftSidebarWaveDropTime
                time={wave.newDropsCount.latestDropTimestamp}
              />
            </div>
          )}
        </div>
      </Link>
      {showPin && (
        <BrainLeftSidebarWavePin waveId={wave.id} isPinned={!!wave.isPinned} />
      )}
    </div>
  );
};

export default BrainLeftSidebarWave;
