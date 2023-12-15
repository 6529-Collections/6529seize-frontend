import { ConsolidatedTDHMetrics } from "../../../../entities/ITDH";
import { formatNumber } from "../../../../helpers/Helpers";

export default function UserPageHeaderStats({
  consolidatedTDH,
}: {
  consolidatedTDH: ConsolidatedTDHMetrics | null;
}) {
  const TDHFormatted = consolidatedTDH?.boosted_tdh
    ? formatNumber(consolidatedTDH.boosted_tdh)
    : null;

  return (
    <div className="tw-mt-6">
      <div className="tw-flex tw-gap-x-6">
        <div className="tw-inline-flex tw-items-center tw-gap-x-1">
          <span className="tw-text-base tw-font-medium tw-text-iron-50">
            {TDHFormatted}
          </span>
          <span className="tw-block tw-text-base tw-font-medium tw-text-iron-400">
            TDH
          </span>
        </div>
        <div className="tw-inline-flex tw-items-center tw-gap-x-1">
          <span className="tw-text-base tw-font-medium tw-text-iron-50">
            Soon™
          </span>
          <span className="tw-block tw-text-base tw-font-medium tw-text-iron-400">
            Rep
          </span>
        </div>
      </div>
    </div>
  );
}
