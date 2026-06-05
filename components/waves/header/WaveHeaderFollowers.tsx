import type { ApiWave } from "@/generated/models/ApiWave";
import { numberWithCommas } from "@/helpers/Helpers";

export default function WaveHeaderFollowers({
  wave,
  onFollowersClick,
}: {
  readonly wave: ApiWave;
  readonly onFollowersClick: () => void;
}) {
  return (
    <button
      onClick={onFollowersClick}
      className="tw-flex tw-items-center tw-gap-x-2 tw-border-none tw-bg-transparent tw-p-0 tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out hover:tw-underline"
    >
      <span>
        <span className="tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-50">
          {numberWithCommas(wave.metrics.subscribers_count)}
        </span>{" "}
        <span className="tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-500">
          Joined
        </span>
      </span>
    </button>
  );
}
