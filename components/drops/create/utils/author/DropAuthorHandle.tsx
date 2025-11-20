"use client";

import { useSearchParams } from "next/navigation";
import { DropPartSize } from "@/components/drops/view/part/DropPart";
import { ProfileMinWithoutSubs } from "@/helpers/ProfileTypes";
import ProfileHandle, {
  ProfileHandleProps,
} from "@/components/common/profile/ProfileHandle";
import { ProfileBadgeSize } from "@/components/common/profile/ProfileAvatar";

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
  const searchParams = useSearchParams();
  const handleOrWallet = (searchParams?.get('user') ?? '').toLowerCase();
  const amIAuthor = handle?.toLowerCase() === handleOrWallet;

  const profileHandleProps: ProfileHandleProps = {
    handle,
    size: PROFILE_SIZE_MAP[size],
    href: handle ? `/${handle}` : undefined,
    asLink: !amIAuthor,
    highlightSearchParam: "user",
  };

  return <ProfileHandle {...profileHandleProps} />;
}
