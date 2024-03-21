import { useAccount } from "wagmi";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import CreateDrop from "../../drops/create/CreateDrop";
import { useEffect, useState } from "react";
import { amIUser } from "../../../helpers/Helpers";

export default function UserPageDrops({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const { address } = useAccount();
  const [isMyProfile, setIsMyProfile] = useState<boolean>(false);

  useEffect(
    () => setIsMyProfile(amIUser({ profile, address })),
    [profile, address]
  );

  return <div>{isMyProfile && <CreateDrop profile={profile} />}</div>;
}
