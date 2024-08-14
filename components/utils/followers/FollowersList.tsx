import { IdentityAndSubscriptionActions } from "../../../generated/models/IdentityAndSubscriptionActions";
import Follower from "./Follower";

export default function FollowersList({
  followers,
}: {
  readonly followers: IdentityAndSubscriptionActions[];
}) {
  return (
    <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-y-4">
      {followers.map((follower) => (
        <Follower key={follower.identity.id} follower={follower} />
      ))}
    </div>
  );
}
