import React from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import MyStreamWaveMyVoteVotesProgress from "./MyStreamWaveMyVoteVotesProgress";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";

interface MyStreamWaveMyVoteVotesProps {
  readonly drop: ExtendedDrop;
}

const MyStreamWaveMyVoteVotes: React.FC<MyStreamWaveMyVoteVotesProps> = ({
  drop,
}) => {
  const isPositive = (drop.rating || 0) >= 0;
  return (
    <div className="tw-flex tw-items-center tw-gap-x-1.5">
      <span className={`tw-text-sm tw-font-semibold ${
        isPositive ? "tw-text-emerald-500" : "tw-text-rose-500"
      }`}>
        {formatNumberWithCommas(drop.rating)}
      </span>

      <MyStreamWaveMyVoteVotesProgress
        rating={drop.rating}
        realtimeRating={drop.realtime_rating}
      />
    </div>
  );
};

export default MyStreamWaveMyVoteVotes;
