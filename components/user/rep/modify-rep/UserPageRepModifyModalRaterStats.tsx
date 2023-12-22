import { RatingStats } from "../../../../entities/IProfile";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";

export default function UserPageRepModifyModalRaterStats({
  repState,
  giverAvailableRep,
}: {
  readonly repState: RatingStats;
  readonly giverAvailableRep: number;
}) {
  return (
    <div className="tw-mt-8">
      <div className="tw-flex tw-flex-col tw-space-y-1">
        <span className="tw-text-sm tw-block tw-text-iron-200 tw-font-semibold">
          <span>Your available Rep:</span>
          <span className="tw-ml-1">
            {formatNumberWithCommas(giverAvailableRep)}
          </span>
        </span>
        <span className="tw-text-sm tw-block tw-text-iron-200 tw-font-semibold">
          <span>Your max/min Rep Rating to {repState.category}:</span>
          <span className="tw-ml-1">
            +/-{" "}
            {formatNumberWithCommas(
              giverAvailableRep + Math.abs(repState.rater_contribution ?? 0)
            )}
          </span>
        </span>
      </div>
    </div>
  );
}
