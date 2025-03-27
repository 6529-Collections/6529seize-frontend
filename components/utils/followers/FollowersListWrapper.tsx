import { ApiIdentityAndSubscriptionActions } from "../../../generated/models/ApiIdentityAndSubscriptionActions";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";
import CommonIntersectionElement from "../CommonIntersectionElement";
import FollowersList from "./FollowersList";

export default function FollowersListWrapper({
  followers,
  loading,
  onBottomIntersection,
}: {
  readonly followers: ApiIdentityAndSubscriptionActions[];
  readonly loading: boolean;
  readonly onBottomIntersection: (state: boolean) => void;
}) {
  return (
    <div className="tw-overflow-hidden tw-h-full">
      <FollowersList followers={followers} />
      {loading && (
        <div className="tw-w-full tw-text-center tw-mt-8">
          <CircleLoader size={CircleLoaderSize.XXLARGE} />
        </div>
      )}
      <CommonIntersectionElement onIntersection={onBottomIntersection} />
    </div>
  );
}
