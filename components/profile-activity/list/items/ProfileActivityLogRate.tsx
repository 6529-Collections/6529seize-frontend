import {
  ProfileActivityLogRatingEdit,
  ProfileActivityLogRatingEditContentChangeReason,
} from "../../../../entities/IProfile";
import { useRouter } from "next/router";
import ProfileActivityLogItemAction from "./utils/ProfileActivityLogItemAction";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";

enum ProfileActivityLogRateType {
  ADDED = "ADDED",
  REMOVED = "REMOVED",
}

const ACTION: Record<ProfileActivityLogRateType, string> = {
  [ProfileActivityLogRateType.ADDED]: "added",
  [ProfileActivityLogRateType.REMOVED]: "removed",
};

const TO_FROM: Record<ProfileActivityLogRateType, string> = {
  [ProfileActivityLogRateType.ADDED]: "to",
  [ProfileActivityLogRateType.REMOVED]: "from",
};

export default function ProfileActivityLogRate({
  log,
}: {
  readonly log: ProfileActivityLogRatingEdit;
}) {
  const isSystemAdjustment =
    log.contents.change_reason ===
    ProfileActivityLogRatingEditContentChangeReason.LOST_TDH;

  const router = useRouter();

  const getRatingType = (): ProfileActivityLogRateType =>
    log.contents.new_rating < log.contents.old_rating
      ? ProfileActivityLogRateType.REMOVED
      : ProfileActivityLogRateType.ADDED;

  const ratingType = getRatingType();
  const goToProfile = () => {
    router.push(`/${log.target_profile_handle}/identity`);
  };

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
        } tw-text-sm tw-font-semibold`}
      >
        {changeStr}
      </span>
      <ProfileActivityLogItemAction
        action={`CIC-rating ${TO_FROM[ratingType]}`}
      />
      <button
        onClick={goToProfile}
        className="tw-bg-transparent tw-border-none tw-leading-4 tw-p-0"
      >
        <span className="tw-whitespace-nowrap hover:tw-underline tw-cursor-pointer tw-truncate tw-max-w-[12rem] tw-text-sm tw-font-semibold tw-text-iron-100">
          {log.target_profile_handle}
        </span>
      </button>
      <span className={`${getTotalRatingClass()} tw-whitespace-nowrap tw-text-sm tw-font-semibold`}>
        (total {newRatingStr})
      </span>
      {isSystemAdjustment && (
        <span className="tw-whitespace-nowrap tw-inline-flex tw-items-center tw-gap-x-1.5 tw-rounded-md tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-700">
          <svg
            className="tw-flex-shrink-0 tw-h-1.5 tw-w-1.5 tw-fill-red"
            viewBox="0 0 6 6"
            aria-hidden="true"
          >
            <circle cx="3" cy="3" r="3" />
          </svg>
         <span> System Adjustment</span>
        </span>
      )}
    </>
  );
}
