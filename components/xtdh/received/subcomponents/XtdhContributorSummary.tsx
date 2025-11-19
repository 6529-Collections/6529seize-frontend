import clsx from "clsx";

interface XtdhContributorSummaryProps {
  readonly activeCount: string;
  readonly totalCount: string;
  readonly className?: string;
}

export function XtdhContributorSummary({
  activeCount,
  totalCount,
  className,
}: Readonly<XtdhContributorSummaryProps>) {
  return (
    <div
      className={clsx(
        "tw-flex tw-flex-wrap tw-items-start tw-gap-4",
        className
      )}
    >
      <div className="tw-flex tw-flex-col tw-gap-0.5">
        <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-500">
          Active contributors
        </span>
        <span className="tw-text-base tw-font-semibold tw-text-white">
          {activeCount}
        </span>
      </div>
      <div className="tw-flex tw-flex-col tw-gap-0.5">
        <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-500">
          Contributors
        </span>
        <span className="tw-text-sm tw-font-medium tw-text-iron-200">
          {totalCount}
        </span>
      </div>
    </div>
  );
}
