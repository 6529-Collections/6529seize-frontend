import { ApiDrop } from "../../../../../generated/models/ApiDrop";
import { formatNumberWithCommas } from "../../../../../helpers/Helpers";
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

  return (
    <div className="tw-flex tw-items-center tw-gap-x-1">
      <span className="tw-text-sm tw-font-medium tw-text-iron-500">
        Your votes
      </span>
      <div className="tw-flex tw-items-baseline tw-gap-1">
        <div className={`tw-relative tw-inline-flex ${userTheme.indicator}`}>
          <span className={`tw-text-sm tw-font-bold ${userTheme.text}`}>
            {userRating < 0 && "-"}
            {formatNumberWithCommas(Math.abs(userRating))}
          </span>
        </div>
        <span className="tw-text-sm tw-font-medium tw-text-iron-500">
          {drop.wave.voting_credit_type}
        </span>
      </div>
    </div>
  );
}
