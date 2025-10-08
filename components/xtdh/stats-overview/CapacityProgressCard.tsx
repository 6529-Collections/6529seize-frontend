import { classNames } from "@/helpers/Helpers";
import type { CapacityProgressVariant } from "./types";
import { calculatePercentage, formatRateValue } from "./utils";

interface CapacityProgressCardProps {
  readonly title: string;
  readonly total: number;
  readonly allocated: number;
  readonly reserved: number;
  readonly allocatedLabel: string;
  readonly reservedLabel: string;
  readonly percentLabel?: string;
  readonly variant: CapacityProgressVariant;
  readonly footnote?: string;
  readonly isEmpty?: boolean;
}

export function CapacityProgressCard({
  title,
  total,
  allocated,
  reserved,
  allocatedLabel,
  reservedLabel,
  percentLabel,
  variant,
  footnote,
  isEmpty = false,
}: Readonly<CapacityProgressCardProps>) {
  const ariaLabel =
    variant === "network"
      ? "Total network xTDH capacity allocated"
      : "Your xTDH capacity allocated";
  const percentDisplay = percentLabel ?? "\u2014";

  return (
    <div className="tw-space-y-4 tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-950/60 tw-p-4">
      <div className="tw-flex tw-flex-col tw-gap-1 sm:tw-flex-row sm:tw-items-end sm:tw-justify-between">
        <div>
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-300">
            {title}
          </p>
          <p className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-iron-50">
            {formatRateValue(total)}
            <span className="tw-text-base tw-font-medium tw-text-iron-300">
              {" "}
              /day
            </span>
          </p>
        </div>
        <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-200">
          {percentDisplay}
        </p>
      </div>
      <CapacityProgressBar
        value={allocated}
        total={total}
        variant={variant}
        ariaLabel={ariaLabel}
        isEmpty={isEmpty}
      />
      {footnote ? (
        <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-400">{footnote}</p>
      ) : (
        <p className="tw-m-0 tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1 tw-text-sm tw-text-iron-200">
          <span>
            {allocatedLabel}: {formatRateValue(allocated)}/day
          </span>
          <span className="tw-text-iron-600">|</span>
          <span>
            {reservedLabel}: {formatRateValue(reserved)}/day
          </span>
        </p>
      )}
    </div>
  );
}

function CapacityProgressBar({
  value,
  total,
  variant,
  ariaLabel,
  isEmpty,
}: {
  readonly value: number;
  readonly total: number;
  readonly variant: CapacityProgressVariant;
  readonly ariaLabel: string;
  readonly isEmpty: boolean;
}) {
  const percent = calculatePercentage(value, total);
  const containerClasses =
    variant === "user"
      ? classNames(
          "tw-relative tw-h-3 tw-w-full tw-overflow-hidden tw-rounded-full tw-ring-1 tw-ring-emerald-400/30",
          isEmpty ? "tw-bg-emerald-500/10 tw-opacity-70" : "tw-bg-emerald-500/20"
        )
      : "tw-relative tw-h-3 tw-w-full tw-overflow-hidden tw-rounded-full tw-bg-iron-800";
  const progressClasses =
    variant === "user"
      ? "tw-absolute tw-left-0 tw-top-0 tw-h-full tw-bg-primary-400 tw-shadow-[0_4px_12px_rgba(14,165,233,0.35)]"
      : "tw-absolute tw-left-0 tw-top-0 tw-h-full tw-bg-primary-500 tw-shadow-[0_4px_12px_rgba(59,130,246,0.35)]";

  return (
    <div
      className={containerClasses}
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <div className={progressClasses} style={{ width: `${percent}%` }} />
    </div>
  );
}
