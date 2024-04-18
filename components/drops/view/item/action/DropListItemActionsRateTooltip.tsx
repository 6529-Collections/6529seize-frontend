import { formatNumberWithCommas } from "../../../../../helpers/Helpers";

export default function DropListItemActionsRateTooltip({
  current,
  myRates,
}: {
  readonly current: number;
  readonly myRates: number | null;
}) {
  return (
    <div>
      <div className="tw-text-center tw-text-white tw-text-xs tw-font-medium">
        {myRates
          ? `Your Rates: ${formatNumberWithCommas(myRates)}`
          : "You haven't rated yet"}
      </div>
      <div className="tw-text-center tw-text-white tw-text-xs tw-font-medium">
        Total: {formatNumberWithCommas(current)}
      </div>
    </div>
  );
}
