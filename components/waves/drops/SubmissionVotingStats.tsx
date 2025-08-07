import React from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { formatNumberWithCommas } from "../../../helpers/Helpers";
import DropVoteProgressing from "../../drops/view/utils/DropVoteProgressing";

interface SubmissionVotingStatsProps {
  readonly drop: ApiDrop;
}

export const SubmissionVotingStats: React.FC<SubmissionVotingStatsProps> = ({
  drop,
}) => {
  const current = drop.rating;
  const projected = drop.rating_prediction;
  const isPositive = current >= 0;

  // Subtle colors for grid view (matching WaveLeaderboardGalleryItemVotes with variant='subtle')
  const currentColorClass = isPositive
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
        {/* Use the reusable DropVoteProgressing component */}
        <DropVoteProgressing
          current={current}
          projected={projected}
          subtle={true}
        />
      </div>

      {/* TDH total text */}
      <div className="tw-text-sm tw-text-iron-500 tw-whitespace-nowrap">
        <span className="tw-font-medium">TDH total</span>
      </div>
    </div>
  );
};
