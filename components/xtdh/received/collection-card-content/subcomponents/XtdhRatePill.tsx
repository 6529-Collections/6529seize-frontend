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
        "tw-flex tw-w-full tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-5 tw-gap-y-2 sm:tw-w-auto sm:tw-min-w-[250px] sm:tw-justify-end sm:tw-text-right",
        className
      )}
    >
      <span className="tw-whitespace-nowrap tw-text-sm tw-font-medium tw-text-iron-500">
        <span className="tw-tabular-nums">{rateLabel}</span> / day
      </span>
      <span className="tw-whitespace-nowrap tw-text-sm tw-font-semibold tw-text-iron-100">
        Total <span className="tw-tabular-nums">{totalLabel}</span> xTDH
      </span>
    </div>
  );
}
