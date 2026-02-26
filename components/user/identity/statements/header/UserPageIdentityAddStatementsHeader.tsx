"use client";

import { useContext, useEffect, useState } from "react";

import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { createPossessionStr } from "@/helpers/Helpers";

import UserPageIdentityStatementsAddButton from "../add/UserPageIdentityStatementsAddButton";

export default function UserPageIdentityAddStatementsHeader({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const account = useSeizeConnectContext();
  const { activeProfileProxy } = useContext(AuthContext);
  const [isMyProfile, setIsMyProfile] = useState<boolean>(false);

  const getCanEdit = (): boolean =>
    isMyProfile && !activeProfileProxy && !!profile?.handle;
  const [canEdit, setCanEdit] = useState<boolean>(getCanEdit());
  useEffect(() => setCanEdit(getCanEdit()), [isMyProfile, activeProfileProxy]);

  useEffect(() => {
    if (!account.address) {
      setIsMyProfile(false);
      return;
    }
    setIsMyProfile(
      (profile.wallets ?? []).some(
        (wallet) =>
          wallet.wallet.toLowerCase() === account.address!.toLowerCase()
      )
    );
  }, [account, profile]);

  const [possessionName, setPossessionName] = useState<string>(
    createPossessionStr(profile?.handle ?? null)
  );

  useEffect(() => {
    setPossessionName(createPossessionStr(profile?.handle ?? null));
  }, [profile]);

  return (
    <div>
      <div className="tw-hidden lg:tw-flex tw-items-center tw-justify-between tw-gap-x-3 tw-w-full">
        <h3 className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-iron-100">
          {possessionName} ID Statements
        </h3>
        {canEdit && (
          <UserPageIdentityStatementsAddButton profile={profile} />
        )}
      </div>
    </div>
  );
}
