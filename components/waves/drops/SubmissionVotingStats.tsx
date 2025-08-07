import React from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { formatNumberWithCommas } from "../../../helpers/Helpers";
import { ApiWaveCreditType } from "../../../generated/models/ApiWaveCreditType";

interface SubmissionVotingStatsProps {
  readonly drop: ApiDrop;
}

export const SubmissionVotingStats: React.FC<SubmissionVotingStatsProps> = ({ drop }) => {
  const currentRating = drop.context_profile_context?.rating ?? 0;
  const projectedVote = drop.rating_prediction;
  const creditType = drop.wave?.voting_credit_type ?? ApiWaveCreditType.Rep;

  return (
    <div className="tw-flex tw-flex-col tw-gap-1 tw-text-xs tw-text-iron-400">
      <div className="tw-flex tw-justify-between tw-items-center">
        <span>Your vote:</span>
        <span className="tw-text-iron-200">
          {formatNumberWithCommas(currentRating)} {creditType}
        </span>
      </div>
      <div className="tw-flex tw-justify-between tw-items-center">
        <span>Projected:</span>
        <span className="tw-text-iron-200">
          {formatNumberWithCommas(projectedVote)} {creditType}
        </span>
      </div>
    </div>
  );
};