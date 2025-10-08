import type { NetworkStats } from "./types";
import { SECTION_HEADER_CLASS } from "./constants";
import { formatPercentLabel, formatPlainNumber } from "./utils";
import { CapacityProgressCard } from "./CapacityProgressCard";
import { MultiplierHighlight } from "./MultiplierHighlight";
import { NetworkMetricsGrid } from "./NetworkMetricsGrid";

interface NetworkStatsSectionProps {
  readonly stats: NetworkStats;
}

export function NetworkStatsSection({
  stats,
}: Readonly<NetworkStatsSectionProps>) {
  const metrics = [
    {
      label: "Active Allocations",
      value: formatPlainNumber(stats.activeAllocations),
      tooltip:
        "Total number of individual xTDH allocations active in the ecosystem.",
    },
    {
      label: "Grantors",
      value: formatPlainNumber(stats.grantors),
      tooltip: "Unique identities allocating their Fluid TDH to collections.",
    },
    {
      label: "Collections",
      value: formatPlainNumber(stats.collections),
      tooltip: "NFT collections currently receiving xTDH allocations.",
    },
    {
      label: "Tokens",
      value: formatPlainNumber(stats.tokens),
      tooltip: "Individual tokens/NFTs receiving xTDH.",
    },
  ] as const;

  return (
    <section
      className="tw-flex tw-h-full tw-flex-col tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-5 tw-text-iron-50"
      role="region"
      aria-label="Network Stats"
    >
      <div className="tw-space-y-6">
        <div className={SECTION_HEADER_CLASS}>
          <h2 className="tw-m-0 tw-text-lg tw-font-semibold">Network Stats</h2>
          <p className="tw-m-0 tw-text-sm tw-text-iron-300">
            Fluid xTDH capacity and allocations across the network.
          </p>
        </div>
        <CapacityProgressCard
          title="Total Daily xTDH Capacity"
          total={stats.totalCapacity}
          allocated={stats.allocatedCapacity}
          reserved={stats.availableCapacity}
          allocatedLabel="Allocated"
          reservedLabel="Available"
          percentLabel={formatPercentLabel(stats.percentAllocated, "Allocated")}
          variant="network"
        />
        <MultiplierHighlight multiplier={stats.multiplier} />
        <NetworkMetricsGrid metrics={metrics} />
      </div>
    </section>
  );
}
