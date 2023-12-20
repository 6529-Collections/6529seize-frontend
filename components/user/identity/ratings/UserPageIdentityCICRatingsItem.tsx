import { useEffect, useState } from "react";
import {
  CICType,
  ProfilesMatterRatingWithRaterLevel,
} from "../../../../entities/IProfile";
import {
  cicToType,
  formatNumberWithCommas,
  getTimeAgo,
} from "../../../../helpers/Helpers";
import { useRouter } from "next/router";

export const CIC_COLOR: Record<CICType, string> = {
  [CICType.INACCURATE]: "tw-bg-[#F97066]",
  [CICType.UNKNOWN]: "tw-bg-[#FEDF89]",
  [CICType.PROBABLY_ACCURATE]: "tw-bg-[#AAF0C4]",
  [CICType.ACCURATE]: "tw-bg-[#73E2A3]",
  [CICType.HIGHLY_ACCURATE]: "tw-bg-[#3CCB7F]",
};

export default function UserPageIdentityCICRatingsItem({
  rating,
}: {
  readonly rating: ProfilesMatterRatingWithRaterLevel;
}) {
  const router = useRouter();
  const [cicType, setCicType] = useState<CICType>(
    cicToType(rating.rater_cic_rating)
  );
  useEffect(() => {
    setCicType(cicToType(rating.rater_cic_rating));
  }, [rating]);

  const getRatingStr = (rating: number) => {
    return rating > 0
      ? `+${formatNumberWithCommas(rating)}`
      : `${formatNumberWithCommas(rating)}`;
  };
  const ratingStr = getRatingStr(rating.rating);
  const isPositiveRating = rating.rating > 0;
  const ratingColor = isPositiveRating ? "tw-text-green" : "tw-text-red";
  const timeAgo = getTimeAgo(new Date(rating.last_modified).getTime());

  const goToProfile = () => {
    router.push(`/${rating.rater_handle}/identity`);
  };

  return (
    <tr>
      <td className="tw-py-2.5">
        <div className="tw-inline-flex tw-items-center tw-space-x-3">
          <span className="tw-relative">
            <div className="tw-flex tw-items-center tw-justify-center tw-h-5 tw-w-5 tw-text-[0.625rem] tw-leading-3 tw-font-bold tw-rounded-full tw-ring-2 tw-ring-iron-300 tw-text-iron-300">
              {rating.rater_level}
            </div>
            <span
              className={`tw-flex-shrink-0 tw-absolute -tw-right-1 -tw-top-1 tw-block tw-h-2.5 tw-w-2.5 tw-rounded-full ${CIC_COLOR[cicType]}`}
            ></span>
          </span>
          <div className="tw-inline-flex tw-items-center tw-space-x-1">
            <button
              onClick={goToProfile}
              className="tw-bg-transparent tw-border-none tw-flex tw-items-center"
            >
              <span className="tw-whitespace-nowrap hover:tw-underline tw-cursor-pointer tw-text-sm tw-font-semibold tw-text-iron-100">
                {rating.rater_handle}
              </span>
            </button>
            <span className="tw-whitespace-nowrap tw-text-sm tw-text-iron-400 tw-font-semibold">
              rated
            </span>
            <span
              className={`tw-whitespace-nowrap tw-text-sm tw-font-semibold ${ratingColor}`}
            >
              {ratingStr}
            </span>
          </div>
        </div>
      </td>
      <td className="tw-py-2.5 tw-pl-3 tw-text-right">
        <span className="tw-whitespace-nowrap tw-text-[0.8125rem] tw-leading-5 tw-text-iron-500">
          {timeAgo}
        </span>
      </td>
    </tr>
  );
}
