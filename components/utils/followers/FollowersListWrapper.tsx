import type { ApiIdentityAndSubscriptionActions } from "@/generated/models/ApiIdentityAndSubscriptionActions";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import CommonIntersectionElement from "../CommonIntersectionElement";
import FollowersList from "./FollowersList";

export default function FollowersListWrapper({
  followers,
  loading,
  onBottomIntersection,
  showFollowButtons = false,
}: {
  readonly followers: ApiIdentityAndSubscriptionActions[];
  readonly loading: boolean;
  readonly onBottomIntersection: (state: boolean) => void;
  readonly showFollowButtons?: boolean | undefined;
}) {
  return (
    <div className="tw-h-full tw-overflow-hidden">
      <FollowersList
        followers={followers}
        showFollowButtons={showFollowButtons}
      />
      {loading && (
        <div className="tw-mt-8 tw-w-full tw-text-center">
          <CircleLoader size={CircleLoaderSize.XXLARGE} />
        </div>
      )}
      <CommonIntersectionElement onIntersection={onBottomIntersection} />
    </div>
  );
}
