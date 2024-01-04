import {
  ApiProfileRepRatesState,
  IProfileAndConsolidations,
} from "../../../../entities/IProfile";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";

export default function UserPageRepNewRepSearchHeader({
  repRates,
  profile,
}: {
  readonly repRates: ApiProfileRepRatesState | null;
  readonly profile: IProfileAndConsolidations;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-space-y-1">
      <span className="tw-text-base tw-block tw-text-iron-300 tw-font-normal">
        <span>Your available Rep:</span>
        <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
          {repRates
            ? formatNumberWithCommas(repRates.rep_rates_left_for_rater ?? 0)
            : ""}
        </span>
      </span>
      <span className="tw-text-base tw-block tw-text-iron-300 tw-font-normal">
        <span>Your Rep assigned to {profile.profile?.handle}:</span>
        <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
          {repRates
            ? formatNumberWithCommas(repRates.total_rep_rating_by_rater ?? 0)
            : ""}
        </span>
      </span>
    </div>
  );
}
