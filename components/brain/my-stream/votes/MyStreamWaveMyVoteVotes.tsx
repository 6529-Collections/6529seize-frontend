import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import DropVoteProgressing from "@/components/drops/view/utils/DropVoteProgressing";

interface MyStreamWaveMyVoteVotesProps {
  readonly drop: ExtendedDrop;
}

const MyStreamWaveMyVoteVotes: React.FC<MyStreamWaveMyVoteVotesProps> = ({
  drop,
}) => {
  const voteClass =
    drop.rating >= 0 ? "tw-text-emerald-500" : "tw-text-rose-500";

  return (
    <div className="tw-flex tw-items-center tw-gap-x-1.5">
      <span
        className={`tw-font-mono tw-text-sm tw-font-bold tw-tracking-tight ${voteClass}`}
      >
        {formatNumberWithCommas(drop.rating)}
      </span>

      <DropVoteProgressing
        current={drop.rating}
        projected={drop.rating_prediction}
      />
    </div>
  );
};

export default MyStreamWaveMyVoteVotes;
