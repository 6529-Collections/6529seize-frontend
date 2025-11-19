export interface XtdhTokenListItemMetricItem {
  readonly label: string;
  readonly value: string;
}

interface XtdhTokenListItemMetricsProps {
  readonly metrics: ReadonlyArray<XtdhTokenListItemMetricItem>;
}

export function XtdhTokenListItemMetrics({
  metrics,
}: Readonly<XtdhTokenListItemMetricsProps>) {
  return (
    <dl className="tw-mt-4 tw-grid tw-gap-3 sm:tw-grid-cols-2">
      {metrics.map((metric) => (
        <XtdhTokenListItemMetric
          key={metric.label}
          label={metric.label}
          value={metric.value}
        />
      ))}
    </dl>
  );
}

function XtdhTokenListItemMetric({
  label,
  value,
}: Readonly<XtdhTokenListItemMetricItem>) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-0.5">
      <dt className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-500">
        {label}
      </dt>
      <dd className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-100">
        {value}
      </dd>
    </div>
  );
}
