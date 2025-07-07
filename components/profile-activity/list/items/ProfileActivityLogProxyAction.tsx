"use client";

import { useRouter } from "next/router";
import { ProfileActivityLogProxyActionCreated } from "../../../../entities/IProfile";
import { PROFILE_PROXY_ACTION_LABELS } from "../../../../entities/IProxy";
import CommonProfileLink from "../../../user/utils/CommonProfileLink";
import ProfileActivityLogItemAction from "./utils/ProfileActivityLogItemAction";
import { UserPageTabType } from "../../../user/layout/UserPageTabs";

export default function ProfileActivityLogProxyAction({
  log,
}: {
  readonly log: ProfileActivityLogProxyActionCreated;
}) {
  const router = useRouter();
  const handleOrWallet = log.target_profile_handle ?? "";

  const isCurrentUser =
    (router.query.user as string)?.toLowerCase() ===
    handleOrWallet.toLowerCase();

  const tabTarget = UserPageTabType.PROXY;
  return (
    <>
      <ProfileActivityLogItemAction action="created proxy action" />
      <span className="tw-whitespace-nowrap tw-text-base tw-font-medium tw-text-iron-100">
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
