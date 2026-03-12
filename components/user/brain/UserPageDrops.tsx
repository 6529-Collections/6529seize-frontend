import Drops from "@/components/drops/view/Drops";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import UserPageBrainSidebar from "./UserPageBrainSidebar";

export default function UserPageDrops({
  profile,
}: {
  readonly profile: ApiIdentity | null;
}) {
  if (!profile) {
    return null;
  }

  const haveProfile = Boolean(profile.handle);

  return (
    <div className="tailwind-scope">
      <div className="tw-grid tw-grid-cols-1 tw-gap-x-8 tw-gap-y-8 lg:tw-grid-cols-[minmax(0,2fr)_minmax(22rem,1fr)] xl:tw-gap-x-10">
        <div className="tw-min-w-0">{haveProfile && <Drops />}</div>
        <UserPageBrainSidebar profile={profile} />
      </div>
    </div>
  );
}
