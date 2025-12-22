import React from "react";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { Tooltip } from "react-tooltip";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { formatNumberWithCommas } from "@/helpers/Helpers";

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
            <div key={rater.profile.id}>
              {rater.profile.pfp ? (
                <img
                  src={getScaledImageUri(
                    rater.profile.pfp,
                    ImageScale.W_AUTO_H_50
                  )}
                  alt={`${rater.profile.handle}'s avatar`}
                  className="tw-w-6 tw-h-6 tw-rounded-md tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800 tw-object-contain"
                  data-tooltip-id={`rater-${rater.profile.id}`}
                />
              ) : (
                <div
                  className="tw-w-6 tw-h-6 tw-rounded-lg tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800"
                  data-tooltip-id={`rater-${rater.profile.id}`}
                />
              )}
              <Tooltip
                id={`rater-${rater.profile.id}`}
                style={{
                  backgroundColor: "#1F2937",
                  color: "white",
                  padding: "4px 8px",
                }}
              >
                {rater.profile.handle} - {rater.rating}
              </Tooltip>
            </div>
          ))}
        </div>
        <span className="tw-text-iron-200 tw-font-semibold tw-text-sm">
          {formatNumberWithCommas(drop.raters_count)}{" "}
          <span className="tw-text-iron-500 tw-font-normal">
            {drop.raters_count === 1 ? "voter" : "voters"}
          </span>
        </span>
      </div>
      <div className="tw-flex tw-items-center tw-justify-center tw-rounded-full tw-text-iron-500 tw-text-xs tw-font-normal">
        {drop.raters_count > 0 && (
          <>
            <span 
              className="tw-text-iron-900 tw-text-xs tw-font-medium tw-bg-iron-500 tw-px-2 tw-py-0.5 tw-rounded-full"
              data-tooltip-id={`total-rating-${drop.id}`}
            >
              {formatNumberWithCommas(drop.rating)}{" "}
            </span>
            <Tooltip
              id={`total-rating-${drop.id}`}
              style={{
                backgroundColor: "#1F2937",
                color: "white",
                padding: "4px 8px",
              }}
            >
              Total
            </Tooltip>
          </>
        )}
        {hasVoted && (
          <div
            className={`${
              hasUpvoted ? "tw-bg-green/20" : "tw-bg-red/20"
            } tw-ml-2 tw-rounded-full tw-h-4 tw-min-w-4 tw-flex tw-items-center tw-justify-center tw-transition tw-ease-out tw-duration-300`}>
            <>
              <span
                className={`${
                  hasUpvoted ? "tw-text-green" : "tw-text-error"
                } tw-text-xs tw-font-normal`}
                data-tooltip-id={`your-votes-${drop.id}`}
              >
                {formatNumberWithCommas(yourVotes)}
              </span>
              <Tooltip
                id={`your-votes-${drop.id}`}
                style={{
                  backgroundColor: "#1F2937",
                  color: "white",
                  padding: "4px 8px",
                }}
              >
                Your given likes
              </Tooltip>
            </>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaveDropRatings;
