"use client";

import { ProfileBadgeSize } from "@/components/common/profile/ProfileAvatar";
import type {
  ProfileHandleProps,
} from "@/components/common/profile/ProfileHandle";
import ProfileHandle from "@/components/common/profile/ProfileHandle";
import { DropPartSize } from "@/components/drops/view/part/DropPart.types";
import type { ProfileMinWithoutSubs } from "@/helpers/ProfileTypes";

const PROFILE_SIZE_MAP: Record<DropPartSize, ProfileBadgeSize> = {
  [DropPartSize.SMALL]: ProfileBadgeSize.SMALL,
  [DropPartSize.MEDIUM]: ProfileBadgeSize.MEDIUM,
  [DropPartSize.LARGE]: ProfileBadgeSize.LARGE,
};

export default function DropAuthorHandle({
  profile: { handle },
  size,
}: {
  readonly profile: ProfileMinWithoutSubs;
  readonly size: DropPartSize;
}) {
  const profileHandleProps: ProfileHandleProps = {
    handle,
    size: PROFILE_SIZE_MAP[size],
    href: handle ? `/${handle}` : undefined,
  };

  return <ProfileHandle {...profileHandleProps} />;
}
