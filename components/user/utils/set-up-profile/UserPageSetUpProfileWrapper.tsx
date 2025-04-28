import { ReactNode, useEffect, useState } from "react";

import UserPageSetUpProfile from "./UserPageSetUpProfile";
import { useSeizeConnectContext } from "../../../auth/SeizeConnectContext";
import { ApiIdentity } from "../../../../generated/models/ApiIdentity";

export default function UserPageSetUpProfileWrapper({
  profile,
  children,
}: {
  readonly profile: ApiIdentity;
  readonly children: ReactNode;
}) {
  const { address } = useSeizeConnectContext();

  const getShowSetUpProfile = () => {
    if (!address) return false;
    if (!profile) return false;
    if (profile.handle) return false;
    return !!profile.wallets?.find((w) =>
      [w.wallet.toLowerCase(), w.display?.toLowerCase()].includes(
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
