export interface XtdhStatsProps {
  readonly metrics: {
    readonly tdhRate: string;
    readonly multiplier: string;
    readonly xtdhRate: string;
  };
  readonly allocation: {
    readonly total: string;
    readonly granted: string;
    readonly available: string;
    readonly percentage: number;
    readonly ariaValueText: string;
  };
  readonly receiving?: {
    readonly rate: string;
    readonly totalReceived: string;
    readonly totalGranted: string;
  };
  readonly className?: string;
}

export function XtdhStats({
  metrics,
  allocation,
  receiving,
  className,
}: Readonly<XtdhStatsProps>) {
  const sectionClassName = [
    "tw-rounded-2xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-p-5 tw-text-iron-100 tw-shadow-md tw-shadow-black/30",
    className ?? "",
  ]
    .join(" ")
    .trim();

  return (
    <section className={sectionClassName} aria-label="xTDH Statistics">
      <MetricsSection {...metrics} />
      <AllocationSection {...allocation} />
      {receiving ? <ReceivingSection {...receiving} /> : null}
    </section>
  );
}

interface MetricsSectionProps {
  readonly tdhRate: string;
  readonly multiplier: string;
  readonly xtdhRate: string;
}

function MetricsSection({
  tdhRate,
  multiplier,
  xtdhRate,
}: Readonly<MetricsSectionProps>) {
  return (
    <section
      aria-labelledby="base-xtdh-metrics-heading"
      className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-3"
    >
      <h2 id="base-xtdh-metrics-heading" className="tw-sr-only">
        Base xTDH Metrics
      </h2>
      <StatCard
        label="TDH Rate"
        tooltip="Daily TDH generation from Memes cards and Gradients"
        value={tdhRate}
        suffix="/day"
      />
      <StatCard
        label="Multiplier"
        tooltip="Current xTDH multiplier applied to your TDH Rate"
        value={multiplier}
        suffix="x"
      />
      <StatCard
        label="xTDH Rate"
        tooltip="Total xTDH you can generate per day (TDH Rate × Multiplier)"
        value={xtdhRate}
        suffix="/day"
      />
    </section>
  );
}

function StatCard({
  label,
  tooltip,
  value,
  suffix,
}: Readonly<{
  label: string;
  tooltip: string;
  value: string;
  suffix?: string;
}>) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-1 tw-rounded-xl tw-bg-iron-900 tw-p-3">
      <span
        className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-300"
        title={tooltip}
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

function AllocationSection({
  total,
  granted,
  available,
  percentage,
  ariaValueText,
}: Readonly<{
  total: string;
  granted: string;
  available: string;
  percentage: number;
  ariaValueText: string;
}>) {
  return (
    <section
      aria-labelledby="xtdh-allocation-section"
      className="tw-mt-5"
    >
      <p
        id="xtdh-allocation-section"
        className="tw-mb-2 tw-text-xs tw-font-medium tw-uppercase tw-text-iron-300"
        title="Overview of how much of your daily xTDH rate is currently granted"
      >
        xTDH Allocation
      </p>
      <div className="tw-space-y-2">
        <progress
          className="tw-block tw-h-2.5 tw-w-full tw-rounded-full tw-border tw-border-iron-700 tw-bg-iron-900 tw-text-primary-500 tw-transition-all tw-duration-300 tw-appearance-none [&::-webkit-progress-bar]:tw-rounded-full [&::-webkit-progress-bar]:tw-bg-transparent [&::-webkit-progress-value]:tw-rounded-full [&::-webkit-progress-value]:tw-bg-primary-500 [&::-moz-progress-bar]:tw-rounded-full [&::-moz-progress-bar]:tw-bg-primary-500"
          value={percentage}
          max={100}
          aria-valuetext={ariaValueText}
          aria-labelledby="xtdh-allocation-section"
        />
        <p className="tw-text-sm tw-text-iron-200">
          <span className="tw-font-semibold">{granted}</span>
          {` / ${total} granted`}
          <span className="tw-text-iron-400"> • </span>
          <span className="tw-font-semibold">{available}</span>
          {" available"}
        </p>
      </div>
    </section>
  );
}

function ReceivingSection({
  rate,
  totalReceived,
  totalGranted,
}: Readonly<{
  rate: string;
  totalReceived: string;
  totalGranted: string;
}>) {
  return (
    <section
      aria-label="Receiving Metrics"
      className="tw-mt-5"
    >
      <p
        className="tw-mb-2 tw-text-xs tw-font-medium tw-uppercase tw-text-iron-300"
        title="Your current incoming xTDH rate from other holders"
      >
        Receiving from Others
      </p>
      <p className="tw-text-sm tw-text-iron-200">
        <span className="tw-font-semibold">{rate}</span>
        {"/day rate"}
        <span className="tw-text-iron-400"> • </span>
        <span className="tw-font-semibold">{totalReceived}</span>
        {" total received"}
      </p>
      <p className="tw-mt-1 tw-text-xs tw-text-iron-400">
        Total granted:{" "}
        <span className="tw-font-semibold tw-text-iron-200">
          {totalGranted}
        </span>
      </p>
    </section>
  );
}
