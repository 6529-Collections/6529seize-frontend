"use client";

import { useSearchParams } from "next/navigation";
import { ProfileActivityLogProxyActionStateChanged } from "@/entities/IProfile";
import { PROFILE_PROXY_ACTION_LABELS } from "@/entities/IProxy";
import { AcceptActionRequestActionEnum } from "@/generated/models/AcceptActionRequest";
import ProfileActivityLogItemAction from "./utils/ProfileActivityLogItemAction";
import { UserPageTabType } from "@/components/user/layout/UserPageTabs";
import CommonProfileLink from "@/components/user/utils/CommonProfileLink";

const ACTION: Record<AcceptActionRequestActionEnum, string> = {
  [AcceptActionRequestActionEnum.Accept]: "accepted",
  [AcceptActionRequestActionEnum.Reject]: "rejected",
  [AcceptActionRequestActionEnum.Revoke]: "revoked",
  [AcceptActionRequestActionEnum.Restore]: "restored",
};

export default function ProfileActivityLogProxyActionState({
  log,
}: {
  readonly log: ProfileActivityLogProxyActionStateChanged;
}) {
  const searchParams = useSearchParams();
  const handleOrWallet = log.target_profile_handle ?? "";

  const isCurrentUser =
    (searchParams?.get("user") as string)?.toLowerCase() ===
    handleOrWallet.toLowerCase();

  const tabTarget = UserPageTabType.PROXY;
  return (
    <>
      <ProfileActivityLogItemAction action="changed" />
      <CommonProfileLink
        handleOrWallet={handleOrWallet}
        isCurrentUser={isCurrentUser}
        tabTarget={tabTarget}
      />
      <ProfileActivityLogItemAction action="proxy" />
      <span className="tw-whitespace-nowrap tw-text-base tw-font-medium tw-text-iron-200">
        {PROFILE_PROXY_ACTION_LABELS[log.contents.type]}
      </span>
      <ProfileActivityLogItemAction action="status to" />
      <span className="tw-whitespace-nowrap tw-text-base tw-font-medium tw-text-iron-200">
        {ACTION[log.contents.state_change_type]}
      </span>
    </>
  );
}
