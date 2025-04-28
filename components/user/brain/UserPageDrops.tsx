import Drops from "../../drops/view/Drops";
import { ApiIdentity } from "../../../generated/models/ApiIdentity";
export default function UserPageDrops({
  profile,
}: {
  readonly profile: ApiIdentity | null;
}) {
  const haveProfile = !!profile?.handle;
  return (
    <div className="tailwind-scope">
      <div className="tw-max-w-[672px] mx-auto">{haveProfile && <Drops />}</div>
    </div>
  );
}
