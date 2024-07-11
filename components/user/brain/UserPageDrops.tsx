import { IProfileAndConsolidations } from "../../../entities/IProfile";
import Drops from "../../drops/view/Drops";

export default function UserPageDrops({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const haveProfile = !!profile.profile?.handle;
  return (
    <div className="tailwind-scope">
      <div className="tw-max-w-2xl mx-auto">
        <div className="tw-text-sm tw-italic tw-text-iron-500">
          No Drops to show
        </div>
        {haveProfile && (
          <div>
            <Drops />
          </div>
        )}
      </div>
    </div>
  );
}
