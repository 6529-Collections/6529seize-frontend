"use client";

import { useSetTitle } from "@/contexts/TitleContext";
import { useCommunityMetrics } from "@/hooks/useCommunityMetrics";
import MetricCard from "./components/MetricCard";
import MetricsSkeleton from "./components/MetricsSkeleton";

function MetricsError({ message }: { readonly message: string }) {
  return (
    <div className="tw-rounded-xl tw-border tw-border-red/30 tw-bg-red/10 tw-p-6 tw-text-center">
      <p className="tw-text-red">{message}</p>
    </div>
  );
}

function DropsIcon() {
  return (
    <svg
      className="tw-size-5 tw-text-white"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
      />
    </svg>
  );
}

function DroppersIcon() {
  return (
    <svg
      className="tw-size-5 tw-text-white"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

function SubmissionsIcon() {
  return (
    <svg
      className="tw-size-5 tw-text-white"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function VotersIcon() {
  return (
    <svg
      className="tw-size-5 tw-text-white"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function VotesIcon() {
  return (
    <svg
      className="tw-size-5 tw-text-white"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  );
}

function TdhIcon() {
  return (
    <svg
      className="tw-size-5 tw-text-white"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
    </svg>
  );
}

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
          </div>
        )}
      </div>
    </div>
  );
}
