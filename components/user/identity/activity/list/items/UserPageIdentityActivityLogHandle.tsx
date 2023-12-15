import {
  IProfileAndConsolidations,
  ProfileActivityLogHandleEdit,
} from "../../../../../../entities/IProfile";
import UserPageIdentityActivityLogItemTimeAgo from "./UserPageIdentityActivityLogItemTimeAgo";
import UserPageIdentityActivityLogItemAction from "./utils/UserPageIdentityActivityLogItemAction";
import UserPageIdentityActivityLogItemHandle from "./utils/UserPageIdentityActivityLogItemHandle";

export default function UserPageIdentityActivityLogHandle({
  log,
  profile,
}: {
  log: ProfileActivityLogHandleEdit;
  profile: IProfileAndConsolidations;
}) {
  const isAdded = !log.contents.old_value;
  return (
    <tr>
      <td className="tw-py-4 tw-flex tw-items-center">
        <span className="tw-space-x-1.5">
          <UserPageIdentityActivityLogItemHandle profile={profile} />
          <UserPageIdentityActivityLogItemAction
            action={isAdded ? "created" : "changed"}
          />
          <span className="tw-whitespace-nowrap tw-text-sm tw-text-iron-300 tw-font-medium">
            handle
          </span>
          {!isAdded && (
            <>
              <span className="tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-text-neutral-100">
                {log.contents.old_value}
              </span>
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

          <span className="tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-text-iron-100">
            {log.contents.new_value}
          </span>
        </span>
      </td>
      <td className="tw-py-4 tw-pl-3 tw-text-right">
        <UserPageIdentityActivityLogItemTimeAgo log={log} />
      </td>
    </tr>
  );
}
