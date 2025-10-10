"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Tooltip } from "react-tooltip";
import { usePrefetchWaveData } from "@/hooks/usePrefetchWaveData";
import { useWaveData } from "@/hooks/useWaveData";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import { ApiWaveType } from "@/generated/models/ObjectSerializer";
import WavePicture from "@/components/waves/WavePicture";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { getWaveHomeRoute, getWaveRoute } from "@/helpers/navigation.helpers";

interface BrainContentPinnedWaveProps {
  readonly waveId: string;
  readonly active: boolean;
  readonly onMouseEnter: (waveId: string) => void;
  readonly onMouseLeave: () => void;
  readonly onRemove: (waveId: string) => void;
}

const BrainContentPinnedWave: React.FC<BrainContentPinnedWaveProps> = ({
  waveId,
  active,
  onMouseEnter,
  onMouseLeave,
  onRemove,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefetchWaveData = usePrefetchWaveData();
  const { registerWave } = useMyStream();
  const { isApp } = useDeviceInfo();
  const { data: wave } = useWaveData({
    waveId,
    onWaveNotFound: () => onRemove(waveId),
  });
  const isMobile = useIsMobileDevice();
  const isDropWave = wave && wave.wave.type !== ApiWaveType.Chat;
  const getHref = (waveId: string) => {
    const currentWaveId = searchParams?.get('wave') ?? undefined;
    const isDirectMessage = wave?.chat?.scope?.group?.is_direct_message ?? false;

    if (currentWaveId === waveId) {
      return getWaveHomeRoute({ isDirectMessage, isApp });
    }

    return getWaveRoute({
      waveId,
      isDirectMessage,
      isApp,
    });
  };

  const onLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onMouseLeave();
    // Navigate to the new wave
    router.push(getHref(waveId));
  };

  const onHover = () => {
    onMouseEnter(waveId);
    const currentWaveId = searchParams?.get('wave') ?? undefined;
    if (waveId === currentWaveId) return;
    registerWave(waveId);
    prefetchWaveData(waveId);
  };

  const onRemoveClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove(waveId);
  };

  return (
    <div
      className={`tw-relative tw-group tw-transition-all tw-duration-300 ${
        !active ? "tw-opacity-70" : ""
      }`}
      onMouseEnter={onHover}
      onMouseLeave={onMouseLeave}>
      <Link
        href={getHref(waveId)}
        onClick={onLinkClick}
        className="tw-flex tw-items-center tw-no-underline tw-group">
        <div
          data-tooltip-id={`wave-tooltip-${waveId}`}
          className={`
            tw-relative tw-h-6 tw-px-1.5 tw-rounded-lg tw-flex tw-items-center tw-gap-1
            tw-cursor-pointer tw-transition-all tw-duration-300
            ${
              active
                ? "tw-bg-primary-500/15 tw-ring-primary-400/30 tw-ring-1 tw-ring-inset"
                : "tw-bg-iron-800 tw-ring-iron-700 tw-ring-1 tw-ring-inset"
            }
          `}>
          <div className="tw-relative tw-size-3.5 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-overflow-hidden tw-bg-iron-900">
            {wave ? (
              <WavePicture
                name={wave.name}
                picture={wave.picture}
                contributors={wave.contributors_overview.map((c) => ({
                  pfp: c.contributor_pfp,
                }))}
              />
            ) : (
              <div className="tw-w-full tw-h-full tw-bg-iron-800" />
            )}
          </div>
          <span
            className={`tw-relative tw-text-[11px] tw-font-medium tw-whitespace-nowrap ${
              active ? "tw-text-primary-400" : "tw-text-iron-200"
            }`}>
            {wave?.name}
          </span>
          {isDropWave && (
            <svg
              className="tw-size-3 tw-flex-shrink-0 tw-text-[#E8D48A]"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 576 512">
              <path
                fill="currentColor"
                d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z"
              />
            </svg>
          )}
          <button
            type="button"
            onClick={onRemoveClick}
            aria-label="Remove wave"
            className="tw-relative -tw-mr-0.5 tw-border-0 tw-bg-transparent tw-p-0.5 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-text-iron-400 tw-cursor-pointer tw-opacity-100  desktop-hover:hover:tw-text-red tw-transition-all tw-duration-300">
            <svg
              className="tw-size-4 tw-flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true">
              <path
                d="M17 7L7 17M7 7L17 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        {!isMobile && (
          <Tooltip
            id={`wave-tooltip-${waveId}`}
            place="top"
            style={{
              backgroundColor: "#1F2937",
              color: "white",
              padding: "4px 8px",
            }}>
            <span className="tw-text-xs">{wave?.name ?? ""}</span>
          </Tooltip>
        )}
      </Link>
    </div>
  );
};

export default BrainContentPinnedWave;
