import { useRouter } from "next/router";
import { CICType } from "../../../../entities/IProfile";
import { useEffect, useState } from "react";
import {
  cicToType,
  formatNumberWithCommas,
  getTimeAgo,
} from "../../../../helpers/Helpers";
import {
  IProfileRatersTableItem,
  ProfileRatersTableType,
} from "./wrapper/ProfileRatersTableWrapper";
import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";
import UserCICAndLevel from "../UserCICAndLevel";

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
  readonly rating: IProfileRatersTableItem;
  readonly type: ProfileRatersTableType;
}) {
  const TYPE_TO_TEXT: Record<ProfileRatersTableType, string> = {
    [ProfileRatersTableType.CIC_RECEIVED]: "CIC rated",
    [ProfileRatersTableType.REP_RECEIVED]: "gave total Rep",
    [ProfileRatersTableType.REP_GIVEN]: "received total Rep",
  };
  const router = useRouter();
  const [cicType, setCicType] = useState<CICType>(cicToType(rating.raterCIC));
  useEffect(() => {
    setCicType(cicToType(rating.raterCIC));
  }, [rating]);

  const getRatingStr = (rating: number) => {
    return rating > 0
      ? `+${formatNumberWithCommas(rating)}`
      : `${formatNumberWithCommas(rating)}`;
  };
  const ratingStr = getRatingStr(rating.rating);
  const isPositiveRating = rating.rating > 0;
  const ratingColor = isPositiveRating ? "tw-text-green" : "tw-text-red";
  const timeAgo = getTimeAgo(new Date(rating.lastModified).getTime());

  const getProfileRoute = (): string => {
    switch (type) {
      case ProfileRatersTableType.CIC_RECEIVED:
        return `/${rating.raterHandle}/identity`;
      case ProfileRatersTableType.REP_RECEIVED:
      case ProfileRatersTableType.REP_GIVEN:
        return `/${rating.raterHandle}/rep`;
      default:
        assertUnreachable(type);
        return "";
    }
  };

  const goToProfile = () => {
    router.push(getProfileRoute());
  };

  return (
    <tr>
      <td className="tw-py-2.5">
        <div className="tw-inline-flex tw-items-center tw-space-x-2">
          <UserCICAndLevel level={rating.raterLevel} cicType={cicType} />
          <div className="tw-inline-flex tw-items-center tw-space-x-1">
            <button
              onClick={goToProfile}
              className="tw-bg-transparent tw-border-none tw-flex tw-items-center"
            >
              <span className="tw-whitespace-nowrap hover:tw-underline tw-cursor-pointer tw-text-sm tw-font-semibold tw-text-iron-100">
                {rating.raterHandle}
              </span>
            </button>
            <span className="tw-whitespace-nowrap tw-text-sm tw-text-iron-400 tw-font-semibold">
              {TYPE_TO_TEXT[type]}
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
