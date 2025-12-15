import { ApiDrop } from "@/generated/models/ApiDrop";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import {
  WAVE_VOTE_STATS_LABELS,
  WAVE_VOTING_LABELS,
} from "@/helpers/waves/waves.constants";
import { RatingsSectionProps, RatingsData, ThemeColors } from "./types";

interface ParticipationDropRatingsUserSectionProps extends RatingsSectionProps {
  readonly ratingsData: RatingsData;
  readonly drop: ApiDrop;
  readonly userTheme: ThemeColors;
}

export default function ParticipationDropRatingsUserSection({
  drop,
  userTheme,
  ratingsData,
}: ParticipationDropRatingsUserSectionProps) {
  const { userRating } = ratingsData;

  // Don't show anything if the user hasn't voted
  if (userRating === 0) {
    return null;
  }

  return (
    <div className="tw-flex tw-items-center tw-gap-x-1">
      <span className="tw-text-sm tw-font-normal tw-text-iron-500">
        {WAVE_VOTE_STATS_LABELS.YOUR_VOTES}
      </span>

      <div className={`tw-relative ${userTheme.indicator}`}>
        <span className={`tw-text-sm tw-font-semibold ${userTheme.text}`}>
          {userRating < 0 && "-"}
          {formatNumberWithCommas(Math.abs(userRating))}
        </span>
      </div>
      <span className="tw-text-sm tw-font-normal tw-text-iron-500">
        {WAVE_VOTING_LABELS[drop.wave.voting_credit_type]}
      </span>
    </div>
  );
}
