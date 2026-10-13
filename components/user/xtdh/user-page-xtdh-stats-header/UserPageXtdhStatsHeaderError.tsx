import Button from "@/components/utils/button/Button";

interface UserPageXtdhStatsHeaderErrorProps {
  readonly message: string;
  readonly onRetry: () => void;
}

export function UserPageXtdhStatsHeaderError({
  message,
  onRetry,
}: Readonly<UserPageXtdhStatsHeaderErrorProps>) {
  return (
    <section className="tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.04] tw-bg-iron-900 tw-p-5 sm:tw-p-6">
      <p
        className="tw-m-0 tw-text-[13px] tw-text-iron-300"
        role="alert"
        aria-live="polite"
      >
        {message}
      </p>
      <Button
        variant="tertiary"
        size="sm"
        onClick={onRetry}
        className="tw-mt-3"
      >
        Retry
      </Button>
    </section>
  );
}
