import type { ApiWave } from "@/generated/models/ApiWave";
import FollowersListWrapper from "@/components/utils/followers/FollowersListWrapper";
import { useWaveFollowers } from "@/hooks/useWaveFollowers";

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
    <div className="tw-min-h-full tw-w-full tw-rounded-b-xl tw-bg-iron-950 tw-px-4 tw-py-2 lg:tw-rounded-b-none">
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
        onBottomIntersection={onBottomIntersection}
      />
    </div>
  );
}
