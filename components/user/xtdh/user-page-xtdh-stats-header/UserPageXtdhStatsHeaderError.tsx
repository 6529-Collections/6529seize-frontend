interface UserPageXtdhStatsHeaderErrorProps {
  readonly message: string;
  readonly onRetry: () => void;
}

export function UserPageXtdhStatsHeaderError({
  message,
  onRetry,
}: Readonly<UserPageXtdhStatsHeaderErrorProps>) {
  return (
    <section className="tw-rounded-2xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-p-5 tw-text-center tw-shadow-md tw-shadow-black/30">
      <p className="tw-text-sm tw-text-red-400" role="alert" aria-live="polite">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="tw-mt-3 tw-inline-flex tw-items-center tw-justify-center tw-rounded tw-bg-primary-500 tw-border tw-border-solid tw-border-primary-400 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-white hover:tw-bg-primary-400"
      >
        Retry
      </button>
    </section>
  );
}
