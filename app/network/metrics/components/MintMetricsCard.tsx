import type { ReactNode } from "react";
import CustomTooltip from "@/components/utils/tooltip/CustomTooltip";
import type { ApiMintMetrics } from "@/generated/models/ApiMintMetrics";
import { formatNumberWithCommas } from "../utils/formatNumbers";

interface MintMetricsCardProps {
  readonly data: ApiMintMetrics[];
  readonly icon: ReactNode;
}

function MintBarChart({ data }: { readonly data: ApiMintMetrics[] }) {
  if (data.length === 0) return null;

  // Max total (subs + mints) for scaling
  const maxTotal = Math.max(...data.map((d) => d.subscriptions + d.mints));
  const GAP_CSS = "clamp(2px, 0.5vw, 8px)";
  const gridTemplate = `repeat(${data.length}, minmax(2px, 1fr))`;

  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <div
        className="tw-grid tw-h-16 tw-items-end"
        style={{ columnGap: GAP_CSS, gridTemplateColumns: gridTemplate }}
      >
        {data.map((item) => {
          const total = item.subscriptions + item.mints;
          const totalHeight = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
          // Proportions within the bar
          const mintProportion = total > 0 ? (item.mints / total) * 100 : 0;
          const subProportion =
            total > 0 ? (item.subscriptions / total) * 100 : 0;

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
                  <div className="tw-mt-1 tw-border-t tw-border-neutral-600 tw-pt-1">
                    Total: {formatNumberWithCommas(total)}
                  </div>
                </div>
              }
              placement="top"
            >
              <div
                className="tw-flex tw-cursor-default tw-flex-col tw-overflow-hidden tw-rounded-t tw-transition-all hover:tw-opacity-80"
                style={{ height: `${Math.max(totalHeight, 3)}%` }}
              >
                <div
                  className="tw-w-full tw-bg-emerald-500"
                  style={{ height: `${mintProportion}%` }}
                />
                <div
                  className="tw-w-full tw-bg-blue-500"
                  style={{ height: `${subProportion}%` }}
                />
              </div>
            </CustomTooltip>
          );
        })}
      </div>
      {/* Card ID labels - hide when too many items */}
      {data.length <= 10 && (
        <div
          className="tw-grid"
          style={{ columnGap: GAP_CSS, gridTemplateColumns: gridTemplate }}
        >
          {data.map((item) => (
            <div
              key={item.card}
              className="tw-flex-1 tw-text-center tw-text-[10px] tw-text-neutral-500"
            >
              #{item.card}
            </div>
          ))}
        </div>
      )}
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

  if (data.length === 0) {
    return (
      <div className="tw-col-span-full tw-rounded-xl tw-border tw-border-neutral-800 tw-bg-[#0f1318] tw-p-5">
        <p className="tw-text-sm tw-text-neutral-400">No mint data available</p>
      </div>
    );
  }

  return (
    <div className="tw-col-span-full tw-rounded-xl tw-border tw-border-neutral-800 tw-bg-[#0f1318] tw-p-5">
      <div className="tw-mb-5 tw-flex tw-items-start tw-justify-between">
        <div className="tw-flex tw-items-center tw-gap-3">
          <h3 className="tw-text-base tw-font-semibold tw-text-white">
            Mint Stats
          </h3>
          <div className="tw-flex tw-gap-1"></div>
        </div>
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
