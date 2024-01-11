import {
  ProfileActivityLog,
  ProfileActivityLogType,
  RateMatter,
} from "../../../../../entities/IProfile";
import ProfileActivityLogItemTimeAgo from "./ProfileActivityLogItemTimeAgo";
import { UserPageTabType } from "../../../../user/layout/UserPageTabs";
import CommonProfileLink from "../../../../user/utils/CommonProfileLink";

export default function ProfileActivityLogItemWrapper({
  log,
  children,
  user,
}: {
  readonly log: ProfileActivityLog;
  readonly children: React.ReactNode;
  readonly user: string | null;
}) {
  const isArchived = log.type === ProfileActivityLogType.PROFILE_ARCHIVED;

  const handleOrWallet = log?.profile_handle ?? "";
  const isCurrentUser =
    user?.toLowerCase() === log?.profile_handle?.toLowerCase();

  const tabTarget =
    log.type === ProfileActivityLogType.RATING_EDIT &&
    log.contents.rating_matter === RateMatter.REP
      ? UserPageTabType.REP
      : UserPageTabType.IDENTITY;

  return (
    <tr className="tw-flex tw-items-center tw-justify-between">
      <td className="tw-py-2.5">
        <span className="tw-space-x-1 tw-inline-flex tw-items-center">
          {!isArchived && (
            <CommonProfileLink
              handleOrWallet={handleOrWallet}
              isCurrentUser={isCurrentUser}
              tabTarget={tabTarget}
            />
          )}
          {children}
        </span>
      </td>
      <td className="tw-py-2.5 tw-pl-3 tw-text-right">
        <ProfileActivityLogItemTimeAgo log={log} />
      </td>
    </tr>
  );
}
