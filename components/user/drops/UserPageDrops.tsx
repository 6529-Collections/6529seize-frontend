import { useAccount } from "wagmi";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import CreateDrop from "../../drops/create/CreateDrop";
import { useEffect, useState } from "react";
import { amIUser } from "../../../helpers/Helpers";
import Drops from "../../drops/view/Drops";

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

  return (
    <div className="tailwind-scope">
      <div className="tw-max-w-3xl tw-mx-auto">
        <h2 className="tw-mb-1 tw-text-xl tw-font-semibold tw-text-iron-50 sm:tw-text-2xl">
          Users Drops
        </h2>
        {isMyProfile && <CreateDrop profile={profile} />}
        <Drops />
      </div>
    </div>
  );
}
