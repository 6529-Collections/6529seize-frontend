"use client";

import { useSearchParams } from "next/navigation";
import { ProfileActivityLogProxyActionCreated } from "@/entities/IProfile";
import { PROFILE_PROXY_ACTION_LABELS } from "@/entities/IProxy";
import CommonProfileLink from "@/components/user/utils/CommonProfileLink";
import ProfileActivityLogItemAction from "./utils/ProfileActivityLogItemAction";
import { USER_PAGE_TAB_IDS } from "@/components/user/layout/userTabs.config";

export default function ProfileActivityLogProxyAction({
  log,
}: {
  readonly log: ProfileActivityLogProxyActionCreated;
}) {
  const searchParams = useSearchParams();
  const handleOrWallet = log.target_profile_handle ?? "";

  const isCurrentUser =
    (searchParams?.get("user") as string)?.toLowerCase() ===
    handleOrWallet.toLowerCase();

  const tabTarget = USER_PAGE_TAB_IDS.PROXY;
  return (
    <>
      <ProfileActivityLogItemAction action="created proxy action" />
      <span className="tw-whitespace-nowrap tw-text-base tw-font-medium tw-text-iron-200">
        {PROFILE_PROXY_ACTION_LABELS[log.contents.type]}
      </span>
      <ProfileActivityLogItemAction action="for" />
      <CommonProfileLink
        handleOrWallet={handleOrWallet}
        isCurrentUser={isCurrentUser}
        tabTarget={tabTarget}
      />
    </>
  );
}
