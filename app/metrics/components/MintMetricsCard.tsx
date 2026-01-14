import CustomTooltip from "@/components/utils/tooltip/CustomTooltip";
import type { ApiMintMetrics } from "@/generated/models/ApiMintMetrics";

interface MintMetricsCardProps {
  readonly data: ApiMintMetrics[];
  readonly icon: React.ReactNode;
}

function formatNumberWithCommas(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function MintBarChart({ data }: { readonly data: ApiMintMetrics[] }) {
  if (data.length === 0) return null;

  const maxMints = Math.max(...data.map((d) => d.mints));
  const maxSubs = Math.max(...data.map((d) => d.subscriptions));
  const maxValue = Math.max(maxMints, maxSubs);

  // Reverse to show oldest on left, newest on right
  const chartData = [...data].reverse();

  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <div className="tw-flex tw-h-16 tw-items-end tw-gap-1">
        {chartData.map((item) => {
          const mintHeight = maxValue > 0 ? (item.mints / maxValue) * 100 : 0;
          const subHeight =
            maxValue > 0 ? (item.subscriptions / maxValue) * 100 : 0;

          return (
            <CustomTooltip
              key={item.card}
              content={
                <div className="tw-text-xs">
                  <div className="tw-mb-1 tw-font-semibold">
                    Card #{item.card}
                  </div>
                  <div className="tw-flex tw-items-center tw-gap-1.5">
                    <span className="tw-size-2 tw-rounded-full tw-bg-emerald-500" />
                    <span>Mints: {formatNumberWithCommas(item.mints)}</span>
                  </div>
                  <div className="tw-flex tw-items-center tw-gap-1.5">
                    <span className="tw-size-2 tw-rounded-full tw-bg-blue-500" />
                    <span>
                      Subscriptions:{" "}
                      {formatNumberWithCommas(item.subscriptions)}
                    </span>
                  </div>
                </div>
              }
              placement="top"
            >
              <div className="tw-flex tw-h-full tw-flex-1 tw-cursor-default tw-items-end tw-gap-0.5">
                <div
                  className="tw-min-h-[2px] tw-w-1/2 tw-rounded-t tw-bg-emerald-500 tw-transition-all hover:tw-opacity-80"
                  style={{ height: `${Math.max(mintHeight, 2)}%` }}
                />
                <div
                  className="tw-min-h-[2px] tw-w-1/2 tw-rounded-t tw-bg-blue-500 tw-transition-all hover:tw-opacity-80"
                  style={{ height: `${Math.max(subHeight, 2)}%` }}
                />
              </div>
            </CustomTooltip>
          );
        })}
      </div>
      <div className="tw-flex tw-items-center tw-justify-center tw-gap-4 tw-text-xs tw-text-neutral-400">
        <div className="tw-flex tw-items-center tw-gap-1.5">
          <span className="tw-size-2 tw-rounded-full tw-bg-emerald-500" />
          <span>Mints</span>
        </div>
        <div className="tw-flex tw-items-center tw-gap-1.5">
          <span className="tw-size-2 tw-rounded-full tw-bg-blue-500" />
          <span>Subscriptions</span>
        </div>
      </div>
    </div>
  );
}

export default function MintMetricsCard({ data, icon }: MintMetricsCardProps) {
  const latestMint = data[0];

  return (
    <div className="tw-rounded-xl tw-border tw-border-neutral-800 tw-bg-[#0f1318] tw-p-5 lg:tw-col-span-2">
      <div className="tw-mb-5 tw-flex tw-items-start tw-justify-between">
        <h3 className="tw-text-base tw-font-semibold tw-text-white">
          Mint Stats
        </h3>
        <div className="tw-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-lg tw-bg-emerald-500">
          {icon}
        </div>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-6 sm:tw-flex-row sm:tw-gap-8">
        {/* Latest mint stats */}
        <div className="tw-flex-shrink-0">
          <p className="tw-mb-1 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wider tw-text-emerald-400">
            Latest Mint
          </p>
          {latestMint && (
            <>
              <p className="tw-mb-3 tw-text-sm tw-text-neutral-400">
                Card #{latestMint.card}
              </p>
              <div className="tw-flex tw-gap-6">
                <div>
                  <p className="tw-mb-0.5 tw-text-xs tw-text-neutral-500">
                    Mints
                  </p>
                  <p className="tw-text-2xl tw-font-bold tw-text-white">
                    {formatNumberWithCommas(latestMint.mints)}
                  </p>
                </div>
                <div>
                  <p className="tw-mb-0.5 tw-text-xs tw-text-neutral-500">
                    Subscriptions
                  </p>
                  <p className="tw-text-2xl tw-font-bold tw-text-white">
                    {formatNumberWithCommas(latestMint.subscriptions)}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="tw-hidden tw-w-px tw-bg-iron-700/50 sm:tw-block" />

        {/* Bar chart */}
        <div className="tw-min-w-0 tw-flex-1">
          <p className="tw-mb-3 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wider tw-text-emerald-400">
            Last {data.length} Mints
          </p>
          <MintBarChart data={data} />
        </div>
      </div>
    </div>
  );
}
