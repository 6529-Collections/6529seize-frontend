import React from "react";
import { ApiWaveVoter } from "../../../../../generated/models/ApiWaveVoter";
import { formatNumberWithCommas } from "../../../../../helpers/Helpers";
import Link from "next/link";
import Tippy from "@tippyjs/react";

interface WaveLeaderboardRightSidebarVoterProps {
  readonly voter: ApiWaveVoter;
  readonly position: number;
}

export const WaveLeaderboardRightSidebarVoter: React.FC<
  WaveLeaderboardRightSidebarVoterProps
> = ({ voter, position }) => {
  const hasPositiveVotes = voter.positive_votes_summed > 0;
  const hasNegativeVotes = voter.negative_votes_summed > 0;

  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-rounded-lg tw-bg-iron-900">
      <div className="tw-flex tw-items-center tw-gap-3">
        <span className="tw-text-iron-400 tw-font-medium">{position}.</span>
        <Link
          href={`/${voter.voter.handle}`}
          className="tw-flex tw-items-center tw-gap-2 tw-no-underline tw-group hover:tw-opacity-80 tw-transition-all tw-duration-300"
        >
          {voter.voter.pfp ? (
            <img
              src={voter.voter.pfp}
              alt=""
              className="tw-size-5 tw-rounded-md tw-ring-1 tw-ring-white/10 tw-bg-iron-800"
            />
          ) : (
            <div className="tw-size-5 tw-rounded-md tw-ring-1 tw-ring-white/10 tw-bg-iron-800" />
          )}
          <span className="tw-text-sm tw-font-medium tw-text-iron-50 tw-transition-all tw-duration-300 group-hover:tw-text-iron-300">
            {voter.voter.handle}
          </span>
        </Link>
      </div>
      <div className="tw-flex tw-items-center tw-gap-3">
        <Tippy content={
          <div className="tw-text-sm">
            <div className="tw-text-emerald-400">+{formatNumberWithCommas(voter.positive_votes_summed)}</div>
            {hasNegativeVotes && <div className="tw-text-red-400">-{formatNumberWithCommas(voter.negative_votes_summed)}</div>}
          </div>
        }>
          <div className="tw-flex tw-items-center tw-gap-1">
            {hasPositiveVotes && <div className="tw-w-1.5 tw-h-1.5 tw-rounded-sm tw-bg-emerald-400" />}
            {hasNegativeVotes && <div className="tw-w-1.5 tw-h-1.5 tw-rounded-sm tw-bg-red-400" />}
          </div>
        </Tippy>
        <span>
          <span className="tw-text-iron-400">{formatNumberWithCommas(voter.absolute_votes_summed)}</span>{" "}
          <span className="tw-text-xs tw-text-iron-400">TDH total</span>
        </span>
      </div>
    </div>
  );
};
