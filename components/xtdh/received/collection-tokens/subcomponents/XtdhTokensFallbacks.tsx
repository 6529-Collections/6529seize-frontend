import type { ReactNode } from "react";

interface ListMessageProps {
  readonly children: ReactNode;
}

interface RetryableMessageProps {
  readonly message?: string | undefined;
  readonly onRetry: () => void;
}

export function ListMessage({ children }: Readonly<ListMessageProps>) {
  return <p className="tw-m-0 tw-text-sm tw-text-iron-300">{children}</p>;
}

export function ListError({ message, onRetry }: Readonly<RetryableMessageProps>) {
  const displayMessage = message ?? "Failed to load received tokens.";
  return (
    <div className="tw-flex tw-flex-col tw-gap-2 tw-px-6 tw-pb-6">
      <p className="tw-m-0 tw-text-sm tw-text-red-400" role="alert">
        {displayMessage}
      </p>
      <RetryButton onRetry={onRetry} />
    </div>
  );
}

export function InlineRetry({ message, onRetry }: Readonly<RetryableMessageProps>) {
  const displayMessage = message ?? "Unable to load more tokens.";
  return (
    <div className="tw-rounded-lg tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-3">
      <p className="tw-m-0 tw-text-sm tw-text-iron-100" role="alert">
        {displayMessage}
      </p>
      <div className="tw-mt-2">
        <RetryButton onRetry={onRetry} />
      </div>
    </div>
  );
}

function RetryButton({ onRetry }: Readonly<{ onRetry: () => void }>) {
  return (
    <button
      type="button"
      onClick={onRetry}
      className="tw-inline-flex tw-items-center tw-justify-center tw-rounded tw-bg-primary-500 tw-border tw-border-solid tw-border-primary-400 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-white hover:tw-bg-primary-400"
    >
      Retry
    </button>
  );
}
