import { GroupFull } from "../../../../../generated/models/GroupFull";
import { getTimeAgo } from "../../../../../helpers/Helpers";

export default function GroupCardHeader({
  group,
}: {
  readonly group: GroupFull;
}) {
  const timeAgo = getTimeAgo(new Date(group.created_at).getTime());
  return (
    <div className="tw-px-4 sm:tw-px-6 tw-flex tw-gap-x-3">
      <div className="tw-flex tw-gap-x-4">
        {group.created_by.pfp ? (
          <img
            className="-tw-mt-3 tw-flex-shrink-0 tw-object-contain tw-h-12 tw-w-12 tw-rounded-lg tw-bg-iron-700 tw-ring-[3px] tw-ring-iron-900"
            src={group.created_by.pfp}
            alt=""
          />
        ) : (
          <div className="-tw-mt-3 tw-h-12 tw-w-12 tw-rounded-lg tw-bg-iron-700 tw-ring-[3px] tw-ring-iron-900"></div>
        )}
      </div>
      <div className="tw-mt-2 tw-flex tw-items-center tw-w-full tw-justify-between">
        <span className="tw-text-base tw-font-semibold tw-text-iron-50">
          {group.created_by.handle}
        </span>
        <div className="tw-flex tw-items-center tw-gap-x-4">
          <span className="tw-text-sm tw-text-iron-400 tw-font-normal">
            {timeAgo}
          </span>
          {/* <button
            type="button"
            className="tw-p-1 tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-400 hover:tw-text-iron-50 tw-transition tw-duration-300 tw-ease-out"
          >
            <svg
              className="tw-w-5 tw-h-5"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                stroke-Linejoin="round"
              />
              <path
                d="M12 6C12.5523 6 13 5.55228 13 5C13 4.44772 12.5523 4 12 4C11.4477 4 11 4.44772 11 5C11 5.55228 11.4477 6 12 6Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                stroke-Linejoin="round"
              />
              <path
                d="M12 20C12.5523 20 13 19.5523 13 19C13 18.4477 12.5523 18 12 18C11.4477 18 11 18.4477 11 19C11 19.5523 11.4477 20 12 20Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                stroke-Linejoin="round"
              />
            </svg>
          </button> */}
        </div>
      </div>
    </div>
  );
}
