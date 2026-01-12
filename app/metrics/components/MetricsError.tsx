export default function MetricsError({
  message,
}: {
  readonly message: string;
}) {
  return (
    <div className="tw-rounded-xl tw-border tw-border-red/30 tw-bg-red/10 tw-p-6 tw-text-center">
      <p className="tw-text-red">{message}</p>
    </div>
  );
}
