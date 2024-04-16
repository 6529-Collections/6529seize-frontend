import {
  ProfileActivityLogRatingEditContentChangeReason,
  type ProfileActivityLogDropRepEdit,
} from "../../../../entities/IProfile";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import ProfileActivityLogItemAction from "./utils/ProfileActivityLogItemAction";
import Link from "next/link";

enum ProfileActivityLogType {
  ADDED = "ADDED",
  REMOVED = "REMOVED",
}

const ACTION: Record<ProfileActivityLogType, string> = {
  [ProfileActivityLogType.ADDED]: "added",
  [ProfileActivityLogType.REMOVED]: "reduced",
};

const TO_FROM: Record<ProfileActivityLogType, string> = {
  [ProfileActivityLogType.ADDED]: "to",
  [ProfileActivityLogType.REMOVED]: "from",
};

export default function ProfileActivityLogDropRepEdit({
  log,
}: {
  readonly log: ProfileActivityLogDropRepEdit;
}) {
  const isSystemAdjustment =
    log.contents.change_reason ===
    ProfileActivityLogRatingEditContentChangeReason.LOST_TDH;


  const getRatingType = (): ProfileActivityLogType =>
    log.contents.new_rating < log.contents.old_rating
      ? ProfileActivityLogType.REMOVED
      : ProfileActivityLogType.ADDED;

  const ratingType = getRatingType();

  const change = log.contents.new_rating - log.contents.old_rating;
  const isChangePositive = change > 0;
  const changeStr = formatNumberWithCommas(Math.abs(change));

  const isNewRatingPositive = log.contents.new_rating > 0;
  const isNewRatingNegative = log.contents.new_rating < 0;
  const newRatingStr = formatNumberWithCommas(log.contents.new_rating);

  const getTotalRatingClass = () => {
    if (isNewRatingPositive) {
      return "tw-text-green";
    } else if (isNewRatingNegative) {
      return "tw-text-red";
    } else {
      return "tw-text-iron-400";
    }
  };

  return (
    <>
      <ProfileActivityLogItemAction action={ACTION[ratingType]} />
      <span
        className={`${
          isChangePositive ? "tw-text-green" : "tw-text-red"
        } tw-text-base tw-font-medium`}
      >
        {changeStr}
      </span>
      <span
        className={`${getTotalRatingClass()} tw-whitespace-nowrap tw-text-base tw-font-medium`}
      >
        (total {newRatingStr})
      </span>
      <span className="tw-whitespace-nowrap tw-text-base tw-font-medium tw-text-iron-100">
        {log.contents.rating_category}
      </span>
      <ProfileActivityLogItemAction action="to Drop" />
      <Link href={`/brain/${log.target_id}`} className="tw-leading-4 tw-p-0">
        <span className="tw-cursor-pointer tw-whitespace-nowrap tw-text-base tw-font-medium tw-text-iron-100 hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out">
          #{log.target_id}
        </span>
      </Link>

      {isSystemAdjustment && (
        <span className="tw-whitespace-nowrap tw-inline-flex tw-items-center tw-gap-x-1.5 tw-rounded-md tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-700">
          <svg
            className="tw-flex-shrink-0 tw-h-1.5 tw-w-1.5 tw-fill-red"
            viewBox="0 0 6 6"
            aria-hidden="true"
          >
            <circle cx="3" cy="3" r="3" />
          </svg>
          <span>System Adjustment</span>
        </span>
      )}
    </>
  );
}
