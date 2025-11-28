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
        "tw-grid tw-grid-cols-2 tw-gap-x-6 tw-gap-y-1 tw-text-left sm:tw-self-center",
        className
      )}
    >
      <div className="tw-flex tw-flex-col tw-gap-1">
        <dt className="tw-m-0 tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-500">
          Active contributors
        </dt>
        <dd className="tw-m-0 tw-text-base tw-font-semibold tw-leading-tight tw-text-iron-100">
          {activeCount}
        </dd>
      </div>
      <div className="tw-flex tw-flex-col tw-gap-1">
        <dt className="tw-m-0 tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-500">
          Contributors
        </dt>
        <dd className="tw-m-0 tw-text-base tw-font-semibold tw-leading-tight tw-text-iron-100">
          {totalCount}
        </dd>
      </div>
    </dl>
  );
}
