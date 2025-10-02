import { ApiProfileRepRatesState } from "@/entities/IProfile";
import { formatNumberWithCommas } from "@/helpers/Helpers";

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
              <div className="tw-flex tw-items-center tw-space-x-1">
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
      </div>
    </div>
  );
}
