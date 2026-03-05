import type { MetadataValueLengthStatus } from "../utils/submissionMetadata";

interface MetadataLengthHintProps {
  readonly status?: MetadataValueLengthStatus | undefined;
  readonly className?: string | undefined;
}

export default function MetadataLengthHint({
  status,
  className,
}: MetadataLengthHintProps) {
  if (!status || (!status.isWarning && !status.isError)) {
    return null;
  }

  const baseClassName = `tw-text-xs ${className ?? ""}`;

  if (status.isError) {
    return (
      <p
        role="alert"
        aria-live="polite"
        className={`tw-text-red ${baseClassName}`}
      >
        {status.length}/{status.maxLength} characters.{" "}
        {Math.abs(status.remaining)} over limit.
      </p>
    );
  }

  return (
    <p className={`tw-text-amber-400 ${baseClassName}`}>
      {status.length}/{status.maxLength} characters.
    </p>
  );
}
