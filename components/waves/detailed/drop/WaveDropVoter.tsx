import React from "react";
import { ApiWaveVoter } from "../../../../generated/models/ApiWaveVoter";
import Link from "next/link";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import Tippy from "@tippyjs/react";

interface WaveDropVoterProps {
  readonly voter: ApiWaveVoter;
  readonly position: number;
}

export const WaveDropVoter: React.FC<WaveDropVoterProps> = ({ voter, position }) => {
  const hasPositiveVotes = !!voter.positive_votes_summed;
  const hasNegativeVotes = !!voter.negative_votes_summed;

  return (
    <div className="tw-p-3 tw-flex tw-items-center tw-justify-between">
      <div className="tw-flex tw-items-center tw-gap-3">
        <span className="tw-text-sm tw-font-medium tw-text-iron-400">
          {position}
        </span>
        <Link
          href={`/${voter.voter.handle}`}
          className="tw-flex tw-items-center tw-gap-2 tw-no-underline tw-group hover:tw-opacity-80 tw-transition-all tw-duration-300"
        >
          {voter.voter.pfp ? (
            <img
              src={voter.voter.pfp}
              alt=""
              className="tw-size-6 tw-rounded-md tw-ring-1 tw-ring-white/10 tw-bg-iron-800 tw-flex-shrink-0"
            />
          ) : (
            <div className="tw-size-6 tw-rounded-md tw-ring-1 tw-ring-white/10 tw-bg-iron-800 tw-flex-shrink-0" />
          )}
          <span className="tw-text-sm tw-font-medium tw-text-iron-50 tw-transition-all tw-duration-300 group-hover:tw-text-iron-300">
            {voter.voter.handle}
          </span>
        </Link>
      </div>
      <div className="tw-flex tw-items-center tw-gap-3 tw-whitespace-nowrap">
        <Tippy
          content={
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
          }
        >
          <div className="tw-flex tw-items-center tw-gap-1">
            {hasPositiveVotes && (
              <div className="tw-w-1.5 tw-h-1.5 tw-rounded-sm tw-bg-green" />
            )}
            {hasNegativeVotes && (
              <div className="tw-w-1.5 tw-h-1.5 tw-rounded-sm tw-bg-red" />
            )}
          </div>
        </Tippy>
        <span className="tw-text-xs tw-text-iron-400">
          {formatNumberWithCommas(voter.absolute_votes_summed)} TDH total
        </span>
      </div>
    </div>
  );
};