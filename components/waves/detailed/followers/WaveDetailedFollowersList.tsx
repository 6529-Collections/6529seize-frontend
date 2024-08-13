import { IdentityAndSubscriptionActions } from "../../../../generated/models/IdentityAndSubscriptionActions";
import WaveDetailedFollower from "./WaveDetailedFollower";

export default function WaveDetailedFollowersList({
  followers,
}: {
  readonly followers: IdentityAndSubscriptionActions[];
}) {
  return (
    <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-y-4">
      {followers.map((follower) => (
        <WaveDetailedFollower key={follower.identity.id} follower={follower} />
      ))}
    </div>
  );
}
