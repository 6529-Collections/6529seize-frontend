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
        "tw-grid tw-gap-y-1 tw-text-left sm:tw-self-center",
        className
      )}
    >
      <div className="tw-grid tw-grid-cols-2 tw-gap-x-6">
        <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-500">
          Active contributors
        </span>
        <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-500">
          Contributors
        </span>
      </div>
      <div className="tw-grid tw-grid-cols-2 tw-gap-x-6">
        <span className="tw-text-base tw-font-semibold tw-leading-tight tw-text-iron-100">
          {activeCount}
        </span>
        <span className="tw-text-base tw-font-semibold tw-leading-tight tw-text-iron-100">
          {totalCount}
        </span>
      </div>
    </div>
  );
}
