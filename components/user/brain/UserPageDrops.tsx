import { useAccount } from "wagmi";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import CreateDrop, { CreateDropType } from "../../drops/create/CreateDrop";
import { useEffect, useState } from "react";
import { amIUser, createPossessionStr } from "../../../helpers/Helpers";
import Drops from "../../drops/view/Drops";
import { Wave } from "../../../generated/models/Wave";

export default function UserPageDrops({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const { address } = useAccount();
  const [canCreateDrop, setCanCreateDrop] = useState(false);

  const haveProfile = !!profile.profile?.handle;

  useEffect(
    () => setCanCreateDrop(amIUser({ profile, address }) && haveProfile),
    [profile, address]
  );

  return (
    <div className="tailwind-scope">
      <div className="tw-max-w-2xl mx-auto">
        {haveProfile && (
          <div>
            <Drops />
          </div>
        )}
      </div>
    </div>
  );
}
