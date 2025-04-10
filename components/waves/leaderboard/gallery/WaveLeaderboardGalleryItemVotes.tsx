import React from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import DropVoteProgressing from "../../../drops/view/utils/DropVoteProgressing";

interface WaveLeaderboardGalleryItemVotesProps {
  readonly drop: ExtendedDrop;
}

export default function WaveLeaderboardGalleryItemVotes({
  drop,
}: WaveLeaderboardGalleryItemVotesProps) {
  const current = drop.rating ?? 0;
  const isPositive = current >= 0;
  return (
    <div className="tw-flex tw-items-center tw-gap-x-1.5">
      <span
        className={`tw-text-sm tw-font-medium ${
          isPositive ? "tw-text-emerald-500" : "tw-text-rose-500"
        }`}
      >
        {formatNumberWithCommas(current)}
      </span>
      <DropVoteProgressing current={current} projected={drop.rating_prediction} />
    </div>
  );
}
