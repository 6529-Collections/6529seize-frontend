import type { ReactNode } from "react";

export function GrantDetailsRow({
  label,
  value,
}: Readonly<{ label: string; value: ReactNode }>) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-0.5">
      <dd className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
        {value}
      </dd>
      <dt className="tw-text-xs tw-font-normal tw-text-iron-500">
        {label}
      </dt>
    </div>
  );
}
