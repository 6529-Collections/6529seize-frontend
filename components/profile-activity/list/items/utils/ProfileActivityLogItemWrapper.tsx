"use client";

import { PROFILE_ACTIVITY_EMPHASIS } from "@/components/profile-activity/profileActivityTypography";

import { USER_PAGE_TAB_IDS } from "@/components/user/layout/userTabs.config";
import CommonProfileLink from "@/components/user/utils/CommonProfileLink";
import type { ProfileActivityLog } from "@/entities/IProfile";
import { isGifImageUrl } from "@/helpers/gif-preview.helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { useIdentity } from "@/hooks/useIdentity";
import { parseDecentralizedMediaRef } from "@/lib/media/decentralized-media";
import { ProfileActivityLogType } from "@/types/enums";
import Image from "next/image";
import { useContext, useState } from "react";
import { IdentityActivityContext } from "../../../IdentityActivityContext";
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
  const compact = useContext(IdentityActivityContext);
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
  const avatarSrc = pfp ? getScaledImageUri(pfp, ImageScale.W_AUTO_H_50) : null;
  const [failedAvatarSrc, setFailedAvatarSrc] = useState<string | null>(null);
  const unoptimized =
    !parseDecentralizedMediaRef(pfp) ||
    !avatarSrc ||
    isGifImageUrl(avatarSrc) ||
    failedAvatarSrc === avatarSrc;
  const timestampIndent = isArchived ? "" : "tw-pl-9";

  return (
    <div
      className={
        compact
          ? "tw-group tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800/70 tw-p-4 last:tw-border-b-0"
          : "tw-group tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08] tw-bg-iron-900/60 tw-p-4 tw-shadow-sm tw-shadow-black/20 tw-transition-colors tw-duration-200 hover:tw-border-white/[0.12] hover:tw-bg-iron-900/80"
      }
    >
      <div
        className={`tw-flex tw-justify-between ${compact ? "tw-flex-col tw-gap-x-6 tw-gap-y-1 @2xl:tw-flex-row @2xl:tw-items-start" : "tw-items-start tw-gap-x-3"}`}
      >
        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-start tw-gap-x-3">
          <div
            className={`tw-flex tw-min-w-0 tw-flex-1 tw-flex-wrap tw-items-center tw-gap-x-1.5 tw-gap-y-1 ${isArchived ? "" : "tw-pl-9"}`}
          >
            {!isArchived && (
              <span className="-tw-ml-9 tw-inline-flex tw-shrink-0 tw-items-center tw-gap-x-3">
                {avatarSrc ? (
                  <Image
                    // Avoid Safari reselecting a large srcset candidate on fallback.
                    key={`${avatarSrc}:${unoptimized}`}
                    src={avatarSrc}
                    alt={handleOrWallet}
                    width={24}
                    height={24}
                    sizes="24px"
                    unoptimized={unoptimized}
                    onError={() => setFailedAvatarSrc(avatarSrc)}
                    className={`tw-h-6 tw-w-6 tw-flex-shrink-0 tw-bg-iron-700 tw-object-cover ${compact ? "tw-rounded-full" : "tw-rounded-md"}`}
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className={`tw-flex tw-h-6 tw-w-6 tw-flex-shrink-0 tw-items-center tw-justify-center tw-bg-iron-700 tw-text-xs tw-font-medium tw-text-iron-300 ${compact ? "tw-rounded-full" : "tw-rounded-md"}`}
                  >
                    {compact ? handleOrWallet.charAt(0).toUpperCase() : null}
                  </span>
                )}
                <CommonProfileLink
                  handleOrWallet={handleOrWallet}
                  isCurrentUser={isCurrentUser}
                  tabTarget={tabTarget}
                  textClassName={`tw-text-sm sm:tw-text-base tw-font-semibold tw-text-iron-100 ${PROFILE_ACTIVITY_EMPHASIS}`}
                />
              </span>
            )}
            {children}
          </div>
        </div>
        <div
          className={
            compact
              ? `${timestampIndent} @2xl:tw-shrink-0 @2xl:tw-pl-0`
              : "tw-flex-shrink-0 tw-pl-3"
          }
        >
          <ProfileActivityLogItemTimeAgo log={log} />
        </div>
      </div>
    </div>
  );
}
