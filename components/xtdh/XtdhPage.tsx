"use client";

import { useMemo, type ReactElement } from "react";

import { XtdhStats } from "@/components/xtdh/stats";
import { buildGlobalXtdhStatsContent } from "@/components/xtdh/stats/buildGlobalXtdhStatsContent";
import { useGlobalTdhStats } from "@/hooks/useGlobalTdhStats";

import XtdhReceivedSection from "./received";

export default function XtdhPage(): ReactElement {
  const globalStatsQuery = useGlobalTdhStats();

  const statsContent = useMemo(() => {
    if (!globalStatsQuery.data) {
      return null;
    }
    return buildGlobalXtdhStatsContent(globalStatsQuery.data);
  }, [globalStatsQuery.data]);

  return (
    <div className="tailwind-scope tw-space-y-6">
      <section className="tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-5 tw-space-y-3">
        <header>
          <h1 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50">
            xTDH Network Overview
          </h1>
          <p className="tw-mt-1 tw-text-sm tw-text-iron-400">
            Live network-wide TDH and xTDH metrics, including the share already granted.
          </p>
        </header>
        <div className="tw-mt-2">
          {globalStatsQuery.isLoading ? (
            <XtdhStatsSkeleton />
          ) : globalStatsQuery.isError || !statsContent ? (
            <XtdhStatsError
              message={
                globalStatsQuery.error?.message ??
                "Failed to load xTDH stats."
              }
              onRetry={() => {
                globalStatsQuery.refetch().catch(() => undefined);
              }}
            />
          ) : (
            <XtdhStats {...statsContent} />
          )}
        </div>
      </section>
      <XtdhReceivedSection profileId={null} requireIdentity={false} />
    </div>
  );
}

function XtdhStatsSkeleton(): ReactElement {
  return (
    <div
      role="status"
      aria-busy="true"
      className="tw-animate-pulse tw-space-y-4"
    >
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-3">
        {[0, 1, 2].map((key) => (
          <div
            key={`xtdh-skeleton-metric-${key}`}
            className="tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4 tw-space-y-2"
          >
            <div className="tw-h-3 tw-w-24 tw-rounded tw-bg-iron-800" />
            <div className="tw-h-6 tw-w-28 tw-rounded tw-bg-iron-700" />
          </div>
        ))}
      </div>
      <div className="tw-space-y-2 tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4">
        <div className="tw-h-3 tw-w-28 tw-rounded tw-bg-iron-800" />
        <div className="tw-h-2 tw-w-full tw-rounded-full tw-bg-iron-800" />
        <div className="tw-h-4 tw-w-48 tw-rounded tw-bg-iron-800" />
      </div>
    </div>
  );
}

function XtdhStatsError({
  message,
  onRetry,
}: Readonly<{ message: string; onRetry: () => void }>): ReactElement {
  return (
    <div
      role="alert"
      className="tw-flex tw-items-start tw-justify-between tw-gap-3 tw-rounded-xl tw-border tw-border-red-900 tw-bg-red-950/40 tw-p-4"
    >
      <div>
        <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-red-200">
          Unable to load xTDH stats
        </p>
        <p className="tw-mt-1 tw-text-sm tw-text-red-200/80">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="tw-rounded-lg tw-border tw-border-red-800 tw-bg-red-900 tw-px-3 tw-py-1.5 tw-text-sm tw-font-semibold tw-text-red-100 desktop-hover:hover:tw-bg-red-800"
      >
        Retry
      </button>
    </div>
  );
}
