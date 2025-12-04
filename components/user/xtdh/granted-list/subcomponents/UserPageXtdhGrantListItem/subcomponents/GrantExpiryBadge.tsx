import type { ReactNode } from "react";

export function GrantExpiryBadge({
  value,
}: Readonly<{ value: ReactNode }>) {
  return (
    <div className="tw-flex tw-items-center tw-gap-1.5 tw-text-xs">
      <span className="tw-text-iron-500">Expires</span>
      <span className="tw-font-medium tw-text-iron-300">{value}</span>
    </div>
  );
}
