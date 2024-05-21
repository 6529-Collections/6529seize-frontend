import {
  CICType,
  RatingWithProfileInfoAndLevel,
} from "../../../../entities/IProfile";
import { useEffect, useState } from "react";
import {
  cicToType,
  formatNumberWithCommas,
  getTimeAgo,
} from "../../../../helpers/Helpers";
import { ProfileRatersTableType } from "./wrapper/ProfileRatersTableWrapper";
import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";
import UserCICAndLevel from "../UserCICAndLevel";
import Link from "next/link";

export const CIC_COLOR: Record<CICType, string> = {
  [CICType.INACCURATE]: "tw-bg-[#F97066]",
  [CICType.UNKNOWN]: "tw-bg-[#FEDF89]",
  [CICType.PROBABLY_ACCURATE]: "tw-bg-[#AAF0C4]",
  [CICType.ACCURATE]: "tw-bg-[#73E2A3]",
  [CICType.HIGHLY_ACCURATE]: "tw-bg-[#3CCB7F]",
};

export default function ProfileRatersTableItem({
  rating,
  type,
}: {
  readonly rating: RatingWithProfileInfoAndLevel;
  readonly type: ProfileRatersTableType;
}) {
  const [cicType, setCicType] = useState<CICType>(cicToType(rating.cic));
  useEffect(() => {
    setCicType(cicToType(rating.cic));
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

  const getProfileRoute = (): string => {
    switch (type) {
      case ProfileRatersTableType.CIC_RECEIVED:
      case ProfileRatersTableType.CIC_GIVEN:
        return `/${rating.handle}/identity`;
      case ProfileRatersTableType.REP_RECEIVED:
      case ProfileRatersTableType.REP_GIVEN:
        return `/${rating.handle}/`;
      default:
        assertUnreachable(type);
        return "";
    }
  };

  const profileRoute = getProfileRoute();

  return (
    <tr>
      <td className="tw-px-4 sm:tw-px-6 lg:tw-pr-4 tw-py-2.5">
        <div className="tw-inline-flex tw-items-center tw-space-x-2.5">
          <UserCICAndLevel level={rating.level} cicType={cicType} />
          <div className="tw-inline-flex tw-items-center tw-space-x-1">
            <Link
              href={profileRoute}
              className="tw-no-underline tw-p-0 tw-flex tw-items-center"
            >
              <span className="tw-whitespace-nowrap hover:tw-underline tw-cursor-pointer tw-text-sm sm:tw-text-md tw-font-medium tw-text-iron-100">
                {rating.handle}
              </span>
            </Link>
          </div>
        </div>
      </td>
      <td className="tw-px-4 sm:tw-px-6 lg:tw-pl-4 tw-py-2.5 tw-text-right">
        <span
          className={`tw-whitespace-nowrap tw-text-sm sm:tw-text-md tw-font-medium ${ratingColor}`}
        >
          {ratingStr}
        </span>
      </td>
      <td className="tw-px-4 sm:tw-px-6 lg:tw-pl-4 tw-py-2.5 tw-text-right">
        <span className="tw-whitespace-nowrap tw-text-sm sm:tw-text-md tw-font-normal tw-text-iron-500">
          {timeAgo}
        </span>
      </td>
    </tr>
  );
}
