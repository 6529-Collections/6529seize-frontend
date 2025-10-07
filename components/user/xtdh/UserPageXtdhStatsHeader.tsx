"use client";

import { formatNumberWithCommas } from "@/helpers/Helpers";
import { useXtdhStats } from "@/hooks/useXtdhStats";

interface UserPageXtdhStatsHeaderProps {
  readonly profileId: string | null;
}

export default function UserPageXtdhStatsHeader({
  profileId,
}: Readonly<UserPageXtdhStatsHeaderProps>) {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useXtdhStats({ profile: profileId });

  if (isLoading) {
    return <UserPageXtdhStatsHeaderSkeleton />;
  }

  if (isError || !data) {
    const message = error instanceof Error ? error.message : undefined;
    return (
      <UserPageXtdhStatsHeaderError
        message={message ?? "Failed to load xTDH stats."}
        onRetry={refetch}
      />
    );
  }

  const xtdhRate = data.baseTdhRate * data.multiplier;
  const xtdhRateGranted = data.xtdhRateGranted;
  const xtdhRateAvailable = Math.max(xtdhRate - xtdhRateGranted, 0);
  const grantingPercentage = xtdhRate > 0 ? (xtdhRateGranted / xtdhRate) * 100 : 0;
  const clampedPercentage = Math.min(Math.max(grantingPercentage, 0), 100);

  const baseRateDisplay = formatDisplay(data.baseTdhRate);
  const multiplierDisplay = formatDisplay(data.multiplier, 2);
  const xtdhRateDisplay = formatDisplay(xtdhRate);
  const grantedDisplay = formatDisplay(xtdhRateGranted);
  const availableDisplay = formatDisplay(xtdhRateAvailable);
  const receivedRateDisplay = formatDisplay(data.xtdhRateReceived);
  const totalReceivedDisplay = formatDisplay(data.totalXtdhReceived);

  return (
    <section
      className="tw-rounded-2xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-p-5 tw-text-iron-100 tw-shadow-md tw-shadow-black/30"
      role="region"
      aria-label="xTDH Statistics"
    >
      <div
        role="group"
        aria-label="Base xTDH Metrics"
        className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-3"
      >
        <StatCard
          label="Base TDH Rate"
          tooltip="Daily TDH generation from Memes cards and Gradients"
          value={baseRateDisplay}
          suffix="/day"
        />
        <StatCard
          label="Multiplier"
          tooltip="Current xTDH multiplier applied to your Base TDH Rate"
          value={multiplierDisplay}
          suffix="x"
        />
        <StatCard
          label="xTDH Rate"
          tooltip="Total xTDH you can generate per day (Base TDH Rate × Multiplier)"
          value={xtdhRateDisplay}
          suffix="/day"
        />
      </div>

      <div
        role="group"
        aria-label="Your xTDH Allocation"
        className="tw-mt-5"
      >
        <p
          className="tw-mb-2 tw-text-xs tw-font-medium tw-uppercase tw-text-iron-300"
          title="Overview of how much of your daily xTDH rate is currently granted"
          tabIndex={0}
        >
          Your xTDH Allocation
        </p>
        <div className="tw-space-y-2">
          <div className="tw-h-2.5 tw-w-full tw-rounded-full tw-border tw-border-iron-700 tw-bg-iron-900">
            <div
              className="tw-h-full tw-rounded-full tw-bg-primary-500 tw-transition-all tw-duration-300"
              style={{ width: `${clampedPercentage}%` }}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.floor(clampedPercentage)}
              aria-valuetext={`${grantedDisplay} out of ${xtdhRateDisplay} xTDH rate granted, ${availableDisplay} available`}
            />
          </div>
          <p className="tw-text-sm tw-text-iron-200">
            <span className="tw-font-semibold">{grantedDisplay}</span>
            {` / ${xtdhRateDisplay} granted`}
            <span className="tw-text-iron-400"> • </span>
            <span className="tw-font-semibold">{availableDisplay}</span>
            {" available"}
          </p>
        </div>
      </div>

      <div
        role="group"
        aria-label="Receiving Metrics"
        className="tw-mt-5"
      >
        <p
          className="tw-mb-2 tw-text-xs tw-font-medium tw-uppercase tw-text-iron-300"
          title="Your current incoming xTDH rate from other holders"
          tabIndex={0}
        >
          Receiving from Others
        </p>
        <p className="tw-text-sm tw-text-iron-200">
          <span className="tw-font-semibold">{receivedRateDisplay}</span>
          {"/day rate"}
          <span className="tw-text-iron-400"> • </span>
          <span className="tw-font-semibold">{totalReceivedDisplay}</span>
          {" total received"}
        </p>
      </div>
    </section>
  );
}

function formatDisplay(value: number, decimals = 0) {
  if (Number.isNaN(value)) {
    return "-";
  }

  const factor = Math.pow(10, decimals);
  const flooredValue = Math.floor(value * factor) / factor;
  return formatNumberWithCommas(flooredValue);
}

interface StatCardProps {
  readonly label: string;
  readonly tooltip: string;
  readonly value: string;
  readonly suffix?: string;
}

function StatCard({
  label,
  tooltip,
  value,
  suffix,
}: Readonly<StatCardProps>) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-1 tw-rounded-xl tw-bg-iron-900 tw-p-3">
      <span
        className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-300"
        title={tooltip}
        tabIndex={0}
      >
        {label}
      </span>
      <span className="tw-text-lg tw-font-semibold tw-text-iron-50">
        {value}
        {suffix ? <span className="tw-text-sm tw-text-iron-300"> {suffix}</span> : null}
      </span>
    </div>
  );
}

function UserPageXtdhStatsHeaderSkeleton() {
  return (
    <section className="tw-rounded-2xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-p-5 tw-shadow-md tw-shadow-black/30">
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-3">
        {[0, 1, 2].map((key) => (
          <div key={key} className="tw-flex tw-flex-col tw-gap-2 tw-animate-pulse">
            <div className="tw-h-3 tw-w-20 tw-rounded tw-bg-iron-700" />
            <div className="tw-h-6 tw-w-24 tw-rounded tw-bg-iron-600" />
          </div>
        ))}
      </div>
      <div className="tw-mt-4 tw-space-y-2 tw-animate-pulse">
        <div className="tw-h-3 tw-w-32 tw-rounded tw-bg-iron-700" />
        <div className="tw-h-2.5 tw-w-full tw-rounded-full tw-border tw-border-iron-700 tw-bg-iron-900" />
        <div className="tw-h-4 tw-w-40 tw-rounded tw-bg-iron-700" />
      </div>
      <div className="tw-mt-4 tw-space-y-2 tw-animate-pulse">
        <div className="tw-h-3 tw-w-36 tw-rounded tw-bg-iron-700" />
        <div className="tw-h-4 tw-w-48 tw-rounded tw-bg-iron-700" />
      </div>
    </section>
  );
}

interface UserPageXtdhStatsHeaderErrorProps {
  readonly message: string;
  readonly onRetry: () => void;
}

function UserPageXtdhStatsHeaderError({
  message,
  onRetry,
}: Readonly<UserPageXtdhStatsHeaderErrorProps>) {
  return (
    <section className="tw-rounded-2xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-p-5 tw-text-center tw-shadow-md tw-shadow-black/30">
      <p className="tw-text-sm tw-text-red-400" role="alert">
        {message}
      </p>
      <button
        type="button"
        onClick={() => onRetry()}
        className="tw-mt-3 tw-inline-flex tw-items-center tw-justify-center tw-rounded tw-bg-primary-500 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-black hover:tw-bg-primary-400"
      >
        Retry
      </button>
    </section>
  );
}
