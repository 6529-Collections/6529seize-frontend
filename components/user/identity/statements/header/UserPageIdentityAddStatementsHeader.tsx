import { useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import UserPageIdentityStatementsAddButton from "../add/UserPageIdentityStatementsAddButton";
import { useAccount } from "wagmi";

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

  const createPossession = (): string => {
    const handle = profile.profile?.handle;
    if (handle) {
      const possession = handle.endsWith("s") ? `${handle}'` : `${handle}'s`;
      return possession;
    }
    return "";
  };

  const [possessionName, setPossessionName] = useState<string>(
    createPossession()
  );

  useEffect(() => {
    setPossessionName(createPossession());
  }, [profile]);

  return (
    <div className="tw-h-16 tw-px-8">
      <div className="tw-h-full tw-flex tw-items-center tw-justify-between tw-w-full tw-border-b tw-border-t-0 tw-border-x-0 tw-border-solid tw-border-white/10">
        <h3 className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-neutral-50 tw-tracking-tight">
          <span>{possessionName}</span> ID Statements
        </h3>
        <UserPageIdentityStatementsAddButton/>
        {isMyProfile && (
          <UserPageIdentityStatementsAddButton profile={profile} />
        )}
      </div>
    </div>
  );
}
