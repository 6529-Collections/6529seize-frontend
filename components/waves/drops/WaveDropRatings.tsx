import React from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import Tippy from "@tippyjs/react";
import { getScaledImageUri, ImageScale } from "../../../helpers/image.helpers";
import { formatNumberWithCommas } from "../../../helpers/Helpers";

interface WaveDropRatingsProps {
  readonly drop: ApiDrop;
}

const WaveDropRatings: React.FC<WaveDropRatingsProps> = ({ drop }) => {
  let borderStyle = "tw-border-iron-700";
  let bgStyle = "tw-bg-iron-900/40";

  const yourVotes = drop?.context_profile_context?.rating ?? 0;
  const hasVoted = yourVotes !== 0;
  const hasUpvoted = yourVotes > 0;

  if (hasVoted) {
    borderStyle = "tw-border-primary-500";
    bgStyle = "tw-bg-primary-500/10";
  }

  return (
    <div
      className={`tw-inline-flex tw-items-center tw-gap-x-2 tw-mt-1 tw-py-1 tw-px-2 tw-rounded-lg tw-shadow-sm tw-border tw-border-solid ${borderStyle} ${bgStyle}`}>
      <div className="tw-flex tw-items-center tw-gap-x-2">
        <div className="tw-flex tw-items-center -tw-space-x-2">
          {drop.top_raters.map((rater) => (
            <Tippy
              key={rater.profile.id}
              content={
                <span className="tw-text-xs">
                  {rater.profile.handle} - {rater.rating}
                </span>
              }>
              {rater.profile.pfp ? (
                <img
                  src={getScaledImageUri(
                    rater.profile.pfp,
                    ImageScale.W_AUTO_H_50
                  )}
                  alt={`${rater.profile.handle}'s avatar`}
                  className="tw-max-h-5 tw-max-w-5 tw-rounded-md tw-ring-black/50 tw-ring-1 tw-bg-iron-700"
                />
              ) : (
                <div className="tw-h-5 tw-w-5 tw-rounded-md tw-ring-1 tw-ring-black/50 tw-bg-iron-700" />
              )}
            </Tippy>
          ))}
        </div>
        <span className="tw-text-iron-500 tw-text-xs tw-font-normal">
          {formatNumberWithCommas(drop.raters_count)}{" "}
          {drop.raters_count === 1 ? "voter" : "voters"}
        </span>
      </div>
      <div className="tw-flex tw-items-center tw-justify-center tw-rounded-full tw-text-iron-500 tw-text-xs tw-font-normal">
        {drop.raters_count > 0 && (
          <Tippy
            content={<span className="tw-text-xs tw-font-medium">Total</span>}>
            <span className="tw-text-iron-900 tw-text-xs tw-font-medium tw-bg-iron-500 tw-px-2 tw-py-0.5 tw-rounded-full">
              {formatNumberWithCommas(drop.rating)}{" "}
            </span>
          </Tippy>
        )}
        {hasVoted && (
          <div
            className={`${
              hasUpvoted ? "tw-bg-green/20" : "tw-bg-red/20"
            } tw-ml-2 tw-rounded-full tw-h-4 tw-min-w-4 tw-flex tw-items-center tw-justify-center tw-transition tw-ease-out tw-duration-300`}>
            <Tippy
              content={
                <span className="tw-text-xs tw-font-medium">
                  Your given likes
                </span>
              }>
              <span
                className={`${
                  hasUpvoted ? "tw-text-green" : "tw-text-error"
                } tw-text-xs tw-font-normal`}>
                {formatNumberWithCommas(yourVotes)}
              </span>
            </Tippy>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaveDropRatings;
