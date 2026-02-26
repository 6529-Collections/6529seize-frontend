"use client";

import FollowersListWrapper from "@/components/utils/followers/FollowersListWrapper";
import type { ApiIdentity } from "@/generated/models/ObjectSerializer";
import useFollowersList from "@/hooks/useFollowersList";

export default function UserPageFollowers({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const { followers, isFetching, onBottomIntersection } = useFollowersList({
    profileId: profile.id,
  });

  return (
    <div className="tailwind-scope">
      <FollowersListWrapper
        followers={followers}
        loading={isFetching}
        onBottomIntersection={onBottomIntersection}
      />
    </div>
  );
}
