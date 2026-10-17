import { LockClosedIcon, LockOpenIcon } from "@heroicons/react/24/outline";

interface E2eeBadgeProps {
  readonly label: string;
  readonly variant?: "encrypted" | "plaintext" | undefined;
  readonly className?: string | undefined;
}

/**
 * Text badge for a chat's encryption state. The icon is decorative; the text
 * always carries the meaning (not color alone).
 */
export function E2eeBadge({
  label,
  variant = "encrypted",
  className = "",
}: E2eeBadgeProps) {
  if (variant === "plaintext") {
    return (
      <span
        className={`tw-inline-flex tw-min-w-0 tw-items-center tw-gap-1 tw-text-xs tw-font-medium tw-text-iron-400 ${className}`}
      >
        <LockOpenIcon
          aria-hidden="true"
          className="tw-size-3.5 tw-flex-shrink-0"
        />
        <span className="tw-truncate">{label}</span>
      </span>
    );
  }
  return (
    <span
      className={`tw-inline-flex tw-min-w-0 tw-items-center tw-gap-1 tw-rounded-full tw-bg-emerald-500/10 tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium tw-text-emerald-300 tw-ring-1 tw-ring-inset tw-ring-emerald-400/20 ${className}`}
    >
      <LockClosedIcon
        aria-hidden="true"
        className="tw-size-3.5 tw-flex-shrink-0"
      />
      <span className="tw-truncate">{label}</span>
    </span>
  );
}
