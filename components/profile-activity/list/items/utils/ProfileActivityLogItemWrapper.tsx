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
    handleOrWallet: isArchived ? null : handleOrWallet,
    initialProfile: null,
  });

  const pfp = profile?.pfp ?? null;

  return (
    <div className="tw-group tw-p-4 tw-bg-[#0A0A0C]/50 hover:tw-bg-[#0A0A0C] tw-border tw-border-solid tw-border-white/[0.12] hover:tw-border-white/[0.16] tw-rounded-lg tw-transition-all tw-duration-200">
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-x-3">
        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-start tw-gap-x-3">
          {!isArchived &&
            (pfp ? (
              <img
                src={getScaledImageUri(pfp, ImageScale.W_AUTO_H_50)}
                alt={handleOrWallet}
                className="tw-h-6 tw-w-6 tw-flex-shrink-0 tw-rounded-md tw-bg-iron-700 tw-object-cover"
              />
            ) : (
              <div className="tw-h-6 tw-w-6 tw-flex-shrink-0 tw-rounded-md tw-bg-iron-700" />
            ))}
          <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-wrap tw-items-center tw-gap-x-1.5 tw-gap-y-1">
            {!isArchived && (
              <CommonProfileLink
                handleOrWallet={handleOrWallet}
                isCurrentUser={isCurrentUser}
                tabTarget={tabTarget}
                textClassName="tw-text-sm md:tw-text-md tw-font-semibold tw-text-iron-100"
              />
            )}
            {children}
          </div>
        </div>
        <div className="tw-flex-shrink-0 tw-pl-3">
          <ProfileActivityLogItemTimeAgo log={log} />
        </div>
      </div>
    </div>
  );
}
