import type { CollectionMetricDatum } from "../types";

interface CollectionMetricProps extends CollectionMetricDatum {}

export function CollectionMetric({
  label,
  value,
}: Readonly<CollectionMetricProps>) {
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
