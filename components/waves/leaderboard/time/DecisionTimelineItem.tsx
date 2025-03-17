import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRepeat } from "@fortawesome/free-solid-svg-icons";
import { DecisionPoint } from "../../../../helpers/waves/time.types";
import { DecisionTimelineMarker } from "./DecisionTimelineMarker";

interface DecisionTimelineItemProps {
  readonly decision: DecisionPoint;
  readonly isNext: boolean;
  readonly isRollingWave: boolean;
}

/**
 * Renders a single decision point item in the timeline
 */
export const DecisionTimelineItem: React.FC<DecisionTimelineItemProps> = ({
  decision,
  isNext,
  isRollingWave,
}) => {
  return (
    <div
      key={decision.id}
      className="tw-flex tw-items-start tw-relative tw-pl-5"
    >
      <DecisionTimelineMarker isNext={isNext} />
      
      <div className="tw-flex tw-justify-between tw-items-center tw-w-full tw-mt-0.5">
        <div>
          <p
            className={`tw-text-xs tw-font-medium ${
              isNext ? "tw-text-white/90" : "tw-text-white/60"
            }`}
          >
            {new Date(decision.timestamp).toLocaleDateString(
              undefined,
              {
                weekday: "short",
                month: "short",
                day: "numeric",
              }
            )}
            {isNext && (
              <span className="tw-ml-1.5 tw-inline-flex tw-items-center tw-rounded-full tw-bg-primary-500/20 tw-px-1.5 tw-py-0.5 tw-text-[10px] tw-font-medium tw-text-primary-400">
                Next
              </span>
            )}
            {decision.isPast && (
              <span className="tw-ml-1.5 tw-inline-flex tw-items-center tw-rounded-full tw-px-1.5 tw-text-[10px] tw-font-medium tw-text-iron-500">
                Complete
              </span>
            )}
          </p>
        </div>

        <div className="tw-text-right tw-text-xs tw-tabular-nums tw-text-white/50 tw-font-mono">
          {new Date(decision.timestamp).toLocaleTimeString(
            undefined,
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          )}
        </div>
      </div>
      
      {isNext && isRollingWave && (
        <div className="tw-absolute tw-left-0 tw-top-1 tw-transform -tw-translate-x-7">
          <FontAwesomeIcon
            icon={faRepeat}
            className="tw-text-xs tw-text-white/30 tw-flex-shrink-0"
          />
        </div>
      )}
    </div>
  );
};