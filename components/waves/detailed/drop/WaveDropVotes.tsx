import React from "react";
import { ApiDrop } from "../../../../generated/models/ObjectSerializer";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import Tippy from "@tippyjs/react";
import Link from "next/link";

interface WaveDropVotesProps {
  readonly drop: ApiDrop;
}

export const WaveDropVotes: React.FC<WaveDropVotesProps> = ({ drop }) => {
  const firstThreeVoters = drop.top_raters.slice(0, 3);
  const isPositive = drop.rating >= 0;
  
  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-px-1">
      <div className="tw-flex tw-items-baseline tw-gap-x-1.5">
        <span className={`tw-text-xl tw-font-semibold tw-bg-gradient-to-r ${
          isPositive 
            ? 'tw-from-emerald-400 tw-to-emerald-500' 
            : 'tw-from-rose-400 tw-to-rose-500'
        } tw-bg-clip-text tw-text-transparent`}>
          {formatNumberWithCommas(drop.rating)}
        </span>
        <span className="tw-text-sm tw-text-iron-400">{drop.wave.voting_credit_type} total</span>
      </div>
      <div className="tw-flex tw-flex-wrap tw-items-end tw-gap-x-3">
        <div className="tw-flex tw-items-center -tw-space-x-1.5">
          {firstThreeVoters.map((voter) => (
            <Tippy
              key={voter.profile.handle}
              content={`${voter.profile.handle} - ${formatNumberWithCommas(
                voter.rating
              )}`}
            >
              <Link href={`/${voter.profile.handle}`}>
                {voter.profile.pfp ? (
                  <img
                    className="tw-size-6 tw-rounded-md tw-ring-2 tw-ring-iron-950"
                    src={voter.profile.pfp}
                    alt="Recent voter"
                  />
                ) : (
                  <div className="tw-size-6 tw-rounded-md tw-ring-2 tw-ring-iron-950 tw-bg-iron-800" />
                )}
              </Link>
            </Tippy>
          ))}
        </div>
        <div className="tw-flex tw-items-baseline tw-gap-x-1">
          <span className="tw-text-base tw-font-medium tw-text-iron-100">
            {formatNumberWithCommas(drop.raters_count)}
          </span>
          <span className="tw-text-sm tw-text-iron-400">
            {drop.raters_count === 1 ? "voter" : "voters"}
          </span>
        </div>
      </div>
    </div>
  );
};
