import { useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import UserPageIdentityStatementsAddButton from "../add/UserPageIdentityStatementsAddButton";
import { useAccount } from "wagmi";
import { createPossessionStr } from "../../../../../helpers/Helpers";

export default function UserPageIdentityAddStatementsHeader({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const account = useAccount();
  const [isMyProfile, setIsMyProfile] = useState<boolean>(false);
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
        {isMyProfile && (
          <UserPageIdentityStatementsAddButton profile={profile} />
        )}
      </div>
    </div>
  );
}
