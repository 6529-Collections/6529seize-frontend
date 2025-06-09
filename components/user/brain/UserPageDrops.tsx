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
      <div className="tw-max-w-4xl tw-mx-auto tw-py-4">
        {haveProfile && <Drops />}
      </div>
    </div>
  );
}
