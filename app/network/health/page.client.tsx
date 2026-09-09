"use client";

import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import {
  NETWORK_PAGE_TITLE_CLASSES,
  NETWORK_REFERENCE_BLACK_PAGE_CLASSES,
  NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES,
} from "@/components/network/networkPageLayoutClasses";
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
  useSetTitle("Health");

  const dailyQuery = useCommunityMetrics("DAY");
  const weeklyQuery = useCommunityMetrics("WEEK");
  const mintQuery = useMintMetrics(50);
  const seriesQuery = useCommunityMetricsSeries();

  const isLoading =
    dailyQuery.isLoading || weeklyQuery.isLoading || mintQuery.isLoading;
  const error = dailyQuery.error ?? weeklyQuery.error ?? mintQuery.error;
  const series = seriesQuery.data;

  return (
    <main
      className={`${NETWORK_REFERENCE_BLACK_PAGE_CLASSES} tw-overflow-x-hidden [touch-action:pan-y]`}
    >
      <div className="tw-w-full">
        <AboutContentsDropdown
          className={NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES}
          currentHref="/network/health"
          desktopFlush
          withDivider
        />
        <article className="tw-mx-auto tw-w-full tw-max-w-7xl tw-pb-12 tw-pt-4 max-sm:tw-px-1 sm:tw-pt-8">
          <header className="tw-mb-8">
            <h1 className={NETWORK_PAGE_TITLE_CLASSES}>Health</h1>
            <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
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
                  title="Posters"
                  dailyData={dailyQuery.data.distinctDroppers}
                  weeklyData={weeklyQuery.data.distinctDroppers}
                  icon={<DroppersIcon />}
                  iconBgColor="tw-border-purple-400/20 tw-bg-purple-500/10 tw-text-purple-300"
                  accentColor="tw-text-purple-400"
                  sparklineData={series?.distinctDroppers}
                  sparklineColor="tw-bg-purple-500"
                  sparklineDates={series?.stepsStartTimes}
                />
                <MetricCard
                  title="Posts"
                  dailyData={dailyQuery.data.dropsCreated}
                  weeklyData={weeklyQuery.data.dropsCreated}
                  icon={<DropsIcon />}
                  iconBgColor="tw-border-blue-400/20 tw-bg-blue-500/10 tw-text-blue-300"
                  accentColor="tw-text-blue-400"
                  sparklineData={series?.dropsCreated}
                  sparklineColor="tw-bg-blue-500"
                  sparklineDates={series?.stepsStartTimes}
                />
                <MetricCard
                  title="Submissions"
                  dailyData={dailyQuery.data.mainStageSubmissions}
                  weeklyData={weeklyQuery.data.mainStageSubmissions}
                  icon={<SubmissionsIcon />}
                  iconBgColor="tw-border-orange-400/20 tw-bg-orange-500/10 tw-text-orange-300"
                  accentColor="tw-text-orange-400"
                  sparklineData={series?.mainStageSubmissions}
                  sparklineColor="tw-bg-orange-500"
                  sparklineDates={series?.stepsStartTimes}
                />
                <MetricCard
                  title="Voters"
                  dailyData={dailyQuery.data.mainStageDistinctVoters}
                  weeklyData={weeklyQuery.data.mainStageDistinctVoters}
                  icon={<VotersIcon />}
                  iconBgColor="tw-border-emerald-400/20 tw-bg-emerald-500/10 tw-text-emerald-300"
                  accentColor="tw-text-emerald-400"
                  sparklineData={series?.mainStageDistinctVoters}
                  sparklineColor="tw-bg-emerald-500"
                  sparklineDates={series?.stepsStartTimes}
                />
                <MetricCard
                  title="Vote Volume"
                  dailyData={dailyQuery.data.mainStageVotes}
                  weeklyData={weeklyQuery.data.mainStageVotes}
                  icon={<VotesIcon />}
                  iconBgColor="tw-border-cyan-400/20 tw-bg-cyan-500/10 tw-text-cyan-300"
                  accentColor="tw-text-cyan-400"
                  useValueCount
                  sparklineData={series?.mainStageVotes}
                  sparklineColor="tw-bg-cyan-500"
                  sparklineDates={series?.stepsStartTimes}
                />
                <CumulativeMetricCard
                  title="Active Votes"
                  dailyData={dailyQuery.data.tdhOnMainStageSubmissions}
                  weeklyData={weeklyQuery.data.tdhOnMainStageSubmissions}
                  icon={<TdhIcon />}
                  iconBgColor="tw-border-amber-400/20 tw-bg-amber-500/10 tw-text-amber-300"
                  accentColor="tw-text-amber-400"
                  unit="TDH"
                  sparklineData={series?.tdhOnMainStageSubmissions}
                  sparklineColor="tw-bg-amber-500"
                  sparklineDates={series?.stepsStartTimes}
                />
                <CumulativeMetricCard
                  title="Network TDH"
                  dailyData={dailyQuery.data.networkTdh}
                  weeklyData={weeklyQuery.data.networkTdh}
                  icon={<NetworkTdhIcon />}
                  iconBgColor="tw-border-teal-400/20 tw-bg-teal-500/10 tw-text-teal-300"
                  accentColor="tw-text-teal-400"
                  unit="TDH"
                  href="/network/health/network-tdh"
                  sparklineData={series?.networkTdh}
                  sparklineColor="tw-bg-teal-500"
                  sparklineDates={series?.stepsStartTimes}
                />
                <CumulativeMetricCard
                  title="TDH Utilization %"
                  dailyData={dailyQuery.data.tdhOnMainStagePercentage}
                  weeklyData={weeklyQuery.data.tdhOnMainStagePercentage}
                  icon={<PercentageIcon />}
                  iconBgColor="tw-border-rose-400/20 tw-bg-rose-500/10 tw-text-rose-300"
                  accentColor="tw-text-rose-400"
                  unit="%"
                  sparklineData={series?.tdhUtilizationPercentage}
                  sparklineColor="tw-bg-rose-500"
                  sparklineDates={series?.stepsStartTimes}
                />
                <CumulativeMetricCard
                  title="xTDH Granted"
                  dailyData={dailyQuery.data.xtdhGranted}
                  weeklyData={weeklyQuery.data.xtdhGranted}
                  icon={<XtdhIcon />}
                  iconBgColor="tw-border-lime-400/20 tw-bg-lime-500/10 tw-text-lime-300"
                  accentColor="tw-text-lime-400"
                  unit="xTDH"
                  sparklineData={series?.xtdhGranted}
                  sparklineColor="tw-bg-lime-500"
                  sparklineDates={series?.stepsStartTimes}
                />
                <CumulativeMetricCard
                  title="Identities"
                  dailyData={dailyQuery.data.profileCount}
                  weeklyData={weeklyQuery.data.profileCount}
                  icon={<ProfileIcon />}
                  iconBgColor="tw-border-violet-400/20 tw-bg-violet-500/10 tw-text-violet-300"
                  accentColor="tw-text-violet-400"
                  sparklineData={series?.profileCount}
                  sparklineColor="tw-bg-violet-500"
                  sparklineDates={series?.stepsStartTimes}
                />
                <MetricCard
                  title="Active Identities"
                  dailyData={dailyQuery.data.activeIdentities}
                  weeklyData={weeklyQuery.data.activeIdentities}
                  icon={<ActiveIdentitiesIcon />}
                  iconBgColor="tw-border-pink-400/20 tw-bg-pink-500/10 tw-text-pink-300"
                  accentColor="tw-text-pink-400"
                  sparklineData={series?.activeIdentities}
                  sparklineColor="tw-bg-pink-500"
                  sparklineDates={series?.stepsStartTimes}
                />
                <MetricCard
                  title="Consolidations Formed"
                  dailyData={dailyQuery.data.consolidationsFormed}
                  weeklyData={weeklyQuery.data.consolidationsFormed}
                  icon={<ConsolidationsIcon />}
                  iconBgColor="tw-border-indigo-400/20 tw-bg-indigo-500/10 tw-text-indigo-300"
                  accentColor="tw-text-indigo-400"
                  sparklineData={series?.consolidationsFormed}
                  sparklineColor="tw-bg-indigo-500"
                  sparklineDates={series?.stepsStartTimes}
                />
              </div>
            )}
        </article>
      </div>
    </main>
  );
}
