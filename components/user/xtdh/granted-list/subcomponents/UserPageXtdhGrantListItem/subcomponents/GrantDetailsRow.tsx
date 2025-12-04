import type { ReactNode } from "react";

export function GrantDetailsRow({
  label,
  value,
}: Readonly<{ label: string; value: ReactNode }>) {
  return (
    <div className="tw-flex tw-flex-col">
      <dt className="tw-text-[10px] tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-500 tw-mb-1">
        {label}
      </dt>
      <dd className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
        {value}
      </dd>
    </div>
  );
}
