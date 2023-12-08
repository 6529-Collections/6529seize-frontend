import { useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import UserPageIdentityStatementsAddButton from "../add/UserPageIdentityStatementsAddButton";
import { useAccount } from "wagmi";
import { createPossessionStr } from "../../../../../helpers/Helpers";

export default function UserPageIdentityAddStatementsHeader({
  profile,
}: {
  profile: IProfileAndConsolidations;
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
    <div className="tw-h-16 tw-px-6 md:tw-px-8">
      <div className="tw-h-full tw-flex tw-items-center tw-justify-between tw-w-full tw-border-b tw-border-t-0 tw-border-x-0 tw-border-solid tw-border-white/10">
        <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50 tw-tracking-tight">
          <span>{possessionName}</span> ID Statements
        </h3>
        {isMyProfile && (
          <UserPageIdentityStatementsAddButton profile={profile} />
        )}
      </div>
    </div>
  );
}
