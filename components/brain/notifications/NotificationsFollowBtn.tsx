"use client";

import UserFollowBtn, {
  UserFollowBtnSize,
} from "@/components/user/utils/UserFollowBtn";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";

export default function NotificationsFollowBtn({
  profile,
  size = UserFollowBtnSize.MEDIUM,
  followLabel,
  followingLabel,
}: {
  readonly profile: ApiProfileMin;
  readonly size?: UserFollowBtnSize | undefined;
  readonly followLabel?: string | undefined;
  readonly followingLabel?: string | undefined;
}) {
  const handle = profile.handle?.trim();
  if (!handle) return null;

  return (
    <UserFollowBtn
      handle={handle}
      size={size}
      showMuteButton={false}
      followLabel={followLabel}
      followingLabel={followingLabel}
      initialFollowing={profile.subscribed_actions.length > 0}
    />
  );
}
