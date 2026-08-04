import React from "react";
import type { DecisionPoint } from "@/helpers/waves/time.types";
import { HorizontalTimelineDot } from "./HorizontalTimelineDot";
import { Time } from "@/helpers/time";

interface HorizontalTimelineItemProps {
  readonly decision: DecisionPoint;
  readonly isNext: boolean;
  readonly flexGrow?: boolean | undefined;
}

/**
 * Renders a single item in the horizontal timeline
 */
export const HorizontalTimelineItem: React.FC<HorizontalTimelineItemProps> = ({
  decision,
  isNext,
  flexGrow = false,
}) => {
  const isPast = decision.timestamp < Time.currentMillis();

  return (
    <div
      className={`tw-relative tw-flex tw-flex-col tw-items-center tw-z-10 ${
        flexGrow
          ? "tw-flex-1"
          : "tw-w-[60px] tw-flex-shrink-0 @[24rem]/timeline:tw-w-[80px]"
      }`}
    >
      <div className="tw-z-10 tw-mb-2">
        <HorizontalTimelineDot isNext={isNext} isPast={isPast} />
      </div>

      <div className="tw-z-10 tw-mt-1 tw-text-center">
        <div className="tw-mb-1 tw-flex tw-h-3 tw-items-center tw-justify-center">
          {isNext && (
            <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-primary-500/15 tw-px-1.5 tw-py-0.5 tw-text-[9px] tw-font-semibold tw-leading-none tw-text-primary-300">
              Next
            </span>
          )}
          {isPast && (
            <span className="tw-text-[9px] tw-font-medium tw-uppercase tw-leading-none tw-tracking-wide tw-text-iron-600">
              <span className="@[24rem]/timeline:tw-hidden">Done</span>
              <span className="tw-hidden @[24rem]/timeline:tw-inline">
                Completed
              </span>
            </span>
          )}
        </div>

        <div
          className={`tw-text-[11px] tw-font-medium ${
            isNext ? "tw-text-iron-200" : "tw-text-iron-400"
          }`}
        >
          {new Date(decision.timestamp).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </div>

        <div className="tw-mt-0.5 tw-font-mono tw-text-[10px] tw-text-iron-600">
          {new Date(decision.timestamp).toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
};
