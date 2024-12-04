import React from "react";
import { ApiDrop } from "../../../../../generated/models/ApiDrop";
import Tippy from "@tippyjs/react";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../../helpers/image.helpers";
import { formatNumberWithCommas } from "../../../../../helpers/Helpers";

interface ParticipationDropRatingsProps {
  readonly drop: ApiDrop;
}

export const ParticipationDropRatings: React.FC<
  ParticipationDropRatingsProps
> = ({ drop }) => {
  const hasRaters = drop.top_raters && drop.top_raters.length > 0;
  const userRating = drop.context_profile_context?.rating ?? 0;

  return (
    <div className="tw-flex tw-items-center tw-justify-between">
      <div className="tw-flex tw-items-start tw-gap-6">
        <div className="tw-flex tw-flex-col tw-gap-1">
          <span className="tw-text-xs tw-font-medium tw-text-iron-500 tw-h-5 tw-flex tw-items-center">
            Total TDH
          </span>
          <span className="tw-text-xl tw-font-bold tw-text-iron-50">
            {formatNumberWithCommas(drop.rating ?? 0)}
          </span>
        </div>

        <div className="tw-flex tw-flex-col tw-gap-1">
          <div className="tw-h-5 tw-flex tw-items-center tw-gap-2">
            <span className="tw-text-xs tw-font-medium tw-text-iron-500">
              Voters
            </span>
            {hasRaters && (
              <div className="tw-flex tw-items-center -tw-space-x-1">
                {drop.top_raters.slice(0, 6).map((rater, index) => (
                  <Tippy
                    key={rater.profile.id}
                    content={
                      <span className="tw-text-xs tw-font-medium">
                        {rater.profile.handle} • {formatNumberWithCommas(rater.rating)} TDH
                      </span>
                    }
                  >
                    <div className="tw-relative tw-transition-transform hover:tw-scale-110 hover:tw-z-10" style={{ zIndex: drop.top_raters.length - index }}>
                      {rater.profile.pfp && (
                        <img
                          src={getScaledImageUri(
                            rater.profile.pfp,
                            ImageScale.W_AUTO_H_50
                          )}
                          alt={`${rater.profile.handle}'s Profile Picture`}
                          className="tw-h-4 tw-w-4 tw-rounded-md tw-ring-1 tw-ring-iron-800 tw-bg-iron-800"
                        />
                      )}
                    </div>
                  </Tippy>
                ))}
                {drop.raters_count > 6 && (
                  <div className="tw-relative tw-h-4 tw-w-4 tw-flex tw-items-center tw-justify-center tw-rounded-md tw-bg-iron-800 tw-ring-1 tw-ring-iron-800 tw-text-iron-300 tw-text-[9px] tw-font-medium">
                    +{drop.raters_count - 6}
                  </div>
                )}
              </div>
            )}
          </div>
          <span className="tw-text-xl tw-font-bold tw-bg-gradient-to-r tw-from-[#E8D48A] tw-to-[#D9A962] tw-bg-clip-text tw-text-transparent">
            {drop.raters_count}
          </span>
        </div>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-1">
        <span className="tw-text-xs tw-font-medium tw-text-iron-500 tw-h-5 tw-flex tw-items-center">
          Your votes
        </span>
        <div className="tw-flex tw-items-baseline tw-gap-1">
          <span className="tw-text-xl tw-font-bold tw-text-green">
            {formatNumberWithCommas(Math.abs(userRating))}
          </span>
          <span className="tw-text-xs tw-font-medium tw-text-iron-500">
            TDH
          </span>
        </div>
      </div>
    </div>
  );
};
