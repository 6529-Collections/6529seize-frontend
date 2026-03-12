"use client";

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import UserPageBrainSidebarCreated from "./UserPageBrainSidebarCreated";
import UserPageBrainSidebarMostActive from "./UserPageBrainSidebarMostActive";

export default function UserPageBrainSidebar({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  return (
    <aside
      className="tw-min-w-0 tw-space-y-6 tw-self-start lg:tw-sticky lg:tw-top-8"
      data-testid="brain-sidebar"
    >
      <UserPageBrainSidebarCreated profile={profile} />
      <UserPageBrainSidebarMostActive profile={profile} />
    </aside>
  );
}
