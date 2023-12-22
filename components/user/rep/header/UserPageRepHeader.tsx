import { ApiProfileRepRatesState } from "../../../../entities/IProfile";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";

export default function UserPageRepHeader({
  repRates,
}: {
  readonly repRates: ApiProfileRepRatesState;
}) {
  return (
    <div>
      <div className="tw-mt-8 tw-mb-6 lg:tw-flex lg:tw-items-center tw-lg:justify-between">
        <div className="tw-min-w-0 tw-flex-1">
          <div className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-flex-wrap sm:tw-space-x-6 tw-gap-y-1">
            <div className="tw-flex tw-items-center tw-text-base tw-font-semibold tw-text-iron-200">
              <div className="tw-flex tw items-center tw-space-x-1">
                <span>Rep:</span>
                <span>{formatNumberWithCommas(repRates.total_rep_rating)}</span>
              </div>
            </div>
            <div className="tw-flex tw-items-center tw-text-base tw-font-semibold tw-text-iron-200 tw-space-x-1">
              <span>Raters:</span>
              <span>1,234</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
