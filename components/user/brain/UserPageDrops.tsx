import { useAccount } from "wagmi";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import CreateDrop, { CreateDropType } from "../../drops/create/CreateDrop";
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
            {canCreateDrop && (
              <CreateDrop
                profile={profile}
                quotedDropId={null}
                type={CreateDropType.DROP}
              />
            )}
            <Drops />
          </div>
        )}
      </div>
    </div>
  );
}