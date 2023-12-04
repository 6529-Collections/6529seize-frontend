import { useContext, useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { amIUser } from "../../../../helpers/Helpers";
import { useAccount } from "wagmi";
import UserPageIdentityHeaderCICRate from "./UserPageIdentityHeaderCICRate";
import { AuthContext } from "../../../auth/Auth";

export default function UserPageIdentityHeaderCICRateWrapper({
  profile,
}: {
  profile: IProfileAndConsolidations;
}) {
  const { address } = useAccount();
  const { myProfile } = useContext(AuthContext);
  const [isMyProfile, setIsMyProfile] = useState<boolean>(true);
  const [iHaveProfile, setIHaveProfile] = useState<boolean>(false);
  const [iAmConnected, setIAmConnected] = useState<boolean>(false);

  useEffect(
    () => setIsMyProfile(amIUser({ profile, address })),
    [profile, address]
  );

  useEffect(() => setIHaveProfile(!!myProfile?.profile?.handle), [myProfile]);

  useEffect(() => setIAmConnected(!!address), [address]);

  if (!iAmConnected) {
    return <div>Please connect to rate</div>;
  }

  if (!iHaveProfile) {
    return <div>Please make profile for rate</div>;
  }

  if (isMyProfile) {
    return null;
  }

  return <UserPageIdentityHeaderCICRate profile={profile} />;
}
