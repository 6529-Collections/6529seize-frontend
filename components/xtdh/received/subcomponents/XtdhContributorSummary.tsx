import clsx from "clsx";

interface XtdhContributorSummaryProps {
  readonly activeCount: string;
  readonly totalCount: string;
  readonly className?: string | undefined;
}

export function XtdhContributorSummary({
  activeCount,
  totalCount,
  className,
}: Readonly<XtdhContributorSummaryProps>) {
  return (
    <dl
      className={clsx(
        "tw-grid sm:tw-grid-cols-3 md:tw-grid-cols-2 tw-gap-4 tw-text-left lg:tw-self-center tw-mb-0 tw-mt-2 lg:tw-mt-0",
        className
      )}
    >
      <div className="tw-flex tw-flex-col">
        <dt className="tw-m-0 tw-text-[10px] tw-font-medium tw-uppercase tw-truncate tw-tracking-wider tw-text-iron-500 tw-mb-1.5">
          Active contributors
        </dt>
        <dd className="tw-m-0 tw-text-base tw-font-semibold tw-leading-tight tw-text-iron-50">
          {activeCount}
        </dd>
      </div>
      <div className="tw-flex tw-flex-col">
        <dt className="tw-m-0 tw-text-[10px] tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-500 tw-mb-1.5">
          Contributors
        </dt>
        <dd className="tw-m-0 tw-text-base tw-font-semibold tw-leading-tight tw-text-iron-50">
          {totalCount}
        </dd>
      </div>
    </dl>
  );
}
