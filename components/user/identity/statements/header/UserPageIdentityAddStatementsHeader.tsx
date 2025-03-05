import { useContext, useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import UserPageIdentityStatementsAddButton from "../add/UserPageIdentityStatementsAddButton";
import { createPossessionStr } from "../../../../../helpers/Helpers";
import { AuthContext } from "../../../../auth/Auth";
import { useSeizeConnectContext } from "../../../../auth/SeizeConnectContext";

export default function UserPageIdentityAddStatementsHeader({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const account = useSeizeConnectContext();
  const { activeProfileProxy } = useContext(AuthContext);
  const [isMyProfile, setIsMyProfile] = useState<boolean>(false);

  const getCanEdit = (): boolean =>
    isMyProfile && !activeProfileProxy && !!profile.profile?.handle;
  const [canEdit, setCanEdit] = useState<boolean>(getCanEdit());
  useEffect(() => setCanEdit(getCanEdit()), [isMyProfile, activeProfileProxy]);

  useEffect(() => {
    if (!account.address) {
      setIsMyProfile(false);
      return;
    }
    setIsMyProfile(
      profile.consolidation.wallets.some(
        (wallet) =>
          wallet.wallet.address.toLowerCase() === account.address!.toLowerCase()
      )
    );
  }, [account, profile]);

  const [possessionName, setPossessionName] = useState<string>(
    createPossessionStr(profile.profile?.handle ?? null)
  );

  useEffect(() => {
    setPossessionName(createPossessionStr(profile.profile?.handle ?? null));
  }, [profile]);

  return (
    <div>
      <div className="tw-h-full tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-3 tw-gap-y-2 tw-w-full">
        <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
          <span>{possessionName}</span> ID Statements
        </h3>
        {canEdit && <UserPageIdentityStatementsAddButton profile={profile} />}
      </div>
    </div>
  );
}
