"use client";

import { ProfileMinWithoutSubs } from "@/helpers/ProfileTypes";
import ProfileHandle, {
  ProfileHandleProps,
} from "@/components/common/profile/ProfileHandle";
import { ProfileBadgeSize } from "@/components/common/profile/ProfileAvatar";
import type { DropPartSize } from "@/components/drops/view/part/DropPart";

const PROFILE_SIZE_MAP: Record<DropPartSize, ProfileBadgeSize> = {
  SMALL: ProfileBadgeSize.SMALL,
  MEDIUM: ProfileBadgeSize.MEDIUM,
  LARGE: ProfileBadgeSize.LARGE,
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
