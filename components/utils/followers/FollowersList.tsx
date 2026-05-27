import type { ApiIdentityAndSubscriptionActions } from "@/generated/models/ApiIdentityAndSubscriptionActions";
import Follower from "./Follower";

export default function FollowersList({
  followers,
  showUserFollowActions,
}: {
  readonly followers: ApiIdentityAndSubscriptionActions[];
  readonly showUserFollowActions: boolean;
}) {
  return (
    <div className="tw-mt-4 tw-flex tw-h-full tw-flex-col tw-overflow-hidden">
      {followers.map((follower, index) => (
        <Follower
          key={follower.identity.id}
          follower={follower}
          showUserFollowAction={showUserFollowActions}
          mutedBackground={index % 2 === 1}
        />
      ))}
    </div>
  );
}
