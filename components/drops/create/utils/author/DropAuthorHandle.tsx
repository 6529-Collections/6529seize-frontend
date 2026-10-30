"use client";

import type { ProfileMinWithoutSubs } from "@/helpers/ProfileTypes";
import type { ProfileHandleProps } from "@/components/common/profile/ProfileHandle";
import ProfileHandle from "@/components/common/profile/ProfileHandle";
import { ProfileBadgeSize } from "@/components/common/profile/ProfileAvatar";
import { DropPartSize } from "@/components/drops/view/part/DropPart.types";
import { AnonymousAuthorName } from "@/components/waves/drops/AnonymousDropAuthor";

const PROFILE_SIZE_MAP: Record<DropPartSize, ProfileBadgeSize> = {
  [DropPartSize.SMALL]: ProfileBadgeSize.SMALL,
  [DropPartSize.MEDIUM]: ProfileBadgeSize.MEDIUM,
  [DropPartSize.LARGE]: ProfileBadgeSize.LARGE,
};

export default function DropAuthorHandle({
  profile: { handle, is_anonymous },
  size,
}: {
  readonly profile: ProfileMinWithoutSubs;
  readonly size: DropPartSize;
}) {
  if (is_anonymous) return <AnonymousAuthorName />;
  const profileHandleProps: ProfileHandleProps = {
    handle,
    size: PROFILE_SIZE_MAP[size],
    href: handle ? `/${handle}` : undefined,
  };

  return <ProfileHandle {...profileHandleProps} />;
}
