'use client';

export interface XtdhReceivedEmptyStateProps {
  readonly message: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
}

export function XtdhReceivedEmptyState({
  message,
  actionLabel,
  onAction,
}: XtdhReceivedEmptyStateProps) {
  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-8 tw-text-center">
      <p className="tw-text-sm tw-text-iron-300 tw-m-0">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-50 hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
