import React from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import Tippy from "@tippyjs/react";
import { getScaledImageUri, ImageScale } from "../../../helpers/image.helpers";
import { formatNumberWithCommas } from "../../../helpers/Helpers";

interface WaveDropRatingsProps {
  readonly drop: ApiDrop;
}

const WaveDropRatings: React.FC<WaveDropRatingsProps> = ({ drop }) => {
  return (
    <div className="tw-flex tw-items-center tw-gap-x-2 tw-mt-1 tw-py-1 tw-px-2 tw-rounded-lg tw-shadow-sm tw-bg-iron-900/40 tw-border tw-border-solid tw-border-primary-300/5">
      <div className="tw-flex tw-items-center tw-gap-x-2">
        <div className="tw-flex tw-items-center -tw-space-x-2">
          {drop.top_raters.map((rater) => (
            <Tippy
              key={rater.profile.id}
              content={
                <span className="tw-text-xs">
                  {rater.profile.handle} - {rater.rating}
                </span>
              }
            >
              {rater.profile.pfp ? (
                <img
                  src={getScaledImageUri(
                    rater.profile.pfp,
                    ImageScale.W_AUTO_H_50
                  )}
                  alt={`${rater.profile.handle}'s avatar`}
                  className="tw-h-5 tw-w-5 tw-rounded-md tw-ring-black/50 tw-ring-1 tw-bg-iron-700"
                />
              ) : (
                <div className="tw-h-5 tw-w-5 tw-rounded-md tw-ring-1 tw-ring-black/50 tw-bg-iron-700" />
              )}
            </Tippy>
          ))}
        </div>
        <span className="tw-text-iron-500 tw-text-xs tw-font-normal">
          {formatNumberWithCommas(drop.raters_count)}{" "}
          {drop.raters_count === 1 ? "liker" : "likers"}
        </span>
        <div className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
      </div>
      <div className="tw-flex tw-items-center tw-justify-center tw-rounded-full tw-text-iron-500 tw-text-xs tw-font-normal">
        {!!drop.rating && (
          <Tippy
            content={<span className="tw-text-xs tw-font-medium">Total</span>}
          >
            <span className="tw-text-iron-500 tw-text-xs tw-font-normal tw-bg-iron-800/30 tw-px-2 tw-py-0.5 tw-rounded-full">
              {formatNumberWithCommas(drop.rating)}{" "}
              <span className="">likes</span>
            </span>
          </Tippy>
        )}
        {!!drop.context_profile_context?.rating && (
          <div
            className={`${
              drop.context_profile_context.rating > 0
                ? "tw-bg-green/20"
                : "tw-bg-red/20"
            } tw-ml-2 tw-rounded-full tw-h-4 tw-min-w-4 tw-flex tw-items-center tw-justify-center tw-transition tw-ease-out tw-duration-300`}
          >
            <Tippy
              content={
                <span className="tw-text-xs tw-font-medium">
                  Your given likes
                </span>
              }
            >
              <span
                className={`${
                  drop.context_profile_context.rating > 0
                    ? "tw-text-green"
                    : "tw-text-error"
                } tw-text-xs tw-font-normal`}
              >
                {formatNumberWithCommas(drop.context_profile_context.rating)}
              </span>
            </Tippy>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaveDropRatings;
