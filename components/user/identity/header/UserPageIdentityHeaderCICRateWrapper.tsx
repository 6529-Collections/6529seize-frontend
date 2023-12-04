import { useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { amIUser } from "../../../../helpers/Helpers";
import { useAccount } from "wagmi";
import UserPageIdentityHeaderCICRate from "./UserPageIdentityHeaderCICRate";

export default function UserPageIdentityHeaderCICRateWrapper({
  profile,
}: {
  profile: IProfileAndConsolidations;
}) {
  const { address } = useAccount();
  const [isMyProfile, setIsMyProfile] = useState<boolean>(true);

  useEffect(
    () => setIsMyProfile(amIUser({ profile, address })),
    [profile, address]
  );

  if (!address) {
    return <div>Please connect to rate</div>;
  }

  if (isMyProfile) {
    return null;
  }

  <UserPageIdentityHeaderCICRate profile={profile} />;
}
