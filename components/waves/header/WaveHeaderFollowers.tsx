import { ApiWave } from "../../../generated/models/ApiWave";
import { numberWithCommas } from "../../../helpers/Helpers";

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
      className="tw-p-0 tw-bg-transparent tw-border-none tw-text-sm tw-flex tw-items-center tw-gap-x-2 hover:tw-underline tw-transition tw-duration-300 tw-ease-out"
    >
      <span>
        <span className="tw-font-medium tw-text-iron-50">
          {numberWithCommas(wave.metrics.subscribers_count)}
        </span>{" "}
        <span className="tw-text-iron-400">
          Joined
        </span>
      </span>
    </button>
  );
}
