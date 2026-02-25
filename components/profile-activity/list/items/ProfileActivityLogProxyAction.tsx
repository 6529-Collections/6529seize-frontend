"use client";

import { useSearchParams } from "next/navigation";

import { USER_PAGE_TAB_IDS } from "@/components/user/layout/userTabs.config";
import CommonProfileLink from "@/components/user/utils/CommonProfileLink";
import type { ProfileActivityLogProxyActionCreated } from "@/entities/IProfile";
import { PROFILE_PROXY_ACTION_LABELS } from "@/entities/IProxy";

import ProfileActivityLogItemAction from "./utils/ProfileActivityLogItemAction";


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
      <span className="tw-whitespace-nowrap tw-text-sm lg:tw-text-base tw-font-medium tw-text-iron-300">
        {PROFILE_PROXY_ACTION_LABELS[log.contents.type]}
      </span>
      <ProfileActivityLogItemAction action="for" />
      <CommonProfileLink
        handleOrWallet={handleOrWallet}
        isCurrentUser={isCurrentUser}
        tabTarget={tabTarget}
        textClassName="tw-text-sm lg:tw-text-base tw-font-semibold tw-text-iron-100"
      />
    </>
  );
}
