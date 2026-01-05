const DEFAULT_SCREEN_READER_MESSAGE = "Loading...";

interface SpinnerLoaderProps {
  readonly text?: string | undefined;
  readonly ariaLabel?: string | undefined;
}

export default function SpinnerLoader({
  text = DEFAULT_SCREEN_READER_MESSAGE,
  ariaLabel,
}: SpinnerLoaderProps) {
  const screenReaderMessage =
    ariaLabel && ariaLabel.trim().length > 0
      ? ariaLabel
      : text && text.trim().length > 0
        ? text
        : DEFAULT_SCREEN_READER_MESSAGE;

  return (
    <div className="tw-w-full tw-py-8">
      <div
        className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-3"
        role="status"
        aria-live="polite"
        aria-label={screenReaderMessage}>
        <span className="tw-sr-only">{screenReaderMessage}</span>
        <div className="tw-animate-spin">
          <svg
            className="tw-w-8 tw-h-8 tw-text-iron-500"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24">
            <circle
              className="tw-opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="tw-opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        {text && text.trim().length > 0 ? (
          <div className="tw-text-iron-400 tw-text-sm" aria-hidden={true}>
            {text}
          </div>
        ) : null}
      </div>
    </div>
  );
}