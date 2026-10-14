"use client";

import {
  PROFILE_ACTIVITY_BODY,
  PROFILE_ACTIVITY_EMPHASIS,
} from "@/components/profile-activity/profileActivityTypography";

import { useSearchParams } from "next/navigation";
import type { ProfileActivityLogProxyActionStateChanged } from "@/entities/IProfile";
import { PROFILE_PROXY_ACTION_LABELS } from "@/entities/IProxy";
import { AcceptActionRequestActionEnum } from "@/generated/models/AcceptActionRequest";
import ProfileActivityLogItemAction from "./utils/ProfileActivityLogItemAction";
import { USER_PAGE_TAB_IDS } from "@/components/user/layout/userTabs.config";
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

  const tabTarget = USER_PAGE_TAB_IDS.PROXY;
  return (
    <>
      <ProfileActivityLogItemAction action="changed" />
      <CommonProfileLink
        handleOrWallet={handleOrWallet}
        isCurrentUser={isCurrentUser}
        tabTarget={tabTarget}
        textClassName={`tw-text-sm lg:tw-text-base tw-font-semibold tw-text-iron-100 ${PROFILE_ACTIVITY_EMPHASIS}`}
      />
      <ProfileActivityLogItemAction action="proxy" />
      <span
        className={`tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-iron-300 lg:tw-text-base ${PROFILE_ACTIVITY_BODY}`}
      >
        {PROFILE_PROXY_ACTION_LABELS[log.contents.type]}
      </span>
      <ProfileActivityLogItemAction action="status to" />
      <span
        className={`tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-iron-300 lg:tw-text-base ${PROFILE_ACTIVITY_BODY}`}
      >
        {ACTION[log.contents.state_change_type]}
      </span>
    </>
  );
}
