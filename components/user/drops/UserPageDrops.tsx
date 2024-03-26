import { useAccount } from "wagmi";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import CreateDrop from "../../drops/create/CreateDrop";
import { useEffect, useState } from "react";
import { amIUser, createPossessionStr } from "../../../helpers/Helpers";
import Drops from "../../drops/view/Drops";

export default function UserPageDrops({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const { address } = useAccount();
  const [canCreateDrop, setCanCreateDrop] = useState(false);

  useEffect(
    () =>
      setCanCreateDrop(
        amIUser({ profile, address }) && !!profile.profile?.handle
      ),
    [profile, address]
  );

  return (
    <div className="tailwind-scope">
      <div className="tw-max-w-3xl tw-mx-auto">
        <h2 className="tw-mb-1 tw-text-xl tw-font-semibold tw-text-iron-50 sm:tw-text-2xl">
          {createPossessionStr(profile.profile?.handle ?? null)} Drops
        </h2>
        {canCreateDrop && <CreateDrop profile={profile} />}
        <Drops />
      </div>
    </div>
  );
}
