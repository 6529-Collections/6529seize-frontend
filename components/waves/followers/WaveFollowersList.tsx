import FollowersListWrapper from "@/components/utils/followers/FollowersListWrapper";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useWaveFollowers } from "@/hooks/useWaveFollowers";

export default function WaveFollowersList({
  wave,
  onBackClick,
}: {
  readonly wave: ApiWave;
  readonly onBackClick: () => void;
}) {
  const { followers, isFetching, onBottomIntersection } = useWaveFollowers(
    wave.id
  );

  return (
    <div className="tw-w-full tw-px-4 tw-py-2 tw-bg-iron-950 tw-min-h-full tw-rounded-b-xl lg:tw-rounded-b-none">
      <button
        onClick={onBackClick}
        className="tw-py-2 tw-px-2 -tw-ml-2 tw-flex tw-items-center tw-gap-x-2 tw-justify-center tw-text-sm tw-font-semibold tw-border-0 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out tw-cursor-pointer tw-text-iron-400 tw-bg-transparent hover:tw-text-iron-50"
      >
        <svg
          className="tw-flex-shrink-0 tw-w-5 tw-h-5"
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
      <FollowersListWrapper
        followers={followers}
        loading={isFetching}
        onBottomIntersection={onBottomIntersection}
      />
    </div>
  );
}
