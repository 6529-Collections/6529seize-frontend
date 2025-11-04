"use client";

import { XtdhStatsOverviewSkeleton } from "./stats-overview/Skeletons";
import { XtdhStatsOverviewError } from "./stats-overview/ErrorState";
import { NetworkStatsSection } from "./stats-overview/NetworkStatsSection";
import { UserXtdhStatusSection } from "./stats-overview/UserXtdhStatusSection";
import { CurrentMultiplierCard } from "./stats-overview/CurrentMultiplierCard";
import { SummaryActionsCard } from "./stats-overview/SummaryActionsCard";
import { useXtdhStatsOverviewData } from "./stats-overview/useXtdhStatsOverviewData";

interface XtdhStatsOverviewProps {
  readonly enabled?: boolean;
}

export default function XtdhStatsOverview({
  enabled = true,
}: Readonly<XtdhStatsOverviewProps>) {
  const {
    networkState,
    showRefreshing,
    handleRetry,
  } = useXtdhStatsOverviewData({ enabled });

  if (networkState.kind === "loading") {
    return <XtdhStatsOverviewSkeleton />;
  }

  if (networkState.kind === "error") {
    return (
      <XtdhStatsOverviewError
        message={networkState.message}
        onRetry={handleRetry}
      />
    );
  }

  const { stats: networkStats } = networkState;

  return (
    <section
      className="tw-rounded-2xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-p-5 md:tw-p-6 tw-text-iron-50 tw-shadow-md tw-shadow-black/30"
      role="region"
      aria-label="xTDH Overview"
    >
      {showRefreshing ? (
        <div className="tw-mb-1 tw-flex tw-justify-end">
          <span
            className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-text-iron-300"
            aria-live="polite"
          >
            <span className="tw-h-2 tw-w-2 tw-rounded-full tw-bg-primary-400 tw-animate-pulse" />
            Refreshing data…
          </span>
        </div>
      ) : null}
      <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-4 md:tw-gap-5">
        <div className="tw-grid tw-gap-4 md:tw-grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <CurrentMultiplierCard
            multiplier={networkStats.multiplier}
            lastUpdatedAt={networkStats.lastUpdatedAt}
          />
          <SummaryActionsCard />
        </div>
        <div className="tw-grid tw-items-start tw-gap-6 xl:tw-grid-cols-2">
          <NetworkStatsSection stats={networkStats} />
          <UserXtdhStatusSection />
        </div>
      </div>
    </section>
  );
}
