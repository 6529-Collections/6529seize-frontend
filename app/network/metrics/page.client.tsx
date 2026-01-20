"use client";

import { useSetTitle } from "@/contexts/TitleContext";
import { useCommunityMetrics } from "@/hooks/useCommunityMetrics";
import { useCommunityMetricsSeries } from "@/hooks/useCommunityMetricsSeries";
import { useMintMetrics } from "@/hooks/useMintMetrics";
import CumulativeMetricCard from "./components/CumulativeMetricCard";
import MetricCard from "./components/MetricCard";
import MetricsError from "./components/MetricsError";
import {
  ActiveIdentitiesIcon,
  ConsolidationsIcon,
  DroppersIcon,
  DropsIcon,
  MintIcon,
  NetworkTdhIcon,
  PercentageIcon,
  ProfileIcon,
  SubmissionsIcon,
  TdhIcon,
  VotersIcon,
  VotesIcon,
  XtdhIcon,
} from "./components/MetricsIcons";
import MetricsSkeleton from "./components/MetricsSkeleton";
import MintMetricsCard from "./components/MintMetricsCard";

export default function MetricsPageClient() {
  useSetTitle("Metrics");

  const dailyQuery = useCommunityMetrics("DAY");
  const weeklyQuery = useCommunityMetrics("WEEK");
  const mintQuery = useMintMetrics(50);
  const seriesQuery = useCommunityMetricsSeries();

  const isLoading =
    dailyQuery.isLoading || weeklyQuery.isLoading || mintQuery.isLoading;
  const error = dailyQuery.error ?? weeklyQuery.error ?? mintQuery.error;
  const series = seriesQuery.data;

  return (
    <div className="tailwind-scope tw-min-h-screen tw-bg-black">
      <div className="tw-mx-auto tw-max-w-6xl tw-px-4 tw-py-8 sm:tw-px-6 lg:tw-px-8">
        <header className="tw-mb-8">
          <h1 className="tw-text-2xl tw-font-bold tw-text-white">Metrics</h1>
          <p className="tw-mt-1 tw-text-sm tw-text-neutral-400">
            Activity overview across different time periods
          </p>
        </header>

        {isLoading && <MetricsSkeleton />}

        {error && !isLoading && (
          <MetricsError message="Failed to load metrics. Please try again later." />
        )}

        {!isLoading &&
          !error &&
          dailyQuery.data &&
          weeklyQuery.data &&
          mintQuery.data && (
            <div className="tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-2 xl:tw-grid-cols-3">
              <MintMetricsCard
                data={mintQuery.data.items}
                icon={<MintIcon />}
              />
              <MetricCard
                title="Distinct Droppers"
                dailyData={dailyQuery.data.distinctDroppers}
                weeklyData={weeklyQuery.data.distinctDroppers}
                icon={<DroppersIcon />}
                iconBgColor="tw-bg-purple-500"
                accentColor="tw-text-purple-400"
                sparklineData={series?.distinctDroppers}
                sparklineColor="tw-bg-purple-500"
              />
              <MetricCard
                title="Drops Created"
                dailyData={dailyQuery.data.dropsCreated}
                weeklyData={weeklyQuery.data.dropsCreated}
                icon={<DropsIcon />}
                iconBgColor="tw-bg-blue-500"
                accentColor="tw-text-blue-400"
                sparklineData={series?.dropsCreated}
                sparklineColor="tw-bg-blue-500"
              />
              <MetricCard
                title="Submissions"
                dailyData={dailyQuery.data.mainStageSubmissions}
                weeklyData={weeklyQuery.data.mainStageSubmissions}
                icon={<SubmissionsIcon />}
                iconBgColor="tw-bg-orange-500"
                accentColor="tw-text-orange-400"
                sparklineData={series?.mainStageSubmissions}
                sparklineColor="tw-bg-orange-500"
              />
              <MetricCard
                title="Distinct Voters"
                dailyData={dailyQuery.data.mainStageDistinctVoters}
                weeklyData={weeklyQuery.data.mainStageDistinctVoters}
                icon={<VotersIcon />}
                iconBgColor="tw-bg-emerald-500"
                accentColor="tw-text-emerald-400"
                sparklineData={series?.mainStageDistinctVoters}
                sparklineColor="tw-bg-emerald-500"
              />
              <MetricCard
                title="Vote Volume"
                dailyData={dailyQuery.data.mainStageVotes}
                weeklyData={weeklyQuery.data.mainStageVotes}
                icon={<VotesIcon />}
                iconBgColor="tw-bg-cyan-500"
                accentColor="tw-text-cyan-400"
                useValueCount
                sparklineData={series?.mainStageVotes}
                sparklineColor="tw-bg-cyan-500"
              />
              <CumulativeMetricCard
                title="Voting Power"
                dailyData={dailyQuery.data.tdhOnMainStageSubmissions}
                weeklyData={weeklyQuery.data.tdhOnMainStageSubmissions}
                icon={<TdhIcon />}
                iconBgColor="tw-bg-amber-500"
                accentColor="tw-text-amber-400"
                unit="TDH"
                sparklineData={series?.tdhOnMainStageSubmissions}
                sparklineColor="tw-bg-amber-500"
              />
              <CumulativeMetricCard
                title="Network TDH"
                dailyData={dailyQuery.data.networkTdh}
                weeklyData={weeklyQuery.data.networkTdh}
                icon={<NetworkTdhIcon />}
                iconBgColor="tw-bg-teal-500"
                accentColor="tw-text-teal-400"
                unit="TDH"
                href="/network/metrics/network-tdh"
                sparklineData={series?.networkTdh}
                sparklineColor="tw-bg-teal-500"
              />
              <CumulativeMetricCard
                title="TDH Utilization %"
                dailyData={dailyQuery.data.tdhOnMainStagePercentage}
                weeklyData={weeklyQuery.data.tdhOnMainStagePercentage}
                icon={<PercentageIcon />}
                iconBgColor="tw-bg-rose-500"
                accentColor="tw-text-rose-400"
                unit="%"
                sparklineData={series?.tdhUtilizationPercentage}
                sparklineColor="tw-bg-rose-500"
              />
              <CumulativeMetricCard
                title="xTDH Granted"
                dailyData={dailyQuery.data.xtdhGranted}
                weeklyData={weeklyQuery.data.xtdhGranted}
                icon={<XtdhIcon />}
                iconBgColor="tw-bg-lime-500"
                accentColor="tw-text-lime-400"
                unit="xTDH"
                sparklineData={series?.xtdhGranted}
                sparklineColor="tw-bg-lime-500"
              />
              <CumulativeMetricCard
                title="Profile Count"
                dailyData={dailyQuery.data.profileCount}
                weeklyData={weeklyQuery.data.profileCount}
                icon={<ProfileIcon />}
                iconBgColor="tw-bg-violet-500"
                accentColor="tw-text-violet-400"
                sparklineData={series?.profileCount}
                sparklineColor="tw-bg-violet-500"
              />
              <MetricCard
                title="Active Identities"
                dailyData={dailyQuery.data.activeIdentities}
                weeklyData={weeklyQuery.data.activeIdentities}
                icon={<ActiveIdentitiesIcon />}
                iconBgColor="tw-bg-pink-500"
                accentColor="tw-text-pink-400"
                sparklineData={series?.activeIdentities}
                sparklineColor="tw-bg-pink-500"
              />
              <MetricCard
                title="Consolidations Formed"
                dailyData={dailyQuery.data.consolidationsFormed}
                weeklyData={weeklyQuery.data.consolidationsFormed}
                icon={<ConsolidationsIcon />}
                iconBgColor="tw-bg-indigo-500"
                accentColor="tw-text-indigo-400"
                sparklineData={series?.consolidationsFormed}
                sparklineColor="tw-bg-indigo-500"
              />
            </div>
          )}
      </div>
    </div>
  );
}
