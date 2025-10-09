'use client';

export interface UserPageXtdhReceivedEmptyStateProps {
  readonly message: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
}

export function UserPageXtdhReceivedEmptyState({
  message,
  actionLabel,
  onAction,
}: UserPageXtdhReceivedEmptyStateProps) {
  return (
    <div className="tw-flex tw-flex-col tw-items-start tw-gap-2 tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-6 tw-text-sm tw-text-iron-300">
      <span>{message}</span>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="tw-rounded tw-bg-primary-500 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-black hover:tw-bg-primary-400"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
