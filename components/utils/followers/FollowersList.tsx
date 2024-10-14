import { ApiIdentityAndSubscriptionActions } from "../../../generated/models/ApiIdentityAndSubscriptionActions";
import Follower from "./Follower";

export default function FollowersList({
  followers,
}: {
  readonly followers: ApiIdentityAndSubscriptionActions[];
}) {
  return (
    <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-y-4">
      {followers.map((follower) => (
        <Follower key={follower.identity.id} follower={follower} />
      ))}
    </div>
  );
}
