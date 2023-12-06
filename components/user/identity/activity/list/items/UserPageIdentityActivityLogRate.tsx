import { ProfileActivityLogRatingEdit } from "../../../../../../entities/IProfile";
import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";

export default function UserPageIdentityActivityLogRate({
  log,
}: {
  log: ProfileActivityLogRatingEdit;
}) {
  const isPositive = log.contents.new_rating > 0;
  const valueAsString = `${isPositive ? "+" : ""}${formatNumberWithCommas(
    log.contents.new_rating
  )}`;

  return (
    <li className="tw-py-4">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-3">
        <div className="tw-inline-flex tw-items-center tw-space-x-2">
          <svg
            className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-100"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 15.5H7.5C6.10444 15.5 5.40665 15.5 4.83886 15.6722C3.56045 16.06 2.56004 17.0605 2.17224 18.3389C2 18.9067 2 19.6044 2 21M16 18L18 20L22 16M14.5 7.5C14.5 9.98528 12.4853 12 10 12C7.51472 12 5.5 9.98528 5.5 7.5C5.5 5.01472 7.51472 3 10 3C12.4853 3 14.5 5.01472 14.5 7.5Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="tw-inline-flex tw-space-x-1.5">
            <span className="tw-text-sm tw-text-neutral-400 tw-font-semibold">
              rated
            </span>
            <span className="tw-text-sm tw-text-neutral-400 tw-font-medium">
              user
            </span>
            <span className="tw-text-sm tw-font-semibold tw-text-neutral-100">
              {log.target_profile_handle}
            </span>
            <span
              className={`${
                isPositive ? "tw-text-green" : "tw-text-red"
              } tw-text-sm tw-font-semibold`}
            >
              {valueAsString}
            </span>
          </div>
        </div>
        <span className="tw-flex-none tw-text-[0.8125rem] tw-leading-5 tw-text-neutral-500">
          <span>1h</span>
          <span className="tw-ml-1">ago</span>
        </span>
      </div>
    </li>
  );
}
