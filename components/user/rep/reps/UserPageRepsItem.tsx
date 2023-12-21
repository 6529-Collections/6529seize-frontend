import { RatingStats } from "../../../../entities/IProfile";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import UserPageRepItemAddIcon from "./UserPageRepItemAddIcon";
import UserPageRepsItemEditIcon from "./UserPageRepsItemEditIcon";

export default function UserPageRepsItem({
  rep,
}: {
  readonly rep: RatingStats;
}) {
  const isPositiveRating = rep.rating > 0;
  return (
    <div>
      <span className="tw-flex tw-items-center tw-justify-between tw-gap-x-3 tw-rounded-lg tw-bg-iorn-900 tw-bordet tw-border-solid tw-border-white/10 tw-px-3 tw-py-1.5">
        <span className="tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-text-iron-200">
          {rep.category}
        </span>
        <span
          className={`${
            isPositiveRating ? "tw-text-green" : "tw-text-red"
          } tw-whitespace-nowrap tw-font-semibold tw-text-sm`}
        >
          {formatNumberWithCommas(rep.rating)}
          {rep.rater_contribution && (
            <span className="tw-ml-1 tw-text-[0.6875rem] tw-leading-5 tw-text-iron-400 tw-font-semibold">
              ({formatNumberWithCommas(rep.rater_contribution)})
            </span>
          )}
        </span>
        <span className="tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-iron-200">
          {formatNumberWithCommas(rep.contributor_count)}
        </span>
        <button
          type="button"
          className="tw-group tw-relative tw-inline-flex tw-items-center tw-text-sm tw-font-medium tw-rounded-lg tw-bg-iron-800 tw-p-2 tw-text-iron-200 focus:tw-outline-none tw-border-0 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-bg-iron-700 focus:tw-z-10 tw-transition tw-duration-300 tw-ease-out"
        >
          {rep.rater_contribution ? (
            <UserPageRepsItemEditIcon />
          ) : (
            <UserPageRepItemAddIcon />
          )}
        </button>
      </span>
    </div>
  );
}
