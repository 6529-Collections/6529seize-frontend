import clsx from "clsx";

export default function RatingInputSigns({
  compact = false,
  className,
}: {
  readonly compact?: boolean;
  readonly className?: string;
}) {
  const iconClassName = compact ? "tw-size-3" : "tw-size-3.5";
  return (
    <span
      className={clsx(
        "tw-flex tw-flex-col tw-items-center tw-justify-center",
        compact ? "tw-gap-0" : "tw-gap-0.5",
        className
      )}
    >
      <svg className={iconClassName} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 5V19M5 12H19"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <svg className={iconClassName} viewBox="0 0 24 24" fill="none">
        <path
          d="M5 12H19"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
