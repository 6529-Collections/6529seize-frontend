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
import Button from "@/components/utils/button/Button";
