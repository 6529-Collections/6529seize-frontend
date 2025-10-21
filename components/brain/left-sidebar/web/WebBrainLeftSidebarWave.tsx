"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePrefetchWaveData } from "../../../../hooks/usePrefetchWaveData";
import { ApiWaveType } from "../../../../generated/models/ApiWaveType";
import WavePicture from "../../../waves/WavePicture";
import BrainLeftSidebarWaveDropTime from "../waves/BrainLeftSidebarWaveDropTime";
import { MinimalWave } from "../../../../contexts/wave/hooks/useEnhancedWavesList";
import BrainLeftSidebarWavePin from "../waves/BrainLeftSidebarWavePin";
import { formatAddress, isValidEthAddress } from "../../../../helpers/Helpers";
import { Tooltip } from "react-tooltip";
import useDeviceInfo from "@/hooks/useDeviceInfo";

interface WebBrainLeftSidebarWaveProps {
  readonly wave: MinimalWave;
  readonly onHover: (waveId: string) => void;
  readonly showPin?: boolean;
  readonly basePath?: string;
  readonly condensed?: boolean;
}

const WebBrainLeftSidebarWave: React.FC<WebBrainLeftSidebarWaveProps> = ({
  wave,
  onHover,
  showPin = true,
  basePath = "/waves",
  condensed = false,
}) => {
  const searchParams = useSearchParams();
  const prefetchWaveData = usePrefetchWaveData();
  const isDropWave = wave.type !== ApiWaveType.Chat;
  const { hasTouchScreen } = useDeviceInfo();

  const getHref = (waveId: string) => {
    const currentWaveId = searchParams?.get("wave") ?? undefined;
    if (currentWaveId === waveId) {
      return basePath;
    }
    const params = new URLSearchParams();
    params.set("wave", waveId);
    return `${basePath}?${params.toString()}`;
  };

  const haveNewDrops = wave.newDropsCount.count > 0;

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

  const onWaveHover = (waveId: string) => {
    const currentWaveId = searchParams?.get("wave") ?? undefined;
    if (waveId !== currentWaveId) {
      onHover(waveId);
      prefetchWaveData(waveId);
    }
  };

  const isActive = wave.id === (searchParams?.get("wave") ?? undefined);
  const tooltipId = `wave-condensed-${wave.id}`;
  const showTooltip = condensed && !hasTouchScreen;

  if (condensed) {
    return (
      <div
        className={`tw-group tw-flex tw-items-center tw-justify-center tw-py-2 tw-transition-all tw-duration-200 tw-ease-out ${
          isActive
            ? "tw-bg-iron-700/60 desktop-hover:hover:tw-bg-iron-700/70"
            : "desktop-hover:hover:tw-bg-iron-800/70"
        }`}
      >
        <Link
          href={getHref(wave.id)}
          onMouseEnter={() => onWaveHover(wave.id)}
          className="tw-flex tw-items-center tw-justify-center tw-no-underline"
          {...(showTooltip ? { "data-tooltip-id": tooltipId } : {})}
        >
          <div className="tw-relative">
            <div
              className={`tw-relative tw-size-8 tw-rounded-full tw-transition tw-duration-300 desktop-hover:group-hover:tw-brightness-110 ${
                isActive
                  ? "tw-opacity-100 tw-ring-1 tw-ring-offset-2 tw-ring-offset-iron-950 tw-ring-white/30"
                  : "tw-opacity-80 desktop-hover:group-hover:tw-opacity-100 tw-ring-1 tw-ring-white/20"
              }`}
            >
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
                    viewBox="0 0 576 512"
                  >
                    <path
                      fill="currentColor"
                      d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"
                    />
                  </svg>
                </div>
              )}
              {!isActive && haveNewDrops && (
                <div className="tw-absolute tw-top-[-4px] tw-right-[-4px] tw-bg-indigo-500 tw-text-white tw-rounded-full tw-h-4 tw-min-w-4 tw-flex tw-items-center tw-justify-center tw-text-[10px] tw-font-medium tw-px-1 tw-shadow-sm">
                  {wave.newDropsCount.count}
                </div>
              )}
            </div>
          </div>
        </Link>
        {showTooltip && (
          <Tooltip
            id={tooltipId}
            place="right"
            positionStrategy="fixed"
            style={{
              background: "#37373E",
              color: "white",
              padding: "6px 10px",
              fontSize: "12px",
              fontWeight: 500,
              borderRadius: "6px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
              zIndex: 10000,
            }}
          >
            <span className="tw-text-xs">
              {formattedWaveName}
            </span>
          </Tooltip>
        )}
      </div>
    );
  }

  return (
    <div
      className={`tw-group tw-flex tw-items-start tw-gap-x-4 tw-px-5 tw-py-2 tw-transition-all tw-duration-200 tw-ease-out ${
        isActive
          ? "tw-bg-iron-700/60 desktop-hover:hover:tw-bg-iron-700/70"
          : "desktop-hover:hover:tw-bg-iron-800/80"
      }`}
    >
      <Link
        href={getHref(wave.id)}
        onMouseEnter={() => onWaveHover(wave.id)}
        className={`tw-flex tw-flex-1 tw-space-x-3 tw-no-underline tw-py-1 tw-transition-all tw-duration-200 tw-ease-out ${
          isActive
            ? "tw-text-white desktop-hover:group-hover:tw-text-white tw-font-medium"
            : "tw-text-iron-400 desktop-hover:group-hover:tw-text-iron-300 tw-font-normal"
        }`}
      >
        <div className="tw-relative">
          <div
            className={`tw-relative tw-size-8 tw-rounded-full tw-transition tw-duration-300 desktop-hover:group-hover:tw-brightness-110 ${
              isActive
                ? "tw-opacity-100  tw-ring-1 tw-ring-offset-2 tw-ring-offset-iron-950 tw-ring-white/30"
                : "tw-opacity-80 desktop-hover:group-hover:tw-opacity-100 tw-ring-1 tw-ring-white/20"
            }`}
          >
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
                  viewBox="0 0 576 512"
                >
                  <path
                    fill="currentColor"
                    d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"
                  />
                </svg>
              </div>
            )}
            {!isActive && haveNewDrops && (
              <div className="tw-absolute tw-top-[-4px] tw-right-[-4px] tw-bg-indigo-500 tw-text-white tw-rounded-full tw-h-4 tw-min-w-4 tw-flex tw-items-center tw-justify-center tw-text-[10px] tw-font-medium tw-px-1 tw-shadow-sm">
                {wave.newDropsCount.count}
              </div>
            )}
          </div>
        </div>
        <div className="tw-flex-1">
          <div className="tw-text-sm -tw-mt-0.5 tw-mb-0.5">
            {formattedWaveName}
          </div>
          {!!wave.newDropsCount.latestDropTimestamp && (
            <div className="tw-text-xs tw-text-iron-500">
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

export default WebBrainLeftSidebarWave;
