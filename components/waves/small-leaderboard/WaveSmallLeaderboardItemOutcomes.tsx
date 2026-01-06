"use client";

import React, { useState, useEffect } from "react";
import { Tooltip } from "react-tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAddressCard, faStar } from "@fortawesome/free-regular-svg-icons";
import { faAward } from "@fortawesome/free-solid-svg-icons";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { useWaveRankReward } from "@/hooks/waves/useWaveRankReward";

interface WaveSmallLeaderboardItemOutcomesProps {
  readonly drop: ApiDrop;
  readonly isMobile?: boolean | undefined;
}

export const WaveSmallLeaderboardItemOutcomes: React.FC<
  WaveSmallLeaderboardItemOutcomesProps
> = ({ drop, isMobile = false }) => {
  const [isTouch, setIsTouch] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsTouch("ontouchstart" in window);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    if (isTouch) {
      e.stopPropagation();
      setIsOpen(!isOpen);
    }
  };

  const { nicTotal, repTotal, manualOutcomes, isLoading } = useWaveRankReward({
    waveId: drop.wave.id,
    rank: drop.rank,
  });

  const totalOutcomes =
    (nicTotal ? 1 : 0) + (repTotal ? 1 : 0) + manualOutcomes.length;

  if (totalOutcomes === 0 && !isLoading) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={`tw-animate-pulse tw-h-6 tw-w-16 tw-bg-iron-800 tw-rounded-lg`} />
    )
  }

  const tooltipContent = (
    <div className="tw-p-3 tw-space-y-3 tw-min-w-[200px]">
      <div className="tw-space-y-2">
        <span className="tw-text-xs tw-font-medium tw-text-iron-400">
          Outcome
        </span>
        <div className="tw-space-y-1.5">
          {!!nicTotal && (
            <div className="tw-flex tw-items-center tw-justify-between">
              <div className="tw-flex tw-items-center tw-gap-2">
                <FontAwesomeIcon
                  icon={faAddressCard}
                  className="tw-size-4 tw-text-blue-300/70"
                />
                <span className="tw-text-xs tw-font-medium tw-text-iron-300">
                  NIC
                </span>
              </div>
              <span className="tw-text-xs tw-font-medium tw-text-blue-200/90">
                {nicTotal}
              </span>
            </div>
          )}
          {!!repTotal && (
            <div className="tw-flex tw-items-center tw-justify-between">
              <div className="tw-flex tw-items-center tw-gap-2">
                <FontAwesomeIcon
                  icon={faStar}
                  className="tw-size-4 tw-text-purple-300/70"
                />
                <span className="tw-text-xs tw-font-medium tw-text-iron-300">
                  Rep
                </span>
              </div>
              <span className="tw-text-xs tw-font-medium tw-text-purple-200/90">
                {repTotal}
              </span>
            </div>
          )}
          {manualOutcomes.map((outcome) => (
            <div
              key={outcome}
              className="tw-flex tw-items-center tw-justify-between">
              <div className="tw-flex tw-items-center tw-gap-2">
                <FontAwesomeIcon
                  icon={faAward}
                  className="tw-size-4 tw-text-amber-300/70"
                />
                <span className="tw-text-xs tw-font-medium tw-text-amber-100/90">
                  {outcome}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={handleClick}
        className={`tw-border-0 tw-rounded-lg tw-flex tw-items-center ${isMobile ? "tw-gap-4" : "tw-gap-2"
          } tw-min-w-6 tw-py-1.5 tw-px-2 tw-bg-iron-800 tw-ring-1 tw-ring-iron-700 ${isTouch ? "tw-cursor-pointer" : ""
          }`}
        data-tooltip-id={`wave-outcomes-${drop.id}`}>
        <span className="tw-text-xs tw-font-medium tw-text-iron-200">
          Outcome:
        </span>
        <div className="tw-flex tw-items-center tw-gap-2">
          {!!nicTotal && (
            <FontAwesomeIcon
              icon={faAddressCard}
              className="tw-size-4 tw-text-blue-300/70 tw-flex-shrink-0"
            />
          )}
          {!!repTotal && (
            <FontAwesomeIcon
              icon={faStar}
              className="tw-size-4 tw-text-purple-300/70 tw-flex-shrink-0"
            />
          )}
          {manualOutcomes.length > 0 && (
            <FontAwesomeIcon
              icon={faAward}
              className="tw-size-4 tw-text-amber-300/70 tw-flex-shrink-0"
            />
          )}
        </div>
      </button>
      <Tooltip
        id={`wave-outcomes-${drop.id}`}
        place="top"
        style={{
          backgroundColor: "#1F2937",
          color: "white",
          padding: "4px 8px",
          zIndex: 10,
        }}
        clickable={true}
        openEvents={isTouch ? { click: true } : { mouseenter: true }}
        closeEvents={isTouch ? { click: true } : { mouseleave: true }}
        globalCloseEvents={isTouch ? { clickOutsideAnchor: true } : {}}
      >
        {tooltipContent}
      </Tooltip>
    </>
  );
};
