import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";

export default function GroupCardActionStats({
  membersCount,
}: {
  readonly membersCount: number | null;
}) {
  const count =
    typeof membersCount === "number"
      ? formatNumberWithCommas(membersCount)
      : null;
  return (
    <div className="tw-mt-4 tw-flex tw-space-x-6">
      <div className="tw-text-sm tw-inline-flex tw-items-center tw-gap-x-1.5">
        <span className="tw-text-iron-400 tw-font-normal">Min rep</span>
        <span className="tw-font-medium tw-text-red">-443</span>
      </div>
      <div className="tw-text-sm tw-inline-flex tw-items-center tw-gap-x-1.5">
        <span className="tw-text-iron-400 tw-font-normal">Max rep</span>
        <span className="tw-font-medium tw-text-green">654</span>
      </div>
      <div className="tw-text-sm tw-inline-flex tw-items-center tw-gap-x-2">
        <svg
          className="tw-size-5 tw-flex-shrink-0 tw-text-iron-300"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          aria-hidden="true"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
          />
        </svg>
        <div className="tw-inline-flex tw-items-center tw-gap-x-1.5">
          <span className="tw-text-iron-400 tw-font-normal">Members count</span>
          <span className="tw-font-medium tw-text-iron-50">{count}</span>
        </div>
      </div>
    </div>
  );
}
