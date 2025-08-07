import React from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { formatNumberWithCommas } from "../../../helpers/Helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "react-tooltip";

interface SubmissionVotingStatsProps {
  readonly drop: ApiDrop;
}

export const SubmissionVotingStats: React.FC<SubmissionVotingStatsProps> = ({
  drop,
}) => {
  const current = drop.rating;
  const projected = drop.rating_prediction;
  const isPositive = current >= 0;
  const isProgressing = current !== projected;
  const isPositiveProgressing = current < projected;

  // Subtle colors for grid view (matching WaveLeaderboardGalleryItemVotes with variant='subtle')
  const currentColorClass = isPositive
    ? "tw-text-iron-300"
    : "tw-text-iron-400";

  // Subtle colors for projected vote arrow
  const projectedColorClass = isPositiveProgressing
    ? "tw-text-iron-300"
    : "tw-text-iron-400";

  return (
    <div className="tw-flex tw-items-center tw-gap-x-1.5 tw-flex-wrap">
      {/* Votes section */}
      <div className="tw-flex tw-items-center tw-gap-x-1.5 tw-text-sm">
        {/* Current vote */}
        <span className={`tw-font-medium ${currentColorClass}`}>
          {formatNumberWithCommas(current)}
        </span>
        {isProgressing && (
          <>
            <span
              className={`${projectedColorClass} tw-text-sm tw-font-medium tw-px-1.5 tw-py-0.5 tw-rounded-md tw-flex tw-items-center tw-gap-x-1  tw-bg-iron-700 tw-transition-colors tw-duration-200`}
              data-tooltip-id={`submission-vote-progress-${current}-${projected}-${drop.id}`}
            >
              <FontAwesomeIcon
                icon={faArrowRight}
                className="tw-flex-shrink-0 tw-size-3"
              />
              <span>{formatNumberWithCommas(projected)}</span>
            </span>
            <Tooltip
              id={`submission-vote-progress-${current}-${projected}-${drop.id}`}
              place="top"
              positionStrategy="fixed"
              opacity={1}
              style={{
                backgroundColor: "#1F2937",
                color: "white",
                padding: "4px 8px",
                fontSize: "12px",
                boxShadow:
                  "0 4px 16px 0 rgba(0,0,0,0.30), 0 2px 8px 0 rgba(55,55,62,0.25)",
              }}
            >
              <span className="tw-text-xs">
                Projected vote count at decision time:{" "}
                {formatNumberWithCommas(projected)}
              </span>
            </Tooltip>
          </>
        )}
      </div>

      {/* TDH total text */}
      <div className="tw-text-sm tw-text-iron-500 tw-whitespace-nowrap">
        <span className="tw-font-medium">TDH total</span>
      </div>
    </div>
  );
};
