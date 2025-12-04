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
    <dl
      className={clsx(
        "tw-grid sm:tw-grid-cols-3 lg:tw-grid-cols-2 tw-gap-4 tw-text-left lg:tw-self-center tw-mb-0 tw-mt-2 lg:tw-mt-0",
        className
      )}
    >
      <div className="tw-flex tw-flex-col tw-gap-0.5">
        <dd className="tw-m-0 tw-text-base tw-font-semibold tw-leading-tight tw-text-iron-50">
          {activeCount}
        </dd>
        <dt className="tw-m-0 tw-text-xs tw-font-normal tw-text-iron-500">
          Active contributors
        </dt>
      </div>
      <div className="tw-flex tw-flex-col tw-gap-0.5">
        <dd className="tw-m-0 tw-text-base tw-font-semibold tw-leading-tight tw-text-iron-50">
          {totalCount}
        </dd>
        <dt className="tw-m-0 tw-text-xs tw-font-normal tw-text-iron-500">
          Contributors
        </dt>
      </div>
    </dl>
  );
}
