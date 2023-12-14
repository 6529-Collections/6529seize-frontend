import { useState } from "react";
import {
  IProfileAndConsolidations,
  ProfileActivityLogBanner1Edit,
} from "../../../../../../entities/IProfile";
import UserPageIdentityActivityLogItemTimeAgo from "./UserPageIdentityActivityLogItemTimeAgo";

export default function UserPageIdentityActivityLogBanner1({
  log,
  profile,
}: {
  log: ProfileActivityLogBanner1Edit;
  profile: IProfileAndConsolidations;
}) {
  const isAdded = !log.contents.old_value;
  return (
    <tr>
      <td className="tw-py-4 tw-flex tw-items-center">
        <div className="tw-mt-1 tw-inline-flex tw-items-center tw-space-x-1.5">
          <span className="tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-text-neutral-100">
            {profile?.profile?.handle}
          </span>
          <span className="tw-whitespace-nowrap tw-text-sm tw-text-neutral-400 tw-font-semibold">
            {isAdded ? "added" : "changed"}
          </span>
          <span className="tw-whitespace-nowrap tw-text-sm tw-text-neutral-400 tw-font-medium">
            Banner 1
          </span>
          {!isAdded && (
            <>
              <span
                className="tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-h-4 tw-w-4 tw-rounded-sm"
                style={{ backgroundColor: log.contents.old_value }}
              ></span>
              <svg
                className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-neutral-400"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 12H20M20 12L14 6M20 12L14 18"
                  stroke="currentcOLOR"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </>
          )}

          <span
            className="tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-h-4 tw-w-4 tw-rounded-sm"
            style={{ backgroundColor: log.contents.new_value }}
          ></span>
        </div>
      </td>
      <td className="tw-py-4 tw-pl-3 tw-text-right">
        <UserPageIdentityActivityLogItemTimeAgo log={log} />
      </td>
    </tr>
  );
}
