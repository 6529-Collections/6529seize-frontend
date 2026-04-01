import type { ApiDrop } from "@/generated/models/ApiDrop";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import {
  WAVE_VOTE_STATS_LABELS,
  WAVE_VOTING_LABELS,
} from "@/helpers/waves/waves.constants";
import type { RatingsSectionProps, RatingsData, ThemeColors } from "./types";

interface ParticipationDropRatingsUserSectionProps extends RatingsSectionProps {
  readonly ratingsData: RatingsData;
  readonly drop: ApiDrop;
  readonly userTheme: ThemeColors;
}

export default function ParticipationDropRatingsUserSection({
  drop,
  ratingsData,
}: ParticipationDropRatingsUserSectionProps) {
  const { userRating } = ratingsData;
  const userValueClass =
    userRating < 0 ? "tw-text-rose-400" : "tw-text-iron-50";

  // Don't show anything if the user hasn't voted
  if (userRating === 0) {
    return null;
  }

  return (
    <div className="tw-flex tw-items-center tw-gap-1.5 tw-text-sm tw-leading-5">
      <span className="tw-whitespace-nowrap">
        <span className="tw-font-normal tw-text-iron-400">
          {WAVE_VOTE_STATS_LABELS.YOUR_VOTES}:{" "}
        </span>
        <span className={`tw-font-medium ${userValueClass}`}>
          {userRating < 0 && "-"}
          {formatNumberWithCommas(Math.abs(userRating))}{" "}
          {WAVE_VOTING_LABELS[drop.wave.voting_credit_type]}
        </span>
      </span>
    </div>
  );
}
