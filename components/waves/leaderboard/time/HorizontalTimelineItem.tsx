import React from "react";
import { DecisionPoint } from "../../../../helpers/waves/time.types";
import { HorizontalTimelineDot } from "./HorizontalTimelineDot";
import { Time } from "../../../../helpers/time";

interface HorizontalTimelineItemProps {
  readonly decision: DecisionPoint;
  readonly isNext: boolean;
  readonly flexGrow?: boolean;
}

/**
 * Renders a single item in the horizontal timeline
 */
export const HorizontalTimelineItem: React.FC<HorizontalTimelineItemProps> = ({
  decision,
  isNext,
  flexGrow = false
}) => {
  const isPast = decision.timestamp < Time.currentMillis();
  
  return (
    <div
      className={`tw-relative tw-flex tw-flex-col tw-items-center tw-z-10 ${
        flexGrow ? "tw-flex-1" : "tw-flex-shrink-0 tw-w-[80px]"
      }`}
    >
      {/* Dot indicator ABOVE the line */}
      <div className="tw-mb-3 tw-z-10">
        <HorizontalTimelineDot isNext={isNext} isPast={isPast} />
      </div>

      {/* Information BELOW the line */}
      <div className="tw-mt-2 tw-z-10 tw-text-center">
        {/* Status badge - only for next or past */}
        {isNext && (
          <span className="tw-flex tw-justify-center tw-mb-1">
            <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-primary-500/20 tw-px-1.5 tw-py-0.5 tw-text-[10px] tw-font-medium tw-text-primary-400">
              Next
            </span>
          </span>
        )}
        {isPast && (
          <span className="tw-flex tw-justify-center tw-mb-1">
            <span className="tw-inline-flex tw-items-center tw-rounded-full tw-px-1.5 tw-py-0.5 tw-text-[10px] tw-font-medium tw-text-iron-500">
              Completed
            </span>
          </span>
        )}

        {/* Date text */}
        <div
          className={`tw-text-xs ${
            isNext
              ? "tw-text-iron-100"
              : "tw-text-iron-400"
          } tw-font-medium`}
        >
          {new Date(
            decision.timestamp
          ).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </div>

        {/* Time text */}
        <div className="tw-text-xs tw-text-iron-500 tw-mt-0.5 tw-font-mono">
          {new Date(
            decision.timestamp
          ).toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
};
