"use client";

import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { numberWithCommas } from "@/helpers/Helpers";
import ProfileAvatar from "@/components/common/profile/ProfileAvatar";
import UserLevel from "@/components/user/utils/level/UserLevel";
import CommonTimeAgo from "@/components/utils/CommonTimeAgo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";

interface CarouselActiveItemDetailsProps {
  readonly drop: ExtendedDrop | null;
}

export default function CarouselActiveItemDetails({
  drop,
}: CarouselActiveItemDetailsProps) {
  if (!drop) {
    return null;
  }

  const realtimeRating = drop.realtime_rating;
  const ratingPrediction = drop.rating_prediction;
  const title = drop.title ?? "Untitled";
  const author = drop.author;
  const rank = drop.rank;
  const waveName = drop.wave.name;

  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-gap-4 tw-pb-4 tw-pt-6">
      {/* Voting Section */}
      <div className="tw-flex tw-items-center tw-gap-4">
        <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm">
          <span className="tw-text-iron-400">
            {numberWithCommas(Math.round(realtimeRating))}
          </span>
          <span className="tw-text-iron-500">→</span>
          <span className="tw-font-medium tw-text-primary-400">
            {numberWithCommas(Math.round(ratingPrediction))}
          </span>
          <span className="tw-text-iron-500">TDH Total</span>
        </div>
        <button
          type="button"
          className="tw-rounded-lg tw-border tw-border-iron-700 tw-bg-transparent tw-px-5 tw-py-1.5 tw-text-sm tw-font-medium tw-text-white tw-transition-colors tw-duration-200 hover:tw-border-iron-600 hover:tw-bg-iron-800"
        >
          Vote
        </button>
      </div>

      {/* Title */}
      <h2 className="tw-m-0 tw-text-center tw-text-xl tw-font-bold tw-text-white">
        {title}
      </h2>

      {/* Author Metadata Row */}
      <div className="tw-flex tw-items-center tw-gap-3 tw-text-sm">
        <ProfileAvatar pfpUrl={author.pfp} alt={author.handle ?? "Author"} />
        <span className="tw-font-medium tw-text-white">
          {author.handle ?? "Anonymous"}
        </span>
        <UserLevel level={author.level} size="xs" />
        {!!drop.created_at && (
          <>
            <span className="tw-text-iron-500">·</span>
            <CommonTimeAgo
              timestamp={drop.created_at}
              short
              className="tw-text-sm tw-text-iron-500"
            />
          </>
        )}
        {typeof rank === "number" && (
          <>
            <span className="tw-text-iron-500">·</span>
            <div className="tw-flex tw-items-center tw-gap-1 tw-text-iron-400">
              <FontAwesomeIcon
                icon={faStar}
                className="tw-size-4 tw-text-yellow-500"
              />
              <span>#{rank}</span>
            </div>
          </>
        )}
        {waveName && (
          <>
            <span className="tw-text-iron-500">·</span>
            <span className="tw-text-xs tw-uppercase tw-tracking-wide tw-text-iron-400">
              {waveName}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
