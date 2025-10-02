import { formatNumberWithCommas } from "@/helpers/Helpers";
import {
  getScaledImageUri,
  ImageScale,
} from "@/helpers/image.helpers";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { RatingsData } from "../types";

interface VoteBreakdownTooltipProps {
  readonly drop: ApiDrop;
  readonly ratingsData: RatingsData;
}

export default function VoteBreakdownTooltip({
  drop,
  ratingsData,
}: VoteBreakdownTooltipProps) {
  const { hasRaters, userRating } = ratingsData;
  const votingPower = drop.context_profile_context?.max_rating ?? 0;
  return (
    <div className="tw-p-3 tw-space-y-3 tw-min-w-[200px]">
      {hasRaters && (
        <div className="tw-space-y-2">
          <span className="tw-text-xs tw-font-medium tw-text-iron-400">
            Top Voters
          </span>
          <div className="tw-space-y-1.5">
            {drop.top_raters.map((rater) => (
              <div
                key={rater.profile.id}
                className="tw-flex tw-items-center tw-justify-between"
              >
                <div className="tw-flex tw-items-center tw-gap-2">
                  {rater.profile.pfp && (
                    <img
                      src={getScaledImageUri(
                        rater.profile.pfp,
                        ImageScale.W_AUTO_H_50
                      )}
                      alt=""
                      className="tw-h-4 tw-w-4 tw-rounded-md tw-ring-1 tw-ring-white/10"
                    />
                  )}
                  <span className="tw-text-xs tw-font-medium tw-text-iron-300">
                    {rater.profile.handle}
                  </span>
                </div>
                <span
                  className={`tw-text-xs tw-font-medium ${
                    rater.rating >= 0
                      ? "tw-text-emerald-400"
                      : "tw-text-rose-400"
                  }`}
                >
                  {rater.rating > 0 && "+"}
                  {formatNumberWithCommas(rater.rating)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {drop.context_profile_context && (
        <div className="tw-space-y-2">
          <span className="tw-text-xs tw-font-medium tw-text-iron-400">
            Your Voting Power
          </span>
          <div className="tw-flex tw-items-center tw-justify-between">
            <span className="tw-text-xs tw-text-iron-300">Voting Range</span>
            <div className="tw-flex tw-items-center">
              <div className="tw-flex tw-flex-col tw-items-center tw-mr-1 tw-leading-[0.15rem] -tw-space-y-2.5">
                <span className="tw-text-xs tw-font-medium tw-text-emerald-400">+</span>
                <span className="tw-text-xs tw-font-medium tw-text-rose-400">−</span>
              </div>
              <span className="tw-text-xs tw-font-medium tw-text-iron-300">
                {formatNumberWithCommas(votingPower)} {drop.wave.voting_credit_type}
              </span>
            </div>
          </div>
          <div className="tw-flex tw-items-center tw-justify-between">
            <span className="tw-text-xs tw-text-iron-300">Voted</span>
            <span className="tw-text-xs tw-font-medium tw-text-iron-300">
              {formatNumberWithCommas(Math.abs(userRating))} {drop.wave.voting_credit_type}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
