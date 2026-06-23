import type { ApiIdentityAndSubscriptionActions } from "@/generated/models/ApiIdentityAndSubscriptionActions";
import Follower from "./Follower";
import { getFollowersMessage } from "./followers.messages";

export default function FollowersList({
  followers,
  showFollowButtons = false,
}: {
  readonly followers: ApiIdentityAndSubscriptionActions[];
  readonly showFollowButtons?: boolean | undefined;
}) {
  const listLabel = getFollowersMessage("followers.list.label");

  return (
    <ul
      aria-label={listLabel}
      className="tw-mb-0 tw-mt-4 tw-flex tw-h-full tw-list-none tw-flex-col tw-overflow-hidden tw-p-0"
    >
      {followers.map((follower, index) => (
        <Follower
          key={follower.identity.id}
          follower={follower}
          showFollowButton={showFollowButtons}
          mutedBackground={index % 2 === 1}
        />
      ))}
    </ul>
  );
}
