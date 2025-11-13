import type { StatCardProps } from "./types";

export function StatCard({
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

