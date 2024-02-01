import { getRandomObjectId } from "../../../helpers/AllowlistToolHelpers";
import CommonCardSkeleton from "../../utils/animation/CommonCardSkeleton";
import CommonSkeletonLoader from "../../utils/animation/CommonSkeletonLoader";

export default function UserPageCollectedFirstLoading() {
  return (
    <div className="tw-w-full">
      <div className="tw-w-full">
        <CommonSkeletonLoader />
        <CommonSkeletonLoader />
      </div>
      <div className="tw-mt-6 lg:tw-mt-8">
        <div className="tw-flow-root">
          <div className="tw-grid tw-grid-cols-4 tw-gap-6 tw-pb-2">
            {Array.from({ length: 20 }).map(() => (
              <div
                key={`user-page-skeleton-${getRandomObjectId()}`}
                className="tw-w-f tw-pt-8 tw-h-96"
              >
                <CommonCardSkeleton />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
