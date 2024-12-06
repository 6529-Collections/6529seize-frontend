import { formatNumberWithCommas } from "../../../../../../../helpers/Helpers";
import { getScaledImageUri, ImageScale } from "../../../../../../../helpers/image.helpers";
import { ApiDrop } from "../../../../../../../generated/models/ApiDrop";
import { RatingsData } from "../types";

interface VoteBreakdownTooltipProps {
  readonly drop: ApiDrop;
  readonly ratingsData: RatingsData;
}

export default function VoteBreakdownTooltip({
  drop,
  ratingsData,
}: VoteBreakdownTooltipProps) {
  const { hasRaters, availableCredit, userRating } = ratingsData;

  return (
    <div className="tw-p-3 tw-space-y-3 tw-min-w-[200px]">
      {hasRaters && (
        <div className="tw-space-y-2">
          <span className="tw-text-xs tw-font-medium tw-text-iron-400">Top Voters</span>
          <div className="tw-space-y-1.5">
            {drop.top_raters.map((rater) => (
              <div key={rater.profile.id} className="tw-flex tw-items-center tw-justify-between">
                <div className="tw-flex tw-items-center tw-gap-2">
                  {rater.profile.pfp && (
                    <img
                      src={getScaledImageUri(rater.profile.pfp, ImageScale.W_AUTO_H_50)}
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
                    rater.rating >= 0 ? "tw-text-emerald-400" : "tw-text-rose-400"
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
            <span className="tw-text-xs tw-text-iron-300">Available</span>
            <span className="tw-text-xs tw-font-medium tw-text-iron-300">
              {formatNumberWithCommas(availableCredit)} TDH
            </span>
          </div>
          <div className="tw-flex tw-items-center tw-justify-between">
            <span className="tw-text-xs tw-text-iron-300">Voted</span>
            <span className="tw-text-xs tw-font-medium tw-text-iron-300">
              {formatNumberWithCommas(Math.abs(userRating))} TDH
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 
