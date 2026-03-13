import Drops from "@/components/drops/view/Drops";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ReactNode } from "react";
import UserPageBrainSidebar from "./UserPageBrainSidebar";

export default function UserPageDrops({
  profile,
}: {
  readonly profile: ApiIdentity | null;
}) {
  let content: ReactNode = null;

  if (profile) {
    const haveProfile = Boolean(profile.handle);

    content = (
      <div className="tailwind-scope">
        <div className="tw-grid tw-grid-cols-1 tw-gap-x-8 tw-gap-y-6 lg:tw-grid-cols-[minmax(0,2fr)_minmax(22rem,1fr)] xl:tw-gap-x-10">
          <div className="tw-order-2 tw-min-w-0 lg:tw-order-1">
            {haveProfile && <Drops />}
          </div>
          <UserPageBrainSidebar profile={profile} />
        </div>
      </div>
    );
  }

  return content;
}
