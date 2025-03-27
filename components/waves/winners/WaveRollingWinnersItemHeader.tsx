import React from "react";
import { format } from "date-fns";
import { ApiWaveDecision } from "../../../generated/models/ApiWaveDecision";

interface WaveRollingWinnersItemHeaderProps {
  readonly point: ApiWaveDecision;
  readonly index: number;
  readonly totalRounds: number;
  readonly isExpanded: boolean;
  readonly toggleExpanded: () => void;
}

export const WaveRollingWinnersItemHeader: React.FC<
  WaveRollingWinnersItemHeaderProps
> = ({ point, index, totalRounds, isExpanded, toggleExpanded }) => {
  // Mobile view
  const mobileView = (
    <div className="tw-flex tw-flex-col tw-w-full sm:tw-hidden">
      <div className="tw-flex tw-items-center tw-justify-between tw-w-full tw-mb-1 tw-pr-8">
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="tw-flex-shrink-0 tw-size-6 tw-rounded-md tw-bg-iron-800 tw-flex tw-items-center tw-justify-center">
            <span
              className={`tw-text-xs tw-font-medium ${
                index === 0
                  ? "tw-text-primary-400"
                  : "tw-text-iron-400"
              }`}
            >
              {totalRounds - index}
            </span>
          </div>
          <span className="tw-text-sm tw-font-medium tw-text-white/90">
            Winners Round {totalRounds - index}
          </span>
        </div>
        <div className="tw-flex tw-items-center">
          <span className="tw-py-0.5 tw-px-1.5 tw-rounded-md tw-bg-iron-800/80 tw-text-xs tw-font-medium tw-text-iron-300">
            {point.winners.length} winner{point.winners.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="tw-flex tw-items-center tw-pl-9">
        <div className="tw-flex tw-items-center tw-gap-1.5">
          <span className="tw-text-xs tw-text-iron-400">
            {format(new Date(point.decision_time), "MMM d, yyyy")}
          </span>
          <span className="tw-size-1 tw-rounded-full tw-bg-iron-600/60"></span>
          <span className="tw-text-xs tw-text-iron-400">
            {format(new Date(point.decision_time), "h:mm a")}
          </span>
        </div>
      </div>
    </div>
  );

  // Desktop view
  const desktopView = (
    <div className="tw-hidden sm:tw-flex tw-items-center tw-gap-3">
      <div className="tw-flex-shrink-0 tw-size-6 tw-rounded-md tw-bg-iron-800 tw-flex tw-items-center tw-justify-center">
        <span
          className={`tw-text-xs tw-font-medium ${
            index === 0
              ? "tw-text-primary-400"
              : "tw-text-iron-400"
          }`}
        >
          {totalRounds - index}
        </span>
      </div>

      <div className="tw-flex tw-items-center">
        <span className="tw-text-sm tw-font-medium tw-text-white/90">
          Winners Round {totalRounds - index}
        </span>

        <div className="tw-flex tw-items-center tw-gap-1.5 tw-ml-2">
          <span className="tw-text-xs tw-text-iron-400">
            {format(new Date(point.decision_time), "EEE, MMM d, yyyy")}
          </span>
          <span className="tw-size-1 tw-rounded-full tw-bg-iron-600/60"></span>
          <span className="tw-text-xs tw-text-iron-400">
            {format(new Date(point.decision_time), "h:mm a")}
          </span>
        </div>

        <div className="tw-flex tw-items-center tw-ml-2">
          <span className="tw-py-0.5 tw-px-1.5 tw-rounded-md tw-bg-iron-800/80 tw-text-xs tw-font-medium tw-text-iron-300">
            {point.winners.length} winner{point.winners.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <button
      onClick={toggleExpanded}
      className="tw-w-full tw-flex tw-items-start sm:tw-items-center tw-justify-between tw-px-4 tw-py-3 tw-bg-iron-900 hover:tw-bg-iron-800/50 tw-transition-colors tw-rounded-lg tw-group tw-border-0 tw-relative"
    >
      {mobileView}
      {desktopView}

      <div className="tw-absolute sm:tw-relative tw-right-4 tw-top-3 sm:tw-top-auto sm:tw-right-auto">
        <div
          className={`tw-h-7 tw-w-7 tw-rounded-full tw-flex tw-items-center tw-justify-center 
            tw-bg-iron-800 tw-transition-all
            ${isExpanded ? "tw-rotate-180 tw-bg-primary-900/50" : ""}`}
        >
          <svg
            className="tw-size-4 tw-text-iron-300 tw-flex-shrink-0"
            fill="none"
            aria-hidden="true"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </button>
  );
};
