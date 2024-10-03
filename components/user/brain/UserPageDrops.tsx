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
      <div className="tw-max-w-[672px] mx-auto">{haveProfile && <Drops />}</div>
    </div>
  );
}
