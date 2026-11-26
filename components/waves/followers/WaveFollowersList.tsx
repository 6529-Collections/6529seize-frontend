import type { ApiWave } from "@/generated/models/ApiWave";
import FollowersListWrapper from "@/components/utils/followers/FollowersListWrapper";
import { useWaveFollowers } from "@/hooks/useWaveFollowers";
import { CircleLoaderSize } from "@/components/distribution-plan-tool/common/CircleLoader";

export default function WaveFollowersList({
  wave,
  onBackClick,
}: {
  readonly wave: ApiWave;
  readonly onBackClick?: (() => void) | undefined;
}) {
  const { followers, isFetching, onBottomIntersection } = useWaveFollowers(
    wave.id
  );

  return (
    <div className="tw-min-h-full tw-w-full tw-rounded-b-xl tw-bg-iron-950 tw-px-4 tw-py-2 lg:tw-rounded-b-none [&_[data-follower-handle]>a:focus-visible]:tw-ring-2 [&_[data-follower-handle]>a:focus-visible]:tw-ring-primary-400 desktop-hover:[&_[data-follower-handle]>a:hover]:tw-text-opacity-80 [&_[data-follower-handle]>a]:tw-rounded-sm [&_[data-follower-handle]>a]:tw-text-iron-200 [&_[data-follower-handle]]:tw-leading-5 [&_[data-follower-row]]:tw-px-0 [&_[data-followers-loader]]:tw-mt-4">
      {onBackClick && (
        <button
          onClick={onBackClick}
          className="-tw-ml-2 tw-flex tw-cursor-pointer tw-items-center tw-justify-center tw-gap-x-2 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-50"
        >
          <svg
            className="tw-h-5 tw-w-5 tw-flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 12H4M4 12L10 18M4 12L10 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
          <span>Back</span>
        </button>
      )}
      <FollowersListWrapper
        followers={followers}
        loading={isFetching}
        loaderSize={CircleLoaderSize.SMALL}
        onBottomIntersection={onBottomIntersection}
      />
    </div>
  );
}
