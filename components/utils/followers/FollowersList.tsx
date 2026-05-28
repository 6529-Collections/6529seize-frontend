import type { ApiIdentityAndSubscriptionActions } from "@/generated/models/ApiIdentityAndSubscriptionActions";
import Follower from "./Follower";

export default function FollowersList({
  followers,
  showFollowButtons = false,
}: {
  readonly followers: ApiIdentityAndSubscriptionActions[];
  readonly showFollowButtons?: boolean | undefined;
}) {
  return (
    <div className="tw-mt-4 tw-flex tw-h-full tw-flex-col tw-overflow-hidden">
      {followers.map((follower, index) => (
        <Follower
          key={follower.identity.id}
          follower={follower}
          showFollowButton={showFollowButtons}
          mutedBackground={index % 2 === 1}
        />
      ))}
    </div>
  );
}
