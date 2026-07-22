import clsx from "clsx";

interface XtdhRatePillProps {
  readonly rateLabel: string;
  readonly totalLabel: string;
  readonly className?: string | undefined;
}

export function XtdhRatePill({
  rateLabel,
  totalLabel,
  className,
}: Readonly<XtdhRatePillProps>) {
  return (
    <div
      className={clsx(
        "tw-flex tw-flex-wrap tw-items-center tw-gap-2",
        className
      )}
    >
      <span className="tw-text-sm tw-font-medium tw-text-iron-500">
        <span className="tw-tabular-nums">{rateLabel}</span> / day
      </span>
      <span className="tw-min-w-[120px] tw-text-sm tw-font-semibold tw-text-iron-100">
        Total <span className="tw-tabular-nums">{totalLabel}</span> xTDH
      </span>
    </div>
  );
}
