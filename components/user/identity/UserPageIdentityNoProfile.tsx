import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { useAccount } from "wagmi";
import { amIUser } from "../../../helpers/Helpers";

export default function UserPageIdentityNoProfile({
  profile,
}: {
  profile: IProfileAndConsolidations;
}) {
  const router = useRouter();
  const { address } = useAccount();
  const { user } = router.query;

  const [isMyProfile, setIsMyProfile] = useState<boolean>(false);

  useEffect(
    () => setIsMyProfile(amIUser({ profile, address })),
    [profile, address]
  );

  if (isMyProfile) {
    return (
      <div>
        You haven't set up your profile yet, to set up your profile, click
        "here"
      </div>
    );
  }

  return <div>Address {user} haven't set up profile yet </div>;
}
