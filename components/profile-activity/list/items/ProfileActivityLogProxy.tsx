"use client";

import { useSearchParams } from "next/navigation";
import { ProfileActivityLogProxyCreated } from "@/entities/IProfile";
import CommonProfileLink from "@/components/user/utils/CommonProfileLink";
import ProfileActivityLogItemAction from "./utils/ProfileActivityLogItemAction";
import { UserPageTabType } from "@/components/user/layout/UserPageTabs";

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

  const tabTarget = UserPageTabType.PROXY;
  return (
    <>
      <ProfileActivityLogItemAction action="created proxy for" />
      <CommonProfileLink
        handleOrWallet={handleOrWallet}
        isCurrentUser={isCurrentUser}
        tabTarget={tabTarget}
      />
    </>
  );
}
