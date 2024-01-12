import { ApiProfileRepRatesState } from "../../../../entities/IProfile";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";

export default function UserPageRepHeader({
  repRates,
}: {
  readonly repRates: ApiProfileRepRatesState | null;
}) {
  return (
    <div>
      <div className="tw-mt-6 lg:tw-mt-8 tw-mb-4 lg:tw-flex lg:tw-items-center tw-lg:justify-between">
        <div className="tw-min-w-0 tw-flex-1">
          <div className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-flex-wrap sm:tw-space-x-6 tw-gap-y-1">
            <div className="tw-flex tw-items-center tw-text-base tw-font-medium tw-text-iron-300">
              <div className="tw-flex tw items-center tw-space-x-1">
                <span>Rep:</span>
                <span className="tw-text-iron-50 tw-font-semibold">
                  {repRates
                    ? formatNumberWithCommas(repRates.total_rep_rating)
                    : ""}
                </span>
              </div>
            </div>
            <div className="tw-flex tw-items-center tw-text-base tw-font-medium tw-text-iron-300 tw-space-x-1">
              <span>Raters:</span>
              <span className="tw-text-iron-50 tw-font-semibold">
                {repRates
                  ? formatNumberWithCommas(repRates.number_of_raters)
                  : ""}
              </span>
            </div>
          </div>
        </div>
        <div className="tw-flex tw-items-center">
          <button
            type="button"
            className="tw-bg-iron-800 tw-relative tw-inline-flex tw-p-0 tw-m-0 tw-h-6 tw-w-11 tw-flex-shrink-0 tw-cursor-pointer tw-rounded-full tw-border-2 tw-border-transparent tw-transition-colors tw-duration-200 tw-ease-in-out focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400 focus:tw-ring-offset-2 tw-ring-offset-iron-800"
            role="switch"
            aria-checked="false"
            aria-labelledby="allow-doxxing"
          >
            <span
              aria-hidden="true"
              className="tw-pointer-events-none tw-inline-block tw-h-5 tw-w-5 tw-transform tw-rounded-full tw-bg-white tw-shadow tw-ring-0 tw-transition tw-duration-200 tw-ease-in-out"
            ></span>
          </button>
          <span className="tw-ml-3 tw-text-sm" id="allow-doxxing">
            <span className="tw-font-medium tw-text-iron-400">Allow doxxing</span>
          </span>
        </div>
      </div>
    </div>
  );
}
