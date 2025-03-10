import React from "react";
import { format } from "date-fns";
import { ApiWaveDecision } from "../../../generated/models/ApiWaveDecision";
import { AnimatedAccordionContent } from "../../common/AnimatedAccordionContent";
import { WaveWinnersRoundContent } from "./WaveWinnersRoundContent";
import { ApiWave } from "../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";

interface WaveWinnersTimelineItemProps {
  readonly point: ApiWaveDecision;
  readonly roundNumber: number;
  readonly isExpanded: boolean;
  readonly toggleExpanded: () => void;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly wave: ApiWave;
  readonly isInteractive: boolean;
}

export const WaveWinnersTimelineItem: React.FC<
  WaveWinnersTimelineItemProps
> = ({
  point,
  roundNumber,
  isExpanded,
  toggleExpanded,
  onDropClick,
  wave,
  isInteractive,
}) => {
  const time = format(new Date(point.decision_time), "h:mm a");
  const hasWinners = point.winners.length > 0;

  return (
    <div className="tw-relative">
      {/* Timeline connector dot */}
      <div className="tw-absolute tw-left-[-13px] tw-top-2.5">
        <div className="tw-size-4 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-bg-iron-800">
          <div
            className={`tw-rounded-full ${
              hasWinners ? "tw-bg-green tw-size-2.5" : "tw-bg-iron-700 tw-size-2"
            }`}
          ></div>
        </div>
      </div>

      <div
        className={`tw-rounded-lg tw-overflow-hidden ${
          hasWinners ? "tw-bg-iron-900" : ""
        } ${
          hasWinners && isInteractive
            ? "tw-transition-colors hover:tw-bg-iron-800/70 tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-mx-4"
            : ""
        } ${
          hasWinners
            ? "tw-border-l-2 tw-border-green/40 tw-border-y-0 tw-border-r-0"
            : ""
        }`}
      >
        <button
          onClick={toggleExpanded}
          disabled={!isInteractive}
          className={`tw-w-full tw-text-left tw-px-5 ${
            hasWinners ? "tw-py-3" : "tw-py-2"
          } tw-flex tw-items-center tw-justify-between tw-bg-transparent tw-border-0 ${
            isInteractive ? "tw-cursor-pointer" : "tw-cursor-default"
          }`}
        >
          <div className="tw-flex tw-flex-col">
            <div className="tw-flex tw-items-center tw-gap-3">
              <span
                className={`tw-text-base tw-font-medium ${
                  hasWinners ? "tw-text-white/90" : "tw-text-iron-400"
                }`}
              >
                Winners Round {roundNumber}
              </span>
              <span className="tw-text-sm tw-text-iron-400">{time}</span>
              {hasWinners ? (
                <span className="tw-inline-flex tw-items-center tw-py-0.5 tw-px-2 tw-rounded-md tw-bg-iron-800 tw-text-xs tw-font-medium tw-text-green">
                  {point.winners.length} winner
                  {point.winners.length !== 1 ? "s" : ""}
                </span>
              ) : (
                <span className="tw-text-xs tw-text-iron-500">
                  No winners in this round
                </span>
              )}
            </div>
          </div>

          {isInteractive && (
            <div
              className={`tw-h-7 tw-w-7 tw-rounded-full tw-flex tw-items-center tw-justify-center 
              tw-bg-iron-800 tw-transition-all
              ${isExpanded ? "tw-rotate-180 tw-bg-iron-700" : ""}`}
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
          )}
        </button>

        {isInteractive && (
          <AnimatedAccordionContent isVisible={isExpanded}>
            <div className="tw-px-5 tw-pb-4 tw-space-y-4 tw-bg-black">
              <WaveWinnersRoundContent
                winners={point.winners}
                onDropClick={onDropClick}
                wave={wave}
                isLoading={false}
              />
            </div>
          </AnimatedAccordionContent>
        )}
      </div>
    </div>
  );
};