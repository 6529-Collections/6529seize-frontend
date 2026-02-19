"use client";

import type { RatingWithProfileInfoAndLevel } from "@/entities/IProfile";
import { formatNumberWithCommas, getTimeAgo } from "@/helpers/Helpers";
import Link from "next/link";
import UserCICAndLevel from "../UserCICAndLevel";

export default function ProfileRatersTableItem({
  rating,
}: {
  readonly rating: RatingWithProfileInfoAndLevel;
}) {
  const getRatingStr = (rating: number) => {
    return rating > 0
      ? `+${formatNumberWithCommas(rating)}`
      : `${formatNumberWithCommas(rating)}`;
  };
  const ratingStr = getRatingStr(rating.rating);
  const isPositiveRating = rating.rating > 0;
  const ratingColor = isPositiveRating ? "tw-text-green" : "tw-text-red";
  const timeAgo = getTimeAgo(new Date(rating.last_modified).getTime());

  const getProfileRoute = (): string => `/${rating.handle}/rep`;

  const profileRoute = getProfileRoute();

  return (
    <tr>
      <td className="tw-px-4 tw-py-2.5 sm:tw-px-6 lg:tw-pr-4">
        <div className="tw-inline-flex tw-items-center tw-space-x-2.5">
          <UserCICAndLevel level={rating.level} />
          <div className="tw-inline-flex tw-items-center tw-space-x-1">
            <Link
              href={profileRoute}
              className="tw-flex tw-items-center tw-p-0 tw-no-underline"
            >
              <span className="tw-cursor-pointer tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-iron-200 hover:tw-underline sm:tw-text-md">
                {rating.handle}
              </span>
            </Link>
          </div>
        </div>
      </td>
      <td className="tw-px-4 tw-py-2.5 tw-text-right sm:tw-px-6 lg:tw-pl-4">
        <span
          className={`tw-whitespace-nowrap tw-text-sm tw-font-medium sm:tw-text-md ${ratingColor}`}
        >
          {ratingStr}
        </span>
      </td>
      <td className="tw-px-4 tw-py-2.5 tw-text-right sm:tw-px-6 lg:tw-pl-4">
        <span className="tw-whitespace-nowrap tw-text-sm tw-font-normal tw-text-iron-500 sm:tw-text-md">
          {timeAgo}
        </span>
      </td>
    </tr>
  );
}
