import type { ReactNode } from "react";

import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";

export function SolidityReferenceHumanizedValue({
  value,
}: {
  readonly value: string;
}) {
  return <>{value.replaceAll("_", " ")}</>;
}

export function SolidityReferenceSummaryCard({
  label,
  value,
}: {
  readonly label: string;
  readonly value: number;
}) {
  return (
    <div className="tw-min-w-0 tw-p-3">
      <dt className="tw-text-[0.65rem] tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.08em] tw-text-iron-500">
        {label}
      </dt>
      <dd className="tw-m-0 tw-mt-2 tw-font-mono tw-text-2xl tw-font-semibold tw-text-white">
        {formatInteger(DEFAULT_LOCALE, value)}
      </dd>
    </div>
  );
}

export function SolidityReferenceKeyValue({
  children,
  label,
}: {
  readonly children: ReactNode;
  readonly label: string;
}) {
  return (
    <div className="tw-min-w-0">
      <dt className="tw-text-[0.68rem] tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.08em] tw-text-iron-400">
        {label}
      </dt>
      <dd className="tw-m-0 tw-mt-1.5 tw-break-all tw-text-sm tw-leading-6 tw-text-iron-300">
        {children}
      </dd>
    </div>
  );
}
