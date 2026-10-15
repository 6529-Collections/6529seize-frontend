import type { ReactNode } from "react";

export function GrantDetailsRow({
  label,
  value,
}: Readonly<{ label: string; value: ReactNode }>) {
  return (
    <div className="tw-flex tw-flex-col">
      <dt className="tw-mb-1 tw-text-[11px] tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-500">
        {label}
      </dt>
      <dd className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-100 group-data-[typography=profile]/profile-xtdh:tw-tabular-nums">
        {value}
      </dd>
    </div>
  );
}
