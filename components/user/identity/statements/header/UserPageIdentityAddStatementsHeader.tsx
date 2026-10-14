"use client";

import { useContext, type ReactNode } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import UserPageIdentityStatementsAddButton from "../add/UserPageIdentityStatementsAddButton";
import { createPossessionStr } from "@/helpers/Helpers";
import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import UserPageIdentityStatementsGuidance from "./UserPageIdentityStatementsGuidance";

export default function UserPageIdentityAddStatementsHeader({
  profile,
  headerAction,
}: {
  readonly profile: ApiIdentity;
  readonly headerAction?: ReactNode;
}) {
  const locale = useBrowserLocale();
  const account = useSeizeConnectContext();
  const { activeProfileProxy } = useContext(AuthContext);
  const normalizedAddress = account.address?.toLowerCase();
  const isMyProfile =
    !!normalizedAddress &&
    (profile.wallets ?? []).some(
      (wallet) => wallet.wallet.toLowerCase() === normalizedAddress
    );
  const canEdit = isMyProfile && !activeProfileProxy && !!profile.handle;
  const possessionName = createPossessionStr(profile.handle ?? null);

  return (
    <div className="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-3">
      <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-1">
        <h3 className="tw-m-0 tw-min-w-0 tw-break-words tw-text-lg tw-font-semibold tw-text-iron-100">
          {t(locale, "user.profile.identity.statements.heading", {
            name: possessionName,
          })}
        </h3>
        <UserPageIdentityStatementsGuidance />
      </div>
      {headerAction ??
        (canEdit && (
          <UserPageIdentityStatementsAddButton profile={profile} size="xs" />
        ))}
    </div>
  );
}
