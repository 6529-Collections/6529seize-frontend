import clsx from "clsx";

export interface XtdhRatePillProps {
  readonly rateLabel: string;
  readonly totalLabel: string;
  readonly className?: string;
}

export function XtdhRatePill({
  rateLabel,
  totalLabel,
  className,
}: Readonly<XtdhRatePillProps>) {
  return (
    <div
      className={clsx(
        "tw-flex tw-flex-wrap tw-items-center tw-justify-end tw-gap-2",
        className
      )}
    >
      <span className="tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-primary-500/40 tw-bg-primary-500/10 tw-px-3 tw-py-1 tw-text-sm tw-font-semibold tw-text-primary-100">
        {`${rateLabel} / day`}
      </span>
      <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
        Total {totalLabel} xTDH
      </span>
    </div>
  );
}
