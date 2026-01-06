"use client";

import React, { useState, useEffect } from "react";
import { Tooltip } from "react-tooltip";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { useWaveRankReward } from "@/hooks/waves/useWaveRankReward";

interface WaveWinnersSmallOutcomeProps {
  readonly drop: ExtendedDrop;
}

export const WaveWinnersSmallOutcome: React.FC<
  WaveWinnersSmallOutcomeProps
> = ({ drop }) => {
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

  const { nicTotal, repTotal, manualOutcomes } = useWaveRankReward({
    waveId: drop.wave.id,
    rank: drop.rank,
  });

  if (!(nicTotal || repTotal || manualOutcomes.length)) {
    return null;
  }

  const tooltipContent = (
    <div className="tw-space-y-3 tw-rounded-xl tw-border tw-border-iron-800/60 tw-bg-iron-900/95 tw-p-3.5 tw-shadow-[0_8px_32px_rgba(0,0,0,0.35)] tw-backdrop-blur-xl lg:tw-min-w-[220px]">
      <div className="tw-space-y-2.5">
        <span className="tw-text-xs tw-font-medium tw-text-iron-400">
          Outcome Details
        </span>
        <div className="tw-space-y-2">
          <div className="tw-flex tw-items-center tw-justify-between tw-rounded-lg tw-bg-iron-800/40 tw-p-2">
            <div className="tw-flex tw-items-center tw-gap-2">
              <svg
                className="tw-size-4 tw-flex-shrink-0 tw-text-[#A4C2DB]"
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="none"
              >
                <path
                  d="M9 6.75H15M9 12H15M9 17.25H12M3.75 19.5H20.25C21.0784 19.5 21.75 18.8284 21.75 18V6C21.75 5.17157 21.0784 4.5 20.25 4.5H3.75C2.92157 4.5 2.25 5.17157 2.25 6V18C2.25 18.8284 2.92157 19.5 3.75 19.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="tw-text-sm tw-font-medium tw-text-iron-200">
                NIC
              </span>
            </div>
            <span className="tw-text-sm tw-font-semibold tw-text-[#A4C2DB]">
              {formatNumberWithCommas(nicTotal)}
            </span>
          </div>

          <div className="tw-flex tw-flex-col tw-gap-y-1 tw-rounded-lg tw-bg-iron-800/40 tw-p-2">
            <div className="tw-flex tw-items-center tw-justify-between">
              <div className="tw-flex tw-items-center tw-gap-2">
                <svg
                  className="tw-size-4 tw-flex-shrink-0 tw-text-[#C3B5D9]"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                >
                  <path
                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                <span className="tw-text-sm tw-font-medium tw-text-iron-200">
                  Rep
                </span>
              </div>
              <span className="tw-text-sm tw-font-semibold tw-text-[#C3B5D9]">
                {formatNumberWithCommas(repTotal)}
              </span>
            </div>
          </div>

          {manualOutcomes.map((outcome) => (
            <div
              key={`manual-${outcome}`}
              className="tw-flex tw-items-center tw-justify-between tw-rounded-lg tw-bg-iron-800/40 tw-p-2"
            >
              <div className="tw-flex tw-items-center tw-gap-2">
                <svg
                  className="tw-size-4 tw-flex-shrink-0 tw-text-[#D4C5AA]"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                >
                  <path
                    d="M12 18v-3m0-3v.01M12.75 3.25h-1.5L8.5 7H4.75l.5 3.5L2 13l3.25 2.5-.5 3.5h3.75l2.75 3.75h1.5L15.5 19h3.75l-.5-3.5L22 13l-3.25-2.5.5-3.5H15.5l-2.75-3.75z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="tw-text-sm tw-font-medium tw-text-iron-200">
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
        onClick={(e) => {
          e.stopPropagation();
          handleClick(e);
        }}
        className="tw-flex tw-min-w-6 tw-items-center tw-gap-2 tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-px-2 tw-py-1.5 tw-ring-1 tw-ring-iron-700"
        data-tooltip-id={`outcome-small-${drop.id}`}
      >
        <span className="tw-text-xs tw-font-normal tw-text-iron-200">
          Outcome:
        </span>
        <div className="tw-flex tw-items-center tw-gap-2">
          {!!nicTotal && (
            <svg
              className="tw-size-4 tw-flex-shrink-0 tw-text-[#A4C2DB]"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
            >
              <path
                d="M9 6.75H15M9 12H15M9 17.25H12M3.75 19.5H20.25C21.0784 19.5 21.75 18.8284 21.75 18V6C21.75 5.17157 21.0784 4.5 20.25 4.5H3.75C2.92157 4.5 2.25 5.17157 2.25 6V18C2.25 18.8284 2.92157 19.5 3.75 19.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {!!repTotal && (
            <svg
              className="tw-size-4 tw-flex-shrink-0 tw-text-[#C3B5D9]"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
            >
              <path
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          )}
          {!!manualOutcomes.length && (
            <svg
              className="tw-size-4 tw-flex-shrink-0 tw-text-[#D4C5AA]"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
            >
              <path
                d="M12 18v-3m0-3v.01M12.75 3.25h-1.5L8.5 7H4.75l.5 3.5L2 13l3.25 2.5-.5 3.5h3.75l2.75 3.75h1.5L15.5 19h3.75l-.5-3.5L22 13l-3.25-2.5.5-3.5H15.5l-2.75-3.75z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </button>
      <Tooltip
        id={`outcome-small-${drop.id}`}
        place="top"
        delayShow={200}
        style={{
          backgroundColor: "#1F2937",
          color: "white",
          padding: "4px 8px",
        }}
      >
        {tooltipContent}
      </Tooltip>
    </>
  );
};
