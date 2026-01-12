"use client";

import { useSetTitle } from "@/contexts/TitleContext";
import { useCommunityMetrics } from "@/hooks/useCommunityMetrics";
import MetricCard from "./components/MetricCard";
import MetricsError from "./components/MetricsError";
import MetricsSkeleton from "./components/MetricsSkeleton";
import {
  ConsolidationsIcon,
  DropsIcon,
  DroppersIcon,
  NetworkTdhIcon,
  PercentageIcon,
  SubmissionsIcon,
  TdhIcon,
  VotersIcon,
  VotesIcon,
} from "./components/MetricsIcons";

export default function MetricsPageClient() {
  useSetTitle("Metrics");

  const dailyQuery = useCommunityMetrics("DAY");
  const weeklyQuery = useCommunityMetrics("WEEK");

  const isLoading = dailyQuery.isLoading || weeklyQuery.isLoading;
  const error = dailyQuery.error ?? weeklyQuery.error;

  return (
    <div className="tailwind-scope tw-min-h-screen tw-bg-black">
      <div className="tw-mx-auto tw-max-w-6xl tw-px-4 tw-py-8 sm:tw-px-6 lg:tw-px-8">
        <header className="tw-mb-8">
          <h1 className="tw-text-2xl tw-font-bold tw-text-white">
            Community Metrics
          </h1>
          <p className="tw-mt-1 tw-text-sm tw-text-neutral-400">
            Activity overview across different time periods
          </p>
        </header>

        {isLoading && <MetricsSkeleton />}

        {error && !isLoading && (
          <MetricsError message="Failed to load metrics. Please try again later." />
        )}

        {!isLoading && !error && dailyQuery.data && weeklyQuery.data && (
          <div className="tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-2 xl:tw-grid-cols-3">
            <MetricCard
              title="Drops Created"
              dailyData={dailyQuery.data.dropsCreated}
              weeklyData={weeklyQuery.data.dropsCreated}
              icon={<DropsIcon />}
              iconBgColor="tw-bg-blue-500"
              accentColor="tw-text-blue-400"
            />
            <MetricCard
              title="Distinct Droppers"
              dailyData={dailyQuery.data.distinctDroppers}
              weeklyData={weeklyQuery.data.distinctDroppers}
              icon={<DroppersIcon />}
              iconBgColor="tw-bg-purple-500"
              accentColor="tw-text-purple-400"
            />
            <MetricCard
              title="Submissions"
              dailyData={dailyQuery.data.mainStageSubmissions}
              weeklyData={weeklyQuery.data.mainStageSubmissions}
              icon={<SubmissionsIcon />}
              iconBgColor="tw-bg-orange-500"
              accentColor="tw-text-orange-400"
            />
            <MetricCard
              title="Distinct Voters"
              dailyData={dailyQuery.data.mainStageDistinctVoters}
              weeklyData={weeklyQuery.data.mainStageDistinctVoters}
              icon={<VotersIcon />}
              iconBgColor="tw-bg-emerald-500"
              accentColor="tw-text-emerald-400"
            />
            <MetricCard
              title="Votes"
              dailyData={dailyQuery.data.mainStageVotes}
              weeklyData={weeklyQuery.data.mainStageVotes}
              icon={<VotesIcon />}
              iconBgColor="tw-bg-cyan-500"
              accentColor="tw-text-cyan-400"
              useValueCount
            />
            <MetricCard
              title="Main Stage TDH"
              dailyData={dailyQuery.data.tdhOnMainStageSubmissions}
              weeklyData={weeklyQuery.data.tdhOnMainStageSubmissions}
              icon={<TdhIcon />}
              iconBgColor="tw-bg-amber-500"
              accentColor="tw-text-amber-400"
              useValueCount
            />
            <MetricCard
              title="Network TDH"
              dailyData={dailyQuery.data.networkTdh}
              weeklyData={weeklyQuery.data.networkTdh}
              icon={<NetworkTdhIcon />}
              iconBgColor="tw-bg-teal-500"
              accentColor="tw-text-teal-400"
              useValueCount
            />
            <MetricCard
              title="Main Stage TDH %"
              dailyData={dailyQuery.data.tdhOnMainStagePercentage}
              weeklyData={weeklyQuery.data.tdhOnMainStagePercentage}
              icon={<PercentageIcon />}
              iconBgColor="tw-bg-rose-500"
              accentColor="tw-text-rose-400"
              useValueCount
              suffix="%"
            />
            <MetricCard
              title="Consolidations Formed"
              dailyData={dailyQuery.data.consolidationsFormed}
              weeklyData={weeklyQuery.data.consolidationsFormed}
              icon={<ConsolidationsIcon />}
              iconBgColor="tw-bg-indigo-500"
              accentColor="tw-text-indigo-400"
            />
          </div>
        )}
      </div>
    </div>
  );
}
