"use client";

import { useSearchParams } from "next/navigation";
import { ProfileActivityLogProxyActionChanged } from "@/entities/IProfile";
import ProfileActivityLogItemAction from "./utils/ProfileActivityLogItemAction";
import { UserPageTabType } from "@/components/user/layout/UserPageTabs";
import CommonProfileLink from "@/components/user/utils/CommonProfileLink";
import { PROFILE_PROXY_ACTION_LABELS } from "@/entities/IProxy";
import { formatNumberWithCommas } from "@/helpers/Helpers";

export default function ProfileActivityLogProxyActionChange({
  log,
}: {
  readonly log: ProfileActivityLogProxyActionChanged;
}) {
  const searchParams = useSearchParams();
  const handleOrWallet = log.target_profile_handle ?? "";
  const isCurrentUser =
    (searchParams?.get("user") as string)?.toLowerCase() ===
    handleOrWallet.toLowerCase();

  const tabTarget = UserPageTabType.PROXY;

  const getChangedParamName = () => {
    if (log.contents.end_time !== undefined) {
      return "end time to";
    }
    if (log.contents.credit_amount !== undefined) {
      return "credit amount to";
    }
    return "";
  };

  const getChangeParamValue = () => {
    if (log.contents.end_time !== undefined) {
      return log.contents.end_time
        ? new Date(log.contents.end_time).toLocaleString()
        : "indefinite";
    }
    if (log.contents.credit_amount !== undefined) {
      return formatNumberWithCommas(log.contents.credit_amount);
    }
    return "";
  };

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
      <ProfileActivityLogItemAction action={getChangedParamName()} />
      <span className="tw-whitespace-nowrap tw-text-base tw-font-medium tw-text-iron-200">
        {getChangeParamValue()}
      </span>
    </>
  );
}
