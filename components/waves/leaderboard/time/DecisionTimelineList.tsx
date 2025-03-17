import React from "react";
import { DecisionPoint } from "../../../../helpers/waves/time.types";
import { DecisionTimelineItem } from "./DecisionTimelineItem";

interface DecisionTimelineListProps {
  readonly decisions: DecisionPoint[];
  readonly nextDecisionTime: number | null;
  readonly isRollingWave: boolean;
}

/**
 * Renders the list of decision points in the timeline
 */
export const DecisionTimelineList: React.FC<DecisionTimelineListProps> = ({
  decisions,
  nextDecisionTime,
  isRollingWave,
}) => {
  return (
    <div className="tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/10">
      <div className="tw-relative tw-py-2">
        <div className="tw-ml-2.5 tw-relative">
          <div className="tw-absolute tw-w-0.5 tw-bg-white/10 tw-top-0 tw-bottom-0 tw-left-2"></div>
          <div className="tw-flex tw-flex-col tw-gap-4 tw-pr-2 tw-overflow-x-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 tw-pl-2">
            {decisions.map((decision) => (
              <DecisionTimelineItem
                key={decision.id}
                decision={decision}
                isNext={!!nextDecisionTime && decision.timestamp === nextDecisionTime}
                isRollingWave={isRollingWave}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};