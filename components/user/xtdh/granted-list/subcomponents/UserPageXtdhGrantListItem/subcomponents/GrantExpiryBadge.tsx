import type { ReactNode } from "react";

export function GrantExpiryBadge({
  value,
}: Readonly<{ value: ReactNode }>) {
  return (
    <div className="tw-min-w-[140px] tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-950 tw-px-3 tw-py-2">
      <p className="tw-m-0 tw-text-xs tw-font-medium tw-text-iron-50">
        <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-400">
          Expires:
        </span>
        <span className="tw-ml-2 tw-text-iron-50">{value}</span>
      </p>
    </div>
  );
}
