"use client";

import { USER_PAGE_TAB_IDS } from "@/components/user/layout/userTabs.config";
import CommonProfileLink from "@/components/user/utils/CommonProfileLink";
import type { ProfileActivityLog } from "@/entities/IProfile";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { useIdentity } from "@/hooks/useIdentity";
import { ProfileActivityLogType } from "@/types/enums";
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

  const tabTarget = USER_PAGE_TAB_IDS.REP;

  const { profile } = useIdentity({
    handleOrWallet: !isArchived ? handleOrWallet : null,
    initialProfile: null,
  });

  const pfp = profile?.pfp ?? null;

  return (
    <div className="tw-group tw-p-4 tw-bg-[#0A0A0C]/50 hover:tw-bg-[#0A0A0C] tw-border tw-border-solid tw-border-white/5 hover:tw-border-white/10 tw-rounded-xl tw-transition-all tw-duration-200">
      <div className="tw-flex tw-items-center tw-justify-between">
        <span className="tw-inline-flex tw-items-center tw-flex-wrap tw-gap-x-1.5 tw-gap-y-1">
          {!isArchived && (
            <>
              {pfp ? (
                <img
                  src={getScaledImageUri(pfp, ImageScale.W_AUTO_H_50)}
                  alt={handleOrWallet}
                  className="tw-h-6 tw-w-6 tw-flex-shrink-0 tw-rounded-md tw-bg-iron-700 tw-object-cover"
                />
              ) : (
                <div className="tw-h-6 tw-w-6 tw-flex-shrink-0 tw-rounded-md tw-bg-iron-700" />
              )}
              <CommonProfileLink
                handleOrWallet={handleOrWallet}
                isCurrentUser={isCurrentUser}
                tabTarget={tabTarget}
              />
            </>
          )}
          {children}
        </span>
        <div className="tw-pl-3 tw-flex-shrink-0">
          <ProfileActivityLogItemTimeAgo log={log} />
        </div>
      </div>
    </div>
  );
}
