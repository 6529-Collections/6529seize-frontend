"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
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

  let statsSection: ReactElement;

  if (globalStatsQuery.isLoading) {
    statsSection = <XtdhStatsSkeleton />;
  } else if (globalStatsQuery.isError || !statsContent) {
    statsSection = (
      <XtdhStatsError
        message={
          globalStatsQuery.error?.message ?? "Failed to load xTDH stats."
        }
        onRetry={() => {
          globalStatsQuery.refetch().catch(() => undefined);
        }}
      />
    );
  } else {
    statsSection = <XtdhStats {...statsContent} />;
  }

  return (
    <div className="tailwind-scope tw-space-y-8">
      <section className="tw-min-w-0">
        <header className="tw-mb-5 tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-x-4 tw-gap-y-2">
          <div className="tw-min-w-0">
            <h1 className="tw-m-0 tw-text-xl tw-font-semibold tw-leading-7 tw-tracking-tight tw-text-iron-100">
              xTDH Network Overview
            </h1>
            <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-leading-5 tw-text-iron-500">
              Live network-wide TDH and xTDH metrics, including the share
              already granted.
            </p>
          </div>
          <Link
            href="/network/xtdh"
            className="tw-inline-flex tw-min-h-11 tw-flex-none tw-items-center tw-gap-1.5 tw-whitespace-nowrap tw-rounded-sm tw-font-semibold tw-leading-5 tw-text-iron-300 tw-no-underline tw-transition-colors focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-black desktop-hover:hover:tw-text-primary-300"
          >
            xTDH Overview
            <ArrowRightIcon className="tw-size-4" aria-hidden="true" />
          </Link>
        </header>
        {statsSection}
      </section>
      <XtdhReceivedSection profileId={null} requireIdentity={false} />
    </div>
  );
}

function XtdhStatsSkeleton(): ReactElement {
  return (
    <div aria-live="polite" aria-busy="true" className="tw-block">
      <span className="tw-sr-only">Loading xTDH stats</span>
      <div
        aria-hidden="true"
        className="tw-grid tw-animate-pulse tw-grid-cols-1 tw-gap-4 motion-reduce:tw-animate-none md:tw-grid-cols-3"
      >
        {STATS_SKELETON_KEYS.map((key) => (
          <div
            key={`xtdh-skeleton-metric-${key}`}
            className="tw-h-[108px] tw-space-y-3 tw-rounded-xl tw-bg-iron-950 tw-p-6 tw-shadow-lg tw-ring-1 tw-ring-white/[0.03]"
          >
            <div className="tw-h-3 tw-w-24 tw-rounded-full tw-bg-iron-800" />
            <div className="tw-h-7 tw-w-28 tw-rounded-full tw-bg-iron-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

const STATS_SKELETON_KEYS = ["multiplier", "rate", "granted"] as const;

function XtdhStatsError({
  message,
  onRetry,
}: Readonly<{ message: string; onRetry: () => void }>): ReactElement {
  return (
    <div
      role="alert"
      className="tw-flex tw-flex-col tw-items-start tw-justify-between tw-gap-4 tw-rounded-xl tw-bg-rose-950/40 tw-p-6 tw-shadow-lg tw-ring-1 tw-ring-rose-900 sm:tw-flex-row"
    >
      <div>
        <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-rose-200">
          Unable to load xTDH stats
        </p>
        <p className="tw-mt-1 tw-text-sm tw-text-rose-200/80">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-rose-800 tw-bg-rose-900 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-rose-100 tw-transition-colors focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-rose-300 desktop-hover:hover:tw-bg-rose-800"
      >
        Retry
      </button>
    </div>
  );
}
