import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";

interface ActionButtonProps {
  readonly onClicked?: (() => void) | undefined;
  readonly children: React.ReactNode;
  readonly size?: "default" | "sm" | undefined;
  readonly disabled?: boolean | undefined;
  readonly loading?: boolean | undefined;
  readonly type?: "button" | "submit" | undefined;
  readonly ariaLabel?: string | undefined;
  readonly className?: string | undefined;
}

export default function ActionButton({
  onClicked,
  children,
  size = "default",
  disabled = false,
  loading = false,
  type = "button",
  ariaLabel,
  className = "",
}: ActionButtonProps) {
  const sizeClasses =
    size === "sm"
      ? "tw-px-2.5 tw-py-1.5 tw-text-xs"
      : "tw-px-3.5 tw-py-2.5 tw-text-sm ";

  return (
    <button
      type={type}
      aria-label={ariaLabel}
      aria-busy={loading}
      disabled={disabled || loading}
      onClick={disabled || loading ? undefined : onClicked}
      className={`tw-rounded-md tw-border tw-border-solid tw-border-primary-500 tw-bg-primary-500 tw-ring-1 tw-ring-inset tw-ring-white/10 ${sizeClasses} tw-flex tw-items-center tw-justify-center tw-gap-x-1.5 tw-font-semibold tw-text-white tw-shadow-sm tw-shadow-black/20 tw-transition-colors tw-duration-200 tw-ease-out hover:tw-border-primary-600 hover:tw-bg-primary-600 hover:tw-ring-white/15 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 ${
        disabled || loading ? "tw-cursor-not-allowed tw-opacity-50" : ""
      } ${className}`}
    >
      {loading && <CircleLoader />}
      {children}
    </button>
  );
}
