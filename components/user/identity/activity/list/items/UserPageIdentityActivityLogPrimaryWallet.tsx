import {
  IProfileAndConsolidations,
  ProfileActivityLogPrimaryWalletEdit,
} from "../../../../../../entities/IProfile";
import { formatAddress } from "../../../../../../helpers/Helpers";
import UserPageIdentityActivityLogItemTimeAgo from "./UserPageIdentityActivityLogItemTimeAgo";
import UserPageIdentityActivityLogItemHandle from "./utils/UserPageIdentityActivityLogItemHandle";
import UserPageIdentityActivityLogItemAction from "./utils/UserPageIdentityActivityLogItemAction";
import UserPageIdentityActivityLogItemValueWithCopy from "./utils/UserPageIdentityActivityLogItemValueWithCopy";

export default function UserPageIdentityActivityLogPrimaryWallet({
  log,
  profile,
}: {
  log: ProfileActivityLogPrimaryWalletEdit;
  profile: IProfileAndConsolidations;
}) {
  const isAdded = !log.contents.old_value;
  return (
    <tr>
      <td className="tw-py-4 tw-flex tw-items-center">
        <div className="tw-space-x-1.5">
          <UserPageIdentityActivityLogItemHandle profile={profile} />
          <UserPageIdentityActivityLogItemAction
            action={isAdded ? "added" : "changed"}
          />

          <span className="tw-whitespace-nowrap tw-text-sm tw-text-iron-300 tw-font-medium">
            primary wallet
          </span>
          {!isAdded && (
            <>
              <UserPageIdentityActivityLogItemValueWithCopy
                title={formatAddress(log.contents.old_value)}
                value={log.contents.old_value}
              />
              <svg
                className="tw-h-5 tw-w-5 tw-text-iron-400"
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
          <UserPageIdentityActivityLogItemValueWithCopy
            title={formatAddress(log.contents.new_value)}
            value={log.contents.new_value}
          />
        </div>
      </td>
      <td className="tw-py-4 tw-pl-3 tw-text-right">
        <UserPageIdentityActivityLogItemTimeAgo log={log} />
      </td>
    </tr>
  );
}
