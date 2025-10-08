interface XtdhStatsOverviewErrorProps {
  readonly message: string;
  readonly onRetry: () => void;
}

export function XtdhStatsOverviewError({
  message,
  onRetry,
}: Readonly<XtdhStatsOverviewErrorProps>) {
  return (
    <section className="tw-rounded-2xl tw-border tw-border-rose-500/40 tw-bg-rose-900/20 tw-p-6 tw-text-iron-50 tw-space-y-4">
      <div className="tw-space-y-1">
        <h2 className="tw-m-0 tw-text-lg tw-font-semibold">
          Unable to load xTDH data
        </h2>
        <p className="tw-m-0 tw-text-sm tw-text-iron-200">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary-500 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-50 tw-transition hover:tw-bg-primary-400 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-0"
      >
        Retry
      </button>
    </section>
  );
}
