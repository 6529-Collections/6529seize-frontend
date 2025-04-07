import React from "react";
import { ApiDrop } from "../../../generated/models/ObjectSerializer";
import { formatNumberWithCommas } from "../../../helpers/Helpers";
import Tippy from "@tippyjs/react";
import Link from "next/link";
import DropVoteProgressing from "../../drops/view/utils/DropVoteProgressing";

interface SingleWaveDropVotesProps {
  readonly drop: ApiDrop;
}

export const SingleWaveDropVotes: React.FC<SingleWaveDropVotesProps> = ({
  drop,
}) => {
  const firstThreeVoters = drop.top_raters.slice(0, 3);
  const isPositive = drop.rating >= 0;

  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-2 tw-overflow-x-auto">
      <div className="tw-flex tw-items-baseline tw-gap-x-1">
        <span
          className={`tw-text-md tw-font-semibold ${
            isPositive ? "tw-text-emerald-500" : "tw-text-rose-500"
          } `}>
          {formatNumberWithCommas(drop.rating)}
        </span>
        <DropVoteProgressing
          rating={drop.rating}
          realtimeRating={drop.realtime_rating}
        />
        <span className="tw-text-md tw-text-iron-400 text-nowrap">
          {drop.wave.voting_credit_type} total
        </span>
      </div>
      <div className="tw-flex tw-flex-wrap tw-items-end tw-gap-x-3">
        <div className="tw-flex tw-items-center -tw-space-x-1.5">
          {firstThreeVoters.map((voter) => (
            <Tippy
              key={voter.profile.handle}
              content={`${voter.profile.handle} - ${formatNumberWithCommas(
                voter.rating
              )}`}>
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
          <span className="tw-text-md tw-font-medium tw-text-iron-100">
            {formatNumberWithCommas(drop.raters_count)}
          </span>
          <span className="tw-text-md tw-text-iron-400 text-nowrap">
            {drop.raters_count === 1 ? "voter" : "voters"}
          </span>
        </div>
      </div>
    </div>
  );
};
