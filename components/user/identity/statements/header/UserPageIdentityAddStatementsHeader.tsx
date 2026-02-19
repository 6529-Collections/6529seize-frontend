"use client";

import { useContext, useEffect, useState } from "react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import UserPageIdentityStatementsAddButton from "../add/UserPageIdentityStatementsAddButton";
import { createPossessionStr } from "@/helpers/Helpers";
import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";

export default function UserPageIdentityAddStatementsHeader({
  profile,
  rightAccessory,
}: {
  readonly profile: ApiIdentity;
  readonly rightAccessory?: React.ReactNode | undefined;
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
      <div className="tw-h-full tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-3 tw-gap-y-2 tw-w-full">
        <h3 className="tw-mb-0 tw-text-[11px] tw-font-bold tw-text-iron-500 tw-uppercase tw-tracking-widest">
          <span>{possessionName}</span> ID Statements
        </h3>
        <div className="tw-inline-flex tw-items-center tw-gap-2">
          {canEdit && <UserPageIdentityStatementsAddButton profile={profile} />}
          {rightAccessory}
        </div>
      </div>
    </div>
  );
}
