import type { NetworkStats } from "./types";
import { OVERVIEW_CARD_CLASS, SECTION_HEADER_CLASS } from "./constants";
import {
  formatPercentLabel,
  formatPlainNumber,
  formatRateValue,
} from "./utils";
import { CapacityProgressCard } from "./CapacityProgressCard";
import { StatsMetricsGrid } from "./StatsMetricsGrid";

interface NetworkStatsSectionProps {
  readonly stats: NetworkStats;
}

export function NetworkStatsSection({
  stats,
}: Readonly<NetworkStatsSectionProps>) {
  const metrics = [
    {
      label: "Base TDH Rate",
      value: formatRateValue(stats.baseTdhRate),
      valueSuffix: "/day",
      tooltip:
        "Total Base TDH generation rate across all network participants.",
    },
    {
      label: "Active Allocations",
      value: formatPlainNumber(stats.activeAllocations),
      tooltip:
        "Total number of active allocation grants across the network.",
    },
    {
      label: "Collections",
      value: formatPlainNumber(stats.collections),
      tooltip: "Unique collections receiving xTDH allocations.",
    },
    {
      label: "Tokens",
      value: formatPlainNumber(stats.tokens),
      tooltip: "Individual tokens receiving xTDH allocations.",
    },
    {
      label: "Grantors",
      value: formatPlainNumber(stats.grantors),
      tooltip: "Unique identities actively granting xTDH to collections or tokens.",
    },
  ] as const;

  return (
    <section className={OVERVIEW_CARD_CLASS} role="region" aria-label="Network Stats">
      <div className="tw-flex tw-h-full tw-flex-col">
        <div className="tw-flex-1 tw-space-y-6">
          <div className={SECTION_HEADER_CLASS}>
            <h2 className="tw-m-0 tw-text-lg tw-font-semibold">Network Stats</h2>
            <p className="tw-mt-1 tw-text-sm tw-text-iron-300">
              xTDH capacity and allocations across the network.
            </p>
          </div>
          <CapacityProgressCard
            title="TOTAL DAILY XTDH CAPACITY"
            total={stats.totalCapacity}
            allocated={stats.allocatedCapacity}
            reserved={stats.availableCapacity}
            allocatedLabel="Allocated"
            reservedLabel="Available"
            percentLabel={formatPercentLabel(stats.percentAllocated, "Allocated")}
            variant="network"
          />
          <StatsMetricsGrid metrics={[
            ...metrics,
            {
              label: "Total xTDH",
              value: formatPlainNumber(stats.totalXtdh),
              tooltip:
                "Total xTDH that has been generated across the entire network (zero-sum: total accrued equals total granted).",
            },
          ]} />
        </div>
      </div>
    </section>
  );
}
