"use client";

import { useContext } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import UserPageIdentityStatementsAddButton from "../add/UserPageIdentityStatementsAddButton";
import { createPossessionStr } from "@/helpers/Helpers";
import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function UserPageIdentityAddStatementsHeader({
  profile,
}: {
  readonly profile: ApiIdentity;
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
    <div>
      <div className="tw-hidden tw-w-full tw-items-center tw-justify-between tw-gap-x-3 lg:tw-flex">
        <h3 className="tw-mb-0 tw-mt-0 tw-text-xl tw-font-semibold tw-text-iron-100">
          {t(locale, "user.profile.identity.statements.heading", {
            name: possessionName,
          })}
        </h3>
        {canEdit && <UserPageIdentityStatementsAddButton profile={profile} />}
      </div>
    </div>
  );
}
