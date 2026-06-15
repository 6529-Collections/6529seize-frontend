import type { ApiIdentityAndSubscriptionActions } from "@/generated/models/ApiIdentityAndSubscriptionActions";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import CommonIntersectionElement from "../CommonIntersectionElement";
import FollowersList from "./FollowersList";
import { getFollowersMessage } from "./followers.messages";

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
  const loadingLabel = getFollowersMessage("followers.list.loading");

  return (
    <div className="tw-h-full tw-overflow-hidden" aria-busy={loading}>
      <FollowersList
        followers={followers}
        showFollowButtons={showFollowButtons}
      />
      {loading && (
        <div
          role="status"
          aria-live="polite"
          aria-label={loadingLabel}
          className="tw-mt-8 tw-w-full tw-text-center"
        >
          <span className="tw-sr-only">{loadingLabel}</span>
          <CircleLoader size={CircleLoaderSize.XXLARGE} />
        </div>
      )}
      <CommonIntersectionElement onIntersection={onBottomIntersection} />
    </div>
  );
}
