import {
  ProfileActivityLogRatingEdit,
  ProfileActivityLogRatingEditContentChangeReason,
} from "../../../../../entities/IProfile";
import { useRouter } from "next/router";
import ProfileActivityLogItemAction from "../utils/ProfileActivityLogItemAction";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";
import ProfileActivityLogRateColoredValue from "./ProfileActivityLogRateColoredValue";
import ProfileActivityLogRateChange from "./ProfileActivityLogRateChange";
import ProfileActivityLogRateRemove from "./ProfileActivityLogRateRemove";

enum ProfileActivityLogRateType {
  NEW_RATING = "NEW_RATING",
  REMOVED_RATING = "REMOVED_RATING",
  INCREASED_RATING = "INCREASED_RATING",
  DECREASED_RATING = "DECREASED_RATING",
}

const ACTION: Record<ProfileActivityLogRateType, string> = {
  [ProfileActivityLogRateType.NEW_RATING]: "cic-rated",
  [ProfileActivityLogRateType.REMOVED_RATING]: "removed cic-rating from",
  [ProfileActivityLogRateType.INCREASED_RATING]: "increased",
  [ProfileActivityLogRateType.DECREASED_RATING]: "decreased",
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

  const getRatingType = (): ProfileActivityLogRateType => {
    if (!log.contents.old_rating) {
      return ProfileActivityLogRateType.NEW_RATING;
    }

    if (!log.contents.new_rating) {
      return ProfileActivityLogRateType.REMOVED_RATING;
    }

    if (log.contents.new_rating > log.contents.old_rating) {
      return ProfileActivityLogRateType.INCREASED_RATING;
    }

    if (log.contents.new_rating < log.contents.old_rating) {
      return ProfileActivityLogRateType.DECREASED_RATING;
    }

    return ProfileActivityLogRateType.NEW_RATING;
  };

  const ratingType = getRatingType();
  const goToProfile = () => {
    router.push(`/${log.target_profile_handle}/identity`);
  };

  return (
    <>
      <ProfileActivityLogItemAction action={ACTION[ratingType]} />
      <button
        onClick={goToProfile}
        className="tw-bg-transparent tw-border-none tw-leading-4 tw-p-0"
      >
        <span className="tw-whitespace-nowrap hover:tw-underline tw-cursor-pointer tw-truncate tw-max-w-[12rem] tw-text-sm tw-font-semibold tw-text-iron-100">
          {log.target_profile_handle}
        </span>
      </button>

      {(() => {
        switch (ratingType) {
          case ProfileActivityLogRateType.NEW_RATING:
            return (
              <ProfileActivityLogRateColoredValue
                value={log.contents.new_rating}
              />
            );
          case ProfileActivityLogRateType.REMOVED_RATING:
            return (
              <ProfileActivityLogRateRemove value={log.contents.old_rating} />
            );
          case ProfileActivityLogRateType.INCREASED_RATING:
          case ProfileActivityLogRateType.DECREASED_RATING:
            return (
              <ProfileActivityLogRateChange
                oldValue={log.contents.old_rating}
                newValue={log.contents.new_rating}
              />
            );
          default:
            assertUnreachable(ratingType);
        }
      })()}
      {isSystemAdjustment && (
        <span className="tw-inline-flex tw-items-center tw-gap-x-1.5 tw-rounded-md tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-text-white tw-ring-1 tw-ring-inset tw-ring-gray-700">
          <svg
            className="tw-h-1.5 tw-w-1.5 tw-fill-red"
            viewBox="0 0 6 6"
            aria-hidden="true"
          >
            <circle cx="3" cy="3" r="3" />
          </svg>
          System Adjustment
        </span>
      )}
    </>
  );
}
