import { ProfileActivityLogRatingEdit } from "../../../../entities/IProfile";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import { useRouter } from "next/router";
import ProfileActivityLogItemAction from "./utils/ProfileActivityLogItemAction";

export default function ProfileActivityLogRate({
  log,
}: {
  readonly log: ProfileActivityLogRatingEdit;
}) {
  const router = useRouter();
  const isPositive = log.contents.new_rating > 0;
  const valueAsString = `${isPositive ? "+" : ""}${formatNumberWithCommas(
    log.contents.new_rating
  )}`;

  const goToProfile = () => {
    router.push(`/${log.target_profile_handle}/identity`);
  };

  const isValueZero = log.contents.new_rating === 0;
  return (
    <>
      <ProfileActivityLogItemAction
        action={isValueZero ? "removed cic-rating from" : "cic-rated"}
      />
      <span className="tw-whitespace-nowrap tw-text-sm tw-text-iron-300 tw-font-medium">
        user
      </span>

      <button
        onClick={goToProfile}
        className="tw-bg-transparent tw-border-none"
      >
        <span className="tw-whitespace-nowrap hover:tw-underline tw-cursor-pointer tw-truncate tw-max-w-[12rem] tw-text-sm tw-font-semibold tw-text-iron-100">
          {log.target_profile_handle}
        </span>
      </button>

      {!isValueZero && (
        <span
          className={`${
            isPositive ? "tw-text-green" : "tw-text-red"
          } tw-text-sm tw-font-semibold`}
        >
          {valueAsString}
        </span>
      )}
    </>
  );
}
