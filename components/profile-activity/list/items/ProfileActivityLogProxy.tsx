"use client";

import { useSearchParams } from "next/navigation";

import { USER_PAGE_TAB_IDS } from "@/components/user/layout/userTabs.config";
import CommonProfileLink from "@/components/user/utils/CommonProfileLink";
import type { ProfileActivityLogProxyCreated } from "@/entities/IProfile";

import ProfileActivityLogItemAction from "./utils/ProfileActivityLogItemAction";


export default function ProfileActivityLogProxy({
  log,
}: {
  readonly log: ProfileActivityLogProxyCreated;
}) {
  const searchParams = useSearchParams();
  const handleOrWallet = log.target_profile_handle ?? "";
  const isCurrentUser =
    (searchParams?.get("user") as string)?.toLowerCase() ===
    handleOrWallet.toLowerCase();

  const tabTarget = USER_PAGE_TAB_IDS.PROXY;
  return (
    <>
      <ProfileActivityLogItemAction action="created proxy for" />
      <CommonProfileLink
        handleOrWallet={handleOrWallet}
        isCurrentUser={isCurrentUser}
        tabTarget={tabTarget}
        textClassName="tw-text-sm lg:tw-text-base tw-font-semibold tw-text-iron-100"
      />
    </>
  );
}
