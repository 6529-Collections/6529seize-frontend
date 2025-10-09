'use client';

export interface UserPageXtdhReceivedErrorStateProps {
  readonly message: string;
  readonly onRetry: () => void;
}

export function UserPageXtdhReceivedErrorState({
  message,
  onRetry,
}: UserPageXtdhReceivedErrorStateProps) {
  const resolvedMessage = message || "Failed to load xTDH received data.";
  return (
    <div className="tw-flex tw-flex-col tw-items-start tw-gap-2 tw-rounded-2xl tw-border tw-border-red-500/40 tw-bg-red-500/10 tw-p-6">
      <p className="tw-text-sm tw-text-red-200 tw-m-0" role="alert">
        {resolvedMessage}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="tw-rounded tw-bg-primary-500 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-black hover:tw-bg-primary-400"
      >
        Retry
      </button>
    </div>
  );
}
