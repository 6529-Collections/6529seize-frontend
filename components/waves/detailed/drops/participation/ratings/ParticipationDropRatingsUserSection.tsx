import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";
import { RatingsSectionProps, RatingsData, ThemeColors } from "./types";

interface ParticipationDropRatingsUserSectionProps extends RatingsSectionProps {
  readonly ratingsData: RatingsData;
  readonly userTheme: ThemeColors;
}

export default function ParticipationDropRatingsUserSection({
  userTheme,
  ratingsData,
}: ParticipationDropRatingsUserSectionProps) {
  const { userRating } = ratingsData;

  return (
    <div className="tw-flex tw-flex-col tw-gap-1.5">
      <span className="tw-text-xs tw-font-medium tw-text-iron-500 tw-h-5 tw-flex tw-items-center">
        Your votes
      </span>
      <div className="tw-flex tw-items-baseline tw-gap-1.5">
        <div className={`tw-relative tw-inline-flex ${userTheme.indicator}`}>
          <span
            className={`tw-text-2xl tw-font-bold tw-bg-gradient-to-r ${userTheme.gradient} tw-bg-clip-text tw-text-transparent`}
          >
            {userRating < 0 && "-"}
            {formatNumberWithCommas(Math.abs(userRating))}
          </span>
        </div>
        <span className="tw-text-sm tw-font-medium tw-text-iron-500">TDH</span>
      </div>
    </div>
  );
} 
