import { ReactNode, useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import UserPageSetUpProfile from "./UserPageSetUpProfile";
import { useSeizeConnectContext } from "../../../auth/SeizeConnectContext";

export default function UserPageSetUpProfileWrapper({
  profile,
  children,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly children: ReactNode;
}) {
  const { address } = useSeizeConnectContext();

  const getShowSetUpProfile = () => {
    if (!address) return false;
    if (!profile) return false;
    if (!!profile.profile?.handle) return false;
    return !!profile.consolidation.wallets.find((w) =>
      [w.wallet.address.toLowerCase(), w.wallet.ens?.toLowerCase()].includes(
        address.toLowerCase()
      )
    );
  };

  const [showSetUpProfile, setShowSetUpProfile] = useState<boolean>(
    getShowSetUpProfile()
  );

  useEffect(
    () => setShowSetUpProfile(getShowSetUpProfile()),
    [profile, address]
  );

  if (showSetUpProfile) {
    return <UserPageSetUpProfile profile={profile} />;
  }
  return <>{children}</>;
}
