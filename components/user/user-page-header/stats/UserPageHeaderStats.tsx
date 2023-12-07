import { ConsolidatedTDHMetrics } from "../../../../entities/ITDH";
import { formatNumber, numberWithCommas } from "../../../../helpers/Helpers";

export default function UserPageHeaderStats({
  consolidatedTDH,
}: {
  consolidatedTDH: ConsolidatedTDHMetrics | null;
}) {
  const TDHFormatted = consolidatedTDH?.boosted_tdh
    ? formatNumber(consolidatedTDH.boosted_tdh)
    : null;
  const tdhRank = consolidatedTDH?.tdh_rank
    ? `#${numberWithCommas(consolidatedTDH.tdh_rank)}`
    : "-";

  return (
    <div className="tw-mt-6">
      <div className="tw-flex tw-gap-x-8">
        <div className="tw-flex tw-flex-col">
          <span className="tw-block tw-text-sm tw-font-medium tw-text-iron-400">
            TDH
          </span>
          <div className="tw-mt-2 tw-inline-flex tw-items-center tw-gap-x-2">
            <span className="tw-text-base tw-font-semibold tw-text-white">
              {tdhRank}
            </span>
            {TDHFormatted && (
              <span className="tw-inline-flex tw-items-center tw-rounded-lg tw-bg-iron-800 tw-px-2 tw-py-1 tw-text-sm tw-font-medium tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-500/5">
                {TDHFormatted}
              </span>
            )}
          </div>
        </div>
        <div className="tw-flex tw-flex-col">
          <span className="tw-block tw-text-sm tw-font-medium tw-text-iron-400">
            Rep
          </span>
          <div className="tw-mt-2 tw-inline-flex tw-items-center tw-gap-x-2">
            <span className="tw-text-base tw-font-semibold tw-text-white">
              Soon™
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
