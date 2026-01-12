import { USER_PAGE_TAB_IDS } from "@/components/user/layout/userTabs.config";
import CommonProfileLink from "@/components/user/utils/CommonProfileLink";
import type { ProfileActivityLog } from "@/entities/IProfile";
import { ProfileActivityLogType, RateMatter } from "@/types/enums";
import ProfileActivityLogItemTimeAgo from "./ProfileActivityLogItemTimeAgo";

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

  const getHandleOrWallet = (): string => {
    if (!user || !log.proxy_handle) return log?.profile_handle ?? "";
    if (user.toLowerCase() === log.proxy_handle.toLowerCase()) {
      return log.proxy_handle;
    }
    return log.profile_handle ?? "";
  };

  const handleOrWallet = getHandleOrWallet();
  const isCurrentUser =
    user?.toLowerCase() === handleOrWallet.toLowerCase() || !user;

  const tabTarget =
    log.type === ProfileActivityLogType.RATING_EDIT &&
    log.contents.rating_matter === RateMatter.REP
      ? USER_PAGE_TAB_IDS.REP
      : USER_PAGE_TAB_IDS.IDENTITY;

  return (
    <tr className="tw-flex tw-items-center tw-justify-between">
      <td className="tw-py-2.5">
        <span className="tw-inline-flex tw-items-center tw-space-x-1.5">
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
