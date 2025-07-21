import React from "react";
import { ApiWaveVoter } from "../../../../generated/models/ApiWaveVoter";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import Link from "next/link";
import { Tooltip } from "react-tooltip";
import { ApiWaveCreditType } from "../../../../generated/models/ApiWaveCreditType";
import UserProfileTooltipWrapper from "../../../utils/tooltip/UserProfileTooltipWrapper";

interface WaveLeaderboardRightSidebarVoterProps {
  readonly voter: ApiWaveVoter;
  readonly position: number;
  readonly creditType: ApiWaveCreditType;
}

export const WaveLeaderboardRightSidebarVoter: React.FC<
  WaveLeaderboardRightSidebarVoterProps
> = ({ voter, position, creditType }) => {
  const hasPositiveVotes = !!voter.positive_votes_summed;
  const hasNegativeVotes = !!voter.negative_votes_summed;

  return (
    <div className="tw-flex tw-flex-col tw-justify-between tw-gap-x-2 tw-gap-y-2 tw-w-full tw-p-3 tw-rounded-lg tw-bg-iron-900 tw-overflow-hidden">
      <div className="tw-flex tw-items-center tw-gap-3">
        <span className="tw-text-iron-400 tw-font-medium tw-flex-shrink-0">{position}.</span>
        <Link
          href={`/${voter.voter.handle}`}
          className="tw-flex tw-items-center tw-gap-2 tw-no-underline desktop-hover:hover:tw-underline tw-group desktop-hover:hover:tw-opacity-80 tw-transition-all tw-duration-300 tw-max-w-full tw-min-w-0"
        >
          {voter.voter.pfp ? (
            <img
              src={voter.voter.pfp}
              alt=""
              className="tw-size-5 tw-rounded-md tw-ring-1 tw-ring-inset tw-ring-white/10 tw-bg-iron-800 tw-flex-shrink-0 tw-object-contain"
            />
          ) : (
            <div className="tw-size-5 tw-rounded-md tw-ring-1 tw-ring-inset tw-ring-white/10 tw-bg-iron-800 tw-flex-shrink-0" />
          )}
          <UserProfileTooltipWrapper user={voter.voter.handle ?? voter.voter.id}>
            <span className="tw-text-sm tw-font-medium tw-text-iron-200 tw-transition-all tw-duration-300 desktop-hover:group-hover:tw-text-opacity-80 tw-truncate">
              {voter.voter.handle}
            </span>
          </UserProfileTooltipWrapper>
        </Link>
      </div>
      <div className="tw-flex tw-items-center tw-gap-x-3 tw-ml-6">
        <>
          <div 
            className="tw-flex tw-items-center tw-gap-1"
            data-tooltip-id={`voter-votes-${voter.voter.handle}-${position}`}
          >
            {hasPositiveVotes && (
              <div className="tw-w-1.5 tw-h-1.5 tw-rounded-sm tw-bg-green" />
            )}
            {hasNegativeVotes && (
              <div className="tw-w-1.5 tw-h-1.5 tw-rounded-sm tw-bg-red" />
            )}
          </div>
          <Tooltip
            id={`voter-votes-${voter.voter.handle}-${position}`}
            style={{
              backgroundColor: "#1F2937",
              color: "white",
              padding: "4px 8px",
            }}
          >
            <div className="tw-text-sm tw-space-x-1">
              <div className="tw-text-green">
                +{formatNumberWithCommas(voter.positive_votes_summed)}
              </div>
              {hasNegativeVotes && (
                <div className="tw-text-red">
                  -{formatNumberWithCommas(voter.negative_votes_summed)}
                </div>
              )}
            </div>
          </Tooltip>
        </>
        <span className="tw-text-xs tw-text-iron-400 tw-whitespace-nowrap">
          {formatNumberWithCommas(voter.absolute_votes_summed)} {creditType}{" "}
          total
        </span>
      </div>
    </div>
  );
};
