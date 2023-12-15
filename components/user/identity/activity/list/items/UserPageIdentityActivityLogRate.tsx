import Tippy from "@tippyjs/react";
import {
  IProfileAndConsolidations,
  ProfileActivityLogRatingEdit,
} from "../../../../../../entities/IProfile";
import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";
import UserPageIdentityActivityLogItemTimeAgo from "./UserPageIdentityActivityLogItemTimeAgo";
import { useRouter } from "next/router";
import UserPageIdentityActivityLogItemHandle from "./utils/UserPageIdentityActivityLogItemHandle";
import UserPageIdentityActivityLogItemAction from "./utils/UserPageIdentityActivityLogItemAction";

export default function UserPageIdentityActivityLogRate({
  log,
  profile,
}: {
  readonly log: ProfileActivityLogRatingEdit;
  readonly profile: IProfileAndConsolidations;
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
    <tr>
      <td className="tw-py-4 tw-flex tw-items-center">
        <span className="tw-space-x-1.5">
          <UserPageIdentityActivityLogItemHandle profile={profile} />
          <UserPageIdentityActivityLogItemAction
            action={isValueZero ? "removed cic-rating from" : "cic-rated"}
          />
          <span className="tw-whitespace-nowrap tw-text-sm tw-text-iron-300 tw-font-medium">
            user
          </span>
          <Tippy content={log.target_profile_handle} theme="dark">
            <span
              onClick={goToProfile}
              className="tw-whitespace-nowrap hover:tw-underline tw-cursor-pointer tw-truncate tw-max-w-[12rem] tw-text-sm tw-font-semibold tw-text-iron-100"
            >
              {log.target_profile_handle}
            </span>
          </Tippy>
          {!isValueZero && (
            <span
              className={`${
                isPositive ? "tw-text-green" : "tw-text-red"
              } tw-text-sm tw-font-semibold`}
            >
              {valueAsString}
            </span>
          )}
        </span>
      </td>
      <td className="tw-py-4 tw-pl-3 tw-text-right">
        <UserPageIdentityActivityLogItemTimeAgo log={log} />
      </td>
    </tr>
  );
}
