'use client';

export interface XtdhReceivedErrorStateProps {
  readonly message?: string;
  readonly onRetry: () => void;
}

export function XtdhReceivedErrorState({
  message,
  onRetry,
}: XtdhReceivedErrorStateProps) {
  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-8 tw-text-center">
      <p className="tw-text-sm tw-text-rose-200 tw-m-0">
        {message ?? "We couldn’t load your received xTDH yet."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-primary-600 tw-bg-primary-700 tw-px-4 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-50 hover:tw-bg-primary-600 tw-transition tw-duration-300 tw-ease-out"
      >
        Retry
      </button>
    </div>
  );
}
