import Drops from "@/components/drops/view/Drops";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ReactNode } from "react";
import UserPageMentionShortcuts from "../mention-shortcuts/UserPageMentionShortcuts";
import UserPageBrainActivity from "./UserPageBrainActivity";
import UserPageBrainSidebar from "./UserPageBrainSidebar";
import { useProfileBlockState } from "@/hooks/content-moderation/useProfileBlockState";

export default function UserPageDrops({
  profile,
}: {
  readonly profile: ApiIdentity | null;
}) {
  let content: ReactNode = null;
  const profileBlockState = useProfileBlockState({
    profileId: profile?.id ?? null,
    profileHandle: profile?.handle,
  });

  if (profile) {
    const haveProfile = Boolean(profile.handle);

    content = (
      <div className="tailwind-scope">
        <div className="tw-grid tw-grid-cols-1 tw-gap-x-8 tw-gap-y-6 lg:tw-grid-cols-[minmax(0,2fr)_minmax(22rem,1fr)] xl:tw-gap-x-10">
          <div className="tw-order-2 tw-min-w-0 tw-space-y-6 lg:tw-order-1">
            <UserPageBrainActivity profile={profile} />
            <UserPageMentionShortcuts profile={profile} />
            {haveProfile && (
              <Drops blockedProfileActivity={profileBlockState.isBlocked} />
            )}
          </div>
          <UserPageBrainSidebar profile={profile} />
        </div>
      </div>
    );
  }

  return content;
}
