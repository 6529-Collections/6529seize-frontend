import React from "react";
import { DecisionPoint } from "../../../../helpers/waves/time.types";
import { HorizontalTimelineItem } from "./HorizontalTimelineItem";

interface HorizontalTimelineProps {
  readonly decisions: DecisionPoint[];
  readonly nextDecisionTime: number | null;
}

/**
 * Renders a horizontal timeline with decision points
 */
export const HorizontalTimeline: React.FC<HorizontalTimelineProps> = ({
  decisions,
  nextDecisionTime
}) => {
  return (
    <div className="tw-overflow-hidden tw-rounded-lg">
      <div className="tw-relative">
        {/* Scrollable container */}
        <div className="tw-overflow-x-auto tw-pb-2 tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
          {/* Flexbox timeline with fixed width elements */}
          <div className="tw-flex tw-gap-4 tw-max-w-20 tw-mx-4">
            {decisions.map((decision) => {
              const isNext =
                !!nextDecisionTime &&
                decision.timestamp === nextDecisionTime;

              return (
                <HorizontalTimelineItem
                  key={decision.id}
                  decision={decision}
                  isNext={isNext}
                />
              );
            })}

            {/* Horizontal line BETWEEN dots and information */}
            <div className="tw-absolute tw-h-0.5 tw-bg-iron-800 tw-left-0 tw-right-0 tw-top-[20px]"></div>
          </div>
        </div>
      </div>
    </div>
  );
};