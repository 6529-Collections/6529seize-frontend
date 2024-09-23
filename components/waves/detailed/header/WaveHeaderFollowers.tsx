import { Wave } from "../../../../generated/models/Wave";
import { numberWithCommas } from "../../../../helpers/Helpers";

export default function WaveHeaderFollowers({
  wave,
  onFollowersClick,
}: {
  readonly wave: Wave;
  readonly onFollowersClick: () => void;
}) {
  return (
    <button
      onClick={onFollowersClick}
      className="tw-p-0 tw-bg-transparent tw-border-none tw-text-sm tw-flex tw-items-center tw-gap-x-2 tw-text-iron-200 hover:tw-underline tw-transition tw-duration-300 tw-ease-out"
    >
      <svg
        className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-300"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        aria-hidden="true"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
        ></path>
      </svg>
      <span>
        <span className="tw-font-medium">
          {numberWithCommas(wave.metrics.subscribers_count)}
        </span>{" "}
        <span className="tw-text-iron-400">
          {wave.metrics.subscribers_count === 1 ? "Follower" : "Followers"}
        </span>
      </span>
    </button>
  );
}
