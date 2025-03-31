import React from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import WaveLeaderboardGalleryItemVotesProgressing from "./WaveLeaderboardGalleryItemVotesProgressing";

interface WaveLeaderboardGalleryItemVotesProps {
  readonly drop: ExtendedDrop;
}

export default function WaveLeaderboardGalleryItemVotes({
  drop,
}: WaveLeaderboardGalleryItemVotesProps) {
  const rating = drop.rating ?? 0;
  const isPositive = rating >= 0;
  return (
    <div className="tw-flex tw-items-center tw-gap-x-1.5">
      <span
        className={`tw-text-sm tw-font-semibold ${
          isPositive ? "tw-text-emerald-500" : "tw-text-rose-500"
        }`}
      >
        {formatNumberWithCommas(rating)}
      </span>
      <WaveLeaderboardGalleryItemVotesProgressing
        rating={rating}
        realtimeRating={drop.realtime_rating}
      />
    </div>
  );
}
