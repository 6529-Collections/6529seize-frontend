interface GrantedListErrorProps {
  readonly message?: string;
  readonly onRetry: () => void;
}

export function GrantedListError({
  message,
  onRetry,
}: Readonly<GrantedListErrorProps>) {
  const displayMessage = message ?? "Failed to load granted xTDH.";

  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <p className="tw-text-sm tw-text-red-400 tw-m-0" role="alert">
        {displayMessage}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="tw-self-start tw-rounded tw-bg-primary-500 tw-text-black tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold hover:tw-bg-primary-400">
        Retry
      </button>
    </div>
  );
}
